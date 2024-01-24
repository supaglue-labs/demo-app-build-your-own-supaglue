import type {StrictObj} from '@supaglue/vdk'
import {mapper, z, zCast} from '@supaglue/vdk'
import {
  initOutreachSDK,
  type OutreachSDK,
  type OutreachSDKTypes,
} from '@opensdks/sdk-outreach'
import type {SalesEngagementProvider} from '../router'
import {commonModels} from '../router'

type Outreach = OutreachSDKTypes['oas']['components']['schemas']

/** Outreach OpenAPI is unfortunately incomplete */
const listResponse = z.object({
  data: z.array(z.unknown()),
  meta: z.object({
    count: z.number(),
    count_truncated: z.boolean(),
  }),
  links: z
    .object({
      // does first / previous exist?
      last: z.string().nullish(),
      next: z.string().nullish(),
    })
    .optional(),
})

const mappers = {
  contact: mapper(
    zCast<StrictObj<Outreach['prospectResponse']>>(),
    commonModels.contact,
    {
      id: (r) => r.id?.toString() ?? '',
      first_name: (r) => r.attributes?.firstName ?? '',
      last_name: (r) => r.attributes?.lastName ?? '',
    },
  ),
  sequence: mapper(
    zCast<StrictObj<Outreach['sequenceResponse']>>(),
    commonModels.sequence,
    {
      id: (r) => r.id?.toString() ?? '',
      name: (r) => r.attributes?.name ?? '',
      raw_data: (r) => r,
    },
  ),
}

export const outreachProvider = {
  __init__: ({fetchLinks}) =>
    initOutreachSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...fetchLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    const res = await instance.GET('/prospects', {params: {query: {}}})
    return {hasNextPage: true, items: res.data.data?.map(mappers.contact) ?? []}
  },
  listSequences: async ({instance, input}) => {
    const res = await instance.GET(
      input.cursor
        ? // Need this for now because SDK cannot handlle absolute URL just yet.
          (input.cursor.replace(
            instance.clientOptions.baseUrl ?? '',
            '',
          ) as '/sequences')
        : '/sequences',
    )
    return {
      nextPageCursor: listResponse.parse(res.data).links?.next,
      items: res.data.data?.map(mappers.sequence) ?? [],
    }
  },
} satisfies SalesEngagementProvider<OutreachSDK>
