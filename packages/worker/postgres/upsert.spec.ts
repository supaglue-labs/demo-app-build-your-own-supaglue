import {sql} from 'drizzle-orm'
import prettier from 'prettier'
import prettierSql from 'prettier-plugin-sql'
import {engagementSequences} from './schema'
import {upsertQuery} from './upsert'

async function formatSql(sqlString: string) {
  return prettier.format(sqlString, {
    parser: 'sql',
    plugins: [prettierSql],
    // https://github.com/un-ts/prettier/tree/master/packages/sql#sql-in-js-with-prettier-plugin-embed
    ['language' as 'filepath' /* workaround type error */]: 'postgresql',
  })
}

test('upsert query', async () => {
  const query = upsertQuery(
    engagementSequences,
    [
      {
        supaglueApplicationId: '$YOUR_APPLICATION_ID',
        supaglueCustomerId: 'connectionId', //  '$YOUR_CUSTOMER_ID',
        supaglueProviderName: 'providerConfigKey',
        id: '123',
        lastModifiedAt: new Date().toISOString(),
        supaglueEmittedAt: new Date().toISOString(),
        isDeleted: false,
        // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
        rawData: sql`${{hello: 1}}::jsonb`,
        supaglueUnifiedData: sql`${{world: 2}}::jsonb`,
      },
    ],
    [
      engagementSequences.supaglueApplicationId,
      engagementSequences.supaglueProviderName,
      engagementSequences.supaglueCustomerId,
      engagementSequences.id,
    ],
  )
  expect(await formatSql(query.sql)).toMatchInlineSnapshot(`
    "insert into
      "engagement_sequences" (
        "_supaglue_application_id",
        "_supaglue_provider_name",
        "_supaglue_customer_id",
        "_supaglue_emitted_at",
        "id",
        "created_at",
        "updated_at",
        "is_deleted",
        "last_modified_at",
        "raw_data",
        "_supaglue_unified_data"
      )
    values
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        default,
        default,
        $6,
        $7,
        $8::jsonb,
        $9::jsonb
      )
    on conflict (
      "_supaglue_application_id",
      "_supaglue_provider_name",
      "_supaglue_customer_id",
      "id"
    ) do
    update
    set
      "last_modified_at" = excluded.last_modified_at,
      "_supaglue_emitted_at" = excluded._supaglue_emitted_at,
      "is_deleted" = excluded.is_deleted,
      "raw_data" = excluded.raw_data,
      "_supaglue_unified_data" = excluded._supaglue_unified_data
    where
      "last_modified_at" != excluded.last_modified_at
      AND "_supaglue_emitted_at" != excluded._supaglue_emitted_at
      AND "is_deleted" != excluded.is_deleted
      AND "raw_data" != excluded.raw_data
      AND "_supaglue_unified_data" != excluded._supaglue_unified_data
    "
  `)
})
