import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getExecutorETHBalance,
  getExecutorUSDCBalance,
  getExecutorWETHBalance,
} from '../services/blockchain'

import type {
  TransactionHistoryItem,
} from '../services/transactionHistory'

function DashboardPage() {
  // ==================================================
  // Dashboard State
  // ==================================================

  const [transactions, setTransactions] = useState<
    TransactionHistoryItem[]
  >([])

  const [executorETH, setExecutorETH] =
    useState<string>('0')

  const [executorUSDC, setExecutorUSDC] =
    useState<string>('0')

  const [executorWETH, setExecutorWETH] =
    useState<string>('0')

  const [loading, setLoading] =
    useState<boolean>(true)

  const [refreshing, setRefreshing] =
    useState<boolean>(false)

  // ==================================================
  // Load Dashboard Data
  // ==================================================

  const loadDashboardData = useCallback(
    async () => {
      try {
        setRefreshing(true)

        // ----------------------------------------------
        // Transaction History
        // ----------------------------------------------

        // ----------------------------------------------
        // Arbitrage Transaction History
        // ----------------------------------------------

        const storedTransactionData =
          localStorage.getItem(
            'flashloan_arbitrage_transaction_history',
          )

        let storedTransactions: TransactionHistoryItem[] = []

        try {
          const parsedTransactions =
            JSON.parse(
              storedTransactionData || '[]',
            )

          if (
            Array.isArray(parsedTransactions)
          ) {
            storedTransactions =
              parsedTransactions as TransactionHistoryItem[]
          }
        } catch (storageError) {
          console.error(
            '[DASHBOARD] Failed to parse arbitrage transaction history:',
            storageError,
          )
        }

        setTransactions(
          storedTransactions,
        )

        // ----------------------------------------------
        // Executor Balances
        // ----------------------------------------------

        const [
          ethBalance,
          usdcBalance,
          wethBalance,
        ] = await Promise.all([
          getExecutorETHBalance(),
          getExecutorUSDCBalance(),
          getExecutorWETHBalance(),
        ])

        setExecutorETH(
          ethBalance ?? '0',
        )

        setExecutorUSDC(
          usdcBalance ?? '0',
        )

        setExecutorWETH(
          wethBalance ?? '0',
        )
      } catch (error) {
        console.error(
          '[DASHBOARD] Failed to load dashboard data:',
          error,
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [],
  )

  // ==================================================
  // Initial Load + Auto Refresh
  // ==================================================

  useEffect(() => {
    let mounted = true

    const load = async () => {
      if (!mounted) {
        return
      }

      await loadDashboardData()
    }

    void load()

    const interval = window.setInterval(
      () => {
        void load()
      },
      10000,
    )

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [loadDashboardData])

  // ==================================================
  // Refresh When Storage Changes
  // ==================================================

  useEffect(() => {
    const handleStorageChange = (
      event: StorageEvent,
    ) => {
      if (
        event.key ===
          'flashloan_arbitrage_transaction_history' ||
        event.key === null
      ) {
        void loadDashboardData()
      }
    }

    window.addEventListener(
      'storage',
      handleStorageChange,
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange,
      )
    }
  }, [loadDashboardData])

  // ==================================================
  // Dashboard Statistics
  // ==================================================

  const totalTransactions =
    transactions.length

  const successfulTransactions =
    transactions.filter(
      (transaction) =>
        transaction.status === 'SUCCESS',
    ).length

  const totalNetProfit =
    transactions.reduce(
      (total, transaction) => {
        const value =
          Number(
            String(
              transaction.netProfit ?? '0',
            ).replace('$', ''),
          )

        return total + (
          Number.isFinite(value)
            ? value
            : 0
        )
      },
      0,
    )

  const totalGrossProfit =
    transactions.reduce(
      (total, transaction) => {
        const value =
          Number(
            String(
              transaction.grossProfit ?? '0',
            ).replace('$', ''),
          )

        return total + (
          Number.isFinite(value)
            ? value
            : 0
        )
      },
      0,
    )

  const latestTransaction =
    transactions.length > 0
      ? transactions[0]
      : null

  // ==================================================
  // Render
  // ==================================================

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">

      {/* ==================================================
          Page Header
          ================================================== */}

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-sm font-medium text-emerald-400">
              FLASH LOAN ARBITRAGE
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Monitor live arbitrage execution,
              transaction performance, and Executor
              contract balances.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`h-2 w-2 rounded-full ${
                refreshing
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />

            {refreshing
              ? 'Refreshing...'
              : 'Live Sepolia'}
          </div>

        </div>
      </section>


      {/* ==================================================
          Performance Statistics
          ================================================== */}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Transactions */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

          <p className="text-xs uppercase tracking-wider text-slate-500">
            Total Transactions
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {loading
              ? '—'
              : totalTransactions}
          </p>

        </div>


        {/* Successful */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

          <p className="text-xs uppercase tracking-wider text-slate-500">
            Successful
          </p>

          <p className="mt-3 text-3xl font-bold text-emerald-400">
            {loading
              ? '—'
              : successfulTransactions}
          </p>

        </div>


        {/* Gross Profit */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

          <p className="text-xs uppercase tracking-wider text-slate-500">
            Total Gross Profit
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {loading
              ? '—'
              : `$${totalGrossProfit.toFixed(2)}`}
          </p>

        </div>


        {/* Net Profit */}

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

          <p className="text-xs uppercase tracking-wider text-slate-500">
            Total Net Profit
          </p>

          <p className="mt-3 text-3xl font-bold text-emerald-400">
            {loading
              ? '—'
              : `$${totalNetProfit.toFixed(2)}`}
          </p>

        </div>

      </section>


      {/* ==================================================
          Executor Balances
          ================================================== */}

      <section className="mt-6">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Executor Balances
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Live Contract Balances
            </h2>
          </div>

          <Link
            to="/contract"
            className="text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            Contract →
          </Link>

        </div>


        <div className="mt-4 grid gap-4 md:grid-cols-3">

          {/* ETH */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Executor ETH
            </p>

            <p className="mt-3 text-xl font-bold text-white">
              {loading
                ? 'Loading...'
                : `${executorETH} ETH`}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Native Sepolia balance
            </p>

          </div>


          {/* USDC */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Executor USDC
            </p>

            <p className="mt-3 text-xl font-bold text-emerald-400">
              {loading
                ? 'Loading...'
                : `${executorUSDC} USDC`}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Arbitrage settlement balance
            </p>

          </div>


          {/* WETH */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Executor WETH
            </p>

            <p className="mt-3 text-xl font-bold text-emerald-400">
              {loading
                ? 'Loading...'
                : `${executorWETH} WETH`}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Wrapped ETH balance
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          Latest Arbitrage
          ================================================== */}

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Latest Arbitrage
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Most Recent Execution
            </h2>
          </div>

          <Link
            to="/transactions"
            className="text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            View All Transactions →
          </Link>

        </div>


        {latestTransaction ? (

          <div className="mt-5 space-y-4">

            {/* Hash */}

            <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Transaction
                </p>

                <p
                  className="mt-1 max-w-full truncate font-mono text-sm text-emerald-400"
                  title={latestTransaction.hash}
                >
                  {latestTransaction.hash}
                </p>
              </div>

              <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                {latestTransaction.status}
              </span>

            </div>


            {/* Details */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <p className="text-xs text-slate-500">
                  Pair
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {latestTransaction.pair}
                </p>
              </div>


              <div>
                <p className="text-xs text-slate-500">
                  Amount
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {latestTransaction.amount}
                </p>
              </div>


              <div>
                <p className="text-xs text-slate-500">
                  Net Profit
                </p>

                <p className="mt-1 text-sm font-bold text-emerald-400">
                  {latestTransaction.netProfit}
                </p>
              </div>


              <div>
                <p className="text-xs text-slate-500">
                  Gas
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {latestTransaction.gas}
                </p>
              </div>

            </div>

          </div>

        ) : (

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center">

            <p className="text-sm font-semibold text-slate-300">
              No arbitrage transactions yet.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Completed flash-loan executions will
              appear here automatically.
            </p>

          </div>

        )}

      </section>


      {/* ==================================================
          System Status
          ================================================== */}

      <section className="mt-6">

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          System Status
        </p>


        <div className="mt-4 grid gap-4 md:grid-cols-3">

          {/* Network */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

            <div className="flex items-center gap-3">

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <div>
                <p className="text-sm font-semibold text-white">
                  Ethereum Sepolia
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Network active
                </p>
              </div>

            </div>

          </div>


          {/* Scanner */}

          <Link
            to="/scanner"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900"
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-white">
                  Live Opportunity Scanner
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  V2 / V3 quote scanning
                </p>
              </div>

              <span className="text-sm font-semibold text-emerald-400">
                Open →
              </span>

            </div>

          </Link>


          {/* Execution */}

          <Link
            to="/execution"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900"
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-white">
                  Flash Loan Execution
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Live Sepolia execution
                </p>
              </div>

              <span className="text-sm font-semibold text-emerald-400">
                Open →
              </span>

            </div>

          </Link>

        </div>

      </section>


      {/* ==================================================
          Quick Actions
          ================================================== */}

      <section className="mt-8 flex flex-col gap-3 sm:flex-row">

        <Link
          to="/scanner"
          className="rounded-xl bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Scan Opportunity
        </Link>

        <Link
          to="/transactions"
          className="rounded-xl border border-slate-700 px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
        >
          View Transactions
        </Link>

        <Link
          to="/contract"
          className="rounded-xl border border-slate-700 px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
        >
          Executor Contract
        </Link>

      </section>

    </div>
  )
}

export default DashboardPage