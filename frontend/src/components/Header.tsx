import { NavLink } from 'react-router-dom'

import NetworkStatus from './NetworkStatus'
import WalletButton from './WalletButton'

import { useArbitrage } from '../context/ArbitrageContext'


function Header() {
  const {
    walletAddress,
    walletConnected,
  } = useArbitrage()


    const navigation = [
      {
        name: 'Dashboard',
        path: '/',
      },
      {
        name: 'Scanner',
        path: '/scanner',
      },
      {
        name: 'Opportunity',
        path: '/opportunity',
      },
      {
        name: 'Execution',
        path: '/execution',
      },
      {
        name: 'Transactions',
        path: '/transactions',
      },
      {
        name: 'Withdrawals',
        path: '/withdrawals',
      },
      {
        name: 'Contract',
        path: '/contract',
      },
    ]


  return (
    <header className="border-b border-slate-800 bg-slate-950/95">

      <div className="mx-auto max-w-7xl px-6">

        {/* ==================================================
            Top Header
            ================================================== */}

        <div className="flex min-h-20 items-center justify-between gap-6">

          {/* ==================================================
              App Logo / Name
              ================================================== */}

          <NavLink
            to="/"
            className="flex shrink-0 items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">

              <span className="text-lg font-bold text-emerald-400">
                FL
              </span>

            </div>


            <div>

              <h1 className="text-lg font-semibold text-white">
                FlashLoan Arbitrage
              </h1>

              <p className="text-xs text-slate-500">
                EVM Network Arbitrage Bot
              </p>

            </div>

          </NavLink>


          {/* ==================================================
              Network + Wallet
              ================================================== */}

          <div className="flex shrink-0 items-center gap-4">

            <NetworkStatus />

            <WalletButton
              key={
                walletConnected
                  ? walletAddress ?? 'connected'
                  : 'disconnected'
              }
            />

          </div>

        </div>


        {/* ==================================================
            Navigation
            ================================================== */}

        <nav className="flex flex-wrap items-center gap-1 border-t border-slate-800/70 py-2">

          {navigation.map((item) => (

            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-2 text-sm font-medium transition',

                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white',
                ].join(' ')
              }
            >
              {item.name}
            </NavLink>

          ))}

        </nav>

      </div>

    </header>
  )
}


export default Header