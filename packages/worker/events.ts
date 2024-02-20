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
      customer_id: z.string(),
      provider_name: z.string(),
      standard_objects: z.array(z.string()).optional(),
      common_objects: z.array(z.string()).optional(),
    }),
  },
}

type BuiltInEvents = EventsFromOpts<{schemas: EventSchemas; id: never}>

export type Events = Combine<
  BuiltInEvents,
  ZodToStandardSchema<typeof eventsMap>
>
