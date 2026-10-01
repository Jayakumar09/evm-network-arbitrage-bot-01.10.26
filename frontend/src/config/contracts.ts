// ======================================================
// Sepolia Contract Configuration
// ======================================================

// Ethereum Sepolia Chain ID
export const SEPOLIA_CHAIN_ID = 11155111

// ======================================================
// Network
// ======================================================

export const NETWORK_NAME = 'Ethereum Sepolia'

// ======================================================
// Executor Contract
// ======================================================

export const EXECUTOR_CONTRACT_ADDRESS =
  '0x4b5Bf061141E49cf8007E148e03B28eE71C3D25a'

// ======================================================
// Aave V3 Sepolia
// ======================================================

// Aave V3 Pool
export const AAVE_POOL_ADDRESS =
  '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951'

// Aave V3 Pool Addresses Provider
export const AAVE_POOL_ADDRESSES_PROVIDER =
  '0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A'

// ======================================================
// Sepolia USDC
//
// IMPORTANT:
// This is the USDC underlying used by Aave V3 Sepolia.
// It is NOT Circle's standalone Sepolia USDC address.
// ======================================================

export const USDC_ADDRESS =
  '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'

// ======================================================
// Circle Sepolia USDC
//
// This is the standalone Circle USDC shown by MetaMask.
// It is NOT the Aave V3 Sepolia USDC used by the
// flash-loan arbitrage system.
// ======================================================

export const CIRCLE_USDC_ADDRESS =
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

// ======================================================
// Sepolia WETH
//
// This is the WETH used by the arbitrage route.
// ======================================================

export const WETH_ADDRESS =
  '0xfff9976782d46cc05630d1f6ebab18b2324d6b14'

// ======================================================
// Aave Sepolia Reserve WETH
//
// IMPORTANT:
// This is different from WETH_ADDRESS above.
// Do not substitute one for the other.
// ======================================================

export const AAVE_WETH_ADDRESS =
  '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c'

// ======================================================
// Uniswap V3
// ======================================================

// Uniswap V3 SwapRouter02
export const UNISWAP_V3_ROUTER_ADDRESS =
  '0x3bFA4769FB09eefC5A80d6E87c3B9C650f7Ae48E'

// Uniswap V3 Quoter V2
export const UNISWAP_V3_QUOTER_V2_ADDRESS =
  '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3'

// Uniswap V3 Factory
export const UNISWAP_V3_FACTORY_ADDRESS =
  '0x0227628f3F023bb0B980b67D528571c95c6DaC1c'

// ======================================================
// V2-Compatible Router
// ======================================================

// V2-compatible / SushiSwap router used by the Executor
export const V2_ROUTER_ADDRESS =
  '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008'

// ======================================================
// Token Decimals
// ======================================================

export const USDC_DECIMALS = 6

export const WETH_DECIMALS = 18