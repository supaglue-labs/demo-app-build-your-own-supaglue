import type {StrictObj} from '@supaglue/vdk'
import {mapper, zCast} from '@supaglue/vdk'
import {
  initApolloSDK,
  type ApolloSDK,
  type ApolloSDKTypes,
} from '@opensdks/sdk-apollo'
import type {SalesEngagementProvider} from '../router'
import {commonModels} from '../router'

type Apollo = ApolloSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(zCast<StrictObj<Apollo['contact']>>(), commonModels.contact, {
    id: 'id',
    first_name: (c) => c.first_name ?? '',
    last_name: (c) => c.last_name ?? '',
  }),
}

export const apolloProvider = {
  __init__: ({proxyLinks}) =>
    initApolloSDK({
      api_key: '', // This will be populated by Nango, or you can populate your own
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    const res = await instance.POST('/v1/contacts/search', {})
    return {
      hasNextPage: true,
      items: res.data.contacts.map(mappers.contact),
    }
  },
  // eslint-disable-next-line @typescript-eslint/require-await, arrow-body-style
  listSequences: async () => {
    return {
      nextPageCursor: null,
      items: [],
    }
  },
} satisfies SalesEngagementProvider<ApolloSDK>
