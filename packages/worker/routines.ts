import {initBYOSupaglueSDK} from '@supaglue/sdk'
import {sql} from 'drizzle-orm'
import type {SendEventPayload} from 'inngest/helpers/types'
import {nango} from './env'
import type {Events} from './events'
import {db} from './postgres'
import {engagementSequences, syncLog} from './postgres/schema'
import {dbUpsert} from './postgres/upsert'

/**
 * Unlike functions, routines are designed to run without dependency on Inngest
 * So they can be used with any job queue system, such as BullMQ or home grown system built
 * on top of postgres / redis / pubsub / whatever.
 */
export type RoutineInput<T extends keyof Events> = {
  event: {data: Events[T]['data']; id?: string}
  step: {
    run: <T>(name: string, fn: () => Promise<T>) => Promise<T> | T
    sendEvent: (
      stepId: string,
      events: SendEventPayload<Events>,
    ) => Promise<unknown> // SendEventOutput
  }
}

export async function scheduleSyncs({step}: RoutineInput<never>) {
  const {
    data: {connections},
  } = await nango.GET('/connection')
  // console.log(connections)

  await step.sendEvent(
    'emit-connection-sync-events',
    connections
      .filter((c) => c.provider === 'outreach')
      .map((c) => ({
        name: 'connection/sync',
        // c.provider is the providerConfigKey, very confusing of nango
        data: {connectionId: c.connection_id, providerConfigKey: c.provider},
      })),
  )
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
      await dbUpsert(
        db,
        engagementSequences,
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
        {shallowMergeJsonbColumns: [engagementSequences.supaglueUnifiedData]},
      )
      return res.data.nextPageCursor
    })
    break
  } while (cursor)

  console.log('[syncConnection] Complete', {
    connectionId,
    providerConfigKey,
    eventId: event.id,
  })
}
