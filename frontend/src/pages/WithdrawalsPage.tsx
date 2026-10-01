// ======================================================
// Withdrawals Page
// Executor Asset Recovery
// Ethereum Sepolia
// ======================================================

import { useEffect, useState } from 'react'

import {
  USDC_ADDRESS,
  WETH_ADDRESS,
} from '../config/contracts'

import {
  getConnectedWalletAddress,
  getExecutorETHBalance,
  getExecutorOwner,
  getExecutorPaused,
  getExecutorUSDCBalance,
  getExecutorWETHBalance,
  getWalletETHBalance,
  getWalletUSDCBalance,
  getWalletCircleUSDCBalance,
  getWalletWETHBalance,
  withdrawExecutorETH,
  withdrawExecutorToken,
  withdrawExecutorWETHAsETH,
} from '../services/blockchain'

import {
  saveTransaction,
} from '../services/transactionHistory'


// ======================================================
// Withdrawals Page
// ======================================================

function WithdrawalsPage() {

  // ====================================================
  // Access State
  // ====================================================

  const [
    connectedWallet,
    setConnectedWallet,
  ] = useState<string | null>(null)

  const [
    isOwner,
    setIsOwner,
  ] = useState(false)

  const [
    isPaused,
    setIsPaused,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)


  // ====================================================
  // Balance State
  // ====================================================

  const [
    executorEthBalance,
    setExecutorEthBalance,
  ] = useState('0.000000')

  const [
    executorUsdcBalance,
    setExecutorUsdcBalance,
  ] = useState('0.00')

  const [
    walletCircleUsdcBalance,
    setWalletCircleUsdcBalance,
  ] = useState('0.00')

  const [
    executorWethBalance,
    setExecutorWethBalance,
  ] = useState('0.000000')

  const [
    walletEthBalance,
    setWalletEthBalance,
  ] = useState('0.000000')

  const [
    walletUsdcBalance,
    setWalletUsdcBalance,
  ] = useState('0.00')

  const [
    walletWethBalance,
    setWalletWethBalance,
  ] = useState('0.000000')


  // ====================================================
  // Action State
  // ====================================================

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false)

  const [
    actionMessage,
    setActionMessage,
  ] = useState('')

  const [
    actionError,
    setActionError,
  ] = useState('')


  // ====================================================
  // Load Balances / Access
  // ====================================================

  useEffect(() => {

    let mounted = true
    let refreshInProgress = false

    async function refresh(
      source = 'UNKNOWN',
      showLoading = false,
    ) {

      if (refreshInProgress) {
        console.log(
          '[WITHDRAW DEBUG] Refresh skipped - previous refresh still running.',
        )

        return
      }

      refreshInProgress = true

      console.log(
        '====================================================',
      )

      console.log(
        `[WITHDRAW DEBUG] Refresh START - source: ${source}`,
      )

      try {

        if (!mounted) {
          return
        }

        if (showLoading) {
          setLoading(true)
        }


        // ------------------------------------------------
        // Wallet / owner / paused status
        // ------------------------------------------------

        const [
          wallet,
          owner,
          paused,
        ] = await Promise.all([
          getConnectedWalletAddress(),
          getExecutorOwner(),
          getExecutorPaused(),
        ])


        if (!mounted) {
              return
            }

            setConnectedWallet(wallet)
            setIsPaused(paused)

            setIsOwner(
              wallet !== null &&
              wallet.toLowerCase() ===
                owner.toLowerCase(),
            )


        if (!wallet) {

          setExecutorEthBalance('0.000000')
          setExecutorUsdcBalance('0.00')
          setExecutorWethBalance('0.000000')

          setWalletEthBalance('0.000000')
          setWalletUsdcBalance('0.00')
          setWalletCircleUsdcBalance('0.00')
          setWalletWethBalance('0.000000')

          return
        }


        // ------------------------------------------------
        // Read Executor + wallet balances
        // ------------------------------------------------

        const [
          executorEth,
          executorUsdc,          
          executorWeth,
          walletEth,
          walletUsdc,
          walletCircleUsdc,
          walletWeth,
        ] = await Promise.all([
          getExecutorETHBalance(),
          getExecutorUSDCBalance(),
          getExecutorWETHBalance(),
          getWalletETHBalance(),
          getWalletUSDCBalance(),
          getWalletCircleUSDCBalance(),
          getWalletWETHBalance(),
        ])


        if (!mounted) {
          return
        }


        setExecutorEthBalance(
          Number(executorEth).toFixed(6),
        )

        setExecutorUsdcBalance(
          Number(executorUsdc).toFixed(2),
        )

        setExecutorWethBalance(
          Number(executorWeth).toFixed(6),
        )

        setWalletEthBalance(
          Number(walletEth).toFixed(6),
        )

        setWalletUsdcBalance(
          Number(walletUsdc).toFixed(2),
        )

        setWalletCircleUsdcBalance(
          Number(walletCircleUsdc).toFixed(2),
        )

        setWalletWethBalance(
          Number(walletWeth).toFixed(6),
        )

        console.log(
          '[WITHDRAW DEBUG] Balances refreshed.',
        )

      } catch (error) {

        console.error(
          '[WITHDRAW DEBUG] Refresh failed:',
          error,
        )

      } finally {

        refreshInProgress = false

        if (
          mounted &&
          showLoading
        ) {
          setLoading(false)
        }

        console.log(
          `[WITHDRAW DEBUG] Refresh END - source: ${source}`,
        )
      }
    }


    refresh(
      'INITIAL_LOAD',
      true,
    )


    // --------------------------------------------------
    // Automatic refresh every 5 seconds
    // --------------------------------------------------

    const refreshInterval =
      window.setInterval(
        () => {
          refresh('AUTO_REFRESH')
        },
        5000,
      )


    // --------------------------------------------------
    // MetaMask events
    // --------------------------------------------------

    const ethereum =
      window.ethereum

    if (!ethereum) {

      return () => {

        mounted = false

        window.clearInterval(
          refreshInterval,
        )
      }
    }


    const handleAccountsChanged =
      () => {
        refresh(
          'METAMASK_ACCOUNT_CHANGED',
        )
      }


    const handleChainChanged =
      () => {
        refresh(
          'METAMASK_CHAIN_CHANGED',
        )
      }


    ethereum.on(
      'accountsChanged',
      handleAccountsChanged,
    )

    ethereum.on(
      'chainChanged',
      handleChainChanged,
    )


    const handleWindowFocus =
      () => {
        refresh('WINDOW_FOCUS')
      }


    window.addEventListener(
      'focus',
      handleWindowFocus,
    )


    return () => {

      mounted = false

      window.clearInterval(
        refreshInterval,
      )

      ethereum.removeListener(
        'accountsChanged',
        handleAccountsChanged,
      )

      ethereum.removeListener(
        'chainChanged',
        handleChainChanged,
      )

      window.removeEventListener(
        'focus',
        handleWindowFocus,
      )
    }

  }, [])


  // ====================================================
  // Withdraw Executor ETH
  // ====================================================

  async function handleWithdrawETH() {

    if (
      !isOwner ||
      !connectedWallet ||
      isPaused ||
      actionLoading
    ) {
      return
    }

    try {

      setActionLoading(true)
      setActionMessage('')
      setActionError('')


      const amount =
        await getExecutorETHBalance()


      if (
        Number(amount) <= 0
      ) {
        setActionError(
          'Executor ETH balance is zero. Nothing to withdraw.',
        )

        return
      }


      console.log(
        '[WITHDRAW DEBUG] ETH withdrawal amount:',
        amount,
      )


      const transactionHash =
        await withdrawExecutorETH(
          connectedWallet,
        )


      saveTransaction({
        hash: transactionHash,
        status: 'SUCCESS',
        type: 'ETH_WITHDRAWAL',
        pair: 'Executor ETH → Owner',
        amount:
          `${Number(amount).toFixed(6)} ETH`,
        grossProfit: '—',
        netProfit: '—',
        gas: '—',
        time: new Date().toLocaleString(),
      })


      setActionMessage(
        `Executor ETH withdrawn successfully. Transaction: ${transactionHash}`,
      )


      await refreshPageBalances()

    } catch (error) {

      console.error(
        '[WITHDRAW ERROR] ETH withdrawal failed:',
        error,
      )

      setActionError(
        error instanceof Error
          ? error.message
          : 'Failed to withdraw Executor ETH.',
      )

    } finally {

      setActionLoading(false)
    }
  }


  // ====================================================
  // Withdraw Executor USDC / WETH
  // ====================================================

  async function handleWithdrawToken(
    token: 'USDC' | 'WETH',
  ) {

    if (
      !isOwner ||
      !connectedWallet ||
      isPaused ||
      actionLoading
    ) {
      return
    }

    try {

      setActionLoading(true)
      setActionMessage('')
      setActionError('')


      const tokenAddress =
        token === 'USDC'
          ? USDC_ADDRESS
          : WETH_ADDRESS


      const amount =
        token === 'USDC'
          ? await getExecutorUSDCBalance()
          : await getExecutorWETHBalance()


      if (
        Number(amount) <= 0
      ) {
        setActionError(
          `Executor ${token} balance is zero. Nothing to withdraw.`,
        )

        return
      }


      console.log(
        '[WITHDRAW DEBUG] Token:',
        token,
      )

      console.log(
        '[WITHDRAW DEBUG] Token amount:',
        amount,
      )


      const transactionHash =
        await withdrawExecutorToken(
          tokenAddress,
          connectedWallet,
        )


      setActionMessage(
        `Executor ${token} withdrawn successfully. Transaction: ${transactionHash}`,
      )


      await refreshPageBalances()

    } catch (error) {

      console.error(
        `[WITHDRAW ERROR] ${token} withdrawal failed:`,
        error,
      )

      setActionError(
        error instanceof Error
          ? error.message
          : `Failed to withdraw Executor ${token}.`,
      )

    } finally {

      setActionLoading(false)
    }
  }


  // ====================================================
  // Convert WETH → ETH
  // ====================================================

  async function handleConvertWETHToETH() {

    if (
      !isOwner ||
      !connectedWallet ||
      isPaused ||
      actionLoading
    ) {
      return
    }

    try {

      setActionLoading(true)
      setActionMessage('')
      setActionError('')


      const wethAmount =
        await getExecutorWETHBalance()


      console.log(
        '[WITHDRAW DEBUG] WETH → ETH amount:',
        wethAmount,
      )


      // ------------------------------------------------
      // Safety threshold requested for this project
      // ------------------------------------------------

      if (
        Number(wethAmount) < 0.01
      ) {
        setActionError(
          'Minimum 0.01 WETH is required for WETH → ETH conversion.',
        )

        return
      }


      const transactionHash =
        await withdrawExecutorWETHAsETH()


      setActionMessage(
        `WETH → ETH conversion completed successfully. Transaction: ${transactionHash}`,
      )


      await refreshPageBalances()

    } catch (error) {

      console.error(
        '[WITHDRAW ERROR] WETH → ETH conversion failed:',
        error,
      )

      setActionError(
        error instanceof Error
          ? error.message
          : 'Failed to convert Executor WETH → ETH.',
      )

    } finally {

      setActionLoading(false)
    }
  }


  // ====================================================
  // Refresh After Action
  // ====================================================

  async function refreshPageBalances() {

    try {

      const [
        executorEth,
        executorUsdc,
        executorWeth,
        walletEth,
        walletUsdc,
        walletWeth,
      ] = await Promise.all([
        getExecutorETHBalance(),
        getExecutorUSDCBalance(),
        getExecutorWETHBalance(),
        getWalletETHBalance(),
        getWalletUSDCBalance(),
        getWalletWETHBalance(),
      ])


      setExecutorEthBalance(
        Number(executorEth).toFixed(6),
      )

      setExecutorUsdcBalance(
        Number(executorUsdc).toFixed(2),
      )

      setExecutorWethBalance(
        Number(executorWeth).toFixed(6),
      )

      setWalletEthBalance(
        Number(walletEth).toFixed(6),
      )

      setWalletUsdcBalance(
        Number(walletUsdc).toFixed(2),
      )

      setWalletWethBalance(
        Number(walletWeth).toFixed(6),
      )

    } catch (error) {

      console.error(
        '[WITHDRAW DEBUG] Failed to refresh balances after action:',
        error,
      )
    }
  }


  // ====================================================
  // Render
  // ====================================================

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* ==================================================
          Header
          ================================================== */}

      <section>

        <p className="text-sm font-medium text-emerald-400">
          FLASH LOAN ARBITRAGE
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Withdrawals
        </h1>

        <p className="mt-3 max-w-3xl text-slate-400">
          Withdraw Executor assets to the connected owner wallet
          or convert Executor WETH into native ETH.
        </p>

      </section>


      {/* ==================================================
          Access Status
          ================================================== */}

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Connected Wallet
            </p>

            <p className="mt-2 truncate font-mono text-sm text-white">
              {loading
                ? 'Loading...'
                : connectedWallet
                  ? connectedWallet
                  : 'Not connected'}
            </p>

          </div>


          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Owner Authorization
            </p>

            <p
              className={`mt-2 text-sm font-semibold ${
                isOwner
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {loading
                ? 'CHECKING...'
                : isOwner
                  ? 'OWNER'
                  : 'READ ONLY'}
            </p>

          </div>


          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Contract Status
            </p>

            <p
              className={`mt-2 text-sm font-semibold ${
                isPaused
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {loading
                ? 'CHECKING...'
                : isPaused
                  ? 'PAUSED'
                  : 'ACTIVE'}
            </p>

          </div>

        </div>


        {!connectedWallet && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
            Connect the Executor owner wallet to use withdrawals.
          </div>
        )}


        {connectedWallet && !isOwner && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            Connected wallet is not the Executor owner.
            Withdrawal controls are read-only.
          </div>
        )}


        {isPaused && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            Executor contract is currently paused.
            Withdrawals are disabled.
          </div>
        )}

      </section>


      {/* ==================================================
          Executor Balances
          ================================================== */}

      <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-slate-950/60 p-6">

        <h2 className="text-lg font-semibold text-white">
          Executor Balances
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Executor ETH
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${executorEthBalance} ETH`}
            </p>

          </div>


          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Executor USDC
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${executorUsdcBalance} USDC`}
            </p>

          </div>


          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Executor WETH
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${executorWethBalance} WETH`}
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          Withdrawal Actions
          ================================================== */}

      <section className="mt-6">

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ------------------------------------------------
              Withdraw ETH
              ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Withdraw Executor ETH
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Withdraw the entire native ETH balance of the
              Executor to the connected owner wallet.
            </p>

            <button
              type="button"
              onClick={handleWithdrawETH}
              disabled={
                !isOwner ||
                actionLoading ||
                isPaused ||
                !connectedWallet ||
                Number(executorEthBalance) <= 0
              }
              className="mt-5 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading
                ? 'Processing...'
                : isPaused
                  ? 'Contract Paused'
                  : Number(executorEthBalance) <= 0
                    ? 'No ETH Available'
                    : 'Withdraw All ETH to Owner Wallet'}
            </button>

          </div>


          {/* ------------------------------------------------
              Withdraw USDC
              ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Withdraw Executor USDC
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Withdraw the entire USDC balance of the Executor
              to the connected owner wallet.
            </p>

            <button
              type="button"
              onClick={() =>
                handleWithdrawToken('USDC')
              }
              disabled={
                !isOwner ||
                actionLoading ||
                isPaused ||
                !connectedWallet ||
                Number(executorUsdcBalance) <= 0
              }
              className="mt-5 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading
                ? 'Processing...'
                : isPaused
                  ? 'Contract Paused'
                  : Number(executorUsdcBalance) <= 0
                    ? 'No USDC Available'
                    : 'Withdraw All USDC to Owner Wallet'}
            </button>

          </div>


          {/* ------------------------------------------------
              Withdraw WETH
              ------------------------------------------------ */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Withdraw Executor WETH
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Withdraw the entire WETH balance of the Executor
              to the connected owner wallet.
            </p>

            <button
              type="button"
              onClick={() =>
                handleWithdrawToken('WETH')
              }
              disabled={
                !isOwner ||
                actionLoading ||
                isPaused ||
                !connectedWallet ||
                Number(executorWethBalance) <= 0
              }
              className="mt-5 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading
                ? 'Processing...'
                : isPaused
                  ? 'Contract Paused'
                  : Number(executorWethBalance) <= 0
                    ? 'No WETH Available'
                    : 'Withdraw All WETH to Owner Wallet'}
            </button>

          </div>


          {/* ------------------------------------------------
              WETH → ETH
              ------------------------------------------------ */}

          <div className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-6">

            <p className="text-xs uppercase tracking-wide text-amber-400">
              Convert Executor WETH → ETH
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Convert the entire WETH balance of the Executor
              into native ETH and send the resulting ETH to
              the connected owner wallet.
            </p>

            <p className="mt-3 text-xs font-medium text-amber-400">
              Safety threshold: minimum 0.01 WETH.
            </p>

            <button
              type="button"
              onClick={handleConvertWETHToETH}
              disabled={
                !isOwner ||
                actionLoading ||
                isPaused ||
                !connectedWallet ||
                Number(executorWethBalance) < 0.01
              }
              className="mt-5 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading
                ? 'Processing...'
                : isPaused
                  ? 'Contract Paused'
                  : Number(executorWethBalance) < 0.01
                    ? 'Minimum 0.01 WETH Required'
                    : 'Convert All WETH → ETH'}
            </button>

          </div>

        </div>

      </section>


      {/* ==================================================
          Wallet Balances
          ================================================== */}

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

        <h2 className="text-lg font-semibold text-white">
          Owner Wallet Balances
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Wallet ETH
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {walletEthBalance} ETH
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Aave USDC
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {walletUsdcBalance} USDC
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Arbitrage USDC
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Circle USDC
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {walletCircleUsdcBalance} USDC
            </p>
            <p className="mt-1 text-xs text-slate-500">
              MetaMask USDC
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Wallet WETH
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {walletWethBalance} WETH
            </p>
          </div>

        </div>

      </section>


      {/* ==================================================
          Result Message
          ================================================== */}

      {actionMessage && (
        <div className="mt-6 break-all rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          {actionMessage}
        </div>
      )}


      {actionError && (
        <div className="mt-6 break-all rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

    </main>
  )
}

export default WithdrawalsPage