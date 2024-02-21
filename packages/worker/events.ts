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
      vertical: z.enum(['crm', 'engagement']),
      standard_objects: z.array(z.string()).optional(),
      common_objects: z.array(z.string()).optional(),
      /** How data will be replicated from source to destination. */
      sync_mode: z
        .enum(['full', 'incremental'])
        .optional()
        .describe('Incremental by default'),
      /** e.g. postgres schema, created on demand */
      destination_schema: z.string().optional(),
    }),
  },
}

type BuiltInEvents = EventsFromOpts<{schemas: EventSchemas; id: never}>

export type Events = Combine<
  BuiltInEvents,
  ZodToStandardSchema<typeof eventsMap>
>
