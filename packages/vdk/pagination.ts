import {z} from '@opensdks/util-zod'

export const zPaginationParams = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),

  updated_after: z
    .string()
    .datetime()
    .optional()
    .describe('Used for incremental syncs, inclusive of the date'),
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
