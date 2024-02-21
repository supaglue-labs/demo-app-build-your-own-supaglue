import {initBYOSupaglueSDK} from '@supaglue/sdk'
import {and, eq, sql} from 'drizzle-orm'
import type {SendEventPayload} from 'inngest/helpers/types'
import {initSupaglueSDK} from '@opensdks/sdk-supaglue'
import {env} from './env'
import type {Events} from './events'
import {db, schema} from './postgres'
import {sync_state} from './postgres/schema'
import {getCommonObjectTable} from './postgres/schema-dynamic'
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
type SingleNoArray<T> = T extends Array<infer U> ? U : T
export type EventPayload = SingleNoArray<SendEventPayload<Events>>

// export async function nangoScheduleSyncs({step}: RoutineInput<never>) {
//   const {
//     data: {connections},
//   } = await nango.GET('/connection')
//   // console.log(connections)

//   await step.sendEvent(
//     'emit-connection-sync-events',
//     connections
//       .filter((c) => c.provider === 'outreach')
//       .map((c) => ({
//         name: 'connection/sync',
//         // c.provider is the providerConfigKey, very confusing of nango
//         data: {connection_id: c.connection_id, provider_config_key: c.provider},
//       })),
//   )
// }

export async function scheduleSyncs({step}: RoutineInput<never>) {
  const supaglue = initSupaglueSDK({
    headers: {'x-api-key': env.SUPAGLUE_API_KEY!},
  })

  const [syncConfigs, customers] = await Promise.all([
    supaglue.mgmt.GET('/sync_configs').then((r) => r.data),
    supaglue.mgmt.GET('/customers').then((r) => r.data),
  ])
  const connections = await Promise.all(
    customers
      .slice(0, 2) // comment me out in production
      .map((c) =>
        supaglue.mgmt
          .GET('/customers/{customer_id}/connections', {
            params: {path: {customer_id: c.customer_id}},
          })
          .then((r) => r.data),
      ),
  ).then((nestedArr) => nestedArr.flat())

  await step.sendEvent(
    'emit-connection-sync-events',
    connections
      .map((c) => {
        if (c.category !== 'crm' && c.category !== 'engagement') {
          return null
        }
        const syncConfig = syncConfigs.find(
          (c) => c.provider_name === c.provider_name,
        )?.config
        return {
          name: 'connection/sync',
          data: {
            customer_id: c.customer_id,
            provider_name: c.provider_name,
            vertical: c.category,
            common_objects: syncConfig?.common_objects?.map((o) => o.object),
            standard_objects: syncConfig?.standard_objects?.map(
              (o) => o.object,
            ),
          },
        } satisfies EventPayload
      })
      .filter((c): c is NonNullable<typeof c> => !!c),
  )
}

export async function syncConnection({
  event,
  step,
}: RoutineInput<'connection/sync'>) {
  const {
    data: {customer_id, provider_name, vertical, common_objects = []},
  } = event
  console.log('[syncConnection] Start', {
    customer_id,
    provider_name,
    eventId: event.id,
  })

  const syncState = await db.query.sync_state
    .findFirst({
      where: and(
        eq(schema.sync_state.customer_id, customer_id),
        eq(schema.sync_state.provider_name, provider_name),
      ),
    })
    .then(
      (ss) =>
        ss ??
        db
          .insert(schema.sync_state)
          .values({
            customer_id,
            provider_name,
            state: sql`${{}}::jsonb`,
          })
          .returning()
          .then((rows) => rows[0]!),
    )

  const syncRunId = await db
    .insert(schema.sync_run)
    .values({
      customer_id,
      provider_name,
      status: 'STARTED',
      initial_state: sql`${syncState.state}::jsonb`,
      started_at: new Date().toISOString(),
    })
    .returning()
    .then((rows) => rows[0]!.id)

  const byos = initBYOSupaglueSDK({
    headers: {
      'x-api-key': env.SUPAGLUE_API_KEY,
      'x-customer-id': customer_id, // This relies on customer-id mapping 1:1 to connection_id
      'x-provider-name': provider_name, // This relies on provider_config_key mapping 1:1 to provider-name
    },
  })

  // Load this from a config please...

  const fullState = syncState.state as Record<string, {cursor?: string | null}>

  const nowFn = sql`now()`

  const metrics: Record<string, number> = {}
  function incrementMetric(name: string, amount = 1) {
    metrics[name] = (metrics[name] ?? 0) + amount
  }

  for (const entity of common_objects) {
    const fullEntity = `${vertical}_${entity}`
    const table = getCommonObjectTable(fullEntity)
    await db.execute(table.createIfNotExistsSql())

    const state = fullState[entity] ?? {}
    fullState[entity] = state

    while (true) {
      const ret = await step.run(`${entity}-sync-${state.cursor}`, async () => {
        const res = await byos.GET(
          `/${vertical}/v2/${entity}` as '/crm/v2/contacts',
          {params: {query: {cursor: state.cursor, page_size: 10}}},
        )
        console.log(
          `Syncing ${vertical} ${entity} count=${res.data.items.length}`,
        )
        incrementMetric(`${entity}_page_count`)
        incrementMetric(`${entity}_object_count`, res.data.items.length)
        if (res.data.items.length) {
          await dbUpsert(
            db,
            table,
            res.data.items.map(({raw_data, ...item}) => ({
              _supaglue_application_id: '$YOUR_APPLICATION_ID',
              _supaglue_customer_id: customer_id, //  '$YOUR_CUSTOMER_ID',
              _supaglue_provider_name: provider_name,
              _supaglue_emitted_at: nowFn,
              id: item.id,
              last_modified_at: nowFn, // TODO: Fix me...
              is_deleted: false,
              // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
              raw_data: sql`${raw_data ?? ''}::jsonb`,
              _supaglue_unified_data: sql`${item}::jsonb`,
            })),
            {noDiffColumns: ['_supaglue_emitted_at', 'last_modified_at']},
          )
        }
        return {cursor: res.data.nextCursor, hasNext: res.data.items.length > 0}
      })
      state.cursor = ret.cursor
      // Persist state. TODO: Figure out how to make this work with step function
      await dbUpsert(
        db,
        sync_state,
        [{...syncState, state: sql`${fullState}::jsonb`, updated_at: nowFn}],
        {
          shallowMergeJsonbColumns: ['state'],
          noDiffColumns: ['created_at', 'updated_at'],
        },
      )
      if (!ret.hasNext) {
        break
      }
    }
  }

  await db
    .update(schema.sync_run)
    .set({
      completed_at: new Date().toISOString(),
      status: 'COMPLETED',
      final_state: sql`${fullState}::jsonb`,
      metrics: sql`${metrics}::jsonb`,
    })
    .where(eq(schema.sync_run.id, syncRunId))

  console.log('[syncConnection] Complete', {
    connectionId: customer_id,
    providerConfigKey: provider_name,
    eventId: event.id,
  })
}

// Later...
// Need to figure out if stepFunction behaves as expected...
