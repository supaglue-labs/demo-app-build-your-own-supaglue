import {mapper, z} from '@supaglue/vdk'
import type {Oas_crm_contacts} from '@opensdks/sdk-hubspot'
import {initHubspotSDK, type HubspotSDK} from '@opensdks/sdk-hubspot'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'

export type SimplePublicObject =
  Oas_crm_contacts['components']['schemas']['SimplePublicObject']

export const HUBSPOT_STANDARD_OBJECTS = [
  'company',
  'contact',
  'deal',
  'line_item',
  'product',
  'ticket',
  'quote',
  'call',
  'communication',
  'email',
  'meeting',
  'note',
  'postal_mail',
  'task',
] as const

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
    updated_at: 'updatedAt',
  }),
}

export const hubspotProvider = {
  __init__: ({proxyLinks}) =>
    initHubspotSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    // We may want to consider using the list rather than search endpoint for this stuff...
    // WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP 
    const res = await instance.crm_contacts.POST(
      '/crm/v3/objects/contacts/search',
      {
        body: {
          properties: [
            'hs_object_id',
            'hs_lastmodifieddate',
            'createdate',
            'lastmodifieddate',
          ],
          filterGroups: [],
          after: '',
          sorts: [
            {
              propertyName: 'hs_lastmodifieddate',
              direction: 'ASCENDING',
            },
            {
              propertyName: 'hs_object_id',
              direction: 'ASCENDING',
            },
          ] as unknown as string[],
          limit: 10,
        },
      },
    )
    return {
      hasNextPage: true,
      items: res.data.results.map(mappers.contact.parse),
    }
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  getAccount: async ({}) => {
    throw new Error('Not implemented yet')
  },
  metadataListStandardObjects: () =>
    HUBSPOT_STANDARD_OBJECTS.map((name) => ({name})),
  metadataListCustomObjects: async ({instance}) => {
    const res = await instance.crm_schemas.GET('/crm/v3/schemas')
    return res.data.results.map((obj) => ({id: obj.id, name: obj.name}))
  },
} satisfies CRMProvider<HubspotSDK>
