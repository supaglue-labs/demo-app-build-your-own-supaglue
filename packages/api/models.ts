import {z} from '@supaglue/vdk'

/** workaround the issue that we get back date from db... need to figure out how to just get string */
// const zTimestamp = z
//   .union([z.string(), z.date()])
//   .describe('ISO8601 date string')

// const dbRecord = z.object({
//   // id: z.string(),
//   /** z.string().datetime() does not work for simple things like `2023-07-19T23:46:48.000+0000`  */
//   updated_at: zTimestamp,
//   created_at: zTimestamp,
// })

export const customer = z
  .object({
    customer_id: z.string(),
    name: z.string().nullish(),
    email: z.string().email().nullish(),
  })
  .openapi({ref: 'customer'})

export const connection = z
  .object({
    customer_id: z.string().nullish(),
    provider_name: z.string(),
  })
  .openapi({ref: 'connection'})

/** @deprecated but still needed */
export const connection_sync_config = z
  .object({
    destination_config: z
      .object({type: z.string(), schema: z.string().nullish()})
      .nullish(),

    custom_objects: z.array(z.object({object: z.string()})).nullish(),
  })
  .openapi({ref: 'connection_sync_config'})
