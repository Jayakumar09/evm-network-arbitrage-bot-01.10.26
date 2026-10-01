import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import {
  diagnoseV2Router,
  diagnoseV2WethUsdcPair,
  diagnoseUniswapV3Pools,
} from './services/blockchain'

// ======================================================
// DEVELOPMENT DIAGNOSTICS
// Expose blockchain diagnostics to browser console
// ======================================================

if (import.meta.env.DEV) {
  ;(window as any).diagnoseV2Router =
    diagnoseV2Router

  ;(window as any).diagnoseV2WethUsdcPair =
    diagnoseV2WethUsdcPair

  ;(window as any).diagnoseUniswapV3Pools =
    diagnoseUniswapV3Pools
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)