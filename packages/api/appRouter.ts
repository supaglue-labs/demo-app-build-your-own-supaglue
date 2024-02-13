import {generateOpenApiDocument} from '@lilyrose2798/trpc-openapi'
import {publicProcedure, trpc, z} from '@supaglue/vdk'
import {crmRouter} from '@supaglue/vertical-crm'
import {salesEngagementRouter} from '@supaglue/vertical-sales-engagement'

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
  crm: crmRouter,
})

export function getOpenAPISpec() {
  const oas = generateOpenApiDocument(appRouter, {
    openApiVersion: '3.1.0', // Want jsonschema
    title: 'Bulid your own Supaglue',
    version: '0.0.0',
    baseUrl: 'http://localhost:3000/api',
    // TODO: add the security field to specify what methods are required.
    securitySchemes: {
      apiKey: {name: 'x-api-key', type: 'apiKey', in: 'header'},
      customerId: {name: 'x-customer-id', type: 'apiKey', in: 'header'},
      providerName: {name: 'x-provider-name', type: 'apiKey', in: 'header'},
    },
  })
  return oas
}

if (require.main === module) {
  console.log(JSON.stringify(getOpenAPISpec(), null, 2))
}
