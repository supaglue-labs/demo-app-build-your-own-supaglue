import {z, zBaseRecord} from '@supaglue/vdk'

export const customer = zBaseRecord
  .extend({
    id: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    name: z.string().nullish(),
    email: z.string().email().nullish(),
  })
  .openapi({ref: 'customer'})

export const resource = zBaseRecord
  .extend({
    id: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    customer_id: z.string().nullish(),
  })
  .openapi({ref: 'resource'})
