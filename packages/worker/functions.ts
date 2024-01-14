import {inngest} from './client'
import {nango} from './env'

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
    console.log(connections)
    await inngest.send(
      connections.map((c) => ({
        name: 'connection/sync',
        // Double check whether provider is same as providerConfigKey
        data: {connectionId: c.connection_id, providerConfigKey: c.provider},
      })),
    )
  },
)

export const syncConnection = inngest.createFunction(
  {id: 'sync-connection'},
  {event: 'connection/sync'},
  async ({event}) => {
    const {
      data: {connectionId, providerConfigKey},
    } = event
    console.log('Handling sync for', {connectionId, providerConfigKey})
  },
)
