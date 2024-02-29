import {z} from '@supaglue/vdk'

/** workaround the issue that we get back date from db... need to figure out how to just get string */
const zTimestamp = z
  .union([z.string(), z.date()])
  .describe('ISO8601 date string')

const dbRecord = z.object({
  id: z.string(),
  /** z.string().datetime() does not work for simple things like `2023-07-19T23:46:48.000+0000`  */
  updated_at: zTimestamp,
  created_at: zTimestamp,
})

export const customer = dbRecord
  .extend({
    name: z.string().nullish(),
    email: z.string().email().nullish(),
  })
  .openapi({ref: 'customer'})

export const resource = dbRecord
  .extend({
    customer_id: z.string().nullish(),
  })
  .openapi({ref: 'resource'})
