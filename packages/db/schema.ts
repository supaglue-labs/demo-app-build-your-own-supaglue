import {sql} from 'drizzle-orm'
import {
  customType,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * WARNING: expression is not escaped and not safe for dynamic table construction from user input!
 */
const generated = <T = undefined>(
  name: string,
  dataType: string,
  expr: string,
) =>
  customType<{
    data: T
    driverData: undefined
    default: true
    notNull: true
  }>({
    // TODO: This doesn't actually work, @see
    // https://discord.com/channels/1043890932593987624/1156712008893354084/1209669640637382739
    // however it is still useful to leave it here so migration can produce semi-correct SQL
    dataType() {
      // console.log(
      //   'Please manually modify the migration to add the generated column',
      //   `${name} ${dataType} GENERATED ALWAYS AS (${expr}) STORED`,
      // )
      return dataType
    },
  })(name)

export const customer = pgTable('customer', {
  // Standard cols
  id: text('id')
    .notNull()
    .primaryKey()
    .default(sql`substr(md5(random()::text), 0, 25)`),
  created_at: timestamp('created_at', {
    precision: 3,
    mode: 'string',
  })
    .notNull()
    .defaultNow(),
  updated_at: timestamp('updated_at', {
    precision: 3,
    mode: 'string',
  })
    .notNull()
    .defaultNow(),

  // Specific cols
  name: text('name'),
  email: text('email'),
})

/** aka connection */
export const resource = pgTable(
  'resource',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .default(sql`substr(md5(random()::text), 0, 25)`),
    created_at: timestamp('created_at', {
      precision: 3,
      mode: 'string',
    })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', {
      precision: 3,
      mode: 'string',
    })
      .notNull()
      .defaultNow(),
    connector_name: text('connector_name').notNull(),
    customer_id: text('customer_id').references(() => customer.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  },
  (table) => ({
    connector_name_idx: index('resource_connector_name').on(
      table.connector_name,
    ),
  }),
)

/** Aka sync execution or sync log  */
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
  input_event: jsonb('input_event').notNull(),
  // Data columns
  started_at: timestamp('started_at', {precision: 3, mode: 'string'}),
  completed_at: timestamp('completed_at', {
    precision: 3,
    mode: 'string',
  }),
  duration: generated('duration', 'interval', 'completed_at - started_at'),

  initial_state: jsonb('initial_state'),
  final_state: jsonb('final_state'),
  metrics: jsonb('metrics'),
  status: generated<'PENDING' | 'SUCCESS' | 'ERROR'>(
    'status',
    'varchar',
    "CASE WHEN error IS NOT NULL THEN 'ERROR' WHEN completed_at IS NOT NULL THEN 'SUCCESS' ELSE 'PENDING' END",
  ),
  error: text('error'),
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
