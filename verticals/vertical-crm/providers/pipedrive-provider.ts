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

type Person = NonNullable<GETResponse<'/persons'>['data']>[number]

const mappers = {
  contact: mapper(zCast<StrictObj<Person>>(), commonModels.contact, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
    first_name: (p) => p.first_name ?? '',
    last_name: (p) => p.last_name ?? '',
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
  const res = await instance.GET(`/${entity as 'persons'}`, {
    params: {
      query: {
        limit: opts?.page_size ?? 100,
        start: cursor,
        // Pipedrive does not support filter but does support sorting, so we can use that
        // to our advantage to implement a binary search for incremental sync
        sort: 'update_time ASC',
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
  listContacts: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      ...input,
      entity: 'persons',
      mapper: mappers.contact,
    }),
  // eslint-disable-next-line @typescript-eslint/require-await
  getAccount: async ({}) => {
    throw new Error('Not implemented yet')
  },
} satisfies CRMProvider<PipedriveSDK>
