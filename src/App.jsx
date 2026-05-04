import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import TradeJournal from "./pages/TradeJournal";
import SignalSimulator from "./pages/SignalSimulator";
import AutoEvolution from "./pages/AutoEvolution";
import TradingChart from "./pages/TradingChart";
import Backtesting from "./pages/Backtesting";
import FTMOChallenge from "./pages/FTMOChallenge";
import TradingDecisionSimulator from "./pages/TradingDecisionSimulator";
import ExecutionIA from "./pages/ExecutionIA";

export default function App() {
  return (
    <Router>
      <div style={{ display: "flex", minHeight: "100vh", background: "#1a1a0e" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/journal" element={<TradeJournal />} />
            <Route path="/signal" element={<SignalSimulator />} />
            <Route path="/evolution" element={<AutoEvolution />} />
            <Route path="/ftmo" element={<FTMOChallenge />} />
            <Route path="/chart" element={<TradingChart />} />
            <Route path="/backtest" element={<Backtesting />} />
            <Route path="/decision" element={<TradingDecisionSimulator />} />
          <Route path="/execution" element={<ExecutionIA />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

