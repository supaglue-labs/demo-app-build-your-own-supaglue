import {initBYOSupaglueSDK} from '@supaglue/sdk'
import {sql} from 'drizzle-orm'
import type {SendEventPayload} from 'inngest/helpers/types'
import {nango} from './env'
import type {Events} from './events'
import {db} from './postgres'
import {sync_log} from './postgres/schema'
import {getCommonObjectTable} from './postgres/schema-factory'
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
        data: {connection_id: c.connection_id, provider_config_key: c.provider},
      })),
  )
}

export async function syncConnection({
  event,
  step,
}: RoutineInput<'connection/sync'>) {
  const {
    data: {connection_id, provider_config_key},
  } = event
  console.log('[syncConnection] Start', {
    connectionId: connection_id,
    providerConfigKey: provider_config_key,
    eventId: event.id,
  })
  await db.insert(sync_log).values({connection_id, provider_config_key})

  const supaglue = initBYOSupaglueSDK({
    headers: {
      'x-connection-id': connection_id,
      'x-provider-name': provider_config_key,
    },
  })

  // Load this from a config please...
  const vertical = 'engagement' as const
  const entitiesToSync = ['contacts', 'sequences'] as const

  for (const entity of entitiesToSync) {
    let cursor = null as null | string | undefined
    do {
      cursor = await step.run(`${entity}-sync-page-${cursor}`, async () => {
        const res = await supaglue.GET(`/${vertical}/v2/${entity}`, {
          params: {query: {cursor}},
        })
        console.log(
          `Syncing ${vertical} ${entity} count=`,
          res.data.items.length,
        )

        const table = getCommonObjectTable(`${vertical}_${entity}`)

        // TODO: Do migration for our table...
        // migrate(db, {migrationsTable: []})

        await dbUpsert(
          db,
          table,
          res.data.items.map(({raw_data, ...item}) => ({
            _supaglue_application_id: '$YOUR_APPLICATION_ID',
            _supaglue_customer_id: connection_id, //  '$YOUR_CUSTOMER_ID',
            _supaglue_provider_name: provider_config_key,
            id: item.id,
            last_modified_at: new Date().toISOString(),
            _supaglue_emitted_at: new Date().toISOString(),
            isDeleted: false,
            // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
            raw_data: sql`${raw_data ?? ''}::jsonb`,
            _supaglue_unified_data: sql`${item}::jsonb`,
          })),
          {shallowMergeJsonbColumns: ['_supaglue_unified_data']},
        )
        return res.data.nextPageCursor
      })
      break
    } while (cursor)
  }

  console.log('[syncConnection] Complete', {
    connectionId: connection_id,
    providerConfigKey: provider_config_key,
    eventId: event.id,
  })
}

// Later...
// Need to figure out if stepFunction behaves as expected...
