import createClient from 'openapi-fetch'
import type {paths} from './openapi'

export function createApiClient(options: {
  baseUrl?: string
  connectionId: string
  providerName: string
  headers?: Record<string, string>
}) {
  return createClient<paths>({
    baseUrl: options.baseUrl ?? 'http://localhost:3000/api',
    headers: {
      'x-connection-id': options.connectionId,
      'x-provider-name': options.providerName,
      ...options.headers,
    },
  })
}
