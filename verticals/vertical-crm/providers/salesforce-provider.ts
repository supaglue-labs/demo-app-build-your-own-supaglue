import {
  LimitOffset,
  mapper,
  modifyRequest,
  PLACEHOLDER_BASE_URL,
  z,
  zCast,
} from '@supaglue/vdk'
import type {SalesforceSDKTypes} from '@opensdks/sdk-salesforce'
import {initSalesforceSDK, type SalesforceSDK} from '@opensdks/sdk-salesforce'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'
import {SALESFORCE_STANDARD_OBJECTS} from './salesforce/constants'

export type SFDC = SalesforceSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(zCast<SFDC['ContactSObject']>(), commonModels.contact, {
    id: 'Id',
    first_name: 'FirstName',
    last_name: 'LastName',
    raw_data: (c) => c,
  }),
}

/**
 * Hard-coded for now, to get list of available versions, visit $instanceUrl/services/data
 * TODO: Consider making this configurable by
 * 1) Exposing ConnectionConfiguration and ConnectionMetadata as part of params to __init__.
 * We don't do that today to reduce 1x roundtrip needed on every request
 * 2) Allow it to be configured on a per request basis via a `x-salesforce-api-version` header.
 * Simpler but we would be forcing the consumer to have to worry about it.
 */
const apiVersion = 'v59.0'

export const salesforceProvider = {
  __init__: ({proxyLinks}) =>
    initSalesforceSDK({
      baseUrl: PLACEHOLDER_BASE_URL,
      links: (defaultLinks) => [
        (req, next) =>
          next(
            modifyRequest(req, {
              url: req.url.replace(
                PLACEHOLDER_BASE_URL,
                PLACEHOLDER_BASE_URL + '/services/data/' + apiVersion,
              ),
            }),
          ),
        ...proxyLinks,
        ...defaultLinks,
      ],
    }),
  countEntity: async ({instance, input}) => {
    const res = await instance.query(`SELECT COUNT() FROM ${input.entity}`)
    return {count: res.totalSize}
  },
  listContacts: async ({instance, input}) => {
    const limit = input?.page_size ?? 100
    const {offset = 0} = LimitOffset.fromCursor(input?.cursor)
    const res = await instance.query<SFDC['ContactSObject']>(`
      SELECT Id, FirstName, LastName 
      FROM Contact 
      ORDER BY SystemModstamp ASC
      LIMIT ${limit} OFFSET ${offset}
    `)
    return {
      items: res.records.map(mappers.contact.parse),
      nextCursor: res.records.length
        ? LimitOffset.toCursor({offset: offset + limit})
        : null,
    }
  },
  getContact: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Contact/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },
  getCompany: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Account/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },
  metadataListStandardObjects: () =>
    SALESFORCE_STANDARD_OBJECTS.map((name) => ({name})),
  metadataListCustomObjects: async ({instance}) => {
    const res = await instance.GET('/sobjects')
    return (res.data.sobjects ?? [])
      .filter((s) => s.custom)
      .map((s) => ({id: s.name!, name: s.name!}))
  },
} satisfies CRMProvider<SalesforceSDK>
