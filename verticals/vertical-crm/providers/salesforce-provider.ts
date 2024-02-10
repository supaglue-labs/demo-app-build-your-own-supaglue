import {mapper, modifyRequest, PLACEHOLDER_BASE_URL, zCast} from '@supaglue/vdk'
import type {SalesforceSDKTypes} from '@opensdks/sdk-salesforce'
import {initSalesforceSDK, type SalesforceSDK} from '@opensdks/sdk-salesforce'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'

export type SFDC = SalesforceSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(zCast<SFDC['ContactSObject']>(), commonModels.contact, {
    id: 'Id',
    first_name: 'FirstName',
    last_name: 'LastName',
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
  listContacts: async ({instance, input}) => {
    const res = await instance.query<SFDC['ContactSObject']>(
      `SELECT Id, FirstName, LastName FROM Contact ORDER BY SystemModstamp ASC LIMIT ${
        input?.limit ?? 10
      }`,
    )
    return {
      hasNextPage: true,
      items: res.records.map(mappers.contact.parse),
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
} satisfies CRMProvider<SalesforceSDK>
