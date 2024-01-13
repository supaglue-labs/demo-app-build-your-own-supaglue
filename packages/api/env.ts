import {createEnv} from '@t3-oss/env-core'
import {z} from 'zod'

export const env = createEnv({
  server: {
    NANGO_SECRET_KEY: z.string(),
  },
  runtimeEnv: process.env,
})
