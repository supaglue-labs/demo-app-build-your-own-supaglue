import {drizzle} from 'drizzle-orm/postgres-js'
import {migrate} from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import {env} from './env'
import * as schema from './schema'

export * from './upsert'
export * from './schema-dynamic'

export {schema, env}
export const pgClient = postgres(env.POSTGRES_URL)
export const db = drizzle(pgClient, {schema, logger: !!process.env['DEBUG']})

/** Will close the postgres client connection by default */
export async function runMigration(opts?: {keepAlive?: boolean}) {
  const path = await import('node:path')
  // const fs = await import('node:fs')
  // const url = await import('node:url')

  // const __filename = url.fileURLToPath(import.meta.url)
  // const __dirname = path.dirname(__filename)
  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
    // Seems to have no impact, and unconditionally creates a drizzle schema... 🤔
    // migrationsTable: '_migrations',
  })

  if (!opts?.keepAlive) {
    await pgClient.end()
  }
}
