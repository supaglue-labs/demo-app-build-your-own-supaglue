import {initBYOSupaglueSDK} from '@supaglue/sdk'

const supaglue = initBYOSupaglueSDK({
  headers: {
    'x-connection-id': 'outreach1',
    'x-provider-name': 'outreach',
  },
})

async function main() {
  let cursor: string | undefined = undefined

  while (true) {
    const r = await supaglue.GET('/engagement/v2/sequences', {
      params: {query: {cursor}},
    })
    console.log('Success', r.data)
    if (!r.data.nextPageCursor) {
      break
    }
    cursor = r.data.nextPageCursor as string | undefined
  }
}

main()

// const supaglue = initBYOSupaglueSDK({
//   headers: {
//     'x-connection-id': 'hubspot1',
//     'x-provider-name': 'hubspot',
//   },
// })

// supaglue.GET('/crm/v2/contacts').then((r) => {
//   if (r.error) {
//     console.log('Error', r.error)
//   } else {
//     console.log('Success', r.data)
//   }
// })
