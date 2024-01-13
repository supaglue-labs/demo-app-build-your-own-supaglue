import {
  TRPCError,
  type AnyProcedure,
  type AnyRouter,
  type inferProcedureInput,
  type inferProcedureOutput,
  type MaybePromise,
} from '@trpc/server'
import type {Link as FetchLink} from '@opensdks/fetch-links'
import {nangoProxyLink} from './nangoProxyLink'
import type {RemoteProcedureContext} from './trpc'

export type Provider = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: (...args: any[]) => any
} & {
  init: (opts: {fetchLinks: FetchLink[]}) => unknown
}

export type ProviderFromRouter<TRouter extends AnyRouter, TInstance = {}> = {
  [k in keyof TRouter as TRouter[k] extends AnyProcedure
    ? k
    : never]?: TRouter[k] extends AnyProcedure
    ? (opts: {
        instance: TInstance
        input: inferProcedureInput<TRouter[k]>
      }) => MaybePromise<inferProcedureOutput<TRouter[k]>>
    : never
} & {
  init: (opts: {fetchLinks: FetchLink[]}) => TInstance
}

export async function proxyCallProvider({
  input,
  ctx,
}: {
  input: unknown
  ctx: RemoteProcedureContext
}) {
  const instance = ctx.provider.init({
    fetchLinks: [
      (req, next) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        const baseUrl = (instance as any)?.clientOptions?.baseUrl as
          | string
          | undefined
        if (baseUrl) {
          req.headers.set(nangoProxyLink.kBaseUrlOverride, baseUrl)
        }
        return next(req)
      },
      ctx.nangoLink,
    ],
  })

  // verticals.salesEngagement.listContacts -> listContacts
  const methodName = ctx.path.split('.').pop() ?? ''
  const implementation = ctx.provider?.[methodName] as Function

  if (typeof implementation !== 'function') {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: `${ctx.providerName} adapter does not implement ${ctx.path}`,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const out = await implementation({instance, input})
  // console.log('[proxyCallRemote] output', out)
  return out
}
