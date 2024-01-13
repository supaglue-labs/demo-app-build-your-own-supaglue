import type {RouterContext} from '@supaglue/vdk'
import {hubspotProvider} from '@supaglue/vertical-crm'
import {
  apolloProvider,
  outreachProvider,
  salesloftProvider,
} from '@supaglue/vertical-sales-engagement'

const providerByName = {
  apollo: apolloProvider,
  salesloft: salesloftProvider,
  outreach: outreachProvider,
  hubspot: hubspotProvider,
}

export function createContext(opts: {
  headers: Headers
  nangoSecretKey: string
}): RouterContext {
  return {
    headers: opts.headers,
    nangoSecretKey: opts.nangoSecretKey,
    providerByName,
  }
}
