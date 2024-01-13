import type {StrictObj} from '@supaglue/vdk'
import {mapper, zCast} from '@supaglue/vdk'
import {
  initOutreachSDK,
  type OutreachSDK,
  type OutreachSDKTypes,
} from '@opensdks/sdk-outreach'
import type {SalesEngagementProvider} from '../router'
import {schemas} from '../router'

type Outreach = OutreachSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(
    zCast<StrictObj<Outreach['prospectResponse']>>(),
    schemas.contact,
    {
      id: (r) => r.id?.toString() ?? '',
      first_name: (r) => r.attributes?.firstName ?? '',
      last_name: (r) => r.attributes?.lastName ?? '',
    },
  ),
}

export const outreachProvider = {
  init: ({fetchLinks}) =>
    initOutreachSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...fetchLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    const res = await instance.GET('/prospects', {})
    return {hasNextPage: true, items: res.data.data?.map(mappers.contact) ?? []}
  },
} satisfies SalesEngagementProvider<OutreachSDK>
