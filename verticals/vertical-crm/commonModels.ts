import {z, zBaseRecord} from '@supaglue/vdk'

export const account = zBaseRecord
  .extend({
    id: z.string().nullish(),
    name: z.string().nullish(),
    isDeleted: z.boolean().nullish(),
    type: z.string().nullish(),
    parentId: z.string().nullish(),
    billingAddress: z
      .object({
        street: z.string().nullish(),
        city: z.string().nullish(),
        state: z.string().nullish(),
        postalCode: z.string().nullish(),
        country: z.string().nullish(),
      })
      .nullish(),
    shippingAddress: z
      .object({
        street: z.string().nullish(),
        city: z.string().nullish(),
        state: z.string().nullish(),
        postalCode: z.string().nullish(),
        country: z.string().nullish(),
      })
      .nullish(),
    phone: z.string().nullish(),
    fax: z.string().nullish(),
    website: z.string().nullish(),
    industry: z.string().nullish(),
    numberOfEmployees: z.number().nullish(),
    ownerId: z.string().nullish(),
    createdAt: z.date().nullish(),
    updatedAt: z.date().nullish(),
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
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    ownerId: z.string().nullish(),
    title: z.string().nullish(),
    company: z.string().nullish(),
    convertedDate: z.date().nullish(),
    leadSource: z.string().nullish(),
    convertedAccountId: z.string().nullish(),
    convertedContactId: z.string().nullish(),
    addresses: z
      .array(
        z.object({
          street1: z.string().nullish(),
          street2: z.string().nullish(),
          city: z.string().nullish(),
          state: z.string().nullish(),
          country: z.string().nullish(),
          postalCode: z.string().nullish(),
          addressType: z.string().nullish(),
        }),
      )
      .nullish(),
    emailAddresses: z
      .array(
        z.object({
          emailAddress: z.string().nullish(),
          emailAddressType: z.string().nullish(),
        }),
      )
      .nullish(),
    phoneNumbers: z
      .array(
        z.object({
          phoneNumber: z.string().nullish(),
          phoneNumberType: z.string().nullish(),
        }),
      )
      .nullish(),
    createdAt: z.date().nullish(),
    updatedAt: z.date().nullish(),
    isDeleted: z.boolean().nullish(),
    lastModifiedAt: z.date().nullish(),
    rawData: z.record(z.unknown()).nullish(),
  })
  .openapi({ref: 'crm.lead'})

export const opportunity = zBaseRecord
  .extend({
    id: z.string().nullish(),
    name: z.string().nullish(),
    updated_at: z.date().nullish(),
    description: z.string().nullish(),
    ownerId: z.string().nullish(),
    status: z.string().nullish(),
    stage: z.string().nullish(),
    closeDate: z.date().nullish(),
    accountId: z.string().nullish(),
    // pipeline is not supported in salesforce
    pipeline: z.string().nullish(),
    // TODO: This should be parseFloat, but we need to migrate our customers
    amount: z.string().nullish(),
    lastActivityAt: z.date().nullish(),
    createdAt: z.date().nullish(),
    updatedAt: z.date().nullish(),
    isDeleted: z.boolean().nullish(),
    lastModifiedAt: z.date().nullish(),
    rawData: z.record(z.unknown()).nullish(),
  })
  .openapi({ref: 'crm.opportunity'})

export const user = zBaseRecord
  .extend({
    id: z.string().nullish(),
    name: z.string().nullish(),
    email: z.string().nullish(),
    isActive: z.boolean().nullish(),
    createdAt: z.date().nullish(),
    updatedAt: z.date().nullish(),
    isDeleted: z.boolean().nullish(),
    lastModifiedAt: z.date().nullish(),
    rawData: z.record(z.unknown()).nullish(),
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
