import type { ArbitrageOpportunity } from '../types/arbitrage'

interface QuotePanelProps {
  opportunity: ArbitrageOpportunity
}

function QuotePanel({ opportunity }: QuotePanelProps) {
  const firstDexName =
    opportunity.firstDex === 'UNISWAP_V3'
      ? 'Uniswap V3'
      : 'V2-Compatible DEX'

  const secondDexName =
    opportunity.secondDex === 'UNISWAP_V3'
      ? 'Uniswap V3'
      : 'V2-Compatible DEX'

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/10">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <h3 className="text-lg font-semibold text-white">
              Arbitrage Opportunity
            </h3>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {opportunity.tokenIn} → {opportunity.tokenOut} →{' '}
            {opportunity.tokenIn}
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <span className="text-sm font-semibold text-emerald-400">
            {opportunity.isProfitable
              ? 'PROFITABLE'
              : 'NOT PROFITABLE'}
          </span>
        </div>
      </div>

      {/* Basic Information */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Loan Amount
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {opportunity.loanAmount} {opportunity.tokenIn}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            DEX Route
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {firstDexName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            → {secondDexName}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Uniswap Fee
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {(opportunity.uniFee / 10000).toFixed(2)}%
          </p>
        </div>

      </div>

      {/* Swap Outputs */}
      <div className="mt-6">

        <h4 className="mb-3 text-sm font-semibold text-slate-300">
          Swap Outputs
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              DEX #1 Expected Output
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              {opportunity.amountOut1}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Minimum: {opportunity.minOut1}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              DEX #2 Expected Output
            </p>

            <p className="mt-2 text-xl font-semibold text-white">
              {opportunity.amountOut2}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Minimum: {opportunity.minOut2}
            </p>
          </div>

        </div>
      </div>

      {/* Profit Analysis */}
      <div className="mt-6">

        <h4 className="mb-3 text-sm font-semibold text-slate-300">
          Profit Analysis
        </h4>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

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
      </div>

      {/* Net Profit */}
      <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Estimated Net Profit
            </p>

            <p className="mt-1 text-3xl font-bold text-emerald-400">
              ${opportunity.estimatedNetProfit}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Profit %
            </p>

            <p className="mt-1 text-xl font-semibold text-white">
              {opportunity.profitPercent}%
            </p>
          </div>

        </div>

        <div className="mt-4 flex items-center justify-between border-t border-emerald-500/10 pt-4">

          <span className="text-sm text-slate-400">
            Minimum Required Profit
          </span>

          <span className="font-semibold text-white">
            ${opportunity.minProfit}
          </span>

        </div>

      </div>

    </section>
  )
}

interface ProfitItemProps {
  label: string
  value: string
}

function ProfitItem({
  label,
  value,
}: ProfitItemProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  )
}

export default QuotePanel