import {z, zBaseRecord} from '@supaglue/vdk'

export const account = zBaseRecord
  .extend({
    name: z.string().nullish(),
    domain: z.string().nullish(),
  })
  .openapi({ref: 'crm.account'})

export const contact = zBaseRecord
  .extend({
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
  })
  .openapi({ref: 'crm.contact'})

export const lead = zBaseRecord
  .extend({
    name: z.string().nullish(),
  })
  .openapi({ref: 'crm.lead'})

export const opportunity = zBaseRecord
  .extend({
    name: z.string().nullish(),
    closedate: z.string().nullish(),
    amount: z.string().nullish(),
    pipeline: z.string().nullish(),
    dealstage: z.string().nullish(),
  })
  .openapi({ref: 'crm.opportunity'})

export const user = zBaseRecord
  .extend({
    name: z.string().nullish(),
  })
  .openapi({ref: 'crm.user'})

export const metaStandardObject = z
  .object({
    name: z.string(),
  })
  .openapi({ref: 'crm.metaStandardObject'})

export const metaCustomObject = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi({ref: 'crm.metaCustomObject'})

export const metaProperty = z
  .object({
    id: z.string().openapi({
      description:
        'The machine name of the property as it appears in the third-party Provider',
      example: 'FirstName',
    }),
    label: z.string().openapi({
      description:
        'The human-readable name of the property as provided by the third-party Provider.',
      example: 'First Name',
    }),
    type: z.string().optional().openapi({
      description:
        'The type of the property as provided by the third-party Provider. These types are not unified by Supaglue. For Intercom, this is string, integer, boolean, or object. For Outreach, this is integer, boolean, number, array, or string.',
      example: 'string',
    }),
    raw_details: z.record(z.unknown()).optional().openapi({
      description:
        'The raw details of the property as provided by the third-party Provider, if available.',
      example: {},
    }),
  })
  .openapi({ref: 'crm.metaProperty'})
