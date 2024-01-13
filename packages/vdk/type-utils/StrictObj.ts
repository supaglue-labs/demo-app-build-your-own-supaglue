/** This will break for all the `unknown` unfortunately. But it is desired to remove `[k: string]: unknown` */
export type StrictKeyOf<T> = keyof {
  [k in keyof T as unknown extends T[k] ? never : k]: never
}
export type StrictObj<T> = Pick<
  T,
  StrictKeyOf<T> extends keyof T ? StrictKeyOf<T> : never
>
