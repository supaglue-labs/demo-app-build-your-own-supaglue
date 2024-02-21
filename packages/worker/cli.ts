/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {parseArgs} from 'node:util'
import {pgClient} from './postgres'
import * as routines from './routines'

/** Mimic subset of Inngest StepTools UI */
const step: routines.RoutineInput<never>['step'] = {
  run: (_, fn) => fn(),
  // eslint-disable-next-line @typescript-eslint/require-await
  sendEvent: async (stepId, events) => {
    console.log('NOOP: [sendEvent]', stepId, JSON.stringify(events, null, 2))
  },
}

const {
  positionals: [cmd],
} = parseArgs({
  // options: {output: {type: 'string', short: 'o'}},
  allowPositionals: true,
})

switch (cmd) {
  case 'scheduleSyncs':
    void routines
      .scheduleSyncs({event: {data: {} as never}, step})
      .finally(() => pgClient.end())
    break
  case 'syncConnection':
    void routines
      .syncConnection({
        event: {
          data: {
            // customer_id: 'outreach1', provider_name: 'outreach'
            customer_id: process.env['CUSTOMER_ID']!,
            provider_name: process.env['PROVIDER_NAME']!,
            vertical: process.env['VERTICAL']! as 'crm',
            common_objects: process.env['COMMON_OBJECT']
              ? [process.env['COMMON_OBJECT']]
              : ['account', 'contact', 'opportunity', 'lead', 'user'],
            sync_mode: process.env['SYNC_MODE']! as 'incremental',
            destination_schema: process.env['DESTINATION_SCHEMA'],
          },
        },
        step,
      })
      .finally(() => pgClient.end())
    break
  default:
    console.error('Unknown command', cmd)
    process.exit(1)
}
