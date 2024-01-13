import {publicProcedure, trpc, z} from '@supaglue/vdk'
import {salesEngagementRouter} from '@supaglue/vertical-sales-engagement'
import {generateOpenApiDocument} from '@usevenice/trpc-openapi'

const publicRouter = trpc.router({
  health: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/health',
        summary: 'Health check',
      },
    })
    .input(z.void())
    .output(z.string())
    .query(() => 'Ok as of ' + new Date().toISOString()),
  getOpenAPISpec: publicProcedure
    .meta({openapi: {method: 'GET', path: '/openapi.json'}})
    .input(z.void())
    .output(z.unknown())
    .query((): unknown => getOpenAPISpec()),
})

export const appRouter = trpc.router({
  public: publicRouter,
  salesEngagement: salesEngagementRouter,
})

export function getOpenAPISpec() {
  const oas = generateOpenApiDocument(appRouter, {
    openApiVersion: '3.1.0', // Want jsonschema
    title: 'Bulid your own Supaglue',
    version: '0.0.0',
    baseUrl: 'http://localhost:3000/api',
  })
  return oas
}
