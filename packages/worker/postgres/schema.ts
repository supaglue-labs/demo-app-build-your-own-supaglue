import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

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

export const engagementUsers = pgTable(
  'engagement_users',
  {
    supaglueApplicationId: text('_supaglue_application_id').notNull(),
    supaglueProviderName: text('_supaglue_provider_name').notNull(),
    supaglueCustomerId: text('_supaglue_customer_id').notNull(),
    supaglueEmittedAt: timestamp('_supaglue_emitted_at', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    id: text('id').notNull(),
    createdAt: timestamp('created_at', {precision: 3, mode: 'string'}),
    updatedAt: timestamp('updated_at', {precision: 3, mode: 'string'}),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    lastModifiedAt: timestamp('last_modified_at', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: text('email'),
    rawData: jsonb('raw_data'),
    supaglueUnifiedData: jsonb('_supaglue_unified_data'),
  },
  (table) => ({
    engagementUsersPkey: primaryKey({
      columns: [
        table.supaglueApplicationId,
        table.supaglueProviderName,
        table.supaglueCustomerId,
        table.id,
      ],
      name: 'engagement_users_pkey',
    }),
  }),
)

export const engagementSequences = pgTable(
  'engagement_sequences',
  {
    supaglueApplicationId: text('_supaglue_application_id').notNull(),
    supaglueProviderName: text('_supaglue_provider_name').notNull(),
    supaglueCustomerId: text('_supaglue_customer_id').notNull(),
    supaglueEmittedAt: timestamp('_supaglue_emitted_at', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    id: text('id').notNull(),
    createdAt: timestamp('created_at', {precision: 3, mode: 'string'}),
    updatedAt: timestamp('updated_at', {precision: 3, mode: 'string'}),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    lastModifiedAt: timestamp('last_modified_at', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    ownerId: text('owner_id'),
    name: text('name'),
    tags: jsonb('tags'),
    numSteps: integer('num_steps').notNull(),
    metrics: jsonb('metrics'),
    isEnabled: boolean('is_enabled').notNull(),
    rawData: jsonb('raw_data'),
    supaglueUnifiedData: jsonb('_supaglue_unified_data'),
  },
  (table) => ({
    engagementSequencesPkey: primaryKey({
      columns: [
        table.supaglueApplicationId,
        table.supaglueProviderName,
        table.supaglueCustomerId,
        table.id,
      ],
      name: 'engagement_sequences_pkey',
    }),
  }),
)

export const engagementContacts = pgTable(
  'engagement_contacts',
  {
    supaglueApplicationId: text('_supaglue_application_id').notNull(),
    supaglueProviderName: text('_supaglue_provider_name').notNull(),
    supaglueCustomerId: text('_supaglue_customer_id').notNull(),
    supaglueEmittedAt: timestamp('_supaglue_emitted_at', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    id: text('id').notNull(),
    createdAt: timestamp('created_at', {precision: 3, mode: 'string'}),
    updatedAt: timestamp('updated_at', {precision: 3, mode: 'string'}),
    isDeleted: boolean('is_deleted').notNull(),
    lastModifiedAt: timestamp('last_modified_at', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    jobTitle: text('job_title'),
    address: jsonb('address'),
    emailAddresses: jsonb('email_addresses').notNull(),
    phoneNumbers: jsonb('phone_numbers').notNull(),
    ownerId: text('owner_id'),
    accountId: text('account_id'),
    openCount: integer('open_count').notNull(),
    clickCount: integer('click_count').notNull(),
    replyCount: integer('reply_count').notNull(),
    bouncedCount: integer('bounced_count').notNull(),
    rawData: jsonb('raw_data'),
    supaglueUnifiedData: jsonb('_supaglue_unified_data'),
  },
  (table) => ({
    engagementContactsPkey: primaryKey({
      columns: [
        table.supaglueApplicationId,
        table.supaglueProviderName,
        table.supaglueCustomerId,
        table.id,
      ],
      name: 'engagement_contacts_pkey',
    }),
  }),
)
