// ======================================================
// Blockchain Service
// Ethereum Sepolia
// ======================================================
import {
  AbiCoder,
  BrowserProvider,
  Contract,
  Interface,
  formatEther,
  formatUnits,
  id,
} from 'ethers'

import type {
  Eip1193Provider,
} from 'ethers'

import {
  EXECUTOR_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  CIRCLE_USDC_ADDRESS,
  WETH_ADDRESS,
  UNISWAP_V3_QUOTER_V2_ADDRESS,
  V2_ROUTER_ADDRESS,
  UNISWAP_V3_FACTORY_ADDRESS,
} from '../config/contracts'

import { ERC20_ABI } from '../abi/erc20'

// ======================================================
// MetaMask Provider Type
// ======================================================

type WindowWithEthereum = Window & {
  ethereum?: Eip1193Provider
}

// ======================================================
// Executor Read-Only ABI
// ======================================================

const EXECUTOR_READ_ABI = [
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function getTokenBalance(address tokenAddress) view returns (uint256)',
]

// ======================================================
// Executor Write ABI
// ======================================================

const EXECUTOR_WRITE_ABI = [
  'function emergencyPause()',
  'function emergencyUnpause()',
  'function transferOwnership(address newOwner)',
  'function withdrawEth(address to)',
  'function withdrawToken(address tokenAddress, address to)',
  'function withdrawWETHAsETH()',

  // Flash Loan Arbitrage
  'function executeFlashLoanArbitrage(address asset, uint256 amount, bytes params)',
]
// ======================================================
// Executor Event ABI
// Used to decode completed flash-loan transactions.
// ======================================================

const EXECUTOR_EVENT_ABI = [

  'event FlashLoanExecuted(address indexed asset, uint256 amount, uint256 premium)',

  'event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)',

  'event ArbitrageProfit(address indexed asset, uint256 amountBorrowed, uint256 profit)',

  'event OperationCompleted(uint256 indexed operationId, bool success)',

]

const EXECUTOR_EVENT_INTERFACE =
  new Interface(EXECUTOR_EVENT_ABI)


// ======================================================
// Uniswap / V2 Read-Only Configuration
// Ethereum Sepolia
// ======================================================


// Uniswap V3 QuoterV2 ABI.
const UNISWAP_V3_QUOTER_V2_ABI = [
  'function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)',
]

// V2-compatible router quote ABI.
const V2_ROUTER_READ_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] memory path) view returns (uint256[] memory amounts)',
]

const V2_ROUTER_DIAGNOSTIC_ABI = [
  'function factory() view returns (address)',
  'function WETH() view returns (address)',
]




// ======================================================
// Withdraw Executor ETH
// ======================================================

export async function withdrawExecutorETH(
  to: string,
): Promise<string> {
  const provider = await getProvider()

  const signer = await provider.getSigner()

  const executor = new Contract(
    EXECUTOR_CONTRACT_ADDRESS,
    EXECUTOR_WRITE_ABI,
    signer,
  )

  const transaction =
    await executor.withdrawEth(
      to,
    )

  

  return transaction.hash
}

      // ======================================================
      // Withdraw Executor ERC20 Token
      // ======================================================

      export async function withdrawExecutorToken(
        tokenAddress: string,
        to: string,
      ): Promise<string> {

        console.log(
          '========================================',
        )

        console.log(
          '[CONTRACT DEBUG] ERC20 withdrawal START',
        )

        console.log(
          '[CONTRACT DEBUG] Token:',
          tokenAddress,
        )

        console.log(
          '[CONTRACT DEBUG] Recipient:',
          to,
        )

        try {

          const provider =
            await getProvider()

          const signer =
            await provider.getSigner()

          const signerAddress =
            await signer.getAddress()

          console.log(
            '[CONTRACT DEBUG] Withdrawal signer:',
            signerAddress,
          )

          const executor =
            new Contract(
              EXECUTOR_CONTRACT_ADDRESS,
              EXECUTOR_WRITE_ABI,
              signer,
            )

          console.log(
            '[CONTRACT DEBUG] Calling withdrawToken()...',
          )

          const transaction =
            await executor.withdrawToken(
              tokenAddress,
              to,
            )

          console.log(
            '[CONTRACT DEBUG] ERC20 withdrawal transaction:',
            transaction.hash,
          )

          // --------------------------------------------------
          // Wait for blockchain confirmation
          // --------------------------------------------------

          const receipt =
            await transaction.wait()

          console.log(
            '[CONTRACT DEBUG] ERC20 withdrawal confirmed:',
            receipt?.hash ?? transaction.hash,
          )

          console.log(
            '[CONTRACT DEBUG] ERC20 withdrawal END',
          )

          console.log(
            '========================================',
          )

          return transaction.hash

        } catch (error) {

          console.error(
            '[CONTRACT DEBUG] ERC20 withdrawal FAILED:',
            error,
          )

          console.log(
            '========================================',
          )

          throw error
        }
      }

      // ======================================================
      // Convert Executor WETH -> Native ETH
      // ======================================================

      export async function withdrawExecutorWETHAsETH(): Promise<string> {

        console.log(
          '========================================',
        )

        console.log(
          '[CONTRACT DEBUG] WETH -> ETH conversion START',
        )

        try {

          const provider =
            await getProvider()

          const signer =
            await provider.getSigner()

          const signerAddress =
            await signer.getAddress()

          console.log(
            '[CONTRACT DEBUG] Conversion signer:',
            signerAddress,
          )

          const executor =
            new Contract(
              EXECUTOR_CONTRACT_ADDRESS,
              EXECUTOR_WRITE_ABI,
              signer,
            )

          console.log(
            '[CONTRACT DEBUG] Calling withdrawWETHAsETH()...',
          )

          const transaction =
            await executor.withdrawWETHAsETH()

          console.log(
            '[CONTRACT DEBUG] WETH -> ETH transaction:',
            transaction.hash,
          )

          // --------------------------------------------------
          // Wait for blockchain confirmation
          // --------------------------------------------------

          const receipt =
            await transaction.wait()

          console.log(
            '[CONTRACT DEBUG] WETH -> ETH confirmed:',
            receipt?.hash ?? transaction.hash,
          )

          console.log(
            '[CONTRACT DEBUG] WETH -> ETH conversion END',
          )

          console.log(
            '========================================',
          )

          return transaction.hash

        } catch (error) {

          console.error(
            '[CONTRACT DEBUG] WETH -> ETH conversion FAILED:',
            error,
          )

          console.log(
            '========================================',
          )

          throw error
        }
      }


      

// ======================================================
// Emergency Pause Executor
// ======================================================

export async function emergencyPauseExecutor(): Promise<string> {
  const provider = await getProvider()

  const signer = await provider.getSigner()

  const executor = new Contract(
    EXECUTOR_CONTRACT_ADDRESS,
    EXECUTOR_WRITE_ABI,
    signer,
  )

  const transaction =
    await executor.emergencyPause()

  await transaction.wait()

  return transaction.hash
}


// ======================================================
// Emergency Unpause Executor
// ======================================================

export async function emergencyUnpauseExecutor(): Promise<string> {
  const provider = await getProvider()

  const signer = await provider.getSigner()

  const executor = new Contract(
    EXECUTOR_CONTRACT_ADDRESS,
    EXECUTOR_WRITE_ABI,
    signer,
  )

  const transaction =
    await executor.emergencyUnpause()

  await transaction.wait()

  return transaction.hash
}


// ======================================================
// Transfer Executor Ownership
// ======================================================

export async function transferExecutorOwnership(
  newOwner: string,
): Promise<string> {
  const provider = await getProvider()

  const signer = await provider.getSigner()

  const executor = new Contract(
    EXECUTOR_CONTRACT_ADDRESS,
    EXECUTOR_WRITE_ABI,
    signer,
  )

  const transaction =
    await executor.transferOwnership(
      newOwner,
    )

  await transaction.wait()

  return transaction.hash
}

// ======================================================
// Encode Flash Loan Arbitrage Parameters
//
// Solidity expects:
//
// params = abi.encode(
//     uint8 operationType,
//     bytes operationData
// )
//
// operationData = abi.encode(
//     uint8 firstDex,
//     address tokenIn,
//     address tokenOut,
//     uint24 uniFee,
//     uint256 minOut1,
//     uint256 minOut2,
//     uint256 minProfit
// )
//
// firstDex:
// 0 = Uniswap V3 -> V2-compatible DEX
// 1 = V2-compatible DEX -> Uniswap V3
// ======================================================

export function encodeFlashLoanArbitrageParams(
  operationType: number,
  firstDex: number,
  tokenIn: string,
  tokenOut: string,
  uniFee: number,
  minOut1: bigint,
  minOut2: bigint,
  minProfit: bigint,
): string {
  console.log('========================================')
  console.log('[FLASH LOAN PARAM ENCODER] START')
  console.log('========================================')

  //====================================================
  // Input diagnostics
  //====================================================

  console.log(
    '[FLASH LOAN PARAM ENCODER] operationType:',
    operationType,
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] operationType meaning:',
    operationType === 1
      ? 'DEX ARBITRAGE'
      : operationType === 2
        ? 'LIQUIDATION'
        : 'INVALID',
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] firstDex:',
    firstDex,
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] firstDex meaning:',
    firstDex === 0
      ? 'Uniswap V3 -> V2-compatible DEX'
      : firstDex === 1
        ? 'V2-compatible DEX -> Uniswap V3'
        : 'INVALID',
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] tokenIn:',
    tokenIn,
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] tokenOut:',
    tokenOut,
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] uniFee:',
    uniFee,
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] minOut1:',
    minOut1.toString(),
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] minOut2:',
    minOut2.toString(),
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] minProfit:',
    minProfit.toString(),
  )

  //====================================================
  // Validate operation type
  //====================================================

  if (
    operationType !== 1 &&
    operationType !== 2
  ) {
    throw new Error(
      `[FLASH LOAN PARAM ENCODER] Invalid operationType: ${operationType}`,
    )
  }

  //====================================================
  // Validate first DEX
  //
  // firstDex is only meaningful for DEX arbitrage.
  //====================================================

  if (operationType === 1) {
    if (
      firstDex !== 0 &&
      firstDex !== 1
    ) {
      throw new Error(
        `[FLASH LOAN PARAM ENCODER] Invalid firstDex: ${firstDex}`,
      )
    }
  }

  //====================================================
  // Validate addresses
  //====================================================

  if (!tokenIn) {
    throw new Error(
      '[FLASH LOAN PARAM ENCODER] tokenIn is empty',
    )
  }

  if (!tokenOut) {
    throw new Error(
      '[FLASH LOAN PARAM ENCODER] tokenOut is empty',
    )
  }

  //====================================================
  // Encode inner operationData
  //
  // Solidity:
  //
  // (
  //   uint8 firstDex,
  //   address tokenIn,
  //   address tokenOut,
  //   uint24 uniFee,
  //   uint256 minOut1,
  //   uint256 minOut2,
  //   uint256 minProfit
  // )
  //====================================================

  const abiCoder =
    AbiCoder.defaultAbiCoder()

  console.log('----------------------------------------')
  console.log(
    '[FLASH LOAN PARAM ENCODER] Encoding operationData...',
  )

  const operationData =
    abiCoder.encode(
      [
        'uint8',
        'address',
        'address',
        'uint24',
        'uint256',
        'uint256',
        'uint256',
      ],
      [
        firstDex,
        tokenIn,
        tokenOut,
        uniFee,
        minOut1,
        minOut2,
        minProfit,
      ],
    )

  console.log(
    '[FLASH LOAN PARAM ENCODER] operationData:',
    operationData,
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] operationData bytes:',
    (operationData.length - 2) / 2,
  )

  //====================================================
  // Encode outer params
  //
  // Solidity:
  //
  // (
  //   uint8 operationType,
  //   bytes operationData
  // )
  //====================================================

  console.log('----------------------------------------')
  console.log(
    '[FLASH LOAN PARAM ENCODER] Encoding outer params...',
  )

  const params =
    abiCoder.encode(
      [
        'uint8',
        'bytes',
      ],
      [
        operationType,
        operationData,
      ],
    )

  console.log(
    '[FLASH LOAN PARAM ENCODER] params:',
    params,
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] params bytes:',
    (params.length - 2) / 2,
  )

  //====================================================
  // Final diagnostics
  //====================================================

  console.log('----------------------------------------')
  console.log(
    '[FLASH LOAN PARAM ENCODER] FINAL SUMMARY',
  )

  console.log(
    'operationType =',
    operationType,
  )

  console.log(
    'firstDex =',
    firstDex,
  )

  console.log(
    'tokenIn =',
    tokenIn,
  )

  console.log(
    'tokenOut =',
    tokenOut,
  )

  console.log(
    'uniFee =',
    uniFee,
  )

  console.log(
    'minOut1 =',
    minOut1.toString(),
  )

  console.log(
    'minOut2 =',
    minOut2.toString(),
  )

  console.log(
    'minProfit =',
    minProfit.toString(),
  )

  console.log(
    '[FLASH LOAN PARAM ENCODER] SUCCESS',
  )

  console.log('========================================')

  return params
}

        // ======================================================
        // Simulate Flash Loan Arbitrage
        // Ethereum Sepolia
        // ======================================================

        export async function simulateFlashLoanArbitrage(
            asset: string,
            amount: bigint,
            params: string,
          ): Promise<boolean> {

            console.log('========================================')
            console.log('[FLASH LOAN SIMULATION] START')
            console.log('Asset:', asset)
            console.log('Amount:', amount.toString())
            console.log('Params:', params)
            console.log(
              'Executor:',
              EXECUTOR_CONTRACT_ADDRESS,
            )

            try {

              const provider =
                await getProvider()

              const signer =
                await provider.getSigner()

              const signerAddress =
                await signer.getAddress()

              console.log(
                '[FLASH LOAN SIMULATION] Signer:',
                signerAddress,
              )

              const executor =
                new Contract(
                  EXECUTOR_CONTRACT_ADDRESS,
                  EXECUTOR_WRITE_ABI,
                  signer,
                )

              console.log(
                '[FLASH LOAN SIMULATION] Calling staticCall...'
              )

              await executor.executeFlashLoanArbitrage.staticCall(
                asset,
                amount,
                params,
              )

              console.log(
                '[FLASH LOAN SIMULATION] SUCCESS'
              )

              console.log('========================================')

              return true

            } catch (error: any) {

              console.error(
                '========================================'
              )

              console.error(
                '[FLASH LOAN SIMULATION] FAILED'
              )

              console.error(
                'Asset:',
                asset,
              )

              console.error(
                'Amount:',
                amount.toString(),
              )

              console.error(
                'Params:',
                params,
              )

              console.error(
                'Executor:',
                EXECUTOR_CONTRACT_ADDRESS,
              )

              console.error(
                'Error:',
                error,
              )

              console.error(
                'Error message:',
                error?.message,
              )

              console.error(
                'Error reason:',
                error?.reason,
              )

              console.error(
                'Error shortMessage:',
                error?.shortMessage,
              )

              console.error(
                'Error data:',
                error?.data,
              )

              console.error(
                '========================================'
              )

             throw error
            }
          }

          // ======================================================
          // Estimate Aave Flash Loan Arbitrage Gas
          // Ethereum Sepolia
          //
          // Diagnostic only.
          // This function DOES NOT send a transaction.
          // ======================================================

          export async function estimateFlashLoanArbitrage(
            asset: string,
            amount: bigint,
            params: string,
          ): Promise<bigint> {

            console.log('========================================')
            console.log('[FLASH LOAN GAS ESTIMATE] START')

            console.log(
              '[FLASH LOAN GAS ESTIMATE] Asset:',
              asset,
            )

            console.log(
              '[FLASH LOAN GAS ESTIMATE] Amount:',
              amount.toString(),
            )

            console.log(
              '[FLASH LOAN GAS ESTIMATE] Params:',
              params,
            )

            console.log(
              '[FLASH LOAN GAS ESTIMATE] Executor:',
              EXECUTOR_CONTRACT_ADDRESS,
            )

            try {

              const provider =
                await getProvider()

              const signer =
                await provider.getSigner()

              const signerAddress =
                await signer.getAddress()

              console.log(
                '[FLASH LOAN GAS ESTIMATE] Signer:',
                signerAddress,
              )

              const executor =
                new Contract(
                  EXECUTOR_CONTRACT_ADDRESS,
                  EXECUTOR_WRITE_ABI,
                  signer,
                )

              // ======================================================
              // Estimate gas for the exact real transaction.
              //
              // This does NOT submit a transaction.
              // ======================================================

              console.log(
                '[FLASH LOAN GAS ESTIMATE] Calling estimateGas...'
              )

              const gasEstimate =
                await executor.executeFlashLoanArbitrage.estimateGas(
                  asset,
                  amount,
                  params,
                )

              console.log(
                '[FLASH LOAN GAS ESTIMATE] Gas estimate:',
                gasEstimate.toString(),
              )

              console.log(
                '[FLASH LOAN GAS ESTIMATE] SUCCESS'
              )

              console.log('========================================')

              return gasEstimate

            } catch (error: any) {

              console.error(
                '========================================'
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] FAILED'
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Asset:',
                asset,
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Amount:',
                amount.toString(),
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Params:',
                params,
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Executor:',
                EXECUTOR_CONTRACT_ADDRESS,
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Error:',
                error,
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Message:',
                error?.message,
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Reason:',
                error?.reason,
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Short message:',
                error?.shortMessage,
              )

              console.error(
                '[FLASH LOAN GAS ESTIMATE] Data:',
                error?.data,
              )

              console.error(
                '========================================'
              )

              throw error
            }
          }





    //======================================================
    // Execute Aave flash loan arbitrage
    //======================================================

    export async function executeFlashLoanArbitrage(
        asset: string,
        amount: bigint,
        params: string,
      ): Promise<string> {

        console.log('========================================')
        console.log('[FLASH LOAN EXECUTION] START')

        console.log(
          '[FLASH LOAN EXECUTION] Asset:',
          asset,
        )

        console.log(
          '[FLASH LOAN EXECUTION] Amount:',
          amount.toString(),
        )

        console.log(
          '[FLASH LOAN EXECUTION] Params:',
          params,
        )

        console.log(
          '[FLASH LOAN EXECUTION] Executor:',
          EXECUTOR_CONTRACT_ADDRESS,
        )

        try {

          const provider =
            await getProvider()

          const signer =
            await provider.getSigner()

          const signerAddress =
            await signer.getAddress()

          console.log(
            '[FLASH LOAN EXECUTION] Signer:',
            signerAddress,
          )

          const executor =
            new Contract(
              EXECUTOR_CONTRACT_ADDRESS,
              EXECUTOR_WRITE_ABI,
              signer,
            )

          // ======================================================
          // Pre-flight simulation
          // ======================================================

          console.log(
            '[FLASH LOAN EXECUTION] Running pre-flight staticCall...'
          )

          await executor.executeFlashLoanArbitrage.staticCall(
            asset,
            amount,
            params,
          )

          console.log(
            '[FLASH LOAN EXECUTION] Pre-flight simulation SUCCESS'
          )

          // ======================================================
          // Send real transaction
          // ======================================================

          console.log(
            '[FLASH LOAN EXECUTION] Sending transaction...'
          )

          const transaction =
            await executor.executeFlashLoanArbitrage(
              asset,
              amount,
              params,
            )

          console.log(
            '[FLASH LOAN EXECUTION] Transaction submitted'
          )

          console.log(
            '[FLASH LOAN EXECUTION] Transaction hash:',
            transaction.hash,
          )

          console.log('========================================')

          return transaction.hash

        } catch (error: any) {

          console.error(
            '========================================'
          )

          console.error(
            '[FLASH LOAN EXECUTION] FAILED'
          )

          console.error(
            '[FLASH LOAN EXECUTION] Asset:',
            asset,
          )

          console.error(
            '[FLASH LOAN EXECUTION] Amount:',
            amount.toString(),
          )

          console.error(
            '[FLASH LOAN EXECUTION] Params:',
            params,
          )

          console.error(
            '[FLASH LOAN EXECUTION] Executor:',
            EXECUTOR_CONTRACT_ADDRESS,
          )

          console.error(
            '[FLASH LOAN EXECUTION] Error:',
            error,
          )

          console.error(
            '[FLASH LOAN EXECUTION] Message:',
            error?.message,
          )

          console.error(
            '[FLASH LOAN EXECUTION] Reason:',
            error?.reason,
          )

          console.error(
            '[FLASH LOAN EXECUTION] Short message:',
            error?.shortMessage,
          )

          console.error(
            '[FLASH LOAN EXECUTION] Data:',
            error?.data,
          )

          console.error(
            '========================================'
          )

          throw error
        }
      }

      // ======================================================
      // Decode completed flash-loan arbitrage transaction
      // Ethereum Sepolia
      //
      // Diagnostic / frontend result function.
      // This function DOES NOT send a transaction.
      // ======================================================

      export async function getFlashLoanTransactionResult(
        txHash: string,
      ): Promise<{
        status: boolean
        gasUsed: bigint
        effectiveGasPrice: bigint
        gasCostWei: bigint

        flashLoanAmount: bigint | null
        flashLoanPremium: bigint | null

        swap1TokenIn: string | null
        swap1TokenOut: string | null
        swap1AmountIn: bigint | null
        swap1AmountOut: bigint | null

        swap2TokenIn: string | null
        swap2TokenOut: string | null
        swap2AmountIn: bigint | null
        swap2AmountOut: bigint | null

        arbitrageAsset: string | null
        arbitrageAmountBorrowed: bigint | null
        arbitrageProfit: bigint | null

        operationId: bigint | null
        operationSuccess: boolean | null

        executorUSDCBalance: string
        executorWETHBalance: string
      }> {

        console.log('========================================')
        console.log(
          '[FLASH LOAN RESULT] START',
        )

        console.log(
          '[FLASH LOAN RESULT] Transaction:',
          txHash,
        )

        const provider =
          await getProvider()

        try {

          // ====================================================
          // Get mined transaction receipt
          // ====================================================

          const receipt =
            await provider.getTransactionReceipt(
              txHash,
            )

          if (!receipt) {

            throw new Error(
              'Transaction receipt not found. The transaction may still be pending.',
            )
          }

          console.log(
            '[FLASH LOAN RESULT] Receipt found',
          )

          console.log(
            '[FLASH LOAN RESULT] Status:',
            receipt.status,
          )

          // ====================================================
          // Basic transaction accounting
          // ====================================================

          const status =
            receipt.status === 1

          const gasUsed =
            receipt.gasUsed

          const effectiveGasPrice =
            receipt.gasPrice

          const gasCostWei =
            gasUsed * effectiveGasPrice

          console.log(
            '[FLASH LOAN RESULT] Gas used:',
            gasUsed.toString(),
          )

          console.log(
            '[FLASH LOAN RESULT] Effective gas price:',
            effectiveGasPrice.toString(),
          )

          console.log(
            '[FLASH LOAN RESULT] Gas cost wei:',
            gasCostWei.toString(),
          )

          // ====================================================
          // Result variables
          // ====================================================

          let flashLoanAmount:
            bigint | null = null

          let flashLoanPremium:
            bigint | null = null

          let swap1TokenIn:
            string | null = null

          let swap1TokenOut:
            string | null = null

          let swap1AmountIn:
            bigint | null = null

          let swap1AmountOut:
            bigint | null = null

          let swap2TokenIn:
            string | null = null

          let swap2TokenOut:
            string | null = null

          let swap2AmountIn:
            bigint | null = null

          let swap2AmountOut:
            bigint | null = null

          let arbitrageAsset:
            string | null = null

          let arbitrageAmountBorrowed:
            bigint | null = null

          let arbitrageProfit:
            bigint | null = null

          let operationId:
            bigint | null = null

          let operationSuccess:
            boolean | null = null

          // ====================================================
          // Decode Executor events
          // ====================================================

          const executorAddress =
            EXECUTOR_CONTRACT_ADDRESS.toLowerCase()

          const executorLogs =
            receipt.logs.filter(
              (log) =>
                log.address.toLowerCase() ===
                executorAddress,
            )

          console.log(
            '[FLASH LOAN RESULT] Executor logs:',
            executorLogs.length,
          )

          let swapCount = 0

          for (const log of executorLogs) {

            try {

              const parsed =
                EXECUTOR_EVENT_INTERFACE.parseLog({
                  topics: log.topics,
                  data: log.data,
                })

              if (!parsed) {
                continue
              }

              console.log(
                '[FLASH LOAN RESULT] Event:',
                parsed.name,
              )

              // ==================================================
              // FlashLoanExecuted
              // ==================================================

             if (
                  parsed.name ===
                  'FlashLoanExecuted'
                ) {

                  const amount =
                    parsed.args.amount as bigint

                  const premium =
                    parsed.args.premium as bigint

                  flashLoanAmount =
                    amount

                  flashLoanPremium =
                    premium

                  console.log(
                    '[FLASH LOAN RESULT] Flash loan amount:',
                    amount.toString(),
                  )

                  console.log(
                    '[FLASH LOAN RESULT] Flash loan premium:',
                    premium.toString(),
                  )

                  continue
                }

              // ==================================================
              // SwapExecuted
              // ==================================================

              if (
                parsed.name ===
                'SwapExecuted'
              ) {

                swapCount++

                if (swapCount === 1) {

                  swap1TokenIn =
                    parsed.args.tokenIn

                  swap1TokenOut =
                    parsed.args.tokenOut

                  swap1AmountIn =
                    parsed.args.amountIn

                  swap1AmountOut =
                    parsed.args.amountOut

                } else if (
                  swapCount === 2
                ) {

                  swap2TokenIn =
                    parsed.args.tokenIn

                  swap2TokenOut =
                    parsed.args.tokenOut

                  swap2AmountIn =
                    parsed.args.amountIn

                  swap2AmountOut =
                    parsed.args.amountOut
                }

                continue
              }

              // ==================================================
              // ArbitrageProfit
              // ==================================================

              if (
                parsed.name ===
                'ArbitrageProfit'
              ) {

                arbitrageAsset =
                  parsed.args.asset

                arbitrageAmountBorrowed =
                  parsed.args.amountBorrowed

                arbitrageProfit =
                  parsed.args.profit

                continue
              }

              // ==================================================
              // OperationCompleted
              // ==================================================

              if (
                parsed.name ===
                'OperationCompleted'
              ) {

                operationId =
                  parsed.args.operationId

                operationSuccess =
                  parsed.args.success
              }

            } catch (decodeError) {

              console.warn(
                '[FLASH LOAN RESULT] Unable to decode Executor log:',
                decodeError,
              )
            }
          }

          // ====================================================
          // Current Executor balances
          // ====================================================

          const executorUSDCBalance =
            await getExecutorUSDCBalance()

          const executorWETHBalance =
            await getExecutorWETHBalance()

          // ====================================================
          // Final diagnostics
          // ====================================================

          console.log(
            '[FLASH LOAN RESULT] Status:',
            status,
          )

          console.log(
            '[FLASH LOAN RESULT] Flash loan amount:',
            flashLoanAmount?.toString() ?? 'N/A',
          )

          console.log(
            '[FLASH LOAN RESULT] Flash loan premium:',
            flashLoanPremium?.toString() ?? 'N/A',
          )

          console.log(
            '[FLASH LOAN RESULT] Swap count:',
            swapCount,
          )

          console.log(
            '[FLASH LOAN RESULT] Arbitrage profit:',
            arbitrageProfit?.toString() ?? 'N/A',
          )

          console.log(
            '[FLASH LOAN RESULT] Operation ID:',
            operationId?.toString() ?? 'N/A',
          )

          console.log(
            '[FLASH LOAN RESULT] Operation success:',
            operationSuccess,
          )

          console.log(
            '[FLASH LOAN RESULT] Executor USDC:',
            executorUSDCBalance,
          )

          console.log(
            '[FLASH LOAN RESULT] Executor WETH:',
            executorWETHBalance,
          )

          console.log(
            '[FLASH LOAN RESULT] SUCCESS',
          )

          console.log('========================================')

          return {
            status,
            gasUsed,
            effectiveGasPrice,
            gasCostWei,

            flashLoanAmount,
            flashLoanPremium,

            swap1TokenIn,
            swap1TokenOut,
            swap1AmountIn,
            swap1AmountOut,

            swap2TokenIn,
            swap2TokenOut,
            swap2AmountIn,
            swap2AmountOut,

            arbitrageAsset,
            arbitrageAmountBorrowed,
            arbitrageProfit,

            operationId,
            operationSuccess,

            executorUSDCBalance,
            executorWETHBalance,
          }

        } catch (error: any) {

          console.error(
            '========================================',
          )

          console.error(
            '[FLASH LOAN RESULT] FAILED',
          )

          console.error(
            '[FLASH LOAN RESULT] Transaction:',
            txHash,
          )

          console.error(
            '[FLASH LOAN RESULT] Error:',
            error,
          )

          console.error(
            '[FLASH LOAN RESULT] Message:',
            error?.message,
          )

          console.error(
            '[FLASH LOAN RESULT] Reason:',
            error?.reason,
          )

          console.error(
            '[FLASH LOAN RESULT] Short message:',
            error?.shortMessage,
          )

          console.error(
            '========================================',
          )

          throw error
        }
      }




// ======================================================
// Get Real Uniswap V3 Quote
// Ethereum Sepolia
// ======================================================

export async function getUniswapV3Quote(
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  fee: number = 3000,
): Promise<bigint> {

  if (amountIn <= 0n) {
    throw new Error(
      'Uniswap V3 quote amount must be greater than zero.',
    )
  }

  if (
    fee !== 500 &&
    fee !== 3000 &&
    fee !== 10000
  ) {
    throw new Error(
      'Unsupported Uniswap V3 fee tier.',
    )
  }

  const provider =
    await getProvider()

  const quoter =
    new Contract(
      UNISWAP_V3_QUOTER_V2_ADDRESS,
      UNISWAP_V3_QUOTER_V2_ABI,
      provider,
    )

  console.log(
    '========================================',
  )

  console.log(
    '[UNISWAP V3 QUOTE] START',
  )

  console.log(
    '[UNISWAP V3 QUOTE] Token In:',
    tokenIn,
  )

  console.log(
    '[UNISWAP V3 QUOTE] Token Out:',
    tokenOut,
  )

  console.log(
    '[UNISWAP V3 QUOTE] Amount In:',
    amountIn.toString(),
  )

  console.log(
    '[UNISWAP V3 QUOTE] Fee:',
    fee,
  )

  console.log(
    '[UNISWAP V3 QUOTE] Quoter:',
    UNISWAP_V3_QUOTER_V2_ADDRESS,
  )

  console.log(
  '[UNISWAP V3 QUOTE] FINAL TOKEN IN:',
  tokenIn,
)

console.log(
  '[UNISWAP V3 QUOTE] FINAL TOKEN OUT:',
  tokenOut,
)

console.log(
  '[UNISWAP V3 QUOTE] FINAL AMOUNT IN:',
  amountIn.toString(),
)

console.log(
  '[UNISWAP V3 QUOTE] FINAL FEE:',
  fee,
)

  try {

    // QuoterV2 is intentionally non-view because it
    // computes the quote through a revert-based simulation.
    // Therefore ethers v6 must use staticCall here.
    const result =
      await quoter.quoteExactInputSingle.staticCall([
        tokenIn,
        tokenOut,
        amountIn,
        fee,
        0,
      ])

    const amountOut =
      result[0]

    console.log(
      '[UNISWAP V3 QUOTE] Amount Out:',
      amountOut.toString(),
    )

    console.log(
      '[UNISWAP V3 QUOTE] SUCCESS',
    )

    console.log(
      '========================================',
    )

    return amountOut

  } catch (error: any) {

    console.error(
      '[UNISWAP V3 QUOTE] FAILED',
    )

    console.error(
      '[UNISWAP V3 QUOTE] Error:',
      error,
    )

    console.error(
      '[UNISWAP V3 QUOTE] Message:',
      error?.message,
    )

    console.error(
      '[UNISWAP V3 QUOTE] Reason:',
      error?.reason,
    )

    console.error(
      '[UNISWAP V3 QUOTE] Short message:',
      error?.shortMessage,
    )

    console.error(
      '[UNISWAP V3 QUOTE] Data:',
      error?.data,
    )

    console.error(
      '========================================',
    )

    throw error
  }
}

// ======================================================
// Uniswap V3 Pool Diagnostic
// Ethereum Sepolia
// ======================================================

const UNISWAP_V3_FACTORY_READ_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
]

const UNISWAP_V3_POOL_READ_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
]

export async function diagnoseUniswapV3Pools(): Promise<void> {

  const provider =
    await getProvider()

  const factory =
    new Contract(
      UNISWAP_V3_FACTORY_ADDRESS,
      UNISWAP_V3_FACTORY_READ_ABI,
      provider,
    )

  console.log(
    '========================================',
  )

  console.log(
    '[V3 POOL DIAGNOSTIC] START',
  )

  console.log(
    '[V3 POOL DIAGNOSTIC] Factory:',
    UNISWAP_V3_FACTORY_ADDRESS,
  )

  console.log(
    '[V3 POOL DIAGNOSTIC] USDC:',
    USDC_ADDRESS,
  )

  console.log(
    '[V3 POOL DIAGNOSTIC] WETH:',
    WETH_ADDRESS,
  )

  const fees = [
    500,
    3000,
    10000,
  ]

  try {

    for (const fee of fees) {

      console.log(
        '----------------------------------------',
      )

      console.log(
        '[V3 POOL DIAGNOSTIC] Fee:',
        fee,
      )

      const poolAddress =
        await factory.getPool(
          USDC_ADDRESS,
          WETH_ADDRESS,
          fee,
        )

      console.log(
        '[V3 POOL DIAGNOSTIC] Pool:',
        poolAddress,
      )

      if (
        !poolAddress ||
        poolAddress.toLowerCase() ===
          '0x0000000000000000000000000000000000000000'
      ) {

        console.warn(
          '[V3 POOL DIAGNOSTIC] NO POOL',
        )

        continue
      }

      const pool =
        new Contract(
          poolAddress,
          UNISWAP_V3_POOL_READ_ABI,
          provider,
        )

      const [
        token0,
        token1,
        poolFee,
        liquidity,
        slot0,
      ] =
        await Promise.all([
          pool.token0(),
          pool.token1(),
          pool.fee(),
          pool.liquidity(),
          pool.slot0(),
        ])

      console.log(
        '[V3 POOL DIAGNOSTIC] token0:',
        token0,
      )

      console.log(
        '[V3 POOL DIAGNOSTIC] token1:',
        token1,
      )

      console.log(
        '[V3 POOL DIAGNOSTIC] Pool fee:',
        poolFee.toString(),
      )

      console.log(
        '[V3 POOL DIAGNOSTIC] Liquidity:',
        liquidity.toString(),
      )

      console.log(
        '[V3 POOL DIAGNOSTIC] sqrtPriceX96:',
        slot0[0].toString(),
      )

      console.log(
        '[V3 POOL DIAGNOSTIC] Tick:',
        slot0[1].toString(),
      )
    }

    console.log(
      '[V3 POOL DIAGNOSTIC] SUCCESS',
    )

  } catch (error: any) {

    console.error(
      '[V3 POOL DIAGNOSTIC] FAILED',
    )

    console.error(
      '[V3 POOL DIAGNOSTIC] Error:',
      error,
    )

    console.error(
      '[V3 POOL DIAGNOSTIC] Message:',
      error?.message,
    )

    console.error(
      '[V3 POOL DIAGNOSTIC] Reason:',
      error?.reason,
    )

    console.error(
      '[V3 POOL DIAGNOSTIC] Short message:',
      error?.shortMessage,
    )

    console.error(
      '[V3 POOL DIAGNOSTIC] Data:',
      error?.data,
    )
  }

  console.log(
    '========================================',
  )
}

// ======================================================
// Real Uniswap V3 USDC -> WETH Quote
// ======================================================

export async function getUniswapV3USDCToWETHQuote(
  amountIn: bigint,
  fee: number = 3000,
): Promise<bigint> {

  return getUniswapV3Quote(
    USDC_ADDRESS,
    WETH_ADDRESS,
    amountIn,
    fee,
  )
}


// ======================================================
// Real V2 Quote
// Ethereum Sepolia
// ======================================================

export async function getV2Quote(
  amountIn: bigint,
  path: string[],
): Promise<bigint> {

  if (amountIn <= 0n) {
    throw new Error(
      'V2 quote amount must be greater than zero.',
    )
  }

  if (path.length < 2) {
    throw new Error(
      'V2 quote path must contain at least two tokens.',
    )
  }

  const provider =
    await getProvider()

  const router =
    new Contract(
      V2_ROUTER_ADDRESS,
      V2_ROUTER_READ_ABI,
      provider,
    )

  console.log(
    '========================================',
  )

  console.log(
    '[V2 QUOTE] START',
  )

  console.log(
    '[V2 QUOTE] Router:',
    V2_ROUTER_ADDRESS,
  )

  console.log(
    '[V2 QUOTE] Amount In:',
    amountIn.toString(),
  )

  console.log(
    '[V2 QUOTE] Path:',
    path,
  )

  try {

    const amounts =
      await router.getAmountsOut(
        amountIn,
        path,
      )

    const amountOut =
      amounts[amounts.length - 1]

    console.log(
      '[V2 QUOTE] Amount Out:',
      amountOut.toString(),
    )

    console.log(
      '[V2 QUOTE] SUCCESS',
    )

    console.log(
      '========================================',
    )

    return amountOut

  } catch (error: any) {

    console.error(
      '[V2 QUOTE] FAILED',
    )

    console.error(
      '[V2 QUOTE] Error:',
      error,
    )

    console.error(
      '[V2 QUOTE] Message:',
      error?.message,
    )

    console.error(
      '[V2 QUOTE] Reason:',
      error?.reason,
    )

    console.error(
      '[V2 QUOTE] Short message:',
      error?.shortMessage,
    )

    console.error(
      '[V2 QUOTE] Data:',
      error?.data,
    )

    console.error(
      '========================================',
    )

    throw error
  }
}

  // ======================================================
  // V2 WETH / USDC Pair Diagnostic
  // Ethereum Sepolia
  // ======================================================

  const V2_ROUTER_FACTORY_ABI = [
    'function factory() external view returns (address)',
  ]

  const V2_FACTORY_READ_ABI = [
    'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  ]

  const V2_PAIR_READ_ABI = [
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  ]


  export async function diagnoseV2WethUsdcPair(): Promise<void> {

        const provider =
          await getProvider()

        // ======================================================
        // Get factory directly from the configured V2 router
        // ======================================================

        const router =
          new Contract(
            V2_ROUTER_ADDRESS,
            V2_ROUTER_FACTORY_ABI,
            provider,
          )

        const factoryAddress =
          await router.factory()

        const factory =
          new Contract(
            factoryAddress,
            V2_FACTORY_READ_ABI,
            provider,
          )

        console.log(
          '========================================',
        )

        console.log(
          '[V2 PAIR DIAGNOSTIC] START',
        )

        console.log(
          '[V2 PAIR DIAGNOSTIC] Router:',
          V2_ROUTER_ADDRESS,
        )

        console.log(
          '[V2 PAIR DIAGNOSTIC] Factory:',
          factoryAddress,
        )

        console.log(
          '[V2 PAIR DIAGNOSTIC] WETH:',
          WETH_ADDRESS,
        )

        console.log(
          '[V2 PAIR DIAGNOSTIC] USDC:',
          USDC_ADDRESS,
        )

        try {

          const pairAddress =
            await factory.getPair(
              WETH_ADDRESS,
              USDC_ADDRESS,
            )

          console.log(
            '[V2 PAIR DIAGNOSTIC] Pair:',
            pairAddress,
          )

          if (
            !pairAddress ||
            pairAddress ===
              '0x0000000000000000000000000000000000000000'
          ) {

            console.warn(
              '[V2 PAIR DIAGNOSTIC] NO PAIR EXISTS',
            )

            console.log(
              '========================================',
            )

            return
          }

          const pair =
            new Contract(
              pairAddress,
              V2_PAIR_READ_ABI,
              provider,
            )

          const [
            token0,
            token1,
            reserves,
          ] =
            await Promise.all([
              pair.token0(),
              pair.token1(),
              pair.getReserves(),
            ])

          console.log(
            '[V2 PAIR DIAGNOSTIC] token0:',
            token0,
          )

          console.log(
            '[V2 PAIR DIAGNOSTIC] token1:',
            token1,
          )

          console.log(
            '[V2 PAIR DIAGNOSTIC] reserve0:',
            reserves[0].toString(),
          )

          console.log(
            '[V2 PAIR DIAGNOSTIC] reserve1:',
            reserves[1].toString(),
          )

          console.log(
            '[V2 PAIR DIAGNOSTIC] timestamp:',
            reserves[2].toString(),
          )

          console.log(
            '[V2 PAIR DIAGNOSTIC] SUCCESS',
          )

        } catch (error: any) {

          console.error(
            '[V2 PAIR DIAGNOSTIC] FAILED',
          )

          console.error(
            '[V2 PAIR DIAGNOSTIC] Error:',
            error,
          )

          console.error(
            '[V2 PAIR DIAGNOSTIC] Message:',
            error?.message,
          )

          console.error(
            '[V2 PAIR DIAGNOSTIC] Reason:',
            error?.reason,
          )

          console.error(
            '[V2 PAIR DIAGNOSTIC] Short message:',
            error?.shortMessage,
          )

          console.error(
            '[V2 PAIR DIAGNOSTIC] Data:',
            error?.data,
          )

        }

        console.log(
          '========================================',
        )
      }


// ======================================================
// Real V2 WETH -> USDC Quote
// ======================================================

export async function getV2WETHToUSDCQuote(
  amountIn: bigint,
): Promise<bigint> {

  return getV2Quote(
    amountIn,
    [
      WETH_ADDRESS,
      USDC_ADDRESS,
    ],
  )
}


// ======================================================
// Get MetaMask Provider
// ======================================================

export async function getProvider(): Promise<BrowserProvider> {
  const ethereum = (window as WindowWithEthereum).ethereum

  if (!ethereum) {
    throw new Error('MetaMask is not installed.')
  }

  return new BrowserProvider(ethereum)
}

// ======================================================
// Get Connected Wallet Address
// ======================================================

export async function getConnectedWalletAddress(): Promise<string | null> {
  const provider = await getProvider()

  const accounts = await provider.send(
    'eth_accounts',
    [],
  )

  if (accounts.length === 0) {
    return null
  }

  return accounts[0]
}

// ======================================================
// Get Executor Contract
// ======================================================

async function getExecutorContract(): Promise<Contract> {
  const provider = await getProvider()

  return new Contract(
    EXECUTOR_CONTRACT_ADDRESS,
    EXECUTOR_READ_ABI,
    provider,
  )
}

// ======================================================
// Get Executor Owner
// ======================================================

export async function getExecutorOwner(): Promise<string> {
  const contract = await getExecutorContract()

  return await contract.owner()
}

// ======================================================
// Get Executor Paused Status
// ======================================================

export async function getExecutorPaused(): Promise<boolean> {
  const contract = await getExecutorContract()

  return await contract.paused()
}

// ======================================================
// Get Executor ETH Balance
// ======================================================

export async function getExecutorETHBalance(): Promise<string> {
  const provider = await getProvider()

  const balance = await provider.getBalance(
    EXECUTOR_CONTRACT_ADDRESS,
  )

  return formatEther(balance)
}

// ======================================================
// Get Executor USDC Balance
// ======================================================

export async function getExecutorUSDCBalance(): Promise<string> {
  const provider = await getProvider()

  const usdcContract = new Contract(
    USDC_ADDRESS,
    ERC20_ABI,
    provider,
  )

  const balance = await usdcContract.balanceOf(
    EXECUTOR_CONTRACT_ADDRESS,
  )

  return formatUnits(balance, 6)
}

// ======================================================
// Get Executor WETH Balance
// ======================================================

export async function getExecutorWETHBalance(): Promise<string> {
  const provider = await getProvider()

  const wethContract = new Contract(
    WETH_ADDRESS,
    ERC20_ABI,
    provider,
  )

  const balance = await wethContract.balanceOf(
    EXECUTOR_CONTRACT_ADDRESS,
  )

  return formatUnits(balance, 18)
}

// ======================================================
// Get Connected Wallet ETH Balance
// ======================================================

export async function getWalletETHBalance(): Promise<string> {
  const provider = await getProvider()

  const wallet =
    await getConnectedWalletAddress()

  if (!wallet) {
    return '0'
  }

  const balance =
    await provider.getBalance(wallet)

  return formatEther(balance)
}


// ======================================================
// Get Connected Wallet ERC20 Token Balance
// ======================================================

export async function getWalletTokenBalance(
  tokenAddress: string,
  decimals: number,
): Promise<string> {

  const provider =
    await getProvider()

  const wallet =
    await getConnectedWalletAddress()

  if (!wallet) {
    return '0'
  }

  const tokenContract =
    new Contract(
      tokenAddress,
      ERC20_ABI,
      provider,
    )

  const balance =
    await tokenContract.balanceOf(
      wallet,
    )

  return formatUnits(
    balance,
    decimals,
  )
}


// ======================================================
// Get Connected Wallet USDC Balance
// Aave / Project USDC
// ======================================================

export async function getWalletUSDCBalance(): Promise<string> {

  return getWalletTokenBalance(
    USDC_ADDRESS,
    6,
  )
}


// ======================================================
// Get Connected Wallet Circle USDC Balance
// Circle USDC
// ======================================================

export async function getWalletCircleUSDCBalance(): Promise<string> {

  return getWalletTokenBalance(
    CIRCLE_USDC_ADDRESS,
    6,
  )
}

// ======================================================
// Get Connected Wallet WETH Balance
// ======================================================

export async function getWalletWETHBalance(): Promise<string> {

  return getWalletTokenBalance(
    WETH_ADDRESS,
    18,
  )
}



// ======================================================
// Wallet Token Balance Diagnostic
// ======================================================

export async function diagnoseWalletTokenBalances(): Promise<void> {

  console.log('========================================')
  console.log('[WALLET BALANCE DIAGNOSTIC] START')
  console.log('========================================')

  try {

    const wallet =
      await getConnectedWalletAddress()

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] Wallet:',
      wallet,
    )

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] Aave/Project USDC:',
      USDC_ADDRESS,
    )

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] Circle USDC:',
      CIRCLE_USDC_ADDRESS,
    )

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] WETH:',
      WETH_ADDRESS,
    )

    const [
      usdc,
      circleUsdc,
      weth,
    ] =
      await Promise.all([
        getWalletUSDCBalance(),
        getWalletCircleUSDCBalance(),
        getWalletWETHBalance(),
      ])

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] Aave/Project USDC:',
      usdc,
    )

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] Circle USDC:',
      circleUsdc,
    )

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] WETH:',
      weth,
    )

    console.log(
      '[WALLET BALANCE DIAGNOSTIC] SUCCESS',
    )

  } catch (error) {

    console.error(
      '[WALLET BALANCE DIAGNOSTIC] FAILED:',
      error,
    )
  }

  console.log('========================================')
}


// ======================================================
// Check Executor Owner
// ======================================================

export async function isConnectedWalletExecutorOwner(): Promise<boolean> {

  const connectedWallet =
    await getConnectedWalletAddress()

  if (!connectedWallet) {
    return false
  }

  const owner =
    await getExecutorOwner()

  return (
    connectedWallet.toLowerCase() ===
    owner.toLowerCase()
  )
}

export async function diagnoseV2Router(): Promise<void> {

  const provider =
    await getProvider()

  const router =
    new Contract(
      V2_ROUTER_ADDRESS,
      V2_ROUTER_DIAGNOSTIC_ABI,
      provider,
    )

  console.log(
    '========================================',
  )

  console.log(
    '[V2 ROUTER DIAGNOSTIC] START',
  )

  console.log(
    '[V2 ROUTER DIAGNOSTIC] Router:',
    V2_ROUTER_ADDRESS,
  )

  try {

    const factory =
      await router.factory()

    const weth =
      await router.WETH()

    console.log(
      '[V2 ROUTER DIAGNOSTIC] Factory:',
      factory,
    )

    console.log(
      '[V2 ROUTER DIAGNOSTIC] WETH:',
      weth,
    )

    console.log(
      '[V2 ROUTER DIAGNOSTIC] SUCCESS',
    )

  } catch (error: any) {

    console.error(
      '[V2 ROUTER DIAGNOSTIC] FAILED',
    )

    console.error(
      '[V2 ROUTER DIAGNOSTIC] Error:',
      error,
    )

    console.error(
      '[V2 ROUTER DIAGNOSTIC] Message:',
      error?.message,
    )

    console.error(
      '[V2 ROUTER DIAGNOSTIC] Reason:',
      error?.reason,
    )

    console.error(
      '[V2 ROUTER DIAGNOSTIC] Short message:',
      error?.shortMessage,
    )

    console.error(
      '[V2 ROUTER DIAGNOSTIC] Data:',
      error?.data,
    )

  }

    console.log(
    '========================================',
  )
}

// ======================================================
// DEVELOPMENT DIAGNOSTIC FUNCTIONS
// Expose existing diagnostics, quote functions,
// encoder and decoder to browser console
// ======================================================
if (import.meta.env.DEV) {

  ;(window as any).diagnoseV2Router =
    diagnoseV2Router

  ;(window as any).diagnoseV2WethUsdcPair =
    diagnoseV2WethUsdcPair

  ;(window as any).diagnoseUniswapV3Pools =
    diagnoseUniswapV3Pools

  ;(window as any).getV2Quote =
    getV2Quote

  ;(window as any).getUniswapV3Quote =
    getUniswapV3Quote

  ;(window as any).encodeFlashLoanArbitrageParams =
    encodeFlashLoanArbitrageParams

  ;(window as any).getExecutorUSDCBalance =
    getExecutorUSDCBalance

  ;(window as any).getExecutorWETHBalance =
    getExecutorWETHBalance

  //====================================================
  // Flash loan diagnostics
  //====================================================

  ;(window as any).simulateFlashLoanArbitrage =
    simulateFlashLoanArbitrage

  ;(window as any).estimateFlashLoanArbitrage =
    estimateFlashLoanArbitrage

  ;(window as any).executeFlashLoanArbitrage =
    executeFlashLoanArbitrage

  ;(window as any).getFlashLoanTransactionResult =
    getFlashLoanTransactionResult

  //====================================================
  // Flash loan error selector diagnostic
  //====================================================

  ;(window as any).diagnoseFlashLoanErrorSelector =
    diagnoseFlashLoanErrorSelector

  //====================================================
  // Flash loan params decoder diagnostic
  //====================================================

  //====================================================
  // Decode Executor custom error
  //====================================================

  ;(window as any).decodeExecutorError = (
    data: string,
  ): void => {

    console.log(
      '========================================',
    )

    console.log(
      '[EXECUTOR ERROR DECODER] START',
    )

    try {

      const cleanData =
        data.trim().replace(/\s/g, '')

      const selector =
        cleanData.slice(0, 10)

      console.log(
        '[EXECUTOR ERROR DECODER] selector:',
        selector,
      )

      console.log(
        '[EXECUTOR ERROR DECODER] raw data:',
        cleanData,
      )

      if (
        selector === '0x7ad693e3'
      ) {

        const argumentHex =
          cleanData.slice(10, 74)

        const leg =
          Number(
            BigInt(
              '0x' + argumentHex,
            ),
          )

        console.log(
          '[EXECUTOR ERROR DECODER] MATCH:',
          'ArbitrageLegFailed(uint8)',
        )

        console.log(
          '[EXECUTOR ERROR DECODER] leg:',
          leg,
        )

        console.log(
          '[EXECUTOR ERROR DECODER] meaning:',
          leg === 1
            ? 'DEX LEG 1 FAILED'
            : leg === 2
              ? 'DEX LEG 2 FAILED'
              : 'UNKNOWN LEG',
        )

        return
      }

      console.warn(
        '[EXECUTOR ERROR DECODER] Unknown selector:',
        selector,
      )

    } catch (error) {

      console.error(
        '[EXECUTOR ERROR DECODER] FAILED:',
        error,
      )

    } finally {

      console.log(
        '[EXECUTOR ERROR DECODER] END',
      )

      console.log(
        '========================================',
      )
    }
  }
}

export function diagnoseFlashLoanErrorSelector(): void {
  console.log('========================================')
  console.log('[FLASH LOAN ERROR SELECTOR] START')

  const selector =
    id('FlashLoanCallFailed()').slice(0, 10)

  console.log(
    '[FLASH LOAN ERROR SELECTOR] FlashLoanCallFailed():',
    selector,
  )

  console.log(
    '[FLASH LOAN ERROR SELECTOR] Remix revert selector:',
    '0x224311fe',
  )

  console.log(
    '[FLASH LOAN ERROR SELECTOR] MATCH:',
    selector.toLowerCase() ===
      '0x224311fe'.toLowerCase(),
  )

  console.log('========================================')
}