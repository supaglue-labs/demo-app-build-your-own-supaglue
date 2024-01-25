import {mapper, zCast} from '@supaglue/vdk'
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

// TODO: Get this from our config
const instanceUrl = process.env['SALESFORCE_INSTANCE_URL']
// To get list of available versions, visit $instanceUrl/services/data
const apiVersion = 'v59.0'

export const salesforceProvider = {
  __init__: ({fetchLinks}) =>
    initSalesforceSDK({
      baseUrl: instanceUrl + '/services/data/' + apiVersion,
      // headers: {authorization: 'Bearer ...'} , // Handled by Nango
      links: (defaultLinks) => [...fetchLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    const res = await instance.GET('/sobjects/Contact', {})
    const contacts = await Promise.all(
      (res.data.recentItems ?? []).map((item) =>
        instance
          .GET('/sobjects/Contact/{id}', {
            params: {path: {id: (item as {Id: string}).Id}},
          })
          .then((r) => r.data),
      ),
    )
    return {
      hasNextPage: true,
      items: contacts.map(mappers.contact.parse),
    }
  },
} satisfies CRMProvider<SalesforceSDK>
