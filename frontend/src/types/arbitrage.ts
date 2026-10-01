export type DexType =
  | 'UNISWAP_V3'
  | 'V2_COMPATIBLE'

export type ArbitrageStatus =
  | 'IDLE'
  | 'QUOTING'
  | 'OPPORTUNITY_FOUND'
  | 'NOT_PROFITABLE'

export interface ArbitrageOpportunity {
  tokenIn: string
  tokenOut: string

  loanAmount: string

  firstDex: DexType
  secondDex: DexType

  uniFee: number

  amountOut1: string
  amountOut2: string

  grossProfit: string
  flashLoanFee: string
  dexFees: string
  estimatedGas: string
  slippageCost: string
  safetyBuffer: string

  estimatedNetProfit: string
  profitPercent: string

  minOut1: string
  minOut2: string
  minProfit: string

  isProfitable: boolean
  isStale: boolean

  status: ArbitrageStatus
}