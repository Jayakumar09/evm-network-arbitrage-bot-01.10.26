
![B](https://i.postimg.cc/Vvxx2whh/20251219-1540-Banner-dla-Githab-simple-compose-01kcvddqxpfd3bgr4kkvnf0qm7.png)

  

## Executor (Aave + V2-compatible DEX + Uniswap V3)

This project is an Ethereum Sepolia testnet flash-loan arbitrage system.
The current verified workflow uses Aave V3 flash loans and a two-leg
arbitrage route between a V2-compatible DEX and Uniswap V3.

The current project is **testnet-only**. Successful Sepolia execution does
not imply production profitability or production readiness.

### Current tested workflow

1. Connect MetaMask to Ethereum Sepolia.
2. Start the frontend with `npm run dev`.
3. Open `/scanner`.
4. Enter the flash-loan amount and scan fresh Sepolia quotes.
5. Review the selected profitable route on `/opportunity`.
6. Prepare execution on `/execution`.
7. Review the minimum outputs and minimum profit.
8. Confirm the in-app execution dialog.
9. The frontend performs an Aave flash-loan `staticCall` pre-flight simulation.
10. If simulation succeeds, MetaMask requests the real transaction.
11. Confirm the Sepolia transaction in MetaMask.
12. Verify the transaction receipt and decoded Executor events.
13. Verify the resulting Executor token balance in Remix if required.
14. Withdraw the realized USDC to the owner wallet using `/withdrawals`.

### Important

- Do **not** use the old `Launch()` workflow for the current checkpoint.
- The current tested path is `executeFlashLoanArbitrage(...)`.
- Keep the deployed Executor address and frontend configuration synchronized.
- Test one feature at a time and do not redeploy a working Executor without
  an explicit reason.

### Current protection model

The arbitrage operation uses:

- Aave flash-loan repayment validation
- token/asset validation
- DEX route selection
- `minOut1`
- `minOut2`
- `minProfit`
- owner authorization
- pause protection
- reentrancy protection on withdrawal paths

The frontend also performs a pre-flight `staticCall` before submitting the
real transaction.

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
0x4b5Bf061141E49cf8007E148e03B28eE71C3D25a
```

### Owner

``` text
0x6D1212b63621675397fFDB26C5ba6fcd76ce9904
```

### Current Contract State

``` text
paused() = false
```

The deployed Executor is the existing Sepolia contract used by the
frontend. No new deployment was performed for this checkpoint.

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

The latest successful frontend execution used:

``` text
USDC
  ↓
V2-Compatible DEX
  ↓
WETH
  ↓
Uniswap V3
  ↓
USDC
```

with:

``` text
firstDex = 1
uniFee   = 3000
```

The scanner checks both directions and selects the best profitable route from
fresh Sepolia quotes.

``` text
dexSelector 0 = Uniswap V3
dexSelector 1 = V2-Compatible DEX
```

------------------------------------------------------------------------

# Latest Successful Real Flash Loan Transaction

The latest verified frontend execution was a real Sepolia transaction.

## Test Amount

``` text
10 USDC
```

## Flash Loan Parameters

``` text
operationType = 1
firstDex      = 1
tokenIn       = Aave Sepolia USDC
tokenOut      = Sepolia WETH
uniFee        = 3000
```

The frontend generated non-zero `minOut1`, `minOut2`, and `minProfit`
protection values for this execution.

## Transaction

``` text
0x2db62f2b8572ebccedc72d2f6e5f07f08e419f0378f05b6e507c8473c3cd5b8f
```

## Receipt

``` text
Status: 1
Gas used: 475,950
Effective gas price: 2.444003269 gwei
Gas cost: 0.00116322335588055 SepoliaETH
```

## Verified Execution Result

``` text
Flash loan:        10 USDC
Aave premium:      0.005000 USDC
Arbitrage profit:  222.071851 USDC
Executor USDC:     222.071851 USDC
Executor WETH:     0
```

The frontend calculated the realized result as:

``` text
Gross profit:       222.076851 USDC
Aave premium:         0.005000 USDC
Net before gas:     222.071851 USDC
Gas cost:             3.121580 USD
Final net profit:   218.950271 USD
```

The frontend decoder detected:

``` text
SwapExecuted
SwapExecuted
ArbitrageProfit
FlashLoanExecuted
OperationCompleted
```

The operation was reported as successful with Operation ID 3.

## On-chain Balance Verification

After the successful transaction, Remix returned:

``` text
getTokenBalance(Aave Sepolia USDC)
= 222071851
```

Because Aave Sepolia USDC uses 6 decimals:

``` text
222071851 raw
= 222.071851 USDC
```

## Profit Withdrawal Verification

The full Executor USDC balance was subsequently withdrawn to the owner wallet.

After withdrawal:

``` text
Executor USDC = 0
```

This was independently confirmed with the Remix `getTokenBalance(address)`
call.

The frontend Withdrawal page also refreshed to:

``` text
Executor USDC = 0.00 USDC
No USDC Available
```

The owner wallet then displayed approximately:

``` text
999.625 USDC
```

This completes the tested execution → balance verification → withdrawal
cycle on Sepolia.

------------------------------------------------------------------------

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
Ethereum Sepolia, but additional safety and execution-cost improvements are
still required before considering production deployment.

## Current limitations

### 1. Scanner gas-cost integration

The scanner currently uses a placeholder gas value during pre-execution
opportunity calculation.

The latest successful transaction consumed:

``` text
475,950 gas
```

The frontend records the actual transaction gas cost after confirmation,
but the scanner should use a real gas estimate before declaring an
opportunity executable.

### 2. Dynamic Aave premium

The scanner should eventually obtain the current Aave premium dynamically
instead of relying on an assumed flash-loan fee during opportunity
calculation.

### 3. Slippage and minimum-profit validation

The latest successful 10-USDC frontend execution used non-zero `minOut1`,
`minOut2`, and `minProfit` values.

These protections are part of the tested execution path, but they should
continue to be hardened against quote changes and execution-time state
changes.

### 4. Quote freshness

The tested route was profitable at the observed Sepolia prices.

It does **not** mean that:

``` text
V2-Compatible DEX → Uniswap V3
```

will always be profitable.

Every execution must use fresh quotes and revalidate the opportunity.

### 5. Testnet only

Sepolia liquidity, prices, gas behavior, and token balances are not
representative of production Ethereum conditions.

No production deployment should be inferred from the successful Sepolia
tests.

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
cd D:\DevProjects\completed\evm-network-arbitrage-bot-01.10.26\frontend
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
cd D:\DevProjects\completed\evm-network-arbitrage-bot-01.10.26\frontend
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
Real flash loan execution           ✓
V2-compatible DEX swap              ✓
Uniswap V3 swap                     ✓
Aave repayment                      ✓
Arbitrage profit                    ✓
Transaction receipt                 ✓
Event decoding                      ✓
Frontend confirmation               ✓
On-chain profit verification        ✓
USDC withdrawal                     ✓
Executor balance reset to zero      ✓
TypeScript check                    ✓
Vite production build              ✓

================================================
LATEST SUCCESSFUL TEST
================================================

10 USDC flash loan

USDC → V2-Compatible DEX → WETH
    → Uniswap V3 → USDC

Realized arbitrage profit:
222.071851 USDC

Final net profit after recorded gas:
218.950271 USD

================================================
EXECUTOR
================================================

0x4b5Bf061141E49cf8007E148e03B28eE71C3D25a

================================================
NEXT DEVELOPMENT PHASE
================================================

Safety hardening:
- Real gas-cost integration in scanner
- Dynamic Aave premium
- Quote freshness / revalidation
- Further minOut validation
- Dynamic minProfit
- Final net-profit calculation
- Improved execution-result UI
================================================
```

------------------------------------------------------------------------

# Repository

GitHub:

https://github.com/Jayakumar09/evm-network-arbitrage-bot-01.10.26

This README represents the current Sepolia testing checkpoint and should
be updated as the project moves into the safety-hardening phase.
