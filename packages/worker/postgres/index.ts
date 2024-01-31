import {drizzle} from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {env} from '../env'
import * as schema from './schema'

export const pgClient = postgres(env.POSTGRES_URL)
export const db = drizzle(pgClient, {schema, logger: !!process.env['DEBUG']})

export {migrate} from 'drizzle-orm/postgres-js/migrator'
