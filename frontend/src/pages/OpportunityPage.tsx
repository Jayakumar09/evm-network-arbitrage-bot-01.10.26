import { useNavigate } from 'react-router-dom'

import { useArbitrage } from '../context/ArbitrageContext'

function OpportunityPage() {
  const navigate = useNavigate()

  const { opportunity } = useArbitrage()

  // --------------------------------------------------
  // No opportunity available
  // --------------------------------------------------
  if (!opportunity) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">

        <p className="text-sm font-medium text-emerald-400">
          FLASH LOAN ARBITRAGE
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Opportunity
        </h1>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">

          <h2 className="text-xl font-semibold text-white">
            No Opportunity Selected
          </h2>

          <p className="mt-2 text-slate-400">
            Scan for an arbitrage opportunity first.
          </p>

          <button
            type="button"
            onClick={() => navigate('/scanner')}
            className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Go to Scanner
          </button>

        </div>

      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">

      {/* ------------------------------------------------
          Page Header
      ------------------------------------------------ */}
      <section>

        <p className="text-sm font-medium text-emerald-400">
          FLASH LOAN ARBITRAGE
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Arbitrage Opportunity
            </h1>

            <p className="mt-2 text-slate-400">
              {opportunity.tokenIn} → {opportunity.tokenOut} →{' '}
              {opportunity.tokenIn}
            </p>
          </div>

          <div
            className={[
              'inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
              opportunity.isProfitable
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border border-red-500/20 bg-red-500/10 text-red-400',
            ].join(' ')}
          >
            <span
              className={[
                'h-2 w-2 rounded-full',
                opportunity.isProfitable
                  ? 'bg-emerald-400'
                  : 'bg-red-400',
              ].join(' ')}
            />

            {opportunity.isProfitable
              ? 'PROFITABLE'
              : 'NOT PROFITABLE'}
          </div>

        </div>

      </section>

      {/* ------------------------------------------------
          Basic Opportunity Information
      ------------------------------------------------ */}
      <section className="mt-8 grid gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Loan Amount
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {opportunity.loanAmount} {opportunity.tokenIn}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            DEX Route
          </p>

          <p className="mt-2 font-semibold text-white">
            {opportunity.firstDex === 'UNISWAP_V3'
              ? 'Uniswap V3'
              : 'V2-Compatible DEX'}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            →
          </p>

          <p className="text-sm text-slate-400">
            {opportunity.secondDex === 'UNISWAP_V3'
              ? 'Uniswap V3'
              : 'V2-Compatible DEX'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Uniswap Fee
          </p>

          <p className="mt-2 text-xl font-semibold text-white">
            {(opportunity.uniFee / 10000).toFixed(2)}%
          </p>
        </div>

      </section>

      {/* ------------------------------------------------
          Swap Outputs
      ------------------------------------------------ */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

        <h2 className="text-lg font-semibold text-white">
          Swap Outputs
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              DEX #1 Expected Output
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {opportunity.amountOut1}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Minimum: {opportunity.minOut1}
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              DEX #2 Expected Output
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {opportunity.amountOut2}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Minimum: {opportunity.minOut2}
            </p>

          </div>

        </div>

      </section>

      {/* ------------------------------------------------
          Profit Analysis
      ------------------------------------------------ */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

        <h2 className="text-lg font-semibold text-white">
          Profit Analysis
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <ProfitItem
            label="Gross Profit"
            value={`$${opportunity.grossProfit}`}
          />

          <ProfitItem
            label="Flash Loan Fee"
            value={`-$${opportunity.flashLoanFee}`}
          />

          <ProfitItem
            label="DEX Fees"
            value={`-$${opportunity.dexFees}`}
          />

          <ProfitItem
            label="Estimated Gas"
            value={`-$${opportunity.estimatedGas}`}
          />

          <ProfitItem
            label="Slippage"
            value={`-$${opportunity.slippageCost}`}
          />

          <ProfitItem
            label="Safety Buffer"
            value={`-$${opportunity.safetyBuffer}`}
          />

        </div>

      </section>

      {/* ------------------------------------------------
          Net Profit
      ------------------------------------------------ */}
      <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Estimated Net Profit
            </p>

            <p className="mt-2 text-4xl font-bold text-emerald-400">
              ${opportunity.estimatedNetProfit}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Minimum Required Profit:{' '}
              <span className="font-semibold text-white">
                ${opportunity.minProfit}
              </span>
            </p>

          </div>

          <div className="text-left sm:text-right">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Profit
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {opportunity.profitPercent}%
            </p>

          </div>

        </div>

      </section>

      {/* ------------------------------------------------
          Execution
      ------------------------------------------------ */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={() => navigate('/scanner')}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
        >
          Back to Scanner
        </button>

        {opportunity.isProfitable && (
          <button
            type="button"
            onClick={() => navigate('/execution')}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Prepare Execution →
          </button>
        )}

      </div>

    </div>
  )
}

/* ======================================================
   Profit Item
====================================================== */

interface ProfitItemProps {
  label: string
  value: string
}

function ProfitItem({
  label,
  value,
}: ProfitItemProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-white">
        {value}
      </p>

    </div>
  )
}

export default OpportunityPage