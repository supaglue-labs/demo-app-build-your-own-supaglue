import {z, zBaseRecord} from '@supaglue/vdk'

export const account = zBaseRecord
  .extend({
    id: z.string().nullish(),
    name: z.string().nullish(),
    updated_at: z.date().nullish(),
    is_deleted: z.boolean().nullish(),
    website: z.string().nullish(),
    industry: z.string().nullish(),
    number_of_employees: z.number().nullish(),
    owner_id: z.string().nullish(),
    created_at: z.date().nullish(),
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
    id: z.string().nullish(),
    name: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    owner_id: z.string().nullish(),
    title: z.string().nullish(),
    company: z.string().nullish(),
    converted_date: z.date().nullish(),
    lead_source: z.string().nullish(),
    converted_account_id: z.string().nullish(),
    converted_contact_id: z.string().nullish(),
    addresses: z
      .array(
        z.object({
          street1: z.string().nullish(),
          street2: z.string().nullish(),
          city: z.string().nullish(),
          state: z.string().nullish(),
          country: z.string().nullish(),
          postal_code: z.string().nullish(),
          address_type: z.string().nullish(),
        }),
      )
      .nullish(),
    email_addresses: z
      .array(
        z.object({
          email_address: z.string().nullish(),
          email_address_type: z.string().nullish(),
        }),
      )
      .nullish(),
    phone_numbers: z
      .array(
        z.object({
          phone_number: z.string().nullish(),
          phone_number_type: z.string().nullish(),
        }),
      )
      .nullish(),
    created_at: z.date().nullish(),
    updated_at: z.date().nullish(),
    is_deleted: z.boolean().nullish(),
    last_modified_at: z.date().nullish(),
    raw_data: z.record(z.unknown()).nullish(),
  })
  .openapi({ref: 'crm.lead'})

export const opportunity = zBaseRecord
  .extend({
    id: z.string().nullish(),
    name: z.string().nullish(),
    updated_at: z.date().nullish(),
    description: z.string().nullish(),
    owner_id: z.string().nullish(),
    status: z.string().nullish(),
    stage: z.string().nullish(),
    close_date: z.date().nullish(),
    account_id: z.string().nullish(),
    pipeline: z.string().nullish(),
    amount: z.number().nullish(),
    last_activity_at: z.date().nullish(),
    created_at: z.date().nullish(),
    is_deleted: z.boolean().nullish(),
    last_modified_at: z.date().nullish(),
    raw_data: z.record(z.unknown()).nullish(),
  })
  .openapi({ref: 'crm.opportunity'})

export const user = zBaseRecord
  .extend({
    id: z.string().nullish(),
    name: z.string().nullish(),
    email: z.string().nullish(),
    is_active: z.boolean().nullish(),
    created_at: z.date().nullish(),
    updated_at: z.date().nullish(),
    is_deleted: z.boolean().nullish(),
    last_modified_at: z.date().nullish(),
    raw_data: z.record(z.unknown()).nullish(),
  })
  .openapi({ref: 'crm.user'})

export const meta_standard_object = z
  .object({
    name: z.string(),
  })
  .openapi({ref: 'crm.meta_standard_object'})

export const meta_custom_object = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi({ref: 'crm.meta_custom_object'})

export const meta_property = z
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
  .openapi({ref: 'crm.meta_property'})

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
