import * as R from 'remeda'
import type {z} from '@opensdks/util-zod'
import type {PathsOf} from './type-utils/PathsOf.js'


export const literal = <T>(literal: T) => ({literal})

export function mapper<
  ZInputSchema extends z.ZodTypeAny,
  ZOutputSchema extends z.ZodTypeAny,
  TOut extends z.infer<ZOutputSchema> = z.infer<ZOutputSchema>,
  TIn extends z.infer<ZInputSchema> = z.infer<ZInputSchema>,
>(
  zExt: ZInputSchema,
  zCom: ZOutputSchema,
  mapping: {
    [k in keyof TOut]:  // | ExtractKeyOfValueType<TIn, TOut[k]> // | Getter<ExtractKeyOfValueType<TIn, TOut[k]>> // | TOut[k] // Constant
      | PathsOf<TIn> // Getter for the keypaths
      | ReturnType<typeof literal<TOut[k]>> // literal value
      | ((ext: TIn) => TOut[k]) // Function that can do whatever
  },
) {
  const meta = {
    _in: undefined as TIn,
    _out: undefined as TOut,
    inputSchema: zCom,
    outputSchema: zExt,
    mapping,
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const apply = (input: TIn): TOut => applyMapper(meta, input)
  apply._in = undefined as TIn
  apply._out = undefined as TOut
  apply.inputSchema = zCom
  apply.outputSchema = zExt
  apply.mapping = mapping
  return apply
}

export function applyMapper<
  T extends Pick<
    ReturnType<typeof mapper>,
    'mapping' | '_in' | '_out' | 'inputSchema' | 'outputSchema'
  >,
>(mapper: T, input: T['_in']): T['_out'] {
  // This can probably be extracted into its own function without needint TIn and TOut even
  return R.mapValues(mapper.mapping, (m, key) => {
    if (typeof m === 'function') {
      return m(input) as unknown
    } else if (typeof m === 'object' && 'literal' in m) {
      return m.literal as unknown
    } else if (typeof m === 'string') {
      return getValueAtKeyPath(input, m)
    }
    throw new Error(`Invalid mapping ${m as unknown} at ${key as string}`)
  })
}

/**
 * https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3
 * We could probbaly use R.pathOr... but it is too well-typed for our needs 🤣
 */
function getValueAtKeyPath(object: unknown, path: string) {
  const keys = path.split('.')
  let result = object
  for (const key of keys) {
    if (result == null) {
      return result
    }
    if (typeof result !== 'object') {
      console.error(
        `Cannot get value at keypath ${path} from non-object`,
        object,
      )
      // TODO: Make object log properly
      throw new TypeError(`Cannot get value at keypath ${path} from non-object`)
    }
    result = (result as Record<string, unknown>)[key]
  }
  return result
}
