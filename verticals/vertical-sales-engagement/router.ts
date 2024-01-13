import type {ProviderFromRouter, RouterMeta} from '@supaglue/vdk'
import {
  proxyCallProvider,
  remoteProcedure,
  trpc,
  z,
  zPaginationParams,
} from '@supaglue/vdk'
import * as schemas from './schemas'

export {schemas}

function oapi(meta: NonNullable<RouterMeta['openapi']>): RouterMeta {
  const vertical = 'sales-engagement'
  return {openapi: {...meta, path: `/verticals/${vertical}${meta.path}`}}
}

export const salesEngagementRouter = trpc.router({
  listContacts: remoteProcedure
    .meta(oapi({method: 'GET', path: '/contacts'}))
    .input(zPaginationParams.nullish())
    .output(
      z.object({
        hasNextPage: z.boolean(),
        items: z.array(schemas.contact),
      }),
    )
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
})

export type SalesEngagementProvider<TInstance> = ProviderFromRouter<
  typeof salesEngagementRouter,
  TInstance
>
