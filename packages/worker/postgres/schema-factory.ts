import {sql} from 'drizzle-orm'
import {
  boolean,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// NOTE: Introduce schema name also?

/** e.g. crm_accounts */
export function getCommonObjectTable<TName extends string>(tableName: TName) {
  const table = pgTable(
    tableName,
    {
      _supaglue_application_id: text('_supaglue_application_id').notNull(),
      _supaglue_provider_name: text('_supaglue_provider_name').notNull(),
      _supaglue_customer_id: text('_supaglue_customer_id').notNull(),
      _supaglue_emitted_at: timestamp('_supaglue_emitted_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      id: text('id').notNull(),
      created_at: timestamp('created_at', {precision: 3, mode: 'string'}),
      updated_at: timestamp('updated_at', {precision: 3, mode: 'string'}),
      is_deleted: boolean('is_deleted').default(false).notNull(),
      last_modified_at: timestamp('last_modified_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      raw_data: jsonb('raw_data'),
      _supaglue_unified_data: jsonb('_supaglue_unified_data'),
    },
    (table) => ({
      primaryKey: primaryKey({
        columns: [
          table._supaglue_application_id,
          table._supaglue_provider_name,
          table._supaglue_customer_id,
          table.id,
        ],
        name: `${tableName}_pkey`,
      }),
    }),
  )
  // Workaround for https://github.com/drizzle-team/drizzle-orm/discussions/1901
  // To get this statement use pnpm db:generate-from-meta result and copy paste output to here... then replace...
  const _table = sql.raw(tableName)
  const extension = {
    createIfNotExistsSql: () => sql`
      CREATE TABLE IF NOT EXISTS "${_table}" (
        "_supaglue_application_id" text NOT NULL,
        "_supaglue_provider_name" text NOT NULL,
        "_supaglue_customer_id" text NOT NULL,
        "_supaglue_emitted_at" timestamp(3) NOT NULL,
        "id" text NOT NULL,
        "created_at" timestamp(3),
        "updated_at" timestamp(3),
        "is_deleted" boolean DEFAULT false NOT NULL,
        "last_modified_at" timestamp(3) NOT NULL,
        "raw_data" jsonb,
        "_supaglue_unified_data" jsonb,
        CONSTRAINT "${_table}_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
      );
    `,
  }
  Object.assign(table, extension)
  return table as typeof table & typeof extension
}

/** e.g. salesforce_contact */
export function getProviderObjectTable<TName extends string>(
  tableName: TName,
  opts?: {custom?: boolean},
) {
  return pgTable(
    tableName,
    {
      _supaglue_application_id: text('_supaglue_application_id').notNull(),
      _supaglue_provider_name: text('_supaglue_provider_name').notNull(),
      _supaglue_customer_id: text('_supaglue_customer_id').notNull(),
      _supaglue_emitted_at: timestamp('_supaglue_emitted_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      id: text('id').notNull(),
      _supaglue_last_modified_at: timestamp('_supaglue_last_modified_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      _supaglue_is_deleted: boolean('_supaglue_is_deleted')
        .default(false)
        .notNull(),
      _supaglue_raw_data: jsonb('_supaglue_raw_data'),
      _supaglue_mapped_data: jsonb('_supaglue_mapped_data'),
      // e.g. salesforce_product_gaps_c , or hubspot_productgaps
      ...(opts?.custom && {
        _supaglue_object_name: text('_supaglue_object_name').notNull(),
      }),
    },
    (table) => ({
      primaryKey: primaryKey({
        columns: [
          table._supaglue_application_id,
          table._supaglue_provider_name,
          table._supaglue_customer_id,
          table.id,
        ],
        name: `${tableName}_pkey`,
      }),
    }),
  )
}
