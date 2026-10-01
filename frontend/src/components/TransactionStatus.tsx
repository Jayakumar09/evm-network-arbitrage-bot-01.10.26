import { useEffect, useState } from 'react'
import {
  BrowserProvider,
} from 'ethers'

// ======================================================
// Transaction Status Props
// ======================================================

interface TransactionStatusProps {
  transactionHash: string
  onConfirmed?: () => void
}

// ======================================================
// Transaction Status
// ======================================================

function TransactionStatus({
  transactionHash,
  onConfirmed,
}: TransactionStatusProps) {

  const [
    status,
    setStatus,
  ] = useState<
    'WAITING' | 'CONFIRMED' | 'FAILED'
  >('WAITING')

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  // ====================================================
  // Wait For Blockchain Confirmation
  // ====================================================

  useEffect(() => {

    let mounted = true

    async function waitForConfirmation() {

      try {

        const ethereum =
          window.ethereum

        if (!ethereum) {
          throw new Error(
            'MetaMask is not installed.',
          )
        }

        const provider =
          new BrowserProvider(
            ethereum,
          )

        const receipt =
          await provider.waitForTransaction(
            transactionHash,
          )

        if (!mounted) {
          return
        }

        if (!receipt) {
          throw new Error(
            'Transaction confirmation was not received.',
          )
        }

        if (
          receipt.status !== 1
        ) {
          setStatus('FAILED')

          setError(
            'Transaction reverted on-chain.',
          )

          return
        }

        setStatus(
          'CONFIRMED',
        )

        setError(null)

        if (onConfirmed) {
            onConfirmed()
          }
      } catch (transactionError) {

        if (!mounted) {
          return
        }

        setStatus('FAILED')

        setError(
          transactionError instanceof Error
            ? transactionError.message
            : 'Transaction confirmation failed.',
        )
      }
    }

    waitForConfirmation()

    return () => {
      mounted = false
    }

  }, [
    transactionHash,
 ])

  // ====================================================
  // Render
  // ====================================================

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

      <h2 className="text-lg font-semibold text-white">
        Transaction Status
      </h2>

      {/* ==================================================
          Waiting
          ================================================== */}

      {status === 'WAITING' && (

        <div className="mt-4">

          <div className="flex items-center gap-3">

            <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />

            <p className="font-medium text-amber-400">
              Waiting for confirmation...
            </p>

          </div>

          <p className="mt-3 break-all font-mono text-sm text-slate-400">
            {transactionHash}
          </p>

        </div>
      )}

      {/* ==================================================
          Confirmed
          ================================================== */}

      {status === 'CONFIRMED' && (

        <div className="mt-4">

          <div className="flex items-center gap-3">

            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
              ✓
            </span>

            <p className="font-medium text-emerald-400">
              Transaction confirmed
            </p>

          </div>

          <p className="mt-3 break-all font-mono text-sm text-slate-400">
            {transactionHash}
          </p>

        </div>
      )}

      {/* ==================================================
          Failed
          ================================================== */}

      {status === 'FAILED' && (

        <div className="mt-4">

          <div className="flex items-center gap-3">

            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 text-xs font-bold text-red-400">
              ×
            </span>

            <p className="font-medium text-red-400">
              Transaction failed
            </p>

          </div>

          {error && (
            <p className="mt-3 break-words text-sm text-slate-400">
              {error}
            </p>
          )}

          <p className="mt-3 break-all font-mono text-sm text-slate-500">
            {transactionHash}
          </p>

        </div>
      )}

    </div>
  )
}

export default TransactionStatus