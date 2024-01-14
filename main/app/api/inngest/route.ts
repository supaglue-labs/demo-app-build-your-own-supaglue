import {functions, inngest, nextServe} from '@supaglue/worker'

export const {GET, POST, PUT} = nextServe({
  client: inngest,
  functions: Object.values(functions),
})
