import type {RouterContext} from '@supaglue/vdk'
import {hubspotProvider, salesforceProvider} from '@supaglue/vertical-crm'
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
  salesforce: salesforceProvider,
}

export function createContext(
  opts: Omit<RouterContext, 'providerByName'>,
): RouterContext {
  return {...opts, providerByName}
}
