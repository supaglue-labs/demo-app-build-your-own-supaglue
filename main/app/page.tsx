import {initNangoSDK} from '@opensdks/sdk-nango'
import {env} from '@/env'
import {NewConnection} from './NewConnection'

export default async function Home() {
  const nango = initNangoSDK({
    headers: {authorization: `Bearer ${env.NANGO_SECRET_KEY}`},
  })
  const res = await nango.GET('/connection')

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
          {res.data.connections.map((connection) => (
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
