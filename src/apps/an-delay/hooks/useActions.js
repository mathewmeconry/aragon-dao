import { useCallback, useMemo } from 'react'
import { noop } from '@aragon/ui'
import { useWallet } from '@/providers/Wallet'
import radspec from '@/radspec'
import anDelayActions from '../actions/an-delay-action.types'
import { useConnectedApp } from '@/providers/ConnectedApp'
import { useGuardianState } from '@/providers/Guardian'
import { useANDelaySettings } from '../providers/ANDelaySettingsProvider'
import { useGasLimit } from '@/hooks/shared/useGasLimit'
import { describeIntent, imposeGasLimit } from '@/utils/tx-utils'

export default function useActions() {
  const { account } = useWallet()
  const { callAsGuardian } = useGuardianState()
  const { connectedApp: connectedANDelayApp } = useConnectedApp()
  const { executionDelay } = useANDelaySettings()
  const [GAS_LIMIT] = useGasLimit()

  const execute = useCallback(
    async (script, onDone = noop) => {
      let intent = await connectedANDelayApp.intent(
        'execute',
        [script.id, script.evmCallScript],
        {
          actAs: account,
        }
      )

      intent = imposeGasLimit(intent, GAS_LIMIT)

      intent = describeIntent(intent, radspec[anDelayActions.EXECUTE](script))

      onDone(intent.transactions)
    },
    [account, connectedANDelayApp]
  )

  const delayExecution = useCallback(
    async (script, onDone = noop) => {
      let intent = await connectedANDelayApp.intent(
        'delayExecution',
        [script.evmCallScript],
        {
          actAs: account,
        }
      )

      intent = imposeGasLimit(intent, GAS_LIMIT)

      intent = describeIntent(
        intent,
        radspec[anDelayActions.DELAY_EXECUTION]({
          id: script.id,
          executionDelay,
        })
      )

      onDone(intent.transactions)
    },
    [account, connectedANDelayApp, executionDelay]
  )

  const pauseExecution = useCallback(
    async (script, onDone = noop) => {
      let intent = await connectedANDelayApp.intent(
        'pauseExecution',
        [script.id],
        {
          actAs: account,
        }
      )

      intent = imposeGasLimit(intent, GAS_LIMIT)

      intent = describeIntent(
        intent,
        radspec[anDelayActions.PAUSE_EXECUTION](script)
      )

      onDone(intent.transactions)
    },
    [account, connectedANDelayApp]
  )

  const resumeExecution = useCallback(
    async (script, onDone = noop) => {
      let intent = await connectedANDelayApp.intent(
        'resumeExecution',
        [script.id],
        {
          actAs: account,
        }
      )

      intent = imposeGasLimit(intent, GAS_LIMIT)

      intent = describeIntent(
        intent,
        radspec[anDelayActions.RESUME_EXECUTION](script)
      )

      onDone(intent.transactions)
    },
    [account, connectedANDelayApp]
  )

  const cancelExecution = useCallback(
    async (script, onDone = noop) => {
      let intent = {
        transactions: [
          callAsGuardian(connectedANDelayApp, 'cancelExecution', [script.id]),
        ],
      }

      intent = imposeGasLimit(intent, GAS_LIMIT)

      intent = describeIntent(
        intent,
        radspec[anDelayActions.CANCEL_EXECUTION](script)
      )

      onDone(intent.transactions)
    },
    [connectedANDelayApp, callAsGuardian]
  )

  return useMemo(
    () => ({
      anDelayActions: {
        execute,
        delayExecution,
        pauseExecution,
        resumeExecution,
        cancelExecution,
      },
    }),
    [execute, delayExecution, pauseExecution, resumeExecution, cancelExecution]
  )
}
