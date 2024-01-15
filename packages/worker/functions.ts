import {initBYOSupaglueSDK} from '@supaglue/sdk'
import {sql} from 'drizzle-orm'
import {inngest} from './client'
import {nango} from './env'
import {db} from './postgres'
import {engagementSequences, syncLog} from './postgres/schema'

export const helloWorld = inngest.createFunction(
  {id: 'hello-world'},
  {event: 'test/hello.world'},
  async ({event, step}) => {
    await step.sleep('wait-a-moment', '1s')
    return {event, body: 'Hello, World!'}
  },
)

export const scheduleSyncs = inngest.createFunction(
  {id: 'schedule-syncs'},
  {cron: '* * * * *'},
  async () => {
    const {
      data: {connections},
    } = await nango.GET('/connection')
    // console.log(connections)

    await inngest.send(
      connections
        .filter((c) => c.provider === 'outreach')
        .map((c) => ({
          name: 'connection/sync',
          // c.provider is the providerConfigKey, very confusing of nango
          data: {connectionId: c.connection_id, providerConfigKey: c.provider},
        })),
    )
  },
)

export const syncConnection = inngest.createFunction(
  {id: 'sync-connection'},
  {event: 'connection/sync'},
  async ({event, step}) => {
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
            res.data.items.map((item) => ({
              supaglueApplicationId: '$YOUR_APPLICATION_ID',
              supaglueCustomerId: connectionId, //  '$YOUR_CUSTOMER_ID',
              supaglueProviderName: providerConfigKey,
              id: item.id,
              lastModifiedAt: new Date().toISOString(),
              supaglueEmittedAt: new Date().toISOString(),
              isDeleted: false,
              // TODO: Return both raw and unified data here...
              // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
              rawData: sql`${item}::jsonb`,
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
  },
)
