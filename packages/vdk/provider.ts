import {
  TRPCError,
  type AnyProcedure,
  type AnyRouter,
  type inferProcedureInput,
  type inferProcedureOutput,
  type MaybePromise,
} from '@trpc/server'
import type {Link as FetchLink} from '@opensdks/fetch-links'
import {initSupaglueSDK} from '@opensdks/sdk-supaglue'
import {nangoProxyLink} from './nangoProxyLink'
import type {RemoteProcedureContext} from './trpc'

type _Provider = {
  __init__: (opts: {
    proxyLinks: FetchLink[]
    /** Used to get the raw credentails in case proxyLink doesn't work (e.g. SOAP calls). Hard coded to rest for now... */
    getCredentials: () => Promise<{
      access_token: string
      refresh_token: string
      expires_at: string
      /** For salesforce */
      instance_url: string | null | undefined
    }>
  }) => unknown
}
export type Provider = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: (...args: any[]) => any
} & _Provider

export type ProviderFromRouter<TRouter extends AnyRouter, TInstance = {}> = {
  [k in keyof TRouter as TRouter[k] extends AnyProcedure
    ? k
    : never]?: TRouter[k] extends AnyProcedure
    ? (opts: {
        instance: TInstance
        input: inferProcedureInput<TRouter[k]>
      }) => MaybePromise<inferProcedureOutput<TRouter[k]>>
    : never
} & _Provider

/**
 * Workaround for situation where we do not want to set an override of the base url
 * and simply want to use the default.
 * TODO: Rethink the interface between nangoProxyLink, proxyCallProvider and the providers themselves to
 * make this relationship clearer
 */
export const PLACEHOLDER_BASE_URL = 'http://placeholder'

export const featureFlags = {
  // Switch this over after credentials migration and adding the nango credentials
  mode: 'supaglue' as 'supaglue' | 'nango',
}

export async function proxyCallProvider({
  input,
  ctx,
}: {
  input: unknown
  ctx: RemoteProcedureContext
}) {
  const instance = ctx.provider.__init__({
    getCredentials: async () => {
      if (featureFlags.mode === 'nango') {
        throw new Error('Not implemented')
      }
      const supaglueApiKey = ctx.headers.get('x-api-key') ?? ctx.supaglueApiKey
      if (!supaglueApiKey) {
        throw new Error('No supaglue API key')
      }
      const supaglue = initSupaglueSDK({
        headers: {'x-api-key': supaglueApiKey},
      })

      const [{data: connections}] = await Promise.all([
        supaglue.mgmt.GET('/customers/{customer_id}/connections', {
          params: {path: {customer_id: ctx.customerId}},
        }),
        // This is a no-op passthrough request to ensure credentials have been refreshed if needed
        supaglue.actions.POST('/passthrough', {
          params: {
            header: {
              'x-customer-id': ctx.customerId,
              'x-provider-name': ctx.providerName,
            },
          },
          body: {method: 'GET', path: '/'},
        }),
      ])
      const conn = connections.find((c) => c.provider_name === ctx.providerName)
      if (!conn) {
        throw new Error('Connection not found')
      }

      const res = await supaglue.private.exportConnection({
        customerId: conn.customer_id,
        connectionId: conn.id,
      })
      return {...res.data.credentials, instance_url: res.data.instance_url}
    },
    proxyLinks:
      featureFlags.mode === 'nango' && ctx.nangoLink
        ? [
            (req, next) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
              const baseUrl = (instance as any)?.clientOptions?.baseUrl as
                | string
                | undefined
              if (baseUrl && baseUrl !== PLACEHOLDER_BASE_URL) {
                req.headers.set(nangoProxyLink.kBaseUrlOverride, baseUrl)
              }
              return next(req)
            },
            ctx.nangoLink,
          ]
        : [ctx.supaglueLink],
  })

  // verticals.salesEngagement.listContacts -> listContacts
  const methodName = ctx.path.split('.').pop() ?? ''
  const implementation = ctx.provider?.[methodName] as Function

  if (typeof implementation !== 'function') {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: `${ctx.providerName} provider does not implement ${ctx.path}`,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const out = await implementation({instance, input})
  // console.log('[proxyCallRemote] output', out)
  return out
}
