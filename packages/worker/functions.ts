import {inngest} from './client'
import {nango} from './env'
import * as routines from './routines'

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
  routines.syncConnection,
)
