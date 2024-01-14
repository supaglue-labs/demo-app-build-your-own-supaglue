import {EventSchemas, Inngest} from 'inngest'
import {z} from 'zod'

export const eventsMap = {
  'test/hello.world': {},
  'connection/sync': {
    data: z.object({
      connectionId: z.string(),
      providerConfigKey: z.string(),
    }),
  },
}

export const inngest = new Inngest({
  id: 'build-your-own-supaglue',
  schemas: new EventSchemas().fromZod(eventsMap),
})
