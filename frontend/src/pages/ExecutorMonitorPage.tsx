import { useEffect, useState } from 'react'

import {
  getCurrentBlockNumber,
  getExecutorRecentActivity,
  type ExecutorActivityEvent,
} from '../services/blockchain'

const EXECUTOR_MONITOR_REFRESH_INTERVAL = 10000

function ExecutorMonitorPage() {
  const [currentBlock, setCurrentBlock] = useState<number | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [activity, setActivity] = useState<ExecutorActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadExecutorActivity = async () => {
      if (!isMounted) {
        return
      }

      setError(null)

      try {
        const [blockNumber, recentActivity] = await Promise.all([
          getCurrentBlockNumber(),
          getExecutorRecentActivity(),
        ])

        if (!isMounted) {
          return
        }

        setCurrentBlock(blockNumber)
        setActivity(recentActivity)
        setLastChecked(new Date())
      } catch (error) {
        console.error(
          '[EXECUTOR MONITOR] Failed to load activity:',
          error,
        )

        if (isMounted) {
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to read Executor activity.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadExecutorActivity()

    const refreshTimer = window.setInterval(
      () => {
        void loadExecutorActivity()
      },
      EXECUTOR_MONITOR_REFRESH_INTERVAL,
    )

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
    }
  }, [])

  const formatHash = (hash: string) => {
    if (hash.length <= 18) {
      return hash
    }

    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const renderEventDetails = (
    event: ExecutorActivityEvent,
  ) => {
    if (event.eventName === 'FlashLoanExecuted') {
      return (
        <div className="space-y-1 text-xs text-slate-400">
          <div>Asset: {formatHash(event.asset ?? '')}</div>
          <div>Amount: {event.amount ?? ''}</div>
          <div>Premium: {event.premium ?? ''}</div>
        </div>
      )
    }

    if (event.eventName === 'SwapExecuted') {
      return (
        <div className="space-y-1 text-xs text-slate-400">
          <div>Token In: {formatHash(event.tokenIn ?? '')}</div>
          <div>Token Out: {formatHash(event.tokenOut ?? '')}</div>
          <div>Amount In: {event.amountIn ?? ''}</div>
          <div>Amount Out: {event.amountOut ?? ''}</div>
        </div>
      )
    }

    if (event.eventName === 'ArbitrageProfit') {
      return (
        <div className="space-y-1 text-xs text-slate-400">
          <div>Asset: {formatHash(event.asset ?? '')}</div>
          <div>Borrowed: {event.amountBorrowed ?? ''}</div>
          <div>Profit: {event.profit ?? ''}</div>
        </div>
      )
    }

    if (event.eventName === 'OperationCompleted') {
      return (
        <div className="space-y-1 text-xs text-slate-400">
          <div>Operation ID: {event.operationId ?? ''}</div>
          <div>
            Success:{' '}
            {event.operationSuccess === null
              ? ''
              : event.operationSuccess
                ? 'true'
                : 'false'}
          </div>
        </div>
      )
    }

    return (
      <div className="text-xs text-slate-400">
        No additional event details.
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Executor Monitor</h1>

        <p className="mt-1 text-sm text-slate-400">
          Read-only monitoring of the deployed Executor contract on Ethereum Sepolia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="text-sm text-slate-400">Network</div>

          <div className="mt-2 font-semibold">
            Ethereum Sepolia
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="text-sm text-slate-400">Executor</div>

          <div className="mt-2 break-all font-mono text-sm">
            0x4b5Bf061141E49cf8007E148e03B28eE71C3D25a
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="text-sm text-slate-400">Current Block</div>

          <div className="mt-2 font-semibold">
            {currentBlock ?? 'Loading...'}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="text-sm text-slate-400">Last Checked</div>

          <div className="mt-2 font-semibold">
            {lastChecked
              ? lastChecked.toLocaleTimeString()
              : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Recent Executor Activity
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Read-only Executor events from the most recent 20 Sepolia blocks.
            </p>
          </div>

          <div className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300">
            {loading
              ? 'Loading...'
              : `${activity.length} event${activity.length === 1 ? '' : 's'}`}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && activity.length === 0 && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
            No Executor events were found in the most recent 20 Sepolia blocks.
          </div>
        )}

        {!loading && !error && activity.length > 0 && (
          <div className="mt-4 space-y-3">
            {activity.map((event, index) => (
              <div
                key={`${event.txHash}-${event.blockNumber}-${event.eventName}-${index}`}
                className="rounded-lg border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-emerald-400">
                      {event.eventName}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Block {event.blockNumber}
                    </div>
                  </div>

                  <div className="font-mono text-xs text-slate-500">
                    {formatHash(event.txHash)}
                  </div>
                </div>

                <div className="mt-3">
                  {renderEventDetails(event)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExecutorMonitorPage
