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
  upsertAccount: async ({instance, input}) => {
    const {domain, name} = input.upsert_on

    if (!domain && !name) {
      throw new Error('Must specify at least one upsert_on field')
    }

    const res = await instance.GET('/accounts', {
      params: {
        query: {
          ...(name && {'filter[name]': name}),
          ...(domain && {'filter[domain]': domain}),
        },
      },
    })
    if ((res.data.data?.length ?? 0) > 1) {
      throw new Error('More than one account found for upsertOn fields')
    }
    const existingAccount = res.data.data?.[0]
    if (existingAccount?.id) {
      const updateRes = await instance.PATCH('/accounts/{id}', {
        params: {path: {id: existingAccount.id}},
        body: {
          data: {
            id: existingAccount.id,
            type: 'account',
            attributes: {
              name,
              domain,
              ...input.record.custom_fields,
            },
            relationships: {
              owner: input.record.owner_id
                ? {
                    data: {
                      type: 'user',
                      id: Number.parseInt(input.record.owner_id, 10),
                    },
                  }
                : undefined,
            },
          },
        },
      })
      return updateRes.data
    } else {
      const createRes = await instance.POST('/accounts', {
        body: {
          data: {
            type: 'account',
            attributes: {
              name,
              domain,
              ...input.record.custom_fields,
            },
            relationships: {
              owner: input.record.owner_id
                ? {
                    data: {
                      type: 'user',
                      id: Number.parseInt(input.record.owner_id, 10),
                    },
                  }
                : undefined,
            },
          },
        },
      })
      return createRes.data
    }

    // const searchResult = await this.#searchAccounts({
    //   filter: {
    //     domain: domain,
    //     name: name,
    //   },
    // });

    // if (searchResult.records.length > 1) {
    //   throw new BadRequestError('More than one account found for upsertOn fields');
    // }
    // if (searchResult.records.length) {
    //   return this.updateAccount({ ...params.record, id: searchResult.records[0].id.toString() });
    // }
    // return this.createAccount(params.record);
  },
} satisfies SalesEngagementProvider<OutreachSDK>
