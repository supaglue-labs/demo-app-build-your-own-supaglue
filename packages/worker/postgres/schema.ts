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

// NOTE: the following tables are dynamically generated and depends on the incoming data
// drizzle migration generate commands depends on the snapshot json
// while db push command depends on the database state
// what we probably need is to dynamically write to schema.ts somehow and parse the output of the db:push command with --strict flag
// and then execute that... a lot of work but may be ok for dynamic schema migration like this...
// We would also need to parse the output of db:generate and store those in the db / put back onto disk from db if we want it to work properly
// So bottom line is hacking around migrations is probably the best way to go esp considering production Supaglue never handled migration
// beyond initial creation anyways...
// TODO: Check out the --custom flag 

export const engagement_users = getCommonObjectTable('engagement_users')
export const engagement_sequences = getCommonObjectTable('engagement_sequences')
export const engagement_contacts = getCommonObjectTable('engagement_contacts')

export const salesforce_account = getProviderObjectTable('salesforce_account')
export const salesforce_contact = getProviderObjectTable('salesforce_contact')
export const salesforce_opportunity = getProviderObjectTable('salesforce_opportunity')
export const salesforce_lead = getProviderObjectTable('salesforce_lead')
