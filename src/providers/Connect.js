import React from 'react'
import { Connect } from '@1hive/connect-react'
import { env } from '@/environment'
import { getProvider } from '@/utils/web3-utils'

const DEFAULT_IPFS_RESOLVER = 'https://ipfs.eth.aragon.network/ipfs/{cid}{path}'

function ConnectProvider({ children }) {
  return (
    <Connect
      location={env('DAO_ID')}
      connector="thegraph"
      options={{
        network: env('CHAIN_ID'),
        ipfs: env('IPFS_RESOLVER') ?? DEFAULT_IPFS_RESOLVER,
        ethereum: getProvider(),
      }}
    >
      {children}
    </Connect>
  )
}

export { ConnectProvider }
