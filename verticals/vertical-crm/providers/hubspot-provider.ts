import type {BaseRecord} from '@supaglue/vdk'
import {LastUpdatedAtNextOffset, mapper, z, zCast} from '@supaglue/vdk'
import type {Oas_crm_contacts, Oas_crm_owners} from '@opensdks/sdk-hubspot'
import {initHubspotSDK, type HubspotSDK} from '@opensdks/sdk-hubspot'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'

export type SimplePublicObject =
  Oas_crm_contacts['components']['schemas']['SimplePublicObject']
export type Owner = Oas_crm_owners['components']['schemas']['PublicOwner']

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
const HSBase = z.object({
  id: z.string(),
  properties: z
    .object({
      hs_object_id: z.string(),
      createdate: z.string().optional(),
      lastmodifieddate: z.string().optional(),
    })
    .passthrough(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})
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
  account: mapper(HSBase, commonModels.account, {
    id: 'id',
    updated_at: 'updatedAt',
  }),
  contact: mapper(HSContact, commonModels.contact, {
    id: 'id',
    first_name: 'properties.firstname',
    last_name: 'properties.lastname',
    updated_at: 'updatedAt',
  }),
  opportunity: mapper(HSBase, commonModels.opportunity, {
    id: 'id',
    name: 'id',
    updated_at: 'updatedAt',
  }),
  lead: mapper(HSBase, commonModels.lead, {
    id: 'id',
    updated_at: 'updatedAt',
  }),
  user: mapper(zCast<Owner>(), commonModels.user, {
    id: 'id',
    updated_at: 'updatedAt',
    name: (o) => [o.firstName, o.lastName].filter((n) => !!n?.trim()).join(' '),
  }),
}
const _listEntityIncrementalThenMap = async <TIn, TOut extends BaseRecord>(
  instance: HubspotSDK,
  {
    entity,
    fields,
    ...opts
  }: {
    entity: string
    fields: Array<Extract<keyof TIn, string>>
    mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
    page_size?: number
    cursor?: string | null
  },
) => {
  const limit = opts?.page_size ?? 100
  const cursor = LastUpdatedAtNextOffset.fromCursor(opts?.cursor)
  const kUpdatedAt =
    entity === 'contacts' ? 'lastmodifieddate' : 'hs_lastmodifieddate'
  // We may want to consider using the list rather than search endpoint for this stuff...
  const res = await instance[`crm_${entity as 'contacts'}`].POST(
    `/crm/v3/objects/${entity as 'contacts'}/search`,
    {
      body: {
        properties: [
          'hs_object_id',
          'createdate',
          'lastmodifieddate',
          'hs_lastmodifieddate',
          ...fields,
        ],
        filterGroups: cursor?.last_updated_at
          ? [
              {
                filters: [
                  {
                    propertyName: kUpdatedAt,
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
            propertyName: kUpdatedAt,
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
  const items = res.data.results.map(opts.mapper.parse)
  const lastItem = items[items.length - 1]
  return {
    items,
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
}

const _listEntityFullThenMap = async <TIn, TOut extends BaseRecord>(
  instance: HubspotSDK,
  {
    entity,
    ...opts
  }: {
    entity: string
    mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
    page_size?: number
    cursor?: string | null
  },
) => {
  const res = await instance[`crm_${entity as 'owners'}`].GET(
    `/crm/v3/${entity as 'owners'}/`,
    {
      params: {
        query: {
          after: opts?.cursor ?? undefined,
          limit: opts?.page_size ?? 100,
        },
      },
    },
  )
  return {
    items: res.data.results.map(opts.mapper.parse),
    has_next_page: !!res.data.paging?.next?.after,
    // This would reset the sync and loop back from the beginning, except
    // the has_next_page check prevents that
    next_cursor: res.data.paging?.next?.after,
  }
}

export const hubspotProvider = {
  __init__: ({proxyLinks}) =>
    initHubspotSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listContacts: async ({instance, input}) =>
    _listEntityIncrementalThenMap(instance, {
      ...input,
      entity: 'contacts',
      mapper: mappers.contact,
      fields: [],
    }),
  listAccounts: async ({instance, input}) =>
    _listEntityIncrementalThenMap(instance, {
      ...input,
      entity: 'companies',
      mapper: mappers.account,
      fields: [],
    }),
  listOpportunities: async ({instance, input}) =>
    _listEntityIncrementalThenMap(instance, {
      ...input,
      entity: 'deals',
      mapper: mappers.opportunity,
      fields: [],
    }),
  // Original supaglue never implemented this, TODO: handle me...
  // listLeads: async ({instance, input}) =>
  //   _listEntityThenMap(instance, {
  //     ...input,
  //     entity: 'leads',
  //     mapper: mappers.lead,
  //     fields: [],
  //   }),
  // Owners does not have a search API... so we have to do a full sync every time
  listUsers: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      entity: 'owners',
      mapper: mappers.user,
      page_size: input?.page_size,
      cursor: input?.cursor,
    }),
  metadataListStandardObjects: () =>
    HUBSPOT_STANDARD_OBJECTS.map((name) => ({name})),
  metadataListCustomObjects: async ({instance}) => {
    const res = await instance.crm_schemas.GET('/crm/v3/schemas')
    return res.data.results.map((obj) => ({id: obj.id, name: obj.name}))
  },
} satisfies CRMProvider<HubspotSDK>
