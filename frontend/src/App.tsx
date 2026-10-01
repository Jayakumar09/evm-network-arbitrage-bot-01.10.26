import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Header from './components/Header'

import DashboardPage from './pages/DashboardPage'
import ScannerPage from './pages/ScannerPage'
import OpportunityPage from './pages/OpportunityPage'
import ExecutionPage from './pages/ExecutionPage'
import TransactionsPage from './pages/TransactionsPage'
import ContractPage from './pages/ContractPage'
import WithdrawalsPage from './pages/WithdrawalsPage'

import { ArbitrageProvider } from './context/ArbitrageContext'

function App() {
  return (
    <BrowserRouter>
      <ArbitrageProvider>
        <div className="min-h-screen bg-slate-950 text-white">
          <Header />

          <main>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/opportunity" element={<OpportunityPage />} />
              <Route path="/execution" element={<ExecutionPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/withdrawals" element={<WithdrawalsPage />} />
              <Route path="/contract" element={<ContractPage />} />
            </Routes>
          </main>
        </div>
      </ArbitrageProvider>
    </BrowserRouter>
  )
}

export default App
