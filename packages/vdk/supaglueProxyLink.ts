import type {Link as FetchLink} from '@opensdks/fetch-links'
import {mergeHeaders, modifyRequest} from '@opensdks/fetch-links'

interface SupaglueHeaders {
  'x-api-key': string
  'x-customer-id': string
  'x-provider-name': string
}

/** https://docs.supaglue.com/api/v2/actions/send-passthrough-request */
export function supaglueProxyLink(opts: {
  apiKey: string
  /** `x-customer-id` header */
  customerId: string
  /** `x-provider-name` header */
  providerName: string
}): FetchLink {
  const supaglueHeaders = {
    'x-api-key': opts.apiKey,
    'x-customer-id': opts.customerId,
    'x-provider-name': opts.providerName,
  } satisfies SupaglueHeaders

  return async (req, next) => {
    const url = new URL(req.url)
    // Can be JSON object or text, Supaglue will accept either
    // prefer to send as JSON to make the underlying network request easier to debug compare to
    // stringfied JSON escaped into another string
    const body = await req.text().then(safeJsonParse)

    const res = await next(
      modifyRequest(req, {
        url: 'https://api.supaglue.io/actions/v2/passthrough',
        headers: mergeHeaders(req.headers, supaglueHeaders),
        method: 'POST',
        body: JSON.stringify({
          path: url.pathname,
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
          query: Object.fromEntries(url.searchParams.entries()),
          // Sending body for get / head requests results in failure
          ...((body as string) && {body}),
        }),
      }),
    )
    if (res.status !== 200) {
      return res
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resJson: {
      url: string
      status: number
      headers: Record<string, string>
      body: string | object
    } = await res.json()
    return new Response(
      typeof resJson.body === 'string'
        ? resJson.body
        : JSON.stringify(resJson.body),
      {
        headers: resJson.headers,
        status: resJson.status,
        statusText: `From ${resJson.url}`,
      },
    )
  }
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}
