import {pgTable, text, timestamp} from 'drizzle-orm/pg-core'
import {getCommonObjectTable} from './schema-factory'

export const syncLog = pgTable('sync_log', {
  connectionId: text('connectionId').notNull(),
  providerConfigKey: text('providerConfigKey').notNull(),
  createdAt: timestamp('created_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
})

export const engagementUsers = getCommonObjectTable('engagement_users')
export const engagementSequences = getCommonObjectTable('engagement_sequences')
export const engagementContacts = getCommonObjectTable('engagement_contacts')
