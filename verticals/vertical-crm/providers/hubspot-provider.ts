import {LastUpdatedAtNextOffset, mapper, z} from '@supaglue/vdk'
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
  listContacts: async ({instance, input: opts}) => {
    const limit = opts?.page_size ?? 100
    const cursor = LastUpdatedAtNextOffset.fromCursor(opts?.cursor)
    const kLastModifiedAt = 'lastmodifieddate'
    // We may want to consider using the list rather than search endpoint for this stuff...
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
          filterGroups: cursor?.last_updated_at
            ? [
                {
                  filters: [
                    {
                      propertyName: kLastModifiedAt,
                      operator: 'GTE',
                      value: cursor?.last_updated_at,
                    },
                  ],
                },
              ]
            : [],
          after: cursor?.next_offset ?? '',
          sorts: [
            {
              propertyName: 'lastmodifieddate',
              direction: 'ASCENDING',
            },
            // Cannot sort by multiple values unfortunately...
            // {
            //   propertyName: 'hs_object_id',
            //   direction: 'ASCENDING',
            // },
          ] as unknown as string[],
          limit,
        },
      },
    )
    const items = res.data.results.map(mappers.contact.parse)
    const lastItem = items[items.length - 1]
    return {
      items: res.data.results.map(mappers.contact.parse),
      // Not the same as simply items.length === 0
      has_next_page: !!res.data.paging?.next?.after,
      next_cursor:
        (lastItem
          ? LastUpdatedAtNextOffset.toCursor({
              last_updated_at: lastItem.updated_at,
              next_offset:
                // offset / offset-like cursor is only usable if the filtering criteria doesn't change, notably the last_updated_at timestamp
                // in practice this means that we only care about `after` offset when we have more than `limit` number of items modified at the exact
                // same timestamp
                lastItem.updated_at === cursor?.last_updated_at
                  ? res.data.paging?.next?.after
                  : undefined,
            })
          : opts?.cursor) ?? null,
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
