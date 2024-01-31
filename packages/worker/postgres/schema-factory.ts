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
  return pgTable(
    tableName,
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
      rawData: jsonb('raw_data'),
      supaglueUnifiedData: jsonb('_supaglue_unified_data'),
    },
    (table) => ({
      primaryKey: primaryKey({
        columns: [
          table.supaglueApplicationId,
          table.supaglueProviderName,
          table.supaglueCustomerId,
          table.id,
        ],
        name: `${tableName}_pkey`,
      }),
    }),
  )
}

/** e.g. salesforce_contact */
export function getProviderObjectTable<TName extends string>(
  tableName: TName,
  opts?: {custom?: boolean},
) {
  return pgTable(
    tableName,
    {
      supaglueApplicationId: text('_supaglue_application_id').notNull(),
      supaglueProviderName: text('_supaglue_provider_name').notNull(),
      supaglueCustomerId: text('_supaglue_customer_id').notNull(),
      supaglueEmittedAt: timestamp('_supaglue_emitted_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      id: text('id').notNull(),
      supaglueLastModifiedAt: timestamp('_supaglue_last_modified_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      supaglueIsDeleted: boolean('_supaglue_is_deleted')
        .default(false)
        .notNull(),
      supaglueRawData: jsonb('_supaglue_raw_data'),
      supaglueMappedData: jsonb('_supaglue_mapped_data'),
      // e.g. salesforce_product_gaps_c , or hubspot_productgaps
      ...(opts?.custom && {
        supaglueObjectName: text('_supaglue_object_name').notNull(),
      }),
    },
    (table) => ({
      primaryKey: primaryKey({
        columns: [
          table.supaglueApplicationId,
          table.supaglueProviderName,
          table.supaglueCustomerId,
          table.id,
        ],
        name: `${tableName}_pkey`,
      }),
    }),
  )
}
