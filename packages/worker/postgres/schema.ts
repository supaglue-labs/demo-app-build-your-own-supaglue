import {sql} from 'drizzle-orm'
import {
  customType,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * WARNING: expression is not escaped and not safe for dynamic table construction from user input!
 */
const generated = (name: string, dataType: string, expr: string) =>
  customType<{
    data: undefined
    driverData: undefined
    default: true
    notNull: true
  }>({
    // TODO: This doesn't actually work, @see
    // https://discord.com/channels/1043890932593987624/1156712008893354084/1209669640637382739
    // however it is still useful to leave it here so migration can produce semi-correct SQL
    dataType() {
      console.log(
        'Please manually modify the migration to add the generated column',
        `${name} ${dataType} GENERATED ALWAYS AS (${expr}) STORED`,
      )
      return dataType
    },
  })(name)

/** Execution  */
export const sync_run = pgTable('sync_run', {
  // Standard cols
  id: text('id')
    .notNull()
    .primaryKey()
    .default(sql`substr(md5(random()::text), 0, 25)`),
  created_at: timestamp('created_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
  updated_at: timestamp('updated_at', {
    precision: 3,
    mode: 'string',
  }).defaultNow(),
  // Identifying cols
  customer_id: text('customer_id').notNull(),
  provider_name: text('provider_name').notNull(),
  // Data columns
  started_at: timestamp('started_at', {precision: 3, mode: 'string'}),
  initial_state: jsonb('initial_state'),

  metrics: jsonb('metrics'),
  completed_at: timestamp('completed_at', {
    precision: 3,
    mode: 'string',
  }),
  final_state: jsonb('final_state'),
  status: generated(
    'status',
    'varchar',
    "CASE WHEN completed_at IS NOT NULL THEN 'COMPLETED' ELSE 'STARTED' END",
  ),
  duration: generated('duration', 'interval', 'completed_at - started_at'),
})

export const sync_state = pgTable(
  'sync_state',
  {
    customer_id: text('customer_id').notNull(),
    provider_name: text('provider_name').notNull(),
    state: jsonb('state'),
    created_at: timestamp('created_at', {
      precision: 3,
      mode: 'string',
    }).defaultNow(),
    updated_at: timestamp('updated_at', {
      precision: 3,
      mode: 'string',
    }).defaultNow(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.customer_id, table.provider_name],
      name: 'sync_state_pkey',
    }),
  }),
)
