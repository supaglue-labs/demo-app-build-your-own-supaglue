import {createApiClient} from '@supaglue/api'

const client = createApiClient({
  providerName: 'salesloft',
  connectionId: 'salesloft1',
})

client.GET('/engagement/v2/contacts').then((r) => {
  if (r.error) {
    console.log('Error', r.error)
  } else {
    console.log('Success', r.data)
  }
})
