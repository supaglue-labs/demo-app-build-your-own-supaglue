'use client'

import Nango from '@nangohq/frontend'
import React from 'react'
import {env} from '@/env'

const nango = new Nango({publicKey: env.NEXT_PUBLIC_NANGO_PUBLIC_KEY})

export function NewConnection() {
  const [connectionId, setConnectionId] = React.useState<string>('')
  return (
    <>
      <p className="flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        Select a sales engagement platform to connect
      </p>
      <div className="flex flex-row gap-2 mt-2 mb-2">
        <label htmlFor="connectionId">Id for new connection:</label>
        <input
          className="border border-gray-800 rounded-md"
          type="text"
          id="connectionId"
          name="connectionId"
          value={connectionId}
          onChange={(e) => setConnectionId(e.target.value)}
        />
      </div>
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left">
        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Apollo{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Salesloft{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </a>

        <a
          href="#"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            nango.auth('outreach', connectionId).then((res) => {
              console.log('authRes', res)
            })
          }>
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Outreach{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </a>
      </div>
    </>
  )
}
