import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import TradeJournal from './pages/TradeJournal'
import SignalSimulator from './pages/SignalSimulator'
import FTMOChallenge from './pages/FTMOChallenge'
import AutoEvolution from './pages/AutoEvolution'
import TradingChart from './pages/TradingChart'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/journal" element={<TradeJournal />} />
            <Route path="/signals" element={<SignalSimulator />} />
            <Route path="/ftmo" element={<FTMOChallenge />} />
            <Route path="/evolution" element={<AutoEvolution />} />
            <Route path="/chart" element={<TradingChart />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}