// ======================================================
// Execution Panel
// Ethereum Sepolia
// ======================================================

import type {
  ArbitrageOpportunity,
} from '../types/arbitrage'


// ======================================================
// Props
// ======================================================

interface ExecutionPanelProps {
  opportunity: ArbitrageOpportunity

  firstDexName: string
  secondDexName: string

  walletAddress: string | null
  isOwner: boolean
  isPaused: boolean
  checkingContract: boolean

  executionState:
    | 'IDLE'
    | 'WAITING_FOR_WALLET'
    | 'TRANSACTION_PENDING'
    | 'CONFIRMED'
    | 'FAILED'

  executionError: string | null

  transactionHash: string | null

  executionDisabled: boolean

  onBack: () => void

  onConfirm: () => void
}


// ======================================================
// Execution Panel
// ======================================================

function ExecutionPanel({
  opportunity,

  firstDexName,
  secondDexName,

  walletAddress,
  isOwner,
  isPaused,
  checkingContract,

  executionState,

  executionError,
  transactionHash,

  executionDisabled,

  onBack,
  onConfirm,
}: ExecutionPanelProps) {

  // ====================================================
  // Render
  // ====================================================

  return (
    <section className="mt-6">

      {/* ==================================================
          Live Execution Notice
          ================================================== */}

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

        <div className="flex items-start gap-3">

          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

          <div>

            <p className="font-semibold text-emerald-400">
              LIVE EXECUTION MODE
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Confirming execution will submit the existing
              Executor flash-loan arbitrage transaction to
              Ethereum Sepolia through MetaMask.
            </p>

          </div>

        </div>

      </div>


      {/* ==================================================
          Execution Access
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

        <h2 className="text-lg font-semibold text-white">
          Execution Access
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">

          <CheckItem
            label="Wallet Connected"
            passed={walletAddress !== null}
          />

          <CheckItem
            label="Executor Owner"
            passed={isOwner}
          />

          <CheckItem
            label="Contract Active"
            passed={!isPaused}
          />

        </div>


        {/* ------------------------------------------------
            Access Messages
            ------------------------------------------------ */}

        {!walletAddress && (
          <p className="mt-4 text-sm text-amber-400">
            Connect the Executor owner wallet before execution.
          </p>
        )}


        {walletAddress && !isOwner && (
          <p className="mt-4 text-sm text-red-400">
            Connected wallet is not the Executor owner.
          </p>
        )}


        {isPaused && (
          <p className="mt-4 text-sm text-red-400">
            Executor contract is currently paused.
          </p>
        )}


        {checkingContract && (
          <p className="mt-4 text-sm text-slate-400">
            Checking Executor contract status...
          </p>
        )}

      </div>


      {/* ==================================================
          Execution Route + Safety Parameters
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        {/* ==================================================
            Execution Route
            ================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

          <h2 className="text-lg font-semibold text-white">
            Execution Route
          </h2>


          <div className="mt-5 space-y-4">

            <ExecutionRow
              label="Token Pair"
              value={`${opportunity.tokenIn} → ${opportunity.tokenOut} → ${opportunity.tokenIn}`}
            />


            <ExecutionRow
              label="Flash Loan"
              value={`${opportunity.loanAmount} ${opportunity.tokenIn}`}
            />


            <ExecutionRow
              label="First DEX"
              value={firstDexName}
            />


            <ExecutionRow
              label="Second DEX"
              value={secondDexName}
            />


            <ExecutionRow
              label="Uniswap Fee"
              value={`${(
                opportunity.uniFee / 10000
              ).toFixed(2)}%`}
            />

          </div>

        </div>


        {/* ==================================================
            Safety Parameters
            ================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

          <h2 className="text-lg font-semibold text-white">
            Safety Parameters
          </h2>


          <div className="mt-5 space-y-4">

            <ExecutionRow
              label="DEX #1 Expected Output"
              value={`${opportunity.amountOut1} ${opportunity.tokenOut}`}
            />


            <ExecutionRow
              label="DEX #1 Minimum Output"
              value={`${opportunity.minOut1} ${opportunity.tokenOut}`}
            />


            <ExecutionRow
              label="DEX #2 Expected Output"
              value={`${opportunity.amountOut2} ${opportunity.tokenIn}`}
            />


            <ExecutionRow
              label="DEX #2 Minimum Output"
              value={`${opportunity.minOut2} ${opportunity.tokenIn}`}
            />


            <ExecutionRow
              label="Minimum Profit"
              value={`$${opportunity.minProfit}`}
            />


            <ExecutionRow
              label="Estimated Gas"
              value={`$${opportunity.estimatedGas}`}
            />


            <ExecutionRow
              label="Quote Status"
              value={
                opportunity.isStale
                  ? 'STALE'
                  : 'CURRENT'
              }
              valueClassName={
                opportunity.isStale
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }
            />

          </div>

        </div>

      </div>


      {/* ==================================================
          Profit Summary
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">

        <div className="grid gap-6 sm:grid-cols-3">

          <div>

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Gross Profit
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              ${opportunity.grossProfit}
            </p>

          </div>


          <div>

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Estimated Net Profit
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-400">
              ${opportunity.estimatedNetProfit}
            </p>

          </div>


          <div>

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Profit
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              {opportunity.profitPercent}%
            </p>

          </div>

        </div>

      </div>


      {/* ==================================================
          Execution Checks
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

        <h2 className="text-lg font-semibold text-white">
          Execution Checks
        </h2>


        <div className="mt-5 grid gap-3 sm:grid-cols-2">

          <CheckItem
            label="Opportunity is profitable"
            passed={opportunity.isProfitable}
          />


          <CheckItem
            label="Quote is current"
            passed={!opportunity.isStale}
          />


          <CheckItem
            label="Executor owner connected"
            passed={isOwner}
          />


          <CheckItem
            label="Executor contract active"
            passed={!isPaused}
          />

        </div>

      </div>


      {/* ==================================================
          Execution Error
          ================================================== */}

      {executionError && (

        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

          <p className="text-sm font-semibold text-red-400">
            Execution Error
          </p>


          <p className="mt-2 break-words text-sm text-slate-300">
            {executionError}
          </p>

        </div>

      )}


      {/* ==================================================
          Transaction Information
          ================================================== */}

      {transactionHash && (

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

          <h2 className="text-lg font-semibold text-white">
            Transaction
          </h2>


          <p className="mt-4 break-all font-mono text-sm text-slate-400">
            {transactionHash}
          </p>


          {executionState === 'TRANSACTION_PENDING' && (

            <div className="mt-4 flex items-center gap-3">

              <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" />

              <span className="text-sm font-medium text-amber-400">
                Transaction pending...
              </span>

            </div>

          )}


          {executionState === 'CONFIRMED' && (

            <div className="mt-4 flex items-center gap-3">

              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
                ✓
              </span>

              <span className="text-sm font-medium text-emerald-400">
                Transaction confirmed.
              </span>

            </div>

          )}


          {executionState === 'FAILED' && (

            <div className="mt-4 flex items-center gap-3">

              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 text-xs font-bold text-red-400">
                ×
              </span>

              <span className="text-sm font-medium text-red-400">
                Transaction failed.
              </span>

            </div>

          )}

        </div>

      )}


      {/* ==================================================
          Action Buttons
          ================================================== */}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
        >
          Back to Opportunity
        </button>


        <button
          type="button"
          disabled={executionDisabled}
          onClick={onConfirm}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {executionState === 'WAITING_FOR_WALLET'
            ? 'Waiting for MetaMask...'
            : executionState === 'TRANSACTION_PENDING'
              ? 'Transaction Pending...'
              : executionState === 'CONFIRMED'
                ? 'Transaction Confirmed'
                : 'Confirm & Execute'}
        </button>

      </div>

    </section>
  )
}


// ======================================================
// Execution Row
// ======================================================

interface ExecutionRowProps {
  label: string
  value: string
  valueClassName?: string
}


function ExecutionRow({
  label,
  value,
  valueClassName = 'text-white',
}: ExecutionRowProps) {

  return (

    <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-white">
        {label}
      </span>


      <span
        className={`break-all text-right text-sm font-semibold ${valueClassName}`}
      >
        {value}
      </span>

    </div>

  )
}


// ======================================================
// Check Item
// ======================================================

interface CheckItemProps {
  label: string
  passed: boolean
}


function CheckItem({
  label,
  passed,
}: CheckItemProps) {

  return (

    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">

      <span
        className={[
          'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
          passed
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-red-500/15 text-red-400',
        ].join(' ')}
      >
        {passed ? '✓' : '×'}
      </span>


      <span className="text-sm text-slate-300">
        {label}
      </span>

    </div>

  )
}


export default ExecutionPanel