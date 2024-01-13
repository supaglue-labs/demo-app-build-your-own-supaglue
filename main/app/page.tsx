import {Nango} from '@nangohq/node'
import {env} from '@/env'
import {NewConnection} from './NewConnection'

const nango = new Nango({secretKey: env.NANGO_SECRET_KEY})

export default async function Home() {
  const {connections} = await nango.listConnections()

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
