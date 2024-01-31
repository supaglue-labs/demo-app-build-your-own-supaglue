import {sql} from 'drizzle-orm'
import prettier from 'prettier'
import prettierSql from 'prettier-plugin-sql'
import {db} from '.'
import {engagementSequences} from './schema'
import {dbUpsert} from './upsert'

async function formatSql(sqlString: string) {
  return prettier.format(sqlString, {
    parser: 'sql',
    plugins: [prettierSql],
    // https://github.com/un-ts/prettier/tree/master/packages/sql#sql-in-js-with-prettier-plugin-embed
    ['language' as 'filepath' /* workaround type error */]: 'postgresql',
  })
}

console.log(engagementSequences._)

test('upsert query', async () => {
  const query = dbUpsert(
    db,
    engagementSequences,
    [
      {
        supaglueApplicationId: '$YOUR_APPLICATION_ID',
        supaglueCustomerId: 'connectionId', //  '$YOUR_CUSTOMER_ID',
        supaglueProviderName: 'providerConfigKey',
        id: '123',
        lastModifiedAt: sql`now()`,
        supaglueEmittedAt: new Date().toISOString(),
        isDeleted: false,
        // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
        rawData: sql`${{hello: 1}}::jsonb`,
        supaglueUnifiedData: sql`${{world: 2}}::jsonb`,
      },
    ],
    {
      shallowMergeJsonbColumns: [engagementSequences.rawData, ],
    },
  )
  expect(await formatSql(query.toSQL().sql)).toMatchInlineSnapshot(`
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
        now(),
        $7::jsonb,
        $8::jsonb
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
      "raw_data" = COALESCE("engagement_sequences"."raw_data", '{}'::jsonb) || excluded.raw_data,
      "_supaglue_unified_data" = excluded._supaglue_unified_data
    where
      "engagement_sequences"."last_modified_at" IS DISTINCT FROM excluded.last_modified_at
      AND "engagement_sequences"."_supaglue_emitted_at" IS DISTINCT FROM excluded._supaglue_emitted_at
      AND "engagement_sequences"."is_deleted" IS DISTINCT FROM excluded.is_deleted
      AND "engagement_sequences"."raw_data" IS DISTINCT FROM excluded.raw_data
      AND "engagement_sequences"."_supaglue_unified_data" IS DISTINCT FROM excluded._supaglue_unified_data
    "
  `)
})
