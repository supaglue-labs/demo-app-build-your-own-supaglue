import type {EventsFromOpts} from 'inngest'
import type {
  Combine,
  EventSchemas,
  ZodToStandardSchema,
} from 'inngest/components/EventSchemas'
import {z} from 'zod'

export const eventsMap = {
  'connection/sync': {
    data: z.object({
      connection_id: z.string(),
      provider_config_key: z.string(),
    }),
  },
}

type BuiltInEvents = EventsFromOpts<{schemas: EventSchemas; id: never}>

export type Events = Combine<
  BuiltInEvents,
  ZodToStandardSchema<typeof eventsMap>
>
