import {createEnv} from '@t3-oss/env-core'
import {z} from 'zod'

// Dedupe this with main/env.ts
export const env = createEnv({
  server: {POSTGRES_URL: z.string()},
  runtimeEnv: process.env,
})
