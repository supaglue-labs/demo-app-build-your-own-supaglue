import {sql} from 'drizzle-orm'
import {
  getTableConfig,
  type IndexColumn,
  type PgColumn,
  type PgDatabase,
  type PgInsertValue,
  type PgTable,
  type PgUpdateSetSource,
} from 'drizzle-orm/pg-core'

/** We assume that every row contains the same keys even if not defined in its value */
export function dbUpsert<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DB extends PgDatabase<any, any>,
  TTable extends PgTable,
>(
  db: DB,
  table: TTable,
  values: Array<PgInsertValue<TTable>>,
  /** defaults to primaryKeyColumns */
  _keyColumns?: IndexColumn[],
) {
  const tbCfg = getTableConfig(table)
  const keyColumns = _keyColumns ?? tbCfg.primaryKeys[0]?.columns
  if (!keyColumns) {
    throw new Error(
      `Unable to upsert without keyColumns for table ${tbCfg.name}`,
    )
  }
  const keyColumnNames = new Set(keyColumns.map((k) => k.name))
  const upsertCols = Object.fromEntries(
    Object.keys(values[0] ?? {})
      .map((k) => [k, table[k as keyof TTable] as PgColumn] as const)
      .filter(([, c]) => !keyColumnNames.has(c.name)),
  )
  return db
    .insert(table)
    .values(values)
    .onConflictDoUpdate({
      target: keyColumns,
      set: Object.fromEntries(
        Object.entries(upsertCols).map(([k, c]) => [
          k,
          sql.raw(`excluded.${c.name}`),
        ]),
      ) as PgUpdateSetSource<TTable>,
      where: sql.join(
        Object.values(upsertCols).map(
          (c) => sql`${c} != ${sql.raw(`excluded.${c.name}`)}`,
        ),
        sql` AND `,
      ),
    })
}
