import {db as _db, dbUpsert, eq, schema, sql} from '@supaglue/db'
import {publicProcedure, trpc, z} from '@supaglue/vdk'
import {TRPCError} from '@trpc/server'
import * as models from './models'

export const dbProcedure = publicProcedure.use(async ({next, ctx}) =>
  next({ctx: {...ctx, db: _db}}),
)

async function getCustomerOrFail(db: typeof _db, id: string) {
  const cus = await db.query.customer.findFirst({
    where: eq(schema.customer.id, id),
  })
  if (!cus) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Customer not found even after upsert. id: ${id}`,
    })
  }
  return cus
}

export const mgmtRouter = trpc.router({
  listCustomers: dbProcedure
    .meta({openapi: {method: 'GET', path: '/customers'}})
    .input(z.void())
    .output(z.object({records: z.array(models.customer)}))
    .query(async ({ctx}) => ({
      records: await ctx.db.query.customer.findMany(),
    })),

  getCustomer: dbProcedure
    .meta({openapi: {method: 'GET', path: '/customers/{id}'}})
    .input(z.object({id: z.string()}))
    .output(z.object({record: models.customer}))
    .query(async ({ctx, input}) => ({
      record: await getCustomerOrFail(ctx.db, input.id),
    })),

  upsertCustomer: dbProcedure
    .meta({openapi: {method: 'PUT', path: '/customers/{id}'}})
    .input(models.customer.pick({id: true, name: true, email: true}))
    .output(z.object({record: models.customer}))
    .mutation(async ({ctx, input}) => {
      await dbUpsert(
        ctx.db,
        schema.customer,
        [{...input, updated_at: sql.raw('now()')}],
        {
          noDiffColumns: ['updated_at'],
        },
      )
      return {record: await getCustomerOrFail(ctx.db, input.id)}
    }),
})
