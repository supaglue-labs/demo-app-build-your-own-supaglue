import type {BaseRecord} from '@supaglue/vdk'
import {LastUpdatedAtNextOffset, mapper, z, zCast} from '@supaglue/vdk'
import type {Oas_crm_contacts, Oas_crm_owners} from '@opensdks/sdk-hubspot'
import {initHubspotSDK, type HubspotSDK} from '@opensdks/sdk-hubspot'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'

export type SimplePublicObject =
  Oas_crm_contacts['components']['schemas']['SimplePublicObject']
export type Owner = Oas_crm_owners['components']['schemas']['PublicOwner']

//   // In certain cases, Hubspot cannot determine the object type based on just the name for custom objects,
//   // so we need to get the ID.
//  const getObjectTypeIdFromNameOrId = async(nameOrId: string): Promise<string> => {
//     // Standard objects can be referred by name no problem
//     if (isStandardObjectType(nameOrId)) {
//       return nameOrId;
//     }
//     if (this.#isAlreadyObjectTypeId(nameOrId)) {
//       return nameOrId;
//     }
//     await this.maybeRefreshAccessToken();
//     const schemas = await this.#client.crm.schemas.coreApi.getAll();
//     const schemaId = schemas.results.find((schema) => schema.name === nameOrId || schema.objectTypeId === nameOrId)
//       ?.objectTypeId;
//     if (!schemaId) {
//       throw new NotFoundError(`Could not find custom object schema with name or id ${nameOrId}`);
//     }
//     return schemaId;
//   }

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
const HSOpportunity = z.object({
  id: z.string(),
  properties: z.object({
    hs_object_id: z.string(),
    createdate: z.string(),
    lastmodifieddate: z.string().nullish(),
    // properties specific to opportunities below...
    name: z.string().nullish(),
    description: z.string().nullish(),
    owner_id: z.string().nullish(),
    account_id: z.string().nullish(),
    status: z.string().nullish(),
    stage: z.string().nullish(),
    closedate: z.string().nullish(), // Assuming closeDate is a string in HubSpot format
    amount: z.string().nullish(),
    last_activity_at: z.string().nullish(), // Assuming lastActivityAt is a string in HubSpot format
    is_deleted: z.boolean().nullish(),
    hs_is_closed_won: z.string().nullish(),
    hs_is_closed: z.string().nullish(),
    archivedAt: z.string().nullish(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})
const HSUser = z.object({
  id: z.string(),
  properties: z.object({
    hs_object_id: z.string(),
    createdate: z.string(),
    lastmodifieddate: z.string().nullish(),
    // properties specific to opportunities below...
    email: z.string().nullish(),
    firstname: z.string().nullish(),
    lastname: z.string().nullish(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})
const HSAccount = z.object({
  id: z.string(),
  properties: z.object({
    hs_object_id: z.string(),
    createdate: z.string(),
    lastmodifieddate: z.string().nullish(),
    name: z.string().nullish(),
    description: z.string().nullish(),
    hubspot_owner_id: z.string().nullish(),
    industry: z.string().nullish(),
    website: z.string().nullish(),
    numberofemployees: z.string().nullish(),
    addresses: z.string().nullish(), // Assuming addresses is a string; adjust the type if needed
    phonenumbers: z.string().nullish(), // Assuming phonenumbers is a string; adjust the type if needed
    lifecyclestage: z.string().nullish(),
    notes_last_updated: z.string().nullish(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})

const propertiesToFetch = {
  company: [
    'hubspot_owner_id',
    'description',
    'industry',
    'website',
    'domain',
    'hs_additional_domains',
    'numberofemployees',
    'address',
    'address2',
    'city',
    'state',
    'country',
    'zip',
    'phone',
    'notes_last_updated',
    'lifecyclestage',
    'createddate',
  ],
  contact: [
    'address', // TODO: IP state/zip/country?
    'address2',
    'city',
    'country',
    'email',
    'fax',
    'firstname',
    'hs_createdate', // TODO: Use this or createdate?
    'hs_is_contact', // TODO: distinguish from "visitor"?
    'hubspot_owner_id',
    'lifecyclestage',
    'lastname',
    'mobilephone',
    'phone',
    'state',
    'work_email',
    'zip',
  ],
  deal: [
    'dealname',
    'description',
    'dealstage',
    'amount',
    'hubspot_owner_id',
    'notes_last_updated',
    'closedate',
    'pipeline',
    'hs_is_closed_won',
    'hs_is_closed',
  ],
  user: ['Id', 'Name', 'Email', 'IsActive', 'CreatedDate', 'SystemModstamp'],
  account: [
    'Id',
    'Name',
    'Type',
    'ParentId',
    'BillingAddress',
    'ShippingAddress',
    'Phone',
    'Fax',
    'Website',
    'Industry',
    'NumberOfEmployees',
    'OwnerId',
    'CreatedDate',
    'LastModifiedDate',
  ],
}

const mappers = {
  account: mapper(HSAccount, commonModels.account, {
    id: 'id',
    name: 'properties.name',
    updated_at: (record) =>
      record.properties.lastmodifieddate
        ? new Date(record.properties.lastmodifieddate)
        : null,
    isDeleted: (record) => !!record.archived,
    website: 'properties.website',
    industry: 'properties.industry',
    numberOfEmployees: (record) =>
      record.properties.numberofemployees
        ? parseInt(record.properties.numberofemployees, 10)
        : null,
    ownerId: 'properties.hubspot_owner_id',
    createdAt: (record) => new Date(record.createdAt),
    updatedAt: (record) => new Date(record.updatedAt),
  }),
  contact: mapper(HSContact, commonModels.contact, {
    id: 'id',
    first_name: 'properties.firstname',
    last_name: 'properties.lastname',
    updated_at: 'updatedAt',
  }),
  opportunity: mapper(HSOpportunity, commonModels.opportunity, {
    id: 'id',
    name: 'properties.name',
    updated_at: (record) =>
      record.properties.lastmodifieddate
        ? new Date(record.properties.lastmodifieddate)
        : null,
    description: 'properties.description',
    ownerId: 'properties.owner_id',
    status: (record) =>
      record.properties.hs_is_closed_won
        ? 'WON'
        : record.properties.hs_is_closed
          ? 'LOST'
          : 'Open',
    stage: 'properties.stage',
    closeDate: (record) =>
      record.properties.closedate
        ? new Date(record.properties.closedate)
        : null,
    accountId: 'properties.account_id',
    amount: 'properties.amount',
    lastActivityAt: (record) =>
      record.properties.last_activity_at
        ? new Date(record.properties.last_activity_at)
        : null,
    createdAt: (record) => new Date(record.properties.createdate),
    updatedAt: (record) => new Date(record.properties.createdate),
    isDeleted: 'properties.is_deleted',
    lastModifiedAt: (record) => new Date(record.updatedAt),
  }),
  lead: mapper(HSBase, commonModels.lead, {
    id: 'id',
    updated_at: 'updatedAt',
  }),
  user: mapper(HSUser, commonModels.user, {
    id: 'id',
    updated_at: 'updatedAt',
    name: (record) =>
      [record.properties.firstname, record.properties.lastname]
        .filter((n) => !!n?.trim())
        .join(' '),
    email: 'properties.email',
    isActive: (record) => !record.archived, // Assuming archived is a boolean
    createdAt: (record) => new Date(record.properties.createdate),
    updatedAt: (record) =>
      record.properties.lastmodifieddate
        ? new Date(record.properties.lastmodifieddate)
        : null,
    isDeleted: (record) => !!record.archived, // Assuming archived is a boolean
    lastModifiedAt: (record) =>
      record.updatedAt ? new Date(record.updatedAt) : null,
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
          'name',
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
      fields: propertiesToFetch.account,
    }),
  listOpportunities: async ({instance, input}) =>
    _listEntityIncrementalThenMap(instance, {
      ...input,
      entity: 'deals',
      mapper: mappers.opportunity,
      fields: propertiesToFetch.deal,
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
  metadataListProperties: async ({instance, input}) => {
    const res = await instance.crm_properties.GET(
      '/crm/v3/properties/{objectType}',
      {
        params: {path: {objectType: input.name}},
      },
    )
    return res.data.results.map((obj) => ({id: obj.name, label: obj.label}))
  },
  // metadataCreateObjectsSchema: async ({instance, input}) => {
  //   const res = await instance.crm_schemas.POST('/crm/v3/schemas', {
  //     body: {
  //       name: input.name,
  //       labels: input.label.singular,
  //       description: input.description || '',
  //       properties: input.fields.map((p) => ({
  //         type: p.type || 'string',
  //         label: p.label,
  //         name: p.label,
  //         fieldType: p.type || 'string',
  //       })),
  //       primaryFieldId: input.primaryFieldId,
  //     },
  //   })
  //   console.log('input:', input)
  //   // console.log('res:', res)
  //   return [{id: '123', name: input.name}]
  // },
  metadataCreateAssociation: async ({instance, input}) => {
    const res = await instance.crm_associations.POST(
      '/crm/v3/associations/{fromObjectType}/{toObjectType}/batch/create',
      {
        params: {
          path: {
            fromObjectType: input.sourceObject,
            toObjectType: input.targetObject,
          },
        },
        body: {
          inputs: [
            {
              from: {id: input.sourceObject},
              to: {id: input.targetObject},
              type: `${input.sourceObject}_${input.targetObject}`,
            },
          ],
        },
      },
    )
    console.log('res:', res.data.errors[0])
    console.log('res:', res.data.errors[1])
    return res.data
  },
} satisfies CRMProvider<HubspotSDK>
