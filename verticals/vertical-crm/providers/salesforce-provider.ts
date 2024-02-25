import type {BaseRecord} from '@supaglue/vdk'
import {
  LastUpdatedAtId,
  mapper,
  modifyRequest,
  PLACEHOLDER_BASE_URL,
  zCast,
} from '@supaglue/vdk'
import * as jsforce from 'jsforce'
import type {SalesforceSDKTypes} from '@opensdks/sdk-salesforce'
import {
  initSalesforceSDK,
  type SalesforceSDK as _SalesforceSDK,
} from '@opensdks/sdk-salesforce'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'
import {SALESFORCE_STANDARD_OBJECTS} from './salesforce/constants'

export type SFDC = SalesforceSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(zCast<SFDC['ContactSObject']>(), commonModels.contact, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    first_name: 'FirstName',
    last_name: 'LastName',
  }),
  account: mapper(zCast<SFDC['AccountSObject']>(), commonModels.account, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
    isDeleted: 'IsDeleted',
    type: 'Type',
    parentId: 'ParentId',
    billingAddress: (record) => ({
      street1: record.BillingStreet ?? null,
      city: record.BillingCity ?? null,
      state: record.BillingState ?? null,
      postalCode: record.BillingPostalCode ?? null,
      country: record.BillingCountry ?? null,
      latitude: record.BillingLatitude ?? null,
      longitude: record.BillingLongitude ?? null,
      geocodeAccuracy: record.BillingGeocodeAccuracy ?? null,
      addressType: 'billing',
    }),
    shippingAddress: (record) => ({
      street1: record.ShippingStreet ?? null,
      city: record.ShippingCity ?? null,
      state: record.ShippingState ?? null,
      postalCode: record.ShippingPostalCode ?? null,
      country: record.ShippingCountry ?? null,
      latitude: record.ShippingLatitude ?? null,
      longitude: record.ShippingLongitude ?? null,
      geocodeAccuracy: record.ShippingGeocodeAccuracy ?? null,
      addressType: 'shipping',
    }),
    phone: 'Phone',
    fax: 'Fax',
    website: 'Website',
    industry: 'Industry',
    numberOfEmployees: 'NumberOfEmployees',
    ownerId: 'OwnerId',
    createdAt: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate) : null,
  }),
  opportunity: mapper(
    zCast<SFDC['OpportunitySObject']>(),
    commonModels.opportunity,
    {
      id: 'Id',
      updated_at: 'SystemModstamp',
      name: 'Name',
      description: 'Description',
      ownerId: 'OwnerId',
      status: (record) => (record.IsClosed ? 'Closed' : 'Open'),
      stage: 'StageName',
      closeDate: (record) =>
        record.CloseDate ? new Date(record.CloseDate) : null,
      accountId: 'AccountId',
      amount: 'Amount',
      lastActivityAt: (record) =>
        record.LastActivityDate ? new Date(record.LastActivityDate) : null,
      createdAt: (record) =>
        record.CreatedDate ? new Date(record.CreatedDate) : null,
      isDeleted: 'IsDeleted',
      lastModifiedAt: (record) =>
        record.LastModifiedDate ? new Date(record.LastModifiedDate) : null,
      rawData: (record) => record,
    },
  ),
  lead: mapper(zCast<SFDC['LeadSObject']>(), commonModels.lead, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
    firstName: 'FirstName',
    lastName: 'LastName',
    ownerId: 'OwnerId',
    title: 'Title',
    company: 'Company',
    convertedDate: (record) =>
      record.ConvertedDate ? new Date(record.ConvertedDate) : null,
    leadSource: 'LeadSource',
    convertedAccountId: 'ConvertedAccountId',
    convertedContactId: 'ConvertedContactId',
    addresses: (record) =>
      record.Street ||
      record.City ||
      record.State ||
      record.Country ||
      record.PostalCode
        ? [
            {
              street1: record.Street ?? null,
              street2: null,
              city: record.City ?? null,
              state: record.State ?? null,
              country: record.Country ?? null,
              postalCode: record.PostalCode ?? null,
              addressType: 'primary',
            },
          ]
        : [],
    emailAddresses: (record) =>
      record.Email
        ? [{emailAddress: record.Email, emailAddressType: 'primary'}]
        : [],
    phoneNumbers: (record) =>
      record.Phone
        ? [
            {
              phoneNumber: record.Phone ?? null,
              phoneNumberType: 'primary',
            },
          ]
        : [],
    createdAt: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate) : null,
    isDeleted: 'IsDeleted',
    lastModifiedAt: (record) =>
      record.SystemModstamp ? new Date(record.SystemModstamp) : new Date(0),
    rawData: (record) => record,
  }),
  user: mapper(zCast<SFDC['UserSObject']>(), commonModels.user, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
    email: 'Email',
    isActive: 'IsActive',
    createdAt: 'CreatedDate',
    updatedAt: 'LastModifiedDate',
    lastModifiedAt: 'LastModifiedDate',
    // rawData: (rawData) => rawData,
  }),
}

type AccountFields =
  | 'OwnerId'
  | 'Name'
  | 'Description'
  | 'Industry'
  | 'Website'
  | 'NumberOfEmployees'
  | 'BillingCity'
  | 'BillingCountry'
  | 'BillingPostalCode'
  | 'BillingState'
  | 'BillingStreet'
  | 'ShippingCity'
  | 'ShippingCountry'
  | 'ShippingPostalCode'
  | 'ShippingState'
  | 'ShippingStreet'
  | 'Phone'
  | 'Fax'
  | 'LastActivityDate'
  | 'CreatedDate'
  | 'IsDeleted'
type ContactFields =
  | 'OwnerId'
  | 'AccountId'
  | 'FirstName'
  | 'LastName'
  | 'Email'
  | 'Phone'
  | 'Fax'
  | 'MobilePhone'
  | 'LastActivityDate'
  | 'MailingCity'
  | 'MailingCountry'
  | 'MailingPostalCode'
  | 'MailingState'
  | 'MailingStreet'
  | 'OtherCity'
  | 'OtherCountry'
  | 'OtherPostalCode'
  | 'OtherState'
  | 'OtherStreet'
  | 'IsDeleted'
  | 'CreatedDate'
type OpportunityFields =
  | 'OwnerId'
  | 'Name'
  | 'Description'
  | 'LastActivityDate'
  | 'Amount'
  | 'IsClosed'
  | 'IsDeleted'
  | 'IsWon'
  | 'StageName'
  | 'CloseDate'
  | 'CreatedDate'
  | 'AccountId'
type LeadFields =
  | 'OwnerId'
  | 'Title'
  | 'FirstName'
  | 'LastName'
  | 'ConvertedDate'
  | 'CreatedDate'
  | 'SystemModstamp'
  | 'ConvertedContactId'
  | 'ConvertedAccountId'
  | 'Company'
  | 'City'
  | 'State'
  | 'Street'
  | 'Country'
  | 'PostalCode'
  | 'Phone'
  | 'Email'
  | 'IsDeleted'
type UserFields = 'Name' | 'Email' | 'IsActive' | 'CreatedDate'

export const CRM_COMMON_OBJECT_TYPES = [
  'account',
  'contact',
  'lead',
  'opportunity',
  'user',
] as const
export type CRMCommonObjectType = (typeof CRM_COMMON_OBJECT_TYPES)[number]

const propertiesForCommonObject: Record<CRMCommonObjectType, string[]> = {
  account: [
    'OwnerId',
    'Name',
    'Description',
    'Industry',
    'Website',
    'NumberOfEmployees',
    // We may not need all of these fields in order to map to common object
    'BillingCity',
    'BillingCountry',
    'BillingPostalCode',
    'BillingState',
    'BillingStreet',
    // We may not need all of these fields in order to map to common object
    'ShippingCity',
    'ShippingCountry',
    'ShippingPostalCode',
    'ShippingState',
    'ShippingStreet',
    'Phone',
    'Fax',
    'LastActivityDate',
    'CreatedDate',
    'IsDeleted',
  ] as AccountFields[],
  contact: [
    'OwnerId',
    'AccountId',
    'FirstName',
    'LastName',
    'Email',
    'Phone',
    'Fax',
    'MobilePhone',
    'LastActivityDate',
    // We may not need all of these fields in order to map to common object
    'MailingCity',
    'MailingCountry',
    'MailingPostalCode',
    'MailingState',
    'MailingStreet',
    // We may not need all of these fields in order to map to common object
    'OtherCity',
    'OtherCountry',
    'OtherPostalCode',
    'OtherState',
    'OtherStreet',
    'IsDeleted',
    'CreatedDate',
  ] as ContactFields[],
  opportunity: [
    'OwnerId',
    'Name',
    'Description',
    'LastActivityDate',
    'Amount',
    'IsClosed',
    'IsDeleted',
    'IsWon',
    'StageName',
    'CloseDate',
    'CreatedDate',
    'AccountId',
  ] as OpportunityFields[],
  lead: [
    'OwnerId',
    'Title',
    'FirstName',
    'LastName',
    'ConvertedDate',
    'CreatedDate',
    'SystemModstamp',
    'ConvertedContactId',
    'ConvertedAccountId',
    'Company',
    'City',
    'State',
    'Street',
    'Country',
    'PostalCode',
    'Phone',
    'Email',
    'IsDeleted',
  ] as LeadFields[],
  user: ['Name', 'Email', 'IsActive', 'CreatedDate'] as UserFields[],
}

type SalesforceSDK = _SalesforceSDK & {
  getJsForce: () => Promise<jsforce.Connection>
}

/**
 * Hard-coded for now, to get list of available versions, visit $instanceUrl/services/data
 * TODO: Consider making this configurable by
 * 1) Exposing ConnectionConfiguration and ConnectionMetadata as part of params to __init__.
 * We don't do that today to reduce 1x roundtrip needed on every request
 * 2) Allow it to be configured on a per request basis via a `x-salesforce-api-version` header.
 * Simpler but we would be forcing the consumer to have to worry about it.
 */
const API_VERSION = '59.0'

function sdkExt(instance: SalesforceSDK) {
  /** NOTE: extract these into a helper functions inside sdk-salesforce */
  const countEntity = async (entity: string) =>
    instance.query(`SELECT COUNT() FROM ${entity}`).then((r) => r.totalSize)

  const listEntity = async <T>({
    cursor,
    ...opts
  }: {
    // to-do: Make entity and fields type safe
    entity: string
    fields: string[]
    cursor?: {
      last_updated_at: string
      last_id: string
    }
    limit?: number
  }) => {
    const whereStatement = cursor
      ? `WHERE SystemModstamp > ${cursor.last_updated_at} OR (SystemModstamp = ${cursor.last_updated_at} AND Id > '${cursor.last_id}')`
      : ''
    const limitStatement = opts.limit != null ? `LIMIT ${opts.limit}` : ''
    return instance.query<T>(`
        SELECT Id, SystemModstamp, ${opts.fields.join(', ')}, FIELDS(CUSTOM)
        FROM ${opts.entity}
        ${whereStatement}
        ORDER BY SystemModstamp ASC, Id ASC
        ${limitStatement} 
      `)
  }

  return {
    countEntity,
    listEntity,
    _listEntityThenMap: async <TIn, TOut extends BaseRecord>({
      entity,
      fields,
      ...opts
    }: {
      entity: string
      fields: Array<Extract<keyof TIn, string>>
      mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
      page_size?: number
      cursor?: string | null
    }) => {
      const limit = opts?.page_size ?? 100
      const cursor = LastUpdatedAtId.fromCursor(opts?.cursor)
      const res = await listEntity<TIn>({entity, fields, cursor, limit})
      const items = res.records.map(opts.mapper.parse)
      const lastItem = items[items.length - 1]
      return {
        items,
        has_next_page: items.length > 0,
        next_cursor: lastItem
          ? LastUpdatedAtId.toCursor({
              last_id: lastItem.id,
              last_updated_at: lastItem.updated_at,
            })
          : opts?.cursor,
      }
    },
  }
}

export const salesforceProvider = {
  __init__: ({proxyLinks, getCredentials}) => {
    const sdk = initSalesforceSDK({
      baseUrl: PLACEHOLDER_BASE_URL,
      links: (defaultLinks) => [
        (req, next) =>
          next(
            modifyRequest(req, {
              url: req.url.replace(
                PLACEHOLDER_BASE_URL,
                PLACEHOLDER_BASE_URL + '/services/data/v' + API_VERSION,
              ),
            }),
          ),
        ...proxyLinks,
        ...defaultLinks,
      ],
    })
    async function getJsForce() {
      const creds = await getCredentials()
      if (!creds.instance_url || !creds.access_token) {
        throw new Error('Missing instance_url or access_token')
      }
      const conn = new jsforce.Connection({
        instanceUrl: creds.instance_url,
        accessToken: creds.access_token,
        version: API_VERSION,
        maxRequest: 10,
      })
      return conn
    }
    return {...sdk, getJsForce} satisfies SalesforceSDK
  },
  countEntity: async ({instance, input}) => {
    // NOTE: extract this into a helper function inside sdk-salesforce
    const res = await instance.query(`SELECT COUNT() FROM ${input.entity}`)
    return {count: res.totalSize}
  },
  // MARK: - Account
  listAccounts: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Account',
      fields: propertiesForCommonObject.account,
      mapper: mappers.account,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),
  getAccount: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Account/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },

  // MARK: - Contact

  listContacts: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Contact',
      fields: propertiesForCommonObject.contact,
      mapper: mappers.contact,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),
  getContact: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Contact/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },

  // MARK: - Opportunity

  listOpportunities: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Opportunity',
      fields: propertiesForCommonObject.opportunity,
      mapper: mappers.opportunity,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - Lead

  listLeads: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Lead',
      fields: ['Name'],
      mapper: mappers.lead,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - User

  listUsers: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'User',
      fields: ['Name'],
      mapper: mappers.user,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - Metadata
  metadataListStandardObjects: () =>
    SALESFORCE_STANDARD_OBJECTS.map((name) => ({name})),
  metadataListCustomObjects: async ({instance}) => {
    const res = await instance.GET('/sobjects')
    return (res.data.sobjects ?? [])
      .filter((s) => s.custom)
      .map((s) => ({id: s.name!, name: s.name!}))
  },
  metadataListProperties: async ({instance, input}) => {
    const sfdc = await instance.getJsForce()
    await sfdc.metadata.read('CustomObject', input.name)
    return []
  },
  metadataCreateObjectsSchema: async ({instance, input}) => {
    const metadata = [
      {
        fullName: `${input.name}__c`,
        label: input.label.singular,
        pluralLabel: input.label.plural,
        nameField: {
          type: 'Text',
          label: 'Name',
        },
        deploymentStatus: 'Deployed',
        sharingModel: 'ReadWrite',
      },
    ]
    const sfdc = await instance.getJsForce()
    let resultObj: {id: string; name: string} = {id: '', name: ''}

    try {
      const results = await sfdc.metadata.create('CustomObject', metadata)
      const result: any = results[0]
      resultObj = {id: result.fullName, name: result.fullName}
    } catch (err) {
      console.error(err)
    }
    return resultObj
  },
} satisfies CRMProvider<SalesforceSDK>
