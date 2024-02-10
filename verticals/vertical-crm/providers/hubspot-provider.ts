import {mapper, z} from '@supaglue/vdk'
import type {Oas_CRM_Contacts} from '@opensdks/sdk-hubspot'
import {initHubspotSDK, type HubspotSDK} from '@opensdks/sdk-hubspot'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'

export type SimplePublicObject =
  Oas_CRM_Contacts['components']['schemas']['SimplePublicObject']

const HSContact = z.object({
  id: z.string(),
  properties: z.object({
    hs_object_id: z.string(),
    createdate: z.string(),
    lastmodifieddate: z.string(),
    // properties specific to contacts below...
    email: z.string().nullish(),
    firstname: z.string().nullish(),
    lastname: z.string().nullish(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})

const mappers = {
  contact: mapper(HSContact, commonModels.contact, {
    id: 'id',
    first_name: 'properties.firstname',
    last_name: 'properties.lastname',
  }),
}

export const hubspotProvider = {
  __init__: ({proxyLinks}) =>
    initHubspotSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    const res = await instance.contacts.GET('/crm/v3/objects/contacts', {})
    return {
      hasNextPage: true,
      items: res.data.results.map(mappers.contact.parse),
    }
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  getCompany: async ({}) => {
    throw new Error('Not implemented yet')
  },
} satisfies CRMProvider<HubspotSDK>
