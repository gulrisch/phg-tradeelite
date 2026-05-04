import { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, Square, Settings, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react'

const SYMBOLS = ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','XAUUSD','NAS100','US30']

export default function ExecutionIA() {
  const [running, setRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [botStatus, setBotStatus] = useState(null)
  const [execLog, setExecLog] = useState([])
  const [cfg, setCfg] = useState({
    port: 5000,
    token: 'PHG_SECRET',
    symbol: 'EURUSD',
    volume: 0.01,
    sl: 20,
    tp: 40,
    autoExec: true,
    requireBuyReady: true,
    requireSellReady: true,
    maxTradesPerSession: 3,
    stopOnLoss: true,
    maxLossPct: 2,
  })
  const [stats, setStats] = useState({ executed: 0, wins: 0, losses: 0, blocked: 0 })
  const [lastSignal, setLastSignal] = useState(null)
  const pollRef = useRef(null)
  const execCountRef = useRef(0)

  const upd = (k, v) => setCfg(p => ({ ...p, [k]: v }))

  const log = useCallback((msg, type = 'info') => {
    setExecLog(p => [{
      time: new Date().toLocaleTimeString('fr-FR'),
      msg,
      type
    }, ...p.slice(0, 99)])
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch(`http://localhost:${cfg.port}/status/`, { signal: AbortSignal.timeout(1500) })
      if (!r.ok) throw new Error()
      const d = await r.json()
      setBotStatus(d)
      setConnected(true)

      // Détection signal + exécution auto
      if (running && cfg.autoExec && d.signal !== lastSignal) {
        setLastSignal(d.signal)
        if (d.signal === 'BUY READY' && cfg.requireBuyReady) {
          if (execCountRef.current < cfg.maxTradesPerSession) {
            await executeOrder('buy', d)
          } else {
            log('Max trades/session atteint — BUY bloqué', 'warn')
            setStats(p => ({ ...p, blocked: p.blocked + 1 }))
          }
        } else if (d.signal === 'SELL READY' && cfg.requireSellReady) {
          if (execCountRef.current < cfg.maxTradesPerSession) {
            await executeOrder('sell', d)
          } else {
            log('Max trades/session atteint — SELL bloqué', 'warn')
            setStats(p => ({ ...p, blocked: p.blocked + 1 }))
          }
        }
      }
    } catch {
      setConnected(false)
      setBotStatus(null)
    }
  }, [cfg, running, lastSignal])

  const executeOrder = async (type, status) => {
    try {
      const r = await fetch(`http://localhost:${cfg.port}/trade/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: cfg.token,
          type,
          symbol: cfg.symbol,
          volume: cfg.volume,
          sl: cfg.sl,
          tp: cfg.tp
        }),
        signal: AbortSignal.timeout(3000)
      })
      const d = await r.json()
      if (d.status === 'ok') {
        execCountRef.current++
        setStats(p => ({ ...p, executed: p.executed + 1 }))
        log(`${type.toUpperCase()} EXECUTE — ${cfg.symbol} @ ${status?.entry || 'marche'} | Signal: ${status?.signal}`, 'success')
      } else {
        log(`${type.toUpperCase()} REFUSE — ${JSON.stringify(d)}`, 'warn')
        setStats(p => ({ ...p, blocked: p.blocked + 1 }))
      }
    } catch (e) {
      log(`ERREUR execution: ${e.message}`, 'error')
    }
  }

  const sendManual = async (type) => {
    if (!connected) return
    await executeOrder(type, botStatus)
  }

  useEffect(() => {
    if (running) {
      log('Execution IA DEMARREE', 'success')
      execCountRef.current = 0
      pollRef.current = setInterval(fetchStatus, 2000)
      fetchStatus()
    } else {
      clearInterval(pollRef.current)
      if (execLog.length > 0) log('Execution IA ARRETEE', 'warn')
    }
    return () => clearInterval(pollRef.current)
  }, [running])

  useEffect(() => {
    if (!running) {
      const id = setInterval(fetchStatus, 3000)
      fetchStatus()
      return () => clearInterval(id)
    }
  }, [cfg.port, running])

  const sigColor = botStatus?.signal?.includes('BUY READY') ? '#00cc66'
    : botStatus?.signal?.includes('SELL READY') ? '#ff4444' : '#c9a227'

  const winrate = stats.executed > 0 ? ((stats.wins / stats.executed) * 100).toFixed(0) : 0

  return (
    <div style={{ padding: '20px', minHeight: '100vh', fontFamily: "'Courier New', monospace" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: running ? '#0a2e0a' : '#0a0a0a', border: `2px solid ${running ? '#00cc66' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color={running ? '#00cc66' : '#555'} style={{ animation: running ? 'pulse 1s infinite' : 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#e0e0e0', letterSpacing: '1px' }}>EXECUTION IA</div>
            <div style={{ fontSize: '11px', color: '#5a7a5a' }}>Exécution automatique · PHG_FTMO_PRO_MAX</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#0a120a', border: `1px solid ${connected ? '#00cc66' : '#ff4444'}`, borderRadius: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: connected ? '#00cc66' : '#ff4444', animation: connected ? 'pulse 1.5s infinite' : 'none' }} />
            <span style={{ fontSize: '11px', color: connected ? '#00cc66' : '#ff4444', fontWeight: '700' }}>{connected ? 'BOT CONNECTE' : 'BOT DECONNECTE'}</span>
          </div>
          <button
            onClick={() => setRunning(!running)}
            disabled={!connected}
            style={{ background: running ? '#2e0a0a' : '#0a2e0a', border: `2px solid ${running ? '#ff4444' : '#00cc66'}`, color: running ? '#ff4444' : '#00cc66', padding: '10px 20px', borderRadius: '10px', cursor: connected ? 'pointer' : 'not-allowed', fontSize: '13px', fontFamily: 'inherit', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', opacity: !connected ? 0.5 : 1 }}>
            {running ? <><Square size={14} /> STOPPER</> : <><Zap size={14} /> DEMARRER</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>

        {/* Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Connexion */}
          <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '10px', color: '#c9a227', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={11} /> CONNEXION
            </div>
            {[
              { label: 'Port', k: 'port', type: 'number' },
              { label: 'Token', k: 'token', type: 'text' },
              { label: 'Symbole', k: 'symbol', type: 'select' },
            ].map(({ label, k, type }) => (
              <div key={k} style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '9px', color: '#5a7a5a', marginBottom: '3px', textTransform: 'uppercase' }}>{label}</div>
                {type === 'select' ? (
                  <select value={cfg[k]} onChange={e => upd(k, e.target.value)}
                    style={{ width: '100%', background: '#0a120a', border: '1px solid #1a2e1a', color: '#e0e0e0', padding: '5px 8px', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit' }}>
                    {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input type={type} value={cfg[k]} onChange={e => upd(k, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    style={{ width: '100%', background: '#0a120a', border: '1px solid #1a2e1a', color: '#e0e0e0', padding: '5px 8px', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
          </div>

          {/* Paramètres trade */}
          <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '10px', color: '#c9a227', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>PARAMETRES TRADE</div>
            {[
              { label: 'Volume (lots)', k: 'volume', min: 0.01, max: 1, step: 0.01 },
              { label: 'Stop Loss (pips)', k: 'sl', min: 5, max: 100, step: 1 },
              { label: 'Take Profit (pips)', k: 'tp', min: 5, max: 200, step: 1 },
              { label: 'Max trades/session', k: 'maxTradesPerSession', min: 1, max: 10, step: 1 },
            ].map(({ label, k, min, max, step }) => (
              <div key={k} style={{ marginBottom: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#5a7a5a' }}>{label}</span>
                  <span style={{ fontSize: '11px', color: '#c9a227', fontWeight: '700' }}>{cfg[k]}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={cfg[k]} onChange={e => upd(k, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#c9a227', cursor: 'pointer' }} />
              </div>
            ))}
          </div>

          {/* Règles IA */}
          <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '10px', color: '#c9a227', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={11} /> REGLES IA
            </div>
            {[
              { label: 'Execution auto', k: 'autoExec', desc: 'Exécute sur signal bot' },
              { label: 'Attendre BUY READY', k: 'requireBuyReady', desc: 'Signal fort requis' },
              { label: 'Attendre SELL READY', k: 'requireSellReady', desc: 'Signal fort requis' },
              { label: 'Stop sur perte', k: 'stopOnLoss', desc: 'Arrêt auto si DD' },
            ].map(({ label, k, desc }) => (
              <div key={k} onClick={() => upd(k, !cfg[k])}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: cfg[k] ? '#0a1a0a' : '#0a120a', border: `1px solid ${cfg[k] ? '#00cc66' : '#1a2e1a'}`, borderRadius: '6px', cursor: 'pointer', marginBottom: '5px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: cfg[k] ? '#e0e0e0' : '#5a7a5a', fontWeight: '700' }}>{label}</div>
                  <div style={{ fontSize: '9px', color: '#3a5a3a' }}>{desc}</div>
                </div>
                <div style={{ width: '28px', height: '14px', background: cfg[k] ? '#00cc66' : '#1a2e1a', borderRadius: '7px', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '1px', left: cfg[k] ? '14px' : '1px', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Signal en temps réel */}
          <div style={{ background: '#0d1a0d', border: `1px solid ${sigColor}30`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#5a7a5a', fontWeight: '700', letterSpacing: '1px' }}>SIGNAL TEMPS REEL</div>
              <div style={{ fontSize: '10px', color: '#555' }}>refresh 2s</div>
            </div>
            {connected && botStatus ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'SIGNAL', val: botStatus.signal || '--', color: sigColor },
                    { label: 'STRUCTURE', val: botStatus.structure || '--', color: '#e0e0e0' },
                    { label: 'TREND', val: botStatus.trend || '--', color: botStatus.trend?.includes('BULL') ? '#00cc66' : '#ff4444' },
                    { label: 'HTF', val: botStatus.htf || '--', color: '#c9a227' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: '#0a120a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#5a7a5a', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'ENTRY', val: botStatus.entry > 0 ? botStatus.entry : '--', color: '#c9a227' },
                    { label: 'STOP LOSS', val: botStatus.sl > 0 ? botStatus.sl : '--', color: '#ff4444' },
                    { label: 'TAKE PROFIT', val: botStatus.tp1 > 0 ? botStatus.tp1 : '--', color: '#00cc66' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: '#0a120a', borderRadius: '7px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#5a7a5a', marginBottom: '3px' }}>{label}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color }}>{val}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#3a4a3a', fontSize: '12px' }}>
                {connected ? 'Analyse en cours...' : 'En attente de connexion au bot'}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'EXECUTES', val: stats.executed, color: '#00aaff' },
              { label: 'WINS', val: stats.wins, color: '#00cc66' },
              { label: 'LOSSES', val: stats.losses, color: '#ff4444' },
              { label: 'BLOQUES', val: stats.blocked, color: '#c9a227' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#5a7a5a', marginBottom: '4px', letterSpacing: '1px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Contrôles manuels */}
          <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '10px', color: '#c9a227', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>EXECUTION MANUELLE</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => sendManual('buy')} disabled={!connected}
                style={{ flex: 1, background: '#0a2e0a', border: '2px solid #00cc66', color: '#00cc66', padding: '12px', borderRadius: '8px', cursor: connected ? 'pointer' : 'not-allowed', fontSize: '13px', fontFamily: 'inherit', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: !connected ? 0.4 : 1 }}>
                <TrendingUp size={14} /> BUY
              </button>
              <button onClick={() => sendManual('sell')} disabled={!connected}
                style={{ flex: 1, background: '#2e0a0a', border: '2px solid #ff4444', color: '#ff4444', padding: '12px', borderRadius: '8px', cursor: connected ? 'pointer' : 'not-allowed', fontSize: '13px', fontFamily: 'inherit', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: !connected ? 0.4 : 1 }}>
                <TrendingDown size={14} /> SELL
              </button>
              <button onClick={() => sendManual('close')} disabled={!connected}
                style={{ flex: 1, background: '#0a120a', border: '2px solid #555', color: '#aaa', padding: '12px', borderRadius: '8px', cursor: connected ? 'pointer' : 'not-allowed', fontSize: '13px', fontFamily: 'inherit', fontWeight: '700', opacity: !connected ? 0.4 : 1 }}>
                FERMER TOUT
              </button>
            </div>
          </div>

          {/* Journal */}
          <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '12px', overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a2e1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: '#c9a227', fontWeight: '700', letterSpacing: '1px' }}>JOURNAL D'EXECUTION</div>
              <button onClick={() => setExecLog([])} style={{ background: 'none', border: 'none', color: '#3a5a3a', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>Effacer</button>
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {execLog.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#3a4a3a', fontSize: '12px' }}>
                  Aucune activité — démarrer l'Execution IA
                </div>
              ) : (
                execLog.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 14px', borderBottom: '1px solid #0a120a', alignItems: 'center', animation: i === 0 ? 'slideIn 0.3s ease' : 'none' }}>
                    <span style={{ color: '#5a7a5a', fontSize: '10px', minWidth: '55px' }}>{e.time}</span>
                    <span style={{ marginRight: '4px' }}>
                      {e.type === 'success' ? <CheckCircle size={12} color="#00cc66" /> : e.type === 'error' ? <AlertTriangle size={12} color="#ff4444" /> : e.type === 'warn' ? <Clock size={12} color="#c9a227" /> : <Zap size={12} color="#00aaff" />}
                    </span>
                    <span style={{ fontSize: '11px', color: e.type === 'success' ? '#00cc66' : e.type === 'error' ? '#ff4444' : e.type === 'warn' ? '#c9a227' : '#7a9a7a' }}>{e.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
