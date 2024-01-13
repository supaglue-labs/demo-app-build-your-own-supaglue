import {
  appRouter,
  createContext,
  createOpenApiFetchHandler,
} from '@supaglue/app-router'

const handler = (req: Request) =>
  createOpenApiFetchHandler({
    endpoint: '/api',
    req,
    router: appRouter,
    createContext: () => createContext({headers: req.headers}),
  })

export {
  handler as GET,
  handler as PUT,
  handler as POST,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
  handler as PATCH,
  handler as TRACE,
}
