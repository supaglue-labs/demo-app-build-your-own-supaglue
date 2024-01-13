import {createApiClient} from '@supaglue/api'

const client = createApiClient({
  providerName: 'outreach',
  connectionId: 'outreach1',
})

client.GET('/engagement/v2/sequences').then((r) => {
  if (r.error) {
    console.log('Error', r.error)
  } else {
    console.log('Success', r.data)
  }
})
