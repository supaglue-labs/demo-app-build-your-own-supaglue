import {createApiClient} from '@supaglue/api'

const client = createApiClient({
  providerName: process.env['_PROVIDER_NAME']!,
  connectionId: process.env['_CONNECTION_ID']!,
  headers: {
    'x-provider-config-key': process.env['_PROVIDER_CONFIG_KEY']!,
  },
})

client.GET('/engagement/v2/contacts').then((r) => {
  if (r.error) {
    console.log('Error', r.error)
  } else {
    console.log('Success', r.data)
  }
})
