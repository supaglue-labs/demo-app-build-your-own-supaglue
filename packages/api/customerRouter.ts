import {publicProcedure, trpc, z} from '@supaglue/vdk'
import * as models from './models'

export const customerRouter = trpc.router({
  listCustomers: publicProcedure
    .meta({openapi: {method: 'GET', path: '/customers'}})
    .input(z.void())
    .output(z.object({records: z.array(models.customer)}))
    .query(() => ({records: []})),
})
