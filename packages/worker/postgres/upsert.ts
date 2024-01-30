import {sql} from 'drizzle-orm'
import type {
  IndexColumn,
  PgColumn,
  PgInsertValue,
  PgTable,
  PgUpdateSetSource,
} from 'drizzle-orm/pg-core'
import {db} from '.'

/** We assume that every row contains the same keys even if not defined in its value */
export function upsertQuery<TTable extends PgTable>(
  table: TTable,
  values: Array<PgInsertValue<TTable>>,
  keyColumns: IndexColumn[],
) {
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
          (c) =>
            sql`${sql.identifier(c.name)} != ${sql.raw(`excluded.${c.name}`)}`,
        ),
        sql` AND `,
      ),
    })
    .toSQL()
}
