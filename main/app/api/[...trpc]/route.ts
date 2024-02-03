import {
  appRouter,
  createContext,
  createOpenApiFetchHandler,
} from '@supaglue/api'
import {env} from '@/env'

const handler = (req: Request) =>
  createOpenApiFetchHandler({
    endpoint: '/api',
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        headers: req.headers,
        nangoSecretKey: env.NANGO_SECRET_KEY,
      }),
  })

export {
  handler as GET,
  handler as PUT,
  handler as POST,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
  handler as PATCH,
}
