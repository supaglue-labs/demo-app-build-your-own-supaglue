import type {
  BaseRecord,
  PathsWithMethod,
  ResponseFrom,
  StrictObj,
} from '@supaglue/vdk'
import {mapper, zCast} from '@supaglue/vdk'
import type {PipedriveSDKTypes} from '@opensdks/sdk-pipedrive'
import {initPipedriveSDK, type PipedriveSDK} from '@opensdks/sdk-pipedrive'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'

// Unfortunately pipedrive does not use the schemas field properly...
// So we have to do the type magic...
// type Pipedrive = PipedriveSDKTypes['oas']['components']['schemas']
type PipedrivePaths = PipedriveSDKTypes['oas']['paths']

type GETResponse<P extends PathsWithMethod<PipedrivePaths, 'get'>> =
  ResponseFrom<PipedrivePaths, 'get', P>

// Move this into sdk-pipedrive would be good
type Organization = NonNullable<GETResponse<'/organizations'>['data']>[number]
type Person = NonNullable<GETResponse<'/persons'>['data']>[number]
type Deal = NonNullable<GETResponse<'/deals'>['data']>[number]
type Lead = NonNullable<GETResponse<'/leads'>['data']>[number]
type User = NonNullable<GETResponse<'/users'>['data']>[number]

const mappers = {
  account: mapper(zCast<StrictObj<Organization>>(), commonModels.account, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
    name: 'name',
  }),
  contact: mapper(zCast<StrictObj<Person>>(), commonModels.contact, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
    first_name: (p) => p.first_name ?? '',
    last_name: (p) => p.last_name ?? '',
  }),
  opportunity: mapper(zCast<StrictObj<Deal>>(), commonModels.opportunity, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
    name: 'title',
  }),
  lead: mapper(zCast<StrictObj<Lead>>(), commonModels.lead, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
  }),
  user: mapper(zCast<StrictObj<User>>(), commonModels.user, {
    id: (p) => `${p.id}`,
    updated_at: 'modified',
  }),
}

const _listEntityFullThenMap = async <TIn, TOut extends BaseRecord>(
  instance: PipedriveSDK,
  {
    entity,
    ...opts
  }: {
    entity: string
    mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
    page_size?: number
    cursor?: string | null
  },
) => {
  // Extract me...
  let cursor = opts?.cursor ? Number.parseInt(opts.cursor) : undefined
  if (Number.isNaN(cursor)) {
    cursor = undefined
  }
  const kUpdatedAt = entity === 'users' ? 'modified' : 'update_time'
  const res = await instance.GET(`/${entity as 'persons'}`, {
    params: {
      query: {
        limit: opts?.page_size ?? 100,
        start: cursor,
        // Pipedrive does not support filter but does support sorting, so we can use that
        // to our advantage to implement a binary search for incremental sync
        sort: `${kUpdatedAt} ASC`,
        // NOTE: See if we can get incremental sync working with a real filter
        // filter_id: 1
      },
    },
  })
  return {
    has_next_page: res.data.additional_data?.pagination?.next_start != null,
    items: (res.data.data ?? []).map(opts.mapper.parse),
    next_cursor: res.data.additional_data?.pagination?.next_start?.toString(),
  }
}

export const pipedriveProvider = {
  __init__: ({proxyLinks}) =>
    initPipedriveSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listAccounts: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      ...input,
      entity: 'persons',
      mapper: mappers.account,
    }),
  listContacts: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      ...input,
      entity: 'persons',
      mapper: mappers.contact,
    }),
  listOpportunities: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      ...input,
      entity: 'deals',
      mapper: mappers.opportunity,
    }),
  listLeads: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      ...input,
      entity: 'leads',
      mapper: mappers.lead,
    }),
  // Currently getting a scope & url mismatch issue, not sure if permanent tho
  // in either case there does not appear to be any actual crm_users synced into production at the moment...
  listUsers: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      ...input,
      entity: 'users',
      mapper: mappers.user,
    }),
  // eslint-disable-next-line @typescript-eslint/require-await
  getAccount: async ({}) => {
    throw new Error('Not implemented yet')
  },
} satisfies CRMProvider<PipedriveSDK>
