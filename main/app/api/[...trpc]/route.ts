import {appRouter, createContext} from '@supaglue/app-router'
import {fetchRequestHandler} from '@trpc/server/adapters/fetch'

// import { appRouter } from '~/server/api/router';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
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
