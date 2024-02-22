import {PLACEHOLDER_BASE_URL} from '@supaglue/vdk'
import {initPipedriveSDK, type PipedriveSDK} from '@opensdks/sdk-pipedrive'
import type {CRMProvider} from '../router'
import {MS_DYNAMICS_365_SALES_STANDARD_OBJECTS} from './ms-dynamics-365-sales/constants'

export const msDynamics365SalesProvider = {
  __init__: ({proxyLinks}) =>
    initPipedriveSDK({
      baseUrl: PLACEHOLDER_BASE_URL,
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    await instance.request('GET', '/contacts')
    return {
      has_next_page: true,
      items: [],
    }
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  getAccount: async ({}) => {
    throw new Error('Not implemented yet')
  },
  metadataListStandardObjects: () =>
    MS_DYNAMICS_365_SALES_STANDARD_OBJECTS.map((name) => ({name})),
} satisfies CRMProvider<PipedriveSDK>
