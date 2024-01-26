import type {GetEvents} from 'inngest'
import {EventSchemas, Inngest} from 'inngest'
import {z} from 'zod'

export const eventsMap = {
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

export type Events = GetEvents<typeof inngest>
