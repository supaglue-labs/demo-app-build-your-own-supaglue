import type {ProviderFromRouter, RouterMeta} from '@supaglue/vdk'
import {
  proxyCallProvider,
  remoteProcedure,
  trpc,
  z,
  zPaginatedResult,
  zPaginationParams,
} from '@supaglue/vdk'
import * as commonModels from './commonModels'

export {commonModels}

function oapi(meta: NonNullable<RouterMeta['openapi']>): RouterMeta {
  return {openapi: {...meta, path: `/crm/v2${meta.path}`}}
}

export const crmRouter = trpc.router({
  countEntity: remoteProcedure
    .meta(oapi({method: 'GET', path: '/{entity}/_count'}))
    .input(z.object({entity: z.string()}))
    .output(z.object({count: z.number()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  // MARK: - Account
  listAccounts: remoteProcedure
    .meta(oapi({method: 'GET', path: '/account'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(commonModels.account)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getAccount: remoteProcedure
    .meta(oapi({method: 'GET', path: '/account/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: commonModels.account, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Contact
  listContacts: remoteProcedure
    .meta(oapi({method: 'GET', path: '/contact'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(commonModels.contact)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getContact: remoteProcedure
    .meta(oapi({method: 'GET', path: '/contact/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: commonModels.contact, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Lead
  listLeads: remoteProcedure
    .meta(oapi({method: 'GET', path: '/lead'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(commonModels.lead)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getLead: remoteProcedure
    .meta(oapi({method: 'GET', path: '/lead/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: commonModels.lead, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Opportunity
  listOpportunities: remoteProcedure
    .meta(oapi({method: 'GET', path: '/opportunity'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(commonModels.opportunity)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getOpportunity: remoteProcedure
    .meta(oapi({method: 'GET', path: '/opportunity/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: commonModels.opportunity, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - User
  listUsers: remoteProcedure
    .meta(oapi({method: 'GET', path: '/user'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(commonModels.user)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getUser: remoteProcedure
    .meta(oapi({method: 'GET', path: '/user/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: commonModels.user, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  listCustomObjectRecords: remoteProcedure
    .meta(oapi({method: 'GET', path: '/custom/{id}'}))
    .input(
      z.object({
        id: z.string(),
        ...zPaginationParams.shape,
      }),
    )
    .output(zPaginatedResult.extend({items: z.array(z.unknown())}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Metadata
  metadataListStandardObjects: remoteProcedure
    .meta(oapi({method: 'GET', path: '/metadata/objects/standard'}))
    .input(z.void())
    .output(z.array(commonModels.metaStandardObject))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  metadataListCustomObjects: remoteProcedure
    .meta(oapi({method: 'GET', path: '/metadata/objects/custom'}))
    .input(z.void())
    .output(z.array(commonModels.metaCustomObject))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  metadataListProperties: remoteProcedure
    .meta(oapi({method: 'GET', path: '/metadata/properties'}))
    .input(
      z.object({
        type: z.enum(['standard', 'custom']),
        name: z.string(),
      }),
    )
    .output(z.array(commonModels.metaProperty))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  metadataCreateObjectsSchema: remoteProcedure
    .meta(oapi({method: 'POST', path: '/metadata/objects/custom'}))
    .input(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        labels: z.object({
          singular: z.string(),
          plural: z.string(),
        }),
        primaryFieldId: z.string(),
        fields: z.array(
          z.object({
            id: z.string(),
            description: z.string().optional(),
            type: z.string(),
            label: z.string(),
            isRequired: z.boolean(),
            default_value: z.string().optional(),
            group_name: z.string().optional(),
          }),
        ),
      }),
    )
    .output(commonModels.metaCustomObject)
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  metadataCreateFieldsSchema: remoteProcedure
    .meta(oapi({method: 'POST', path: '/metadata/objects/fields'}))
    .input(
      z.object({
        name: z.string(),
        description: z.string().nullish(),
        label: z.object({
          singular: z.string(),
          plural: z.string(),
        }),
      }),
    )
    .output(commonModels.metaCustomObject)
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  createCustomObjectRecord: remoteProcedure
    .meta(oapi({method: 'POST', path: '/custom/{id}'}))
    .input(
      z.object({
        id: z.string(),
        record: z.record(z.any()),
      }),
    )
    .output(z.object({record: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  metadataCreateAssociation: remoteProcedure
    .meta(oapi({method: 'POST', path: '/metadata/associations'}))
    .input(
      z.object({
        sourceObject: z.string(),
        targetObject: z.string(),
        id: z.string(),
        label: z.string(),
      }),
    )
    .output(
      z.object({
        sourceObject: z.string(),
        targetObject: z.string(),
        id: z.string(),
        label: z.string(),
      }),
    )
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
})

export type CRMProvider<TInstance> = ProviderFromRouter<
  typeof crmRouter,
  TInstance
>
