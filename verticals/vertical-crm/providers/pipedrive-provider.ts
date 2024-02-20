import type {PathsWithMethod, ResponseFrom, StrictObj} from '@supaglue/vdk'
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
    first_name: (p) => p.first_name ?? '',
    last_name: (p) => p.last_name ?? '',
    updated_at: (p) => p.update_time ?? '',
  }),
}

export const pipedriveProvider = {
  __init__: ({proxyLinks}) =>
    initPipedriveSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listContacts: async ({instance}) => {
    const res = await instance.GET('/persons')
    return {
      hasNextPage: true,
      items: (res.data.data ?? []).map(mappers.contact.parse),
    }
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  getCompany: async ({}) => {
    throw new Error('Not implemented yet')
  },
} satisfies CRMProvider<PipedriveSDK>
