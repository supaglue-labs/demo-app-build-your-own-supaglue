import {initBYOSupaglueSDK} from '@supaglue/sdk'

// const supaglue = initBYOSupaglueSDK({
//   headers: {
//     'x-connection-id': 'outreach1',
//     'x-provider-name': 'outreach',
//   },
// })

// supaglue.GET('/engagement/v2/sequences').then((r) => {
//   if (r.error) {
//     console.log('Error', r.error)
//   } else {
//     console.log('Success', r.data)
//   }
// })

const supaglue = initBYOSupaglueSDK({
  headers: {
    'x-connection-id': 'hubspot1',
    'x-provider-name': 'hubspot',
  },
})

supaglue.GET('/crm/v2/contacts').then((r) => {
  if (r.error) {
    console.log('Error', r.error)
  } else {
    console.log('Success', r.data)
  }
})
