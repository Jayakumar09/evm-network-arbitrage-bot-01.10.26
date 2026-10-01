// ======================================================
// Contract Page
// Executor Contract Status
// Ethereum Sepolia
// ======================================================

import { useEffect, useState } from 'react'

import {
  EXECUTOR_CONTRACT_ADDRESS,
  NETWORK_NAME,
} from '../config/contracts'

import {
  emergencyPauseExecutor,
  emergencyUnpauseExecutor,
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
  transferExecutorOwnership,
} from '../services/blockchain'


// ======================================================
// Contract Page
// ======================================================

function ContractPage() {

  // ====================================================
  // Wallet State
  // ====================================================

  const [
    connectedWallet,
    setConnectedWallet,
  ] = useState<string | null>(null)

  const [
    contractOwner,
    setContractOwner,
  ] = useState('')

  const [
    isOwner,
    setIsOwner,
  ] = useState(false)

  const [
    isPaused,
    setIsPaused,
  ] = useState(false)

  const [
    isConnected,
    setIsConnected,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)


  // ====================================================
  // Owner Controls
  // ====================================================

  const [
    ownerActionLoading,
    setOwnerActionLoading,
  ] = useState(false)

  const [
    ownerActionMessage,
    setOwnerActionMessage,
  ] = useState('')

  const [
    ownerActionError,
    setOwnerActionError,
  ] = useState('')

  const [
    newOwnerAddress,
    setNewOwnerAddress,
  ] = useState('')


  // ====================================================
  // Contract Balances
  // ====================================================

  const [
    ethBalance,
    setEthBalance,
  ] = useState('0.000000')

  const [
    usdcBalance,
    setUsdcBalance,
  ] = useState('0.00')

  const [
    wethBalance,
    setWethBalance,
  ] = useState('0.000000')


  // ====================================================
  // Wallet Balances
  // ====================================================

  const [
    walletEthBalance,
    setWalletEthBalance,
  ] = useState('0.000000')

  const [
    walletUsdcBalance,
    setWalletUsdcBalance,
  ] = useState('0.00')

  const [
    walletCircleUsdcBalance,
    setWalletCircleUsdcBalance,
  ] = useState('0.00')

  const [
    walletWethBalance,
    setWalletWethBalance,
  ] = useState('0.000000')


  // ====================================================
  // Format Address
  // ====================================================

  function formatAddress(
    address: string | null,
  ): string {

    if (!address) {
      return 'Not connected'
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }


  // ====================================================
  // Load Contract Data
  // ====================================================

  useEffect(() => {

    let mounted = true



    async function loadContractData(
      showLoading: boolean = false,
    ) {









      try {

        if (!mounted) {
          return
        }


        if (showLoading) {
          setLoading(true)
        }


        // ------------------------------------------------
        // Connected wallet
        // ------------------------------------------------



        const wallet =
          await getConnectedWalletAddress()





        if (!mounted) {
          return
        }


        setConnectedWallet(wallet)

        setIsConnected(
          wallet !== null,
        )


        // ------------------------------------------------
        // Contract owner
        // ------------------------------------------------



        const owner =
          await getExecutorOwner()





        if (!mounted) {
          return
        }


        setContractOwner(owner)


        // ------------------------------------------------
        // Owner authorization
        // ------------------------------------------------

        const ownerStatus =
          wallet !== null &&
          wallet.toLowerCase() ===
            owner.toLowerCase()





        setIsOwner(
          ownerStatus,
        )


        // ------------------------------------------------
        // Paused status
        // ------------------------------------------------



        const paused =
          await getExecutorPaused()





        if (!mounted) {
          return
        }


        setIsPaused(
          paused,
        )


        // ------------------------------------------------
        // No wallet
        // ------------------------------------------------

        if (!wallet) {



          setEthBalance('0.000000')
          setUsdcBalance('0.00')
          setWethBalance('0.000000')

          setWalletEthBalance('0.000000')
          setWalletUsdcBalance('0.00')
          setWalletCircleUsdcBalance('0.00')
          setWalletWethBalance('0.000000')

          return
        }


        // ------------------------------------------------
        // Read all balances
        // ------------------------------------------------




        const [
          eth,
          usdc,
          weth,
          walletEth,
          walletUsdc,
          walletCircleUsdc,
          walletWeth,
        ] = await Promise.all([

          // Executor
          getExecutorETHBalance(),
          getExecutorUSDCBalance(),
          getExecutorWETHBalance(),

          // Connected wallet
          getWalletETHBalance(),
          getWalletUSDCBalance(),
          getWalletCircleUSDCBalance(),
          getWalletWETHBalance(),

        ])


        if (!mounted) {
          return
        }


        // ------------------------------------------------
        // Debug raw values
        // ------------------------------------------------




        // ------------------------------------------------
        // Executor balances
        // ------------------------------------------------

        setEthBalance(
          Number(eth).toFixed(6),
        )

        setUsdcBalance(
          Number(usdc).toFixed(2),
        )

        setWethBalance(
          Number(weth).toFixed(6),
        )


        // ------------------------------------------------
        // Wallet balances
        // ------------------------------------------------

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




      } catch (error) {

        console.error(
          '[CONTRACT DEBUG] Failed to load contract data:',
          error,
        )


        if (!mounted) {
          return
        }


        setConnectedWallet(null)
        setIsConnected(false)
        setIsOwner(false)

        setWalletEthBalance('0.000000')
        setWalletUsdcBalance('0.00')
        setWalletCircleUsdcBalance('0.00')
        setWalletWethBalance('0.000000')

      } finally {
        if (
          mounted &&
          showLoading
        ) {
          setLoading(false)
        }
      }
    }


    // ==================================================
    // Initial load
    // ==================================================



    loadContractData(true)


    // ==================================================
    // Automatic refresh
    //
    // Keep the existing 5-second refresh behavior.
    // ==================================================

    const refreshInterval =
      window.setInterval(
        () => {

          loadContractData()

        },
        5000,
      )


    // ==================================================
    // MetaMask
    // ==================================================

    const ethereum =
      window.ethereum


    if (!ethereum) {

      console.warn(
        '[CONTRACT DEBUG] MetaMask / window.ethereum not available.',
      )


      return () => {

        mounted = false

        window.clearInterval(
          refreshInterval,
        )
      }
    }


    // --------------------------------------------------
    // Account changed
    // --------------------------------------------------

    const handleAccountsChanged =
      () => {

        console.log(
          '[CONTRACT DEBUG] MetaMask account changed.',
        )

        loadContractData()
      }


    // --------------------------------------------------
    // Chain changed
    // --------------------------------------------------

    const handleChainChanged =
      () => {

        console.log(
          '[CONTRACT DEBUG] MetaMask network changed.',
        )

        loadContractData()
      }


    // --------------------------------------------------
    // Window focus
    // --------------------------------------------------

    const handleWindowFocus =
      () => {

        console.log(
          '[CONTRACT DEBUG] Browser window focused - refreshing.',
        )

        loadContractData()
      }


    // --------------------------------------------------
    // Page visible
    // --------------------------------------------------

    const handleVisibilityChange =
      () => {

        if (
          document.visibilityState ===
          'visible'
        ) {



          loadContractData()
        }
      }


    // ==================================================
    // Register listeners
    // ==================================================

    ethereum.on(
      'accountsChanged',
      handleAccountsChanged,
    )

    ethereum.on(
      'chainChanged',
      handleChainChanged,
    )

    window.addEventListener(
      'focus',
      handleWindowFocus,
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )


    // ==================================================
    // Cleanup
    // ==================================================

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

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }

  }, [])


  // ====================================================
  // Pause Executor
  // ====================================================

  async function handlePauseExecutor() {

    if (
      !isOwner ||
      ownerActionLoading
    ) {
      return
    }


    try {

      setOwnerActionLoading(true)
      setOwnerActionMessage('')
      setOwnerActionError('')


      console.log(
        '[CONTRACT DEBUG] Starting Executor pause...',
      )


      const transactionHash =
        await emergencyPauseExecutor()


      console.log(
        '[CONTRACT DEBUG] Executor pause confirmed:',
        transactionHash,
      )


      const paused =
        await getExecutorPaused()


      console.log(
        '[CONTRACT DEBUG] Executor paused state after transaction:',
        paused,
      )


      setIsPaused(
        paused,
      )


      setOwnerActionMessage(
        `Contract paused successfully. Transaction: ${transactionHash}`,
      )

    } catch (error) {

      console.error(
        '[CONTRACT DEBUG] Failed to pause Executor:',
        error,
      )


      setOwnerActionError(
        error instanceof Error
          ? error.message
          : 'Failed to pause contract.',
      )

    } finally {

      setOwnerActionLoading(false)
    }
  }


  // ====================================================
  // Unpause Executor
  // ====================================================

  async function handleUnpauseExecutor() {

    if (
      !isOwner ||
      ownerActionLoading
    ) {
      return
    }


    try {

      setOwnerActionLoading(true)
      setOwnerActionMessage('')
      setOwnerActionError('')


      console.log(
        '[CONTRACT DEBUG] Starting Executor unpause...',
      )


      const transactionHash =
        await emergencyUnpauseExecutor()


      console.log(
        '[CONTRACT DEBUG] Executor unpause confirmed:',
        transactionHash,
      )


      const paused =
        await getExecutorPaused()


      console.log(
        '[CONTRACT DEBUG] Executor paused state after transaction:',
        paused,
      )


      setIsPaused(
        paused,
      )


      setOwnerActionMessage(
        `Contract unpaused successfully. Transaction: ${transactionHash}`,
      )

    } catch (error) {

      console.error(
        '[CONTRACT DEBUG] Failed to unpause Executor:',
        error,
      )


      setOwnerActionError(
        error instanceof Error
          ? error.message
          : 'Failed to unpause contract.',
      )

    } finally {

      setOwnerActionLoading(false)
    }
  }


  // ====================================================
  // Transfer Ownership
  // ====================================================

  async function handleTransferOwnership() {

    if (
      !isOwner ||
      ownerActionLoading
    ) {
      return
    }


    const targetAddress =
      newOwnerAddress.trim()


    if (!targetAddress) {

      setOwnerActionError(
        'Enter a new owner address.',
      )

      return
    }


    if (
      !/^0x[a-fA-F0-9]{40}$/.test(
        targetAddress,
      )
    ) {

      setOwnerActionError(
        'Enter a valid Ethereum address.',
      )

      return
    }


    try {

      setOwnerActionLoading(true)
      setOwnerActionMessage('')
      setOwnerActionError('')


      console.log(
        '[CONTRACT DEBUG] Starting ownership transfer:',
        targetAddress,
      )


      const transactionHash =
        await transferExecutorOwnership(
          targetAddress,
        )


      console.log(
        '[CONTRACT DEBUG] Ownership transfer confirmed:',
        transactionHash,
      )


      // ------------------------------------------------
      // Re-read actual owner from blockchain
      // ------------------------------------------------

      const owner =
        await getExecutorOwner()


      const wallet =
        await getConnectedWalletAddress()


      setContractOwner(
        owner,
      )

      setConnectedWallet(
        wallet,
      )

      setIsConnected(
        wallet !== null,
      )

      setIsOwner(
        wallet !== null &&
        wallet.toLowerCase() ===
          owner.toLowerCase(),
      )


      setNewOwnerAddress('')


      setOwnerActionMessage(
        `Ownership transferred successfully. Transaction: ${transactionHash}`,
      )

    } catch (error) {

      console.error(
        '[CONTRACT DEBUG] Failed to transfer ownership:',
        error,
      )


      setOwnerActionError(
        error instanceof Error
          ? error.message
          : 'Failed to transfer ownership.',
      )

    } finally {

      setOwnerActionLoading(false)
    }
  }


  // ====================================================
  // Render
  // ====================================================

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* ==================================================
          Page Header
          ================================================== */}

      <div className="mb-8">

        <p className="mb-2 text-sm font-medium text-emerald-400">
          FLASH LOAN ARBITRAGE
        </p>


        <div className="flex items-center justify-between gap-4">

          <div>

            <h1 className="text-4xl font-bold text-white">
              Executor Contract
            </h1>

            <p className="mt-3 text-slate-400">
              View executor contract status, network,
              balances, and operational information.
            </p>

          </div>


          <span
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              isPaused
                ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            }`}
          >

            <span
              className={`h-2 w-2 rounded-full ${
                isPaused
                  ? 'bg-red-400'
                  : 'bg-emerald-400'
              }`}
            />

            {loading
              ? 'CHECKING...'
              : isPaused
                ? 'PAUSED'
                : 'ACTIVE'}

          </span>

        </div>

      </div>


      {/* ==================================================
          Contract Information
          ================================================== */}

      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-6">

        <h2 className="mb-5 text-lg font-semibold text-white">
          Contract Information
        </h2>


        <div className="grid gap-4 md:grid-cols-2">

          {/* Contract Address */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Contract Address
            </p>

            <p className="mt-2 break-all font-mono text-sm text-white">
              {EXECUTOR_CONTRACT_ADDRESS}
            </p>

          </div>


          {/* Network */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Network
            </p>

            <p className="mt-2 text-sm font-semibold text-white">
              {NETWORK_NAME}
            </p>

          </div>


          {/* Contract Status */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
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
                ? 'Checking...'
                : isPaused
                  ? 'Paused'
                  : 'Active'}
            </p>

          </div>


          {/* Execution Mode */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Execution Mode
            </p>

            <p className="mt-2 text-sm font-semibold text-amber-400">
              Mock Execution
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          Wallet & Ownership
          ================================================== */}

      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-6">

        <h2 className="mb-5 text-lg font-semibold text-white">
          Wallet & Ownership
        </h2>


        <div className="space-y-4">

          {/* Connected Wallet */}

          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-4">

            <span className="text-sm text-white">
              Connected Wallet
            </span>

            <span className="break-all font-mono text-sm font-semibold text-slate-300">
              {loading
                ? 'Checking...'
                : formatAddress(connectedWallet)}
            </span>

          </div>


          {/* Contract Owner */}

          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-4">

            <span className="text-sm text-white">
              Contract Owner
            </span>

            <span className="break-all font-mono text-sm font-semibold text-slate-300">
              {loading
                ? 'Checking...'
                : formatAddress(contractOwner)}
            </span>

          </div>


          {/* Authorization */}

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-4">

            <span className="text-sm text-white">
              Owner Authorization
            </span>

            <span
              className={`text-sm font-semibold ${
                isOwner
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {loading
                ? 'CHECKING...'
                : isOwner
                  ? 'OWNER'
                  : 'NOT OWNER'}
            </span>

          </div>

        </div>

      </section>


      {/* ==================================================
          Owner Controls
          ================================================== */}

      <section className="mb-6 rounded-xl border border-amber-500/20 bg-slate-950/60 p-6">

        <div className="mb-5 flex items-center justify-between gap-4">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Owner Controls
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Emergency controls and ownership management
              for the Executor contract.
            </p>

          </div>


          <span
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              isOwner
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {loading
              ? 'CHECKING...'
              : isOwner
                ? 'OWNER'
                : 'READ ONLY'}
          </span>

        </div>


        {!isConnected && (

          <div className="mb-5 rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
            Connect the Executor owner wallet to use
            owner controls.
          </div>

        )}


        {isConnected && !isOwner && (

          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            Connected wallet is not the Executor owner.
            Owner controls are read-only.
          </div>

        )}


        {/* Pause / Unpause */}

        <div className="grid gap-4 md:grid-cols-2">

          <button
            type="button"
            onClick={handlePauseExecutor}
            disabled={
              !isOwner ||
              ownerActionLoading ||
              isPaused
            }
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ownerActionLoading
              ? 'Processing...'
              : isPaused
                ? 'Contract Already Paused'
                : 'Pause Contract'}
          </button>


          <button
            type="button"
            onClick={handleUnpauseExecutor}
            disabled={
              !isOwner ||
              ownerActionLoading ||
              !isPaused
            }
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ownerActionLoading
              ? 'Processing...'
              : !isPaused
                ? 'Contract Already Active'
                : 'Unpause Contract'}
          </button>

        </div>


        {/* Transfer Ownership */}

        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/40 p-5">

          <p className="text-xs uppercase tracking-wide text-slate-400">
            Transfer Ownership
          </p>


          <p className="mt-2 text-sm text-slate-400">
            Transfer Executor ownership to another Ethereum
            address. The current connected wallet must remain
            the owner to perform this action.
          </p>


          <div className="mt-3 flex flex-col gap-3 md:flex-row">

            <input
              type="text"
              value={newOwnerAddress}
              onChange={(event) => {

                setNewOwnerAddress(
                  event.target.value,
                )

                if (ownerActionError) {
                  setOwnerActionError('')
                }

              }}
              disabled={
                !isOwner ||
                ownerActionLoading
              }
              placeholder="0x..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-40"
            />


            <button
              type="button"
              onClick={handleTransferOwnership}
              disabled={
                !isOwner ||
                ownerActionLoading ||
                !newOwnerAddress.trim()
              }
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ownerActionLoading
                ? 'Processing...'
                : 'Transfer Ownership'}
            </button>

          </div>

        </div>


        {/* Success Message */}

        {ownerActionMessage && (

          <div className="mt-4 break-all rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
            {ownerActionMessage}
          </div>

        )}


        {/* Error Message */}

        {ownerActionError && (

          <div className="mt-4 break-all rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {ownerActionError}
          </div>

        )}

      </section>


      {/* ==================================================
          Wallet Balances
          ================================================== */}

      <section className="mb-6 rounded-xl border border-emerald-500/20 bg-slate-950/60 p-6">

        <h2 className="mb-5 text-lg font-semibold text-white">
          Wallet Balances
        </h2>


        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          {/* ETH */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Wallet ETH
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${walletEthBalance} ETH`}
            </p>

          </div>


          {/* Aave / Project USDC */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Aave USDC
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${walletUsdcBalance} USDC`}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Arbitrage USDC
            </p>

          </div>


          {/* Circle USDC */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Circle USDC
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${walletCircleUsdcBalance} USDC`}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              MetaMask USDC
            </p>

          </div>


          {/* WETH */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              Wallet WETH
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${walletWethBalance} WETH`}
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          Contract Balances
          ================================================== */}

      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-6">

        <div className="flex items-center justify-between gap-4">

          <h2 className="text-lg font-semibold text-white">
            Contract Balances
          </h2>

          <span className="text-xs text-slate-500">
            Auto-refresh: 5s
          </span>

        </div>


        <div className="mt-5 grid gap-4 md:grid-cols-3">

          {/* ETH */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              ETH Balance
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${ethBalance} ETH`}
            </p>

          </div>


          {/* USDC */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              USDC Balance
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${usdcBalance} USDC`}
            </p>

          </div>


          {/* WETH */}

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-400">
              WETH Balance
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {loading
                ? 'Loading...'
                : `${wethBalance} WETH`}
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          Operational Status
          ================================================== */}

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-6">

        <h2 className="mb-5 text-lg font-semibold text-white">
          Operational Status
        </h2>


        <div className="space-y-4">

          {/* Contract Paused */}

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-4">

            <span className="text-sm text-white">
              Contract Paused
            </span>

            <span
              className={`text-sm font-semibold ${
                isPaused
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {loading
                ? 'CHECKING...'
                : isPaused
                  ? 'YES'
                  : 'NO'}
            </span>

          </div>


          {/* Flash Loan Execution */}

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-4">

            <span className="text-sm text-white">
              Flash Loan Execution
            </span>

            <span className="text-sm font-semibold text-amber-400">
              MOCK
            </span>

          </div>


          {/* Blockchain Connection */}

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-4">

            <span className="text-sm text-white">
              Blockchain Connection
            </span>

            <span
              className={`text-sm font-semibold ${
                isConnected
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {loading
                ? 'CHECKING...'
                : isConnected
                  ? 'CONNECTED'
                  : 'NOT CONNECTED'}
            </span>

          </div>

        </div>

      </section>

    </main>
  )
}


// ======================================================
// Export
// ======================================================

export default ContractPage