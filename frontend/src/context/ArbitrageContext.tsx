import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { getConnectedWalletAddress } from '../services/blockchain'

import type {
  ArbitrageOpportunity,
} from '../types/arbitrage'

interface ArbitrageContextValue {
  opportunity: ArbitrageOpportunity | null

  setOpportunity: (
    opportunity: ArbitrageOpportunity | null,
  ) => void

  clearOpportunity: () => void

  walletAddress: string | null

  walletConnected: boolean

  refreshWallet: () => Promise<void>
}

const ArbitrageContext =
  createContext<ArbitrageContextValue | undefined>(
    undefined,
  )

interface ArbitrageProviderProps {
  children: ReactNode
}

export function ArbitrageProvider({
  children,
}: ArbitrageProviderProps) {
  const [opportunity, setOpportunity] =
    useState<ArbitrageOpportunity | null>(null)

  const [walletAddress, setWalletAddress] =
    useState<string | null>(null)

  const [walletConnected, setWalletConnected] =
    useState(false)

  const clearOpportunity = () => {
    setOpportunity(null)
  }

  const refreshWallet = async () => {
    const address =
      await getConnectedWalletAddress()

    setWalletAddress(address)
    setWalletConnected(address !== null)
  }

  useEffect(() => {
    const handleWalletDisconnected = () => {
      setWalletAddress(null)
      setWalletConnected(false)
    }

    window.addEventListener(
      'walletDisconnected',
      handleWalletDisconnected,
    )

    return () => {
      window.removeEventListener(
        'walletDisconnected',
        handleWalletDisconnected,
      )
    }
  }, [])

  return (
    <ArbitrageContext.Provider
      value={{
        opportunity,
        setOpportunity,
        clearOpportunity,
        walletAddress,
        walletConnected,
        refreshWallet,
      }}
    >
      {children}
    </ArbitrageContext.Provider>
  )
}

export function useArbitrage() {
  const context = useContext(ArbitrageContext)

  if (!context) {
    throw new Error(
      'useArbitrage must be used inside ArbitrageProvider',
    )
  }

  return context
}