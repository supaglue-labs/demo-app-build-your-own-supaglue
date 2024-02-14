import type {RouterContext} from '@supaglue/vdk'

import {
  apolloProvider,
  outreachProvider,
  salesloftProvider,
} from '@supaglue/vertical-sales-engagement'

const providerByName = {
  apollo: apolloProvider,
  salesloft: salesloftProvider,
  outreach: outreachProvider,
}

export function createContext(
  opts: Omit<RouterContext, 'providerByName'>,
): RouterContext {
  return {...opts, providerByName}
}
