import type {StrictObj} from '@supaglue/vdk'
import {mapper, zCast} from '@supaglue/vdk'
import {
  initSalesloftSDK,
  type SalesloftSDK,
  type SalesloftSDKTypes,
} from '@opensdks/sdk-salesloft'
import type {SalesEngagementProvider} from '../router'
import {schemas} from '../router'

type Salesloft = SalesloftSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(zCast<StrictObj<Salesloft['Person']>>(), schemas.contact, {
    // TODO: Mapper should be able to enforce types as well so number does not automatically become string.
    id: (p) => p.id?.toString() ?? '',
    first_name: (p) => p.first_name ?? '',
    last_name: (p) => p.last_name ?? '',
  }),
}

export const salesloftProvider = {
  init: ({fetchLinks}) =>
    initSalesloftSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...fetchLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    const res = await instance.GET('/v2/people.json', {})
    return {hasNextPage: true, items: res.data.data.map(mappers.contact)}
  },
} satisfies SalesEngagementProvider<SalesloftSDK>
