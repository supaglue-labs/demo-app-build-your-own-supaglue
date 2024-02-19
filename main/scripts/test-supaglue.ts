import {createClient, fetchLink} from '@opensdks/runtime'
import {initSupaglueSDK} from '@opensdks/sdk-supaglue'
import {env} from '@/env'

const supaglue = initSupaglueSDK({
  headers: {'x-api-key': process.env['SUPAGLUE_API_KEY']!},
})

// supaglue.mgmt
//   .GET('/customers/{customer_id}/connections/{provider_name}', {
//     params: {
//       path: {customer_id: '$STUOMER_ID', provider_name: 'hubspot'},
//     },
//   })
//   .then((r) => {
//     console.log(r.data)
//   })

// createClient({
//   baseUrl: 'https://api.supaglue.io',
//   links: [fetchLink()],
//   headers: {'x-api-key': process.env['SUPAGLUE_API_KEY']!},
// })
//   .request(
//     'GET',
//     '/private/v2/customers/$STUOMER_ID/connections/$CONNECTIONID',
//   )
//   .then((r) => {
//     console.log(r.data)
//   })

supaglue.private
  .exportConnection({
    customerId: '$STUOMER_ID',
    connectionId: '$CONNECTIONID',
  })
  .then((r) => {
    console.log(r.data)
  })
