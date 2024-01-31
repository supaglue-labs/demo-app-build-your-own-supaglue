import {pgTable, text, timestamp} from 'drizzle-orm/pg-core'
import {getCommonObjectTable, getProviderObjectTable} from './schema-factory'

export const sync_log = pgTable('sync_log', {
  connection_id: text('connection_id').notNull(),
  provider_config_key: text('provider_config_key').notNull(),
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
