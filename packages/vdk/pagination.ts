import JsonURL from '@jsonurl/jsonurl'
import {z} from '@opensdks/util-zod'

export const zPaginationParams = z.object({
  cursor: z.string().nullish(),
  page_size: z.number().optional(),
})
export type Pagination = z.infer<typeof zPaginationParams>

export type PaginatedOutput<T extends {}> = z.infer<
  ReturnType<typeof paginatedOutput<z.ZodObject<any, any, any, T>>>
>
export function paginatedOutput<ItemType extends z.AnyZodObject>(
  itemSchema: ItemType,
) {
  return z.object({
    hasNextPage: z.boolean(),
    items: z.array(itemSchema.extend({_original: z.unknown()})),
  })
}

const zLastUpdatedAtId = z.object({
  last_updated_at: z.string(),
  last_id: z.string(),
})

export const LastUpdatedAtId = {
  fromCursor: (cursor?: string | null) => {
    if (!cursor) {
      return undefined
    }
    const ret = zLastUpdatedAtId.safeParse(JsonURL.parse(cursor))
    // TODO: Return indication to caller that the cursor is invalid so that they can dynamically
    // switch to a full sync rather than incremental sync
    if (!ret.success) {
      console.warn('Failed to parse LastUpdatedAtId cursor', cursor, ret.error)
      return undefined
    }
    return ret.data
  },
  toCursor: (params?: z.infer<typeof zLastUpdatedAtId>) => {
    if (!params) {
      return undefined
    }
    return JsonURL.stringify(params)
  },
}

// cursor pagination
// offset increment pagination
// updated_since + id ideally
// page increment pagination

export const zBaseRecord = z.object({
  id: z.string(),
  /** z.string().datetime() does not work for simple things like `2023-07-19T23:46:48.000+0000`  */
  updated_at: z.string().describe('ISO8601 date string'),
  raw_data: z.record(z.unknown()).optional(),
})

export type BaseRecord = z.infer<typeof zBaseRecord>