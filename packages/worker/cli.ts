import {pgClient} from './postgres'
import * as routines from './routines'

/** Mimic subset of Inngest StepTools UI */
const step: routines.RoutineInput<never>['step'] = {
  run: (_, fn) => fn(),
  // eslint-disable-next-line @typescript-eslint/require-await
  sendEvent: async (stepId, events) => {
    console.log('NOOP: [sendEvent]', stepId, events)
  },
}

// void routines
//   .syncConnection({
//     event: {data: {customer_id: 'outreach1', provider_name: 'outreach'}},
//     step,
//   })
//   .finally(() => pgClient.end())

void routines
  .scheduleSyncs({event: {data: {} as never}, step})
  .finally(() => pgClient.end())
