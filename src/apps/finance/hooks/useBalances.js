import { useEffect, useMemo, useRef, useState } from 'react'
import { useConnect } from '@1hive/connect-react'
import { useConnectedApp } from '@/providers/ConnectedApp'
import { useContractReadOnly, getContract } from '@/hooks/shared/useContract'
import { useMounted } from '@/hooks/shared/useMounted'
import BN from 'bn.js'

import vaultBalanceAbi from '../abi/vault-balance.json'
import minimeTokenAbi from '@/abi/minimeToken.json'
import { useNetwork } from '@/hooks/shared'
import { constants } from 'ethers'

const INITIAL_TIMER = 2000

const cachedContracts = new Map([])

const getContractInstance = (address, abi, chainId) => {
  if (cachedContracts.has(address)) {
    return cachedContracts.get(address)
  }
  const contract = getContract(address, abi, chainId)
  cachedContracts.set(contract)
  return contract
}

const useBalances = (timeout = 7000) => {
  const { chainId } = useNetwork()
  const { nativeToken } = useNetwork()
  const { connectedApp: connectedFinanceApp } = useConnectedApp()
  const [tokenBalances = [], { error }] = useConnect(
    () => connectedFinanceApp?.onBalance(),
    [connectedFinanceApp]
  )
  const mounted = useMounted()
  const [tokenData, setTokenData] = useState([])
  const [tokenWithBalance, setTokenWithBalance] = useState([])
  const [loadingBalances, setLoadingBalances] = useState(true)

  const vaultAddress = useRef()

  const financeContract = useContractReadOnly(
    connectedFinanceApp?.address,
    connectedFinanceApp?._app.abi,
    chainId
  )

  useEffect(() => {
    if (!financeContract) {
      return
    }
    const getVaultContract = async () => {
      const vaultAddr = await financeContract.vault()
      vaultAddress.current = vaultAddr
      getContractInstance(vaultAddress, vaultBalanceAbi, chainId)
    }
    getVaultContract()
  }, [chainId, financeContract])

  useEffect(() => {
    if (!tokenBalances?.length || !mounted) {
      return
    }
    const getTokenData = async () => {
      try {
        const tokensWithData = await Promise.all(
          tokenBalances.map(async tokenBalance => {
            const tokenContract = getContractInstance(
              tokenBalance.token,
              minimeTokenAbi,
              chainId
            )

            let decimals
            let symbol
            if (tokenBalance.token === constants.AddressZero) {
              decimals = 18
              symbol = nativeToken
            } else {
              const [dec, symb] = await Promise.all([
                tokenContract.decimals(),
                tokenContract.symbol(),
              ])

              decimals = dec
              symbol = symb
            }

            return {
              address: tokenBalance.token,
              decimals,
              symbol,
            }
          })
        )
        setTokenData(tokensWithData)
      } catch (error) {
        setLoadingBalances(false)
        console.error(`ERROR getting token data : ${error}`)
      }
    }
    getTokenData()
  }, [chainId, mounted, nativeToken, tokenBalances])

  useEffect(() => {
    if (!vaultAddress.current) {
      return
    }

    const vaultContract = getContractInstance(
      vaultAddress?.current,
      vaultBalanceAbi,
      chainId
    )

    let cancelled = false
    let timeoutId

    const pollAccountBalance = async () => {
      try {
        const tokensWithBalances = await Promise.all(
          tokenData.map(async tokenData => {
            const vaultBalance = await vaultContract.balance(tokenData.address)

            return {
              ...tokenData,
              balance: new BN(vaultBalance.toString()),
            }
          })
        )
        if (!cancelled) {
          setTokenWithBalance(tokensWithBalances)
          setLoadingBalances(false)
        }
      } catch (err) {
        setLoadingBalances(false)
        console.error(`Error fetching balance: ${err} retrying...`)
      }
      if (!cancelled) {
        timeoutId = window.setTimeout(pollAccountBalance, timeout)
      }
    }

    timeoutId = window.setTimeout(pollAccountBalance, INITIAL_TIMER)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [chainId, timeout, tokenData])

  const balancesKey = tokenWithBalance
    .map(token => token.balance.toString())
    .map(String)
    .join('')

  return [
    useMemo(() => {
      return tokenWithBalance
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenWithBalance, balancesKey]),
    { loading: loadingBalances, error },
  ]
}

export default useBalances
