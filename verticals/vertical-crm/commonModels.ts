import {z} from '@supaglue/vdk'

export const contact = z
  .object({
    id: z.string(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
  })
  .openapi({ref: 'crm.contact'})
