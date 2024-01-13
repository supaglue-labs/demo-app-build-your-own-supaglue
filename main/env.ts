import {createEnv} from '@t3-oss/env-nextjs'
import {z} from 'zod'

export const env = createEnv({
  server: {
    NANGO_SECRET_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_NANGO_PUBLIC_KEY: z.string(),
  },
  runtimeEnv: {
    NANGO_SECRET_KEY: process.env.NANGO_SECRET_KEY,
    NEXT_PUBLIC_NANGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY,
  },

})
