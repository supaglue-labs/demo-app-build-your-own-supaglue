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
  }),
  opportunity: mapper(
    zCast<SFDC['OpportunitySObject']>(),
    commonModels.opportunity,
    {
      id: 'Id',
      updated_at: 'SystemModstamp',
      name: 'Name',
    },
  ),
  lead: mapper(zCast<SFDC['LeadSObject']>(), commonModels.lead, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
  }),
  user: mapper(zCast<SFDC['UserSObject']>(), commonModels.user, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
  }),
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
        SELECT Id, SystemModstamp, ${opts.fields.join(', ')}
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
      fields: ['Name'],
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
      fields: ['FirstName', 'LastName'],
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
      fields: ['Name'],
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
} satisfies CRMProvider<SalesforceSDK>
