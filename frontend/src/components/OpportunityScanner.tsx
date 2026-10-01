import { useState } from 'react'

import {
  useArbitrage,
} from '../context/ArbitrageContext'

import {
  formatUnits,
  parseUnits,
} from 'ethers'

import {
  getUniswapV3Quote,
  getV2Quote,
} from '../services/blockchain'

import {
  USDC_ADDRESS,
  WETH_ADDRESS,
} from '../config/contracts'

import type {
  ArbitrageOpportunity,
  DexType,
} from '../types/arbitrage'

    interface OpportunityScannerProps {
      onOpportunityFound: (
        opportunity: ArbitrageOpportunity,
      ) => void
    }

    function OpportunityScanner({
        onOpportunityFound,
      }: OpportunityScannerProps) {

      const {
        clearOpportunity,
      } = useArbitrage()

      const [tokenIn, setTokenIn] = useState('USDC')
      const [tokenOut, setTokenOut] = useState('WETH')
      const [loanAmount, setLoanAmount] = useState('100')

      const [firstDex, setFirstDex] =
        useState<DexType>('UNISWAP_V3')

      const [secondDex, setSecondDex] =
        useState<DexType>('V2_COMPATIBLE')

      const [uniFee, setUniFee] = useState('3000')

      const [isScanning, setIsScanning] = useState(false)

      const [scanError, setScanError] =
        useState<string | null>(null)


       const handleScan = async () => {
            // ==================================================
            // Clear previous opportunity
            // ==================================================

            clearOpportunity()

            if (!tokenIn || !tokenOut || !loanAmount) {
              return
            }

            if (
              tokenIn !== 'USDC' ||
              tokenOut !== 'WETH'
            ) {
              setScanError(
                'Phase-1 live scanner supports USDC → WETH → USDC only.',
              )
              return
            }

            const numericLoanAmount =
              Number(loanAmount)

            if (
              !Number.isFinite(numericLoanAmount) ||
              numericLoanAmount <= 0
            ) {
              setScanError(
                'Enter a valid flash loan amount.',
              )
              return
            }

            setIsScanning(true)
            setScanError(null)
           
            try {
              // ==================================================
              // Convert user amount to USDC raw units
              // ==================================================

              const amountIn =
                parseUnits(
                  loanAmount,
                  6,
                )

              console.log(
                '========================================',
              )

              console.log(
                '[LIVE SCANNER] START',
              )

              console.log(
                '[LIVE SCANNER] Route scan:',
                'V2 → V3 AND V3 → V2',
              )

              console.log(
                '[LIVE SCANNER] Loan amount:',
                loanAmount,
              )

              console.log(
                '[LIVE SCANNER] USDC raw amount:',
                amountIn.toString(),
              )

              // ==================================================
              // Common calculation function
              // ==================================================

              const evaluateRoute = async (
                routeFirstDex: DexType,
                routeSecondDex: DexType,
              ): Promise<ArbitrageOpportunity> => {
                console.log(
                  '========================================',
                )

                console.log(
                  '[LIVE SCANNER] EVALUATING ROUTE:',
                  `${routeFirstDex} → ${routeSecondDex}`,
                )

                let amountOut1Raw: bigint
                let amountOut2Raw: bigint

                // ==================================================
                // DEX #1
                // ==================================================

                if (
                  routeFirstDex ===
                  'UNISWAP_V3'
                ) {
                  // USDC → WETH

                  amountOut1Raw =
                    await getUniswapV3Quote(
                      USDC_ADDRESS,
                      WETH_ADDRESS,
                      amountIn,
                      Number(uniFee),
                    )

                  console.log(
                    '[LIVE SCANNER] V3 DEX #1 WETH:',
                    formatUnits(
                      amountOut1Raw,
                      18,
                    ),
                  )
                } else {
                  // V2 USDC → WETH

                  amountOut1Raw =
                    await getV2Quote(
                      amountIn,
                      [
                        USDC_ADDRESS,
                        WETH_ADDRESS,
                      ],
                    )

                  console.log(
                    '[LIVE SCANNER] V2 DEX #1 WETH:',
                    formatUnits(
                      amountOut1Raw,
                      18,
                    ),
                  )
                }

                const amountOut1 =
                  formatUnits(
                    amountOut1Raw,
                    18,
                  )

                // ==================================================
                // DEX #2
                // ==================================================

                if (
                  routeSecondDex ===
                  'UNISWAP_V3'
                ) {
                  // WETH → USDC

                  amountOut2Raw =
                    await getUniswapV3Quote(
                      WETH_ADDRESS,
                      USDC_ADDRESS,
                      amountOut1Raw,
                      Number(uniFee),
                    )

                  console.log(
                    '[LIVE SCANNER] V3 DEX #2 USDC:',
                    formatUnits(
                      amountOut2Raw,
                      6,
                    ),
                  )
                } else {
                  // V2 WETH → USDC

                  amountOut2Raw =
                    await getV2Quote(
                      amountOut1Raw,
                      [
                        WETH_ADDRESS,
                        USDC_ADDRESS,
                      ],
                    )

                  console.log(
                    '[LIVE SCANNER] V2 DEX #2 USDC:',
                    formatUnits(
                      amountOut2Raw,
                      6,
                    ),
                  )
                }

                const amountOut2 =
                  formatUnits(
                    amountOut2Raw,
                    6,
                  )
                  
                // ==================================================
                // Profit calculation
                // ==================================================

                const loanAmountNumber =
                  Number(loanAmount)

                const amountOut2Number =
                  Number(amountOut2)

                const grossProfit =
                  amountOut2Number -
                  loanAmountNumber

                // ==================================================
                // Aave Sepolia Flash Loan Premium
                // ==================================================

                const flashLoanFee =
                  loanAmountNumber * 0.0005

                // ==================================================
                // DEX Fees
                //
                // The V2 and V3 quote functions already include
                // their respective swap fees.
                // ==================================================

                const dexFees = 0

                // ==================================================
                // Gas
                //
                // Gas will be measured separately during execution.
                // Keep scanner estimate at zero rather than inventing
                // a gas price.
                // ==================================================

                const estimatedGas = 0

                // ==================================================
                // Minimum Output Protection
                //
                // Keep 1% slippage protection on both swaps.
                // ==================================================

                const minOut1Raw =
                  amountOut1Raw * 99n / 100n

                const minOut2Raw =
                  amountOut2Raw * 99n / 100n

                const minOut1 =
                  formatUnits(
                    minOut1Raw,
                    18,
                  )

                const minOut2 =
                  formatUnits(
                    minOut2Raw,
                    6,
                  )

                // ==================================================
                // Slippage Reserve
                //
                // Difference between quoted final output and the
                // protected minimum final output.
                // ==================================================

                const slippageCost =
                  Math.max(
                    amountOut2Number -
                      Number(minOut2),
                    0,
                  )

                // ==================================================
                // Safety Buffer
                //
                // Reserve 10% of gross profit as an additional
                // profitability safety margin.
                // ==================================================

                const safetyBuffer =
                  grossProfit > 0
                    ? grossProfit * 0.10
                    : 0

                // ==================================================
                // Estimated Net Profit
                // ==================================================

                const estimatedNetProfit =
                  grossProfit -
                  flashLoanFee -
                  dexFees -
                  estimatedGas -
                  slippageCost -
                  safetyBuffer

                // ==================================================
                // Minimum On-Chain Profit
                //
                // IMPORTANT:
                //
                // The Executor must not accept a trade that has
                // only 0.01 / 0.05 USDC profit.
                //
                // Require at least 10% of the quoted gross profit,
                // while always covering the Aave flash-loan fee.
                // ==================================================

                const minimumProfitSafety =
                  grossProfit > 0
                    ? grossProfit * 0.10
                    : 0

                const minProfit =
                  Math.max(
                    flashLoanFee,
                    minimumProfitSafety,
                  )

                // ==================================================
                // Profit Percentage
                // ==================================================

                const profitPercent =
                  loanAmountNumber > 0
                    ? (
                        estimatedNetProfit /
                        loanAmountNumber
                      ) * 100
                    : 0

                // ==================================================
                // Profitability Check
                // ==================================================

                const isProfitable =
                  estimatedNetProfit >
                  minProfit

                // ==================================================
                // Diagnostics
                // ==================================================

                console.log(
                  '[LIVE SCANNER] ROUTE RESULT:',
                  `${routeFirstDex} → ${routeSecondDex}`,
                )

                console.log(
                  '[LIVE SCANNER] Gross profit:',
                  grossProfit,
                )

                console.log(
                  '[LIVE SCANNER] Flash loan fee:',
                  flashLoanFee,
                )

                console.log(
                  '[LIVE SCANNER] Slippage reserve:',
                  slippageCost,
                )

                console.log(
                  '[LIVE SCANNER] Safety buffer:',
                  safetyBuffer,
                )

                console.log(
                  '[LIVE SCANNER] Estimated net profit:',
                  estimatedNetProfit,
                )

                console.log(
                  '[LIVE SCANNER] Minimum profit safety floor:',
                  minimumProfitSafety,
                )

                console.log(
                  '[LIVE SCANNER] Minimum on-chain profit:',
                  minProfit,
                )

                console.log(
                  '[LIVE SCANNER] Profitable:',
                  isProfitable,
                )

                return {
                  tokenIn,
                  tokenOut,
                  loanAmount,

                  firstDex:
                    routeFirstDex,

                  secondDex:
                    routeSecondDex,

                  // IMPORTANT:
                  // Keep the fee that was actually used
                  // for this quote.
                  uniFee:
                    Number(uniFee),

                  amountOut1,
                  amountOut2,

                  grossProfit:
                    grossProfit.toFixed(6),

                  flashLoanFee:
                    flashLoanFee.toFixed(6),

                  dexFees:
                    dexFees.toFixed(6),

                  estimatedGas:
                    estimatedGas.toFixed(6),

                  slippageCost:
                    slippageCost.toFixed(6),

                  safetyBuffer:
                    safetyBuffer.toFixed(6),

                  estimatedNetProfit:
                    estimatedNetProfit.toFixed(6),

                  profitPercent:
                    profitPercent.toFixed(4),

                  minOut1,
                  minOut2,

                  minProfit:
                    minProfit.toFixed(6),

                  isProfitable,
                  isStale: false,

                  status:
                    'OPPORTUNITY_FOUND',
                }
              }

              // ==================================================
              // Evaluate BOTH directions
              // ==================================================

              console.log(
                '========================================',
              )

              console.log(
                '[LIVE SCANNER] TEST #1:',
                'V2_COMPATIBLE → UNISWAP_V3',
              )

              const v2ToV3 =
                await evaluateRoute(
                  'V2_COMPATIBLE',
                  'UNISWAP_V3',
                )

              console.log(
                '========================================',
              )

              console.log(
                '[LIVE SCANNER] TEST #2:',
                'UNISWAP_V3 → V2_COMPATIBLE',
              )

              const v3ToV2 =
                await evaluateRoute(
                  'UNISWAP_V3',
                  'V2_COMPATIBLE',
                )

              // ==================================================
              // Select the BEST route
              // ==================================================

              const candidates =
                [
                  v2ToV3,
                  v3ToV2,
                ]

              const profitableCandidates =
                candidates.filter(
                  (candidate) =>
                    candidate.isProfitable,
                )

              console.log(
                '========================================',
              )

              console.log(
                '[LIVE SCANNER] TOTAL CANDIDATES:',
                candidates.length,
              )

              console.log(
                '[LIVE SCANNER] PROFITABLE CANDIDATES:',
                profitableCandidates.length,
              )

              // ==================================================
              // No profitable route
              // ==================================================

              if (
                profitableCandidates.length ===
                0
              ) {
                const bestCandidate =
                  candidates.reduce(
                    (
                      best,
                      current,
                    ) =>
                      Number(
                        current.estimatedNetProfit,
                      ) >
                      Number(
                        best.estimatedNetProfit,
                      )
                        ? current
                        : best,
                  )

                console.log(
                  '[LIVE SCANNER] NO PROFITABLE ROUTE',
                )

                console.log(
                  '[LIVE SCANNER] BEST ROUTE:',
                  `${bestCandidate.firstDex} → ${bestCandidate.secondDex}`,
                )

                console.log(
                  '[LIVE SCANNER] BEST FEE:',
                  bestCandidate.uniFee,
                )

                console.log(
                  '[LIVE SCANNER] BEST NET PROFIT:',
                  bestCandidate.estimatedNetProfit,
                )

                console.log(
                  '[LIVE SCANNER] No opportunity published.',
                )

                return
              }

              // ==================================================
              // Find highest-profit route
              // ==================================================

              const bestOpportunity =
                profitableCandidates.reduce(
                  (
                    best,
                    current,
                  ) =>
                    Number(
                      current.estimatedNetProfit,
                    ) >
                    Number(
                      best.estimatedNetProfit,
                    )
                      ? current
                      : best,
                )

              console.log(
                '========================================',
              )

              console.log(
                '[LIVE SCANNER] BEST PROFITABLE ROUTE:',
                `${bestOpportunity.firstDex} → ${bestOpportunity.secondDex}`,
              )

              console.log(
                '[LIVE SCANNER] BEST FEE:',
                bestOpportunity.uniFee,
              )

              console.log(
                '[LIVE SCANNER] BEST NET PROFIT:',
                bestOpportunity.estimatedNetProfit,
              )

              console.log(
                '[LIVE SCANNER] PROFITABLE:',
                bestOpportunity.isProfitable,
              )

              // ==================================================
              // Synchronize UI with BEST route
              // ==================================================

              setFirstDex(
                bestOpportunity.firstDex,
              )

              setSecondDex(
                bestOpportunity.secondDex,
              )

              // Keep the fee that produced the
              // selected opportunity.
              setUniFee(
                String(
                  bestOpportunity.uniFee,
                ),
              )

              console.log(
                '[LIVE SCANNER] SELECTED ROUTE:',
                `${bestOpportunity.firstDex} → ${bestOpportunity.secondDex}`,
              )

              console.log(
                '[LIVE SCANNER] SELECTED FEE:',
                bestOpportunity.uniFee,
              )

              // ==================================================
              // Publish ONLY the best profitable opportunity
              // ==================================================

              onOpportunityFound(
                bestOpportunity,
              )

              console.log(
                '[LIVE SCANNER] OPPORTUNITY PUBLISHED',
              )

              console.log(
                '========================================',
              )

            } catch (error: any) {
              console.error(
                '========================================',
              )

              console.error(
                '[LIVE SCANNER] FAILED',
              )

              console.error(
                '[LIVE SCANNER] Error:',
                error,
              )

              console.error(
                '[LIVE SCANNER] Message:',
                error?.message,
              )

              console.error(
                '[LIVE SCANNER] Reason:',
                error?.reason,
              )

              console.error(
                '[LIVE SCANNER] Short message:',
                error?.shortMessage,
              )

              console.error(
                '[LIVE SCANNER] Data:',
                error?.data,
              )

              console.error(
                '========================================',
              )

              setScanError(
                error?.shortMessage ||
                error?.reason ||
                error?.message ||
                'Live DEX quote failed.',
              )

            } finally {
              setIsScanning(false)
            }
          }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/10">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />

          <h3 className="text-lg font-semibold text-white">
            Arbitrage Opportunity Scanner
          </h3>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Scan DEX routes for potential flash-loan arbitrage
          opportunities.
        </p>

        {/* Live Quote Mode */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          LIVE SEPOLIA QUOTE MODE
        </div>

        {scanError && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {scanError}
          </div>
        )}
      </div>

      {/* Input Grid */}
      <div className="grid gap-5 md:grid-cols-3">

        {/* Token In */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Token In
          </label>

          <input
            value={tokenIn}
            onChange={(event) =>
              setTokenIn(event.target.value.toUpperCase())
            }
            placeholder="USDC"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60"
          />
        </div>

        {/* Token Out */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Token Out
          </label>

          <input
            value={tokenOut}
            onChange={(event) =>
              setTokenOut(event.target.value.toUpperCase())
            }
            placeholder="WETH"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60"
          />
        </div>

        {/* Loan Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Flash Loan Amount
          </label>

          <input
            value={loanAmount}
            onChange={(event) =>
              setLoanAmount(event.target.value)
            }
            type="number"
            min="0"
            step="any"
            placeholder="100"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60"
          />
        </div>

        {/* First DEX */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            First DEX
          </label>

          <select
            value={firstDex}
            onChange={(event) =>
              setFirstDex(event.target.value as DexType)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/60"
          >
            <option value="UNISWAP_V3">
              Uniswap V3
            </option>

            <option value="V2_COMPATIBLE">
              V2-Compatible DEX
            </option>
          </select>
        </div>

        {/* Second DEX */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Second DEX
          </label>

          <select
            value={secondDex}
            onChange={(event) =>
              setSecondDex(event.target.value as DexType)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/60"
          >
            <option value="V2_COMPATIBLE">
              V2-Compatible DEX
            </option>

            <option value="UNISWAP_V3">
              Uniswap V3
            </option>
          </select>
        </div>

        {/* Fee Tier */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Uniswap Fee Tier
          </label>

          <select
            value={uniFee}
            onChange={(event) =>
              setUniFee(event.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/60"
          >
            <option value="500">0.05%</option>
            <option value="3000">0.30%</option>
            <option value="10000">1.00%</option>
          </select>
        </div>
      </div>

      {/* Scan Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleScan}
          disabled={isScanning}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isScanning
            ? 'Scanning...'
            : 'Scan Opportunity'}
        </button>
      </div>

    </section>
  )
}

export default OpportunityScanner