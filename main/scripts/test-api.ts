import {initBYOSupaglueSDK} from '@supaglue/sdk'

const supaglue = initBYOSupaglueSDK({
  headers: {
    'x-api-key': process.env['SUPAGLUE_API_KEY']!,
    'x-customer-id': process.env['_CUSTOMER_ID']!,
    'x-provider-name': process.env['_PROVIDER_NAME']!,
  },
})

async function main() {
  const res = await supaglue.GET('/engagement/v2/accounts', {})
  console.log('Success', res.data)
}
main()
