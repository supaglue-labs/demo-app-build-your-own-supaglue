import type {ProviderFromRouter, RouterMeta} from '@supaglue/vdk'
import {
  proxyCallProvider,
  remoteProcedure,
  trpc,
  z,
  zPaginationParams,
} from '@supaglue/vdk'
import * as commonModels from './commonModels'

export {commonModels}

function oapi(meta: NonNullable<RouterMeta['openapi']>): RouterMeta {
  return {openapi: {...meta, path: `/engagement/v2${meta.path}`}}
}

export const salesEngagementRouter = trpc.router({
  listContacts: remoteProcedure
    .meta(oapi({method: 'GET', path: '/contacts'}))
    .input(zPaginationParams.nullish())
    .output(
      z.object({
        hasNextPage: z.boolean(),
        items: z.array(commonModels.contact),
      }),
    )
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  listSequences: remoteProcedure
    .meta(oapi({method: 'GET', path: '/sequences'}))
    .input(zPaginationParams.nullish())
    .output(
      z.object({
        hasNextPage: z.boolean(),
        items: z.array(commonModels.sequence),
      }),
    )
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
})

export type SalesEngagementProvider<TInstance> = ProviderFromRouter<
  typeof salesEngagementRouter,
  TInstance
>
