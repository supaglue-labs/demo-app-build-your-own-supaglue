import * as routines from './routines'

void routines.syncConnection({
  event: {data: {connectionId: 'outreach1', providerConfigKey: 'outreach'}},
  step: {run: (_, fn) => fn()},
})
