import {sql} from 'drizzle-orm'
import {jsonb, pgTable, text, timestamp} from 'drizzle-orm/pg-core'
import {getCommonObjectTable, getProviderObjectTable} from './schema-factory'

/** Execution  */
export const sync_run = pgTable('sync_run', {
  id: text('id')
    .notNull()
    .primaryKey()
    .default(sql`substr(md5(random()::text), 0, 25)`),
  connection_id: text('connection_id').notNull(),
  provider_config_key: text('provider_config_key').notNull(),
  status: text('status').notNull(),
  started_at: timestamp('started_at', {
    precision: 3,
    mode: 'string',
  }),
  completed_at: timestamp('completed_at', {
    precision: 3,
    mode: 'string',
  }),
  created_at: timestamp('created_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
  updated_at: timestamp('updated_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
})

export const sync_state = pgTable('sync_state', {
  connection_id: text('connection_id').notNull(),
  provider_config_key: text('provider_config_key').notNull(),
  state: jsonb('state'),
  created_at: timestamp('created_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
  updated_at: timestamp('updated_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
})

export const engagement_users = getCommonObjectTable('engagement_users')
export const engagement_sequences = getCommonObjectTable('engagement_sequences')
export const engagement_contacts = getCommonObjectTable('engagement_contacts')

export const salesforce_account = getProviderObjectTable('salesforce_account')
export const salesforce_contact = getProviderObjectTable('salesforce_contact')
export const salesforce_opportunity = getProviderObjectTable('salesforce_opportunity')
