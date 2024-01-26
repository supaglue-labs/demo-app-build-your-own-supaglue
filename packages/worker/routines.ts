import {initBYOSupaglueSDK} from '@supaglue/sdk'
import {sql} from 'drizzle-orm'
import type {Events} from './client'
import {db} from './postgres'
import {engagementSequences, syncLog} from './postgres/schema'

/**
 * Unlike functions, routines are designed to run without dependency on inngeset
 */
type RoutineInput<T extends keyof Events> = {
  event: {data: Events[T]['data']; id?: string}
  step: {run: <T>(name: string, fn: () => Promise<T>) => Promise<T> | T}
}

export async function syncConnection({
  event,
  step,
}: RoutineInput<'connection/sync'>) {
  const {
    data: {connectionId, providerConfigKey},
  } = event
  console.log('[syncConnection] Start', {
    connectionId,
    providerConfigKey,
    eventId: event.id,
  })
  await db.insert(syncLog).values({connectionId, providerConfigKey})

  const supaglue = initBYOSupaglueSDK({
    headers: {
      'x-connection-id': connectionId,
      'x-provider-name': providerConfigKey,
    },
  })

  // TODO: Need to figure out if stepFunction behaves as expected...
  let cursor = null as null | string | undefined
  do {
    cursor = await step.run(`sync-page-${cursor}`, async () => {
      const res = await supaglue.GET('/engagement/v2/sequences', {
        params: {query: {cursor}},
      })
      console.log('Syncing sequences count=', res.data.items.length)
      await db
        .insert(engagementSequences)
        .values(
          res.data.items.map(({raw_data, ...item}) => ({
            supaglueApplicationId: '$YOUR_APPLICATION_ID',
            supaglueCustomerId: connectionId, //  '$YOUR_CUSTOMER_ID',
            supaglueProviderName: providerConfigKey,
            id: item.id,
            lastModifiedAt: new Date().toISOString(),
            supaglueEmittedAt: new Date().toISOString(),
            isDeleted: false,
            // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
            rawData: sql`${raw_data}::jsonb`,
            supaglueUnifiedData: sql`${item}::jsonb`,
          })),
        )
        .onConflictDoNothing()

      return res.data.nextPageCursor
    })
  } while (cursor)

  console.log('[syncConnection] Complete', {
    connectionId,
    providerConfigKey,
    eventId: event.id,
  })
}
