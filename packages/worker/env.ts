import {createEnv} from '@t3-oss/env-core'
import {z} from 'zod'
import {initNangoSDK} from '@opensdks/sdk-nango'

// Dedupe this with main/env.ts
export const env = createEnv({
  server: {
    NANGO_SECRET_KEY: z.string(),
    SUPAGLUE_API_KEY: z.string(),
    POSTGRES_URL: z.string(),
  },
  runtimeEnv: process.env,
})

export const nango = initNangoSDK({
  headers: {authorization: `Bearer ${env.NANGO_SECRET_KEY}`},
})
