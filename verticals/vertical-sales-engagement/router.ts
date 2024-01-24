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
    .input(z.object({cursor: z.string().nullish()}))
    .output(
      z.object({
        nextPageCursor: z.string().nullish(),
        items: z.array(commonModels.sequence),
      }),
    )
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  upsertAccount: remoteProcedure
    .meta(oapi({method: 'POST', path: '/accounts/_upsert'}))
    .input(
      z.object({
        record: z.object({
          name: z.string().nullish().openapi({example: 'My Company'}),
          domain: z.string().nullish().openapi({example: 'mycompany.com'}),
          owner_id: z
            .string()
            .nullish()
            .openapi({example: '9f3e97fd-4d5d-4efc-959d-bbebfac079f5'}),
          account_id: z
            .string()
            .nullish()
            .openapi({example: 'ae4be028-9078-4850-a0bf-d2112b7c4d11'}),
          custom_fields: z.record(z.unknown()).nullish(),
        }),
        upsert_on: z.object({
          name: z.string().optional().openapi({
            description:
              'The name of the account to upsert on. Supported for Outreach, Salesloft, and Apollo.',
          }),
          domain: z
            .string()
            .optional()
            .describe(
              'The domain of the account to upsert on. Only supported for Outreach and Salesloft.',
            ),
        }),
      }),
    )
    .output(z.object({record: z.object({id: z.string()}).optional()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
})

export type SalesEngagementProvider<TInstance> = ProviderFromRouter<
  typeof salesEngagementRouter,
  TInstance
>
