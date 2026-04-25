import { useState, useEffect, useRef } from 'react'
import { Activity, CheckCircle, XCircle, RefreshCw, Send, TrendingUp, TrendingDown, Clock } from 'lucide-react'

const PAIRS = [
  { name: 'EURUSD', pip: 0.0001, spread: 1.2 },
  { name: 'GBPUSD', pip: 0.0001, spread: 1.5 },
  { name: 'XAUUSD', pip: 0.01, spread: 0.3 },
  { name: 'GBPJPY', pip: 0.01, spread: 2.1 },
  { name: 'USDJPY', pip: 0.01, spread: 1.0 },
]

function genSignal(pair) {
  const score = Math.floor(Math.random() * 35) + 60
  const conf = Math.floor(Math.random() * 25) + 65
  const prob = Math.floor(Math.random() * 20) + 65
  const dir = Math.random() > 0.5 ? 'BUY' : 'SELL'
  const status = score >= 85 && conf >= 80 && prob >= 70 ? 'READY' : score >= 70 ? 'WEAK' : 'WAIT'
  const bos = score > 75
  const fvg = prob > 70
  const ema = conf > 75
  const htf = score > 80
  const choch = Math.random() > 0.5
  const ob = Math.random() > 0.4
  const rr = (Math.random() * 2 + 1.5).toFixed(1)
  const sl = (Math.random() * 15 + 10).toFixed(1)
  const tp = (sl * rr).toFixed(1)
  return {
    pair: pair.name, score, conf, prob, dir, status,
    bos, fvg, ema, htf, choch, ob, rr, sl, tp,
    session: ['London', 'New York', 'Asian'][Math.floor(Math.random() * 3)],
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    spread: pair.spread,
  }
}

const statusColor = { READY: '#00cc66', WEAK: '#ff9900', WAIT: '#5a7a5a' }
const statusBg = { READY: '#0a2e1a', WEAK: '#2e1a0a', WAIT: '#0d150d' }

export default function SignalSimulator() {
  const [signals, setSignals] = useState(PAIRS.map(genSignal))
  const [scanning, setScanning] = useState(false)
  const [autoScan, setAutoScan] = useState(false)
  const [sent, setSent] = useState({})
  const [filter, setFilter] = useState('ALL')
  const intervalRef = useRef(null)

  const scan = () => {
    setScanning(true)
    setTimeout(() => {
      setSignals(PAIRS.map(genSignal))
      setScanning(false)
      setSent({})
    }, 800)
  }

  useEffect(() => {
    if (autoScan) {
      intervalRef.current = setInterval(scan, 30000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoScan])

  const sendToCtrader = (s) => {
    setSent(prev => ({ ...prev, [s.pair]: true }))
    setTimeout(() => setSent(prev => ({ ...prev, [s.pair]: false })), 3000)
  }

  const filtered = filter === 'ALL' ? signals : signals.filter(s => s.status === filter)
  const readyCount = signals.filter(s => s.status === 'READY').length

  return (
    <div style={{ padding: '24px', minHeight: '100vh', fontFamily: "'Courier New', monospace" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Activity size={20} color="#c9a227" />
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#e0e0e0', letterSpacing: '1px' }}>SIGNAL SIMULATOR</span>
          </div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>
            PHG ICT Analysis · BOS + FVG + EMA + HTF · {readyCount} signal{readyCount !== 1 ? 's' : ''} READY
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setAutoScan(!autoScan)} style={{ background: autoScan ? '#0a2e0a' : '#0d150d', border: `1px solid ${autoScan ? '#00cc66' : '#1a2e1a'}`, color: autoScan ? '#00cc66' : '#5a7a5a', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>
            AUTO {autoScan ? 'ON' : 'OFF'}
          </button>
          <button onClick={scan} disabled={scanning} style={{ background: '#1a2e0a', border: '1px solid #c9a227', color: '#c9a227', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', opacity: scanning ? 0.7 : 1 }}>
            <RefreshCw size={14} style={{ animation: scanning ? 'spin 0.8s linear infinite' : 'none' }} />
            {scanning ? 'Scan...' : 'Scanner'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['ALL', 'READY', 'WEAK', 'WAIT'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? (statusBg[f] || '#1a2e0a') : '#0d150d', border: `1px solid ${filter === f ? (statusColor[f] || '#c9a227') : '#1a2e1a'}`, color: filter === f ? (statusColor[f] || '#c9a227') : '#5a7a5a', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', fontWeight: '700' }}>
            {f}
          </button>
        ))}
      </div>

      {filtered.map((s, i) => (
        <div key={s.pair + i} style={{ background: '#0d1a0d', border: `1px solid ${s.status === 'READY' ? '#00cc66' : s.status === 'WEAK' ? '#ff990033' : '#1a2e1a'}`, borderRadius: '12px', padding: '20px', marginBottom: '12px', boxShadow: s.status === 'READY' ? '0 0 20px #00cc6615' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#e0e0e0', letterSpacing: '1px' }}>{s.pair}</span>
              <span style={{ background: s.dir === 'BUY' ? '#0a2e0a' : '#2e0a0a', color: s.dir === 'BUY' ? '#00cc66' : '#ff4444', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {s.dir === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {s.dir}
              </span>
              <span style={{ fontSize: '11px', color: '#5a7a5a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={10} /> {s.time}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#5a7a5a' }}>{s.session}</span>
              <span style={{ border: `1px solid ${statusColor[s.status]}`, color: statusColor[s.status], padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{s.status}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
            {[['Score IA', s.score + '/100', s.score >= 85 ? '#00cc66' : '#ff9900', s.score],['Confiance', s.conf + '%', s.conf >= 80 ? '#00cc66' : '#ff9900', s.conf],['Probabilité', s.prob + '%', s.prob >= 70 ? '#00cc66' : '#ff9900', s.prob]].map(([label, val, color, raw]) => (
              <div key={label} style={{ background: '#0a120a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#5a7a5a', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color }}>{val}</div>
                <div style={{ height: '3px', background: '#1a2e1a', borderRadius: '2px', marginTop: '8px' }}>
                  <div style={{ height: '100%', width: raw + '%', background: color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {[['BOS', s.bos], ['FVG', s.fvg], ['EMA', s.ema], ['HTF', s.htf], ['CHoCH', s.choch], ['OB', s.ob]].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: val ? '#0a1a0a' : '#0a120a', padding: '8px 4px', borderRadius: '6px', border: `1px solid ${val ? '#00cc6633' : '#1a2e1a'}` }}>
                {val ? <CheckCircle size={14} color="#00cc66" /> : <XCircle size={14} color="#2a3a2a" />}
                <span style={{ fontSize: '10px', color: val ? '#e0e0e0' : '#3a4a3a', fontWeight: '700' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: s.status === 'READY' ? '14px' : '0' }}>
            {[['Stop Loss', s.sl + ' pips', '#ff4444'],['Take Profit', s.tp + ' pips', '#00cc66'],['Risk/Reward', '1:' + s.rr, '#c9a227']].map(([label, val, color]) => (
              <div key={label} style={{ background: '#0a120a', borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ fontSize: '10px', color: '#5a7a5a', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color }}>{val}</div>
              </div>
            ))}
          </div>

          {s.status === 'READY' && (
            <button onClick={() => sendToCtrader(s)} style={{ width: '100%', background: sent[s.pair] ? '#0a3a1a' : '#0a2e0a', border: `1px solid ${sent[s.pair] ? '#00ff88' : '#00cc66'}`, color: sent[s.pair] ? '#00ff88' : '#00cc66', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Send size={14} />
              {sent[s.pair] ? '✓ SIGNAL ENVOYÉ SUR CTRADER' : 'VALIDER ET ENVOYER SUR CTRADER'}
            </button>
          )}
        </div>
      ))}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}