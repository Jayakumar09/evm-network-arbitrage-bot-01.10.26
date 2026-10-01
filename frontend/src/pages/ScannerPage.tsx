import { useNavigate } from 'react-router-dom'

import OpportunityScanner from '../components/OpportunityScanner'

import { useArbitrage } from '../context/ArbitrageContext'

import type {
  ArbitrageOpportunity,
} from '../types/arbitrage'

function ScannerPage() {
  const navigate = useNavigate()

  const {
    opportunity,
    setOpportunity,
  } = useArbitrage()

  const handleOpportunityFound = (
    newOpportunity: ArbitrageOpportunity,
  ) => {
    setOpportunity(newOpportunity)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">

      {/* Page Header */}
      <section className="mb-8">

        <p className="text-sm font-medium text-emerald-400">
          FLASH LOAN ARBITRAGE
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Opportunity Scanner
        </h1>

        <p className="mt-3 max-w-2xl text-slate-400">
          Scan DEX price differences and identify potential
          flash-loan arbitrage opportunities.
        </p>

      </section>

      {/* Scanner */}
      <OpportunityScanner
        onOpportunityFound={handleOpportunityFound}
      />

      {/* Result */}
      {opportunity && (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400">
                Opportunity Found
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                {opportunity.tokenIn} → {opportunity.tokenOut} →{' '}
                {opportunity.tokenIn}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Estimated Net Profit:{' '}
                <span className="font-semibold text-emerald-400">
                  ${opportunity.estimatedNetProfit}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/opportunity')}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              View Opportunity
            </button>

          </div>

        </div>
      )}

    </div>
  )
}

export default ScannerPage