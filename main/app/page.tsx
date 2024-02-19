import {featureFlags} from '@supaglue/vdk'
import {initNangoSDK} from '@opensdks/sdk-nango'
import {initSupaglueSDK} from '@opensdks/sdk-supaglue'
import {env} from '@/env'
import {NewConnection} from './NewConnection'

async function listConnections() {
  if (env.SUPAGLUE_API_KEY && featureFlags.mode === 'supaglue') {
    const supaglue = initSupaglueSDK({
      headers: {'x-api-key': env.SUPAGLUE_API_KEY},
    })
    const cusRes = await supaglue.mgmt.GET('/customers')
    const connections = await Promise.all(
      cusRes.data.map((c) =>
        supaglue.mgmt.GET('/customers/{customer_id}/connections', {
          params: {path: {customer_id: c.customer_id}},
        }),
      ),
    ).then((resArray) => resArray.flatMap((res) => res.data))
    return connections.map((c) => ({
      id: c.id,
      connection_id: `customerId: ${c.customer_id}\n connectionId: ${c.id}`,
      provider: c.provider_name,
      // customer_id: c.customer_id,
    }))
  }
  if (env.NANGO_SECRET_KEY && featureFlags.mode === 'nango') {
    const nango = initNangoSDK({
      headers: {authorization: `Bearer ${env.NANGO_SECRET_KEY}`},
    })
    const res = await nango.GET('/connection')
    return res.data.connections.map((c) => ({
      id: c.id,
      provider: c.provider,
      connection_id: c.connection_id,
      // CustomerId does not exist in nango...
    }))
  }
  throw new Error('Neither Supaglue nor nango is initialized')
}

export default async function Home() {
  const connections = await listConnections()

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Current Connections</h1>
      <table>
        <thead>
          <tr>
            <th>Provider Config Key</th>
            <th>Connection ID</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((connection) => (
            <tr key={connection.id}>
              <td>{connection.provider}</td>
              <td>{connection.connection_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h1 className="text-4xl font-bold mb-8">New connection</h1>
      <NewConnection />
    </main>
  )
}
