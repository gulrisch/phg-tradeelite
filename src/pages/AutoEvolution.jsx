import { useState, useEffect, useRef } from 'react'
import { Brain, Zap, TrendingUp, TrendingDown, RefreshCw, ChevronUp, ChevronDown, Award, AlertTriangle } from 'lucide-react'

function genStrategy(gen = 1, parent = null) {
  const base = parent
    ? { winrate: Math.min(95, Math.max(40, parent.winrate + (Math.random() * 10 - 4))), rr: Math.min(5, Math.max(1, parent.rr + (Math.random() * 0.6 - 0.2))), drawdown: Math.max(5, Math.min(35, parent.drawdown + (Math.random() * 6 - 3))), trades: parent.trades + Math.floor(Math.random() * 20) }
    : { winrate: Math.floor(Math.random() * 30) + 45, rr: parseFloat((Math.random() * 2 + 1.2).toFixed(2)), drawdown: parseFloat((Math.random() * 20 + 8).toFixed(1)), trades: Math.floor(Math.random() * 50) + 20 }

  const score = base.winrate * 0.4 + base.rr * 15 + (40 - base.drawdown) * 0.5 + Math.min(base.trades, 100) * 0.1

  const allMutations = ['EMA période ajustée', 'Seuil BOS renforcé', 'Filtre HTF activé', 'SL optimisé', 'Session Kill Zone étendue', 'FVG gap threshold réduit']
  const mutations = allMutations.filter(() => Math.random() > 0.6).slice(0, 3)

  const params = {
    ema_fast: Math.floor(Math.random() * 10) + 8,
    ema_slow: Math.floor(Math.random() * 20) + 18,
    bos_lookback: Math.floor(Math.random() * 10) + 5,
    rsi_filter: Math.floor(Math.random() * 20) + 50,
    kill_zone: ['London Open', 'NY Open', 'Both'][Math.floor(Math.random() * 3)],
    sl_pips: Math.floor(Math.random() * 15) + 10,
    tp_pips: Math.floor(Math.random() * 30) + 20,
  }

  return {
    id: `G${gen}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    generation: gen,
    ...base,
    winrate: parseFloat(base.winrate.toFixed(1)),
    rr: parseFloat(base.rr.toFixed(2)),
    score: parseFloat(score.toFixed(1)),
    mutations: mutations.length ? mutations : ['Paramètres hérités'],
    params,
    status: score > 75 ? 'ELITE' : score > 60 ? 'VIABLE' : 'FAIBLE',
    equity: Array.from({ length: 20 }, (_, i) => parseFloat((10000 + (Math.random() - 0.3) * 800 * (i + 1) * 0.1).toFixed(0))),
  }
}

const statusColor = { ELITE: '#c9a227', VIABLE: '#00cc66', FAIBLE: '#ff4444' }
const statusBg = { ELITE: '#2e1a00', VIABLE: '#0a2e0a', FAIBLE: '#2e0a0a' }

function Sparkline({ data, color }) {
  const w = 120, h = 36
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`)
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export default function AutoEvolution() {
  const [generation, setGeneration] = useState(1)
  const [pool, setPool] = useState([])
  const [best, setBest] = useState(null)
  const [history, setHistory] = useState([])
  const [evolving, setEvolving] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [log, setLog] = useState([])
  const autoRef = useRef(null)
  const poolRef = useRef([])

  const addLog = (msg) => setLog(prev => [`[${new Date().toLocaleTimeString('fr-FR')}] ${msg}`, ...prev].slice(0, 20))

  useEffect(() => {
    const initial = Array.from({ length: 5 }, () => genStrategy(1)).sort((a, b) => b.score - a.score)
    setPool(initial)
    poolRef.current = initial
    setBest(initial[0])
    addLog('Génération 1 initialisée — 5 stratégies créées')
  }, [])

  const evolve = () => {
    if (evolving) return
    setEvolving(true)
    setGeneration(prev => {
      const nextGen = prev + 1
      addLog(`Évolution génération ${nextGen} en cours...`)
      setTimeout(() => {
        const currentPool = poolRef.current
        const newPool = [
          ...currentPool.slice(0, 2).flatMap(parent => Array.from({ length: 2 }, () => genStrategy(nextGen, parent))),
          genStrategy(nextGen)
        ].sort((a, b) => b.score - a.score)
        poolRef.current = newPool
        setPool(newPool)
        setBest(prev => newPool[0].score > (prev?.score || 0) ? newPool[0] : prev)
        setHistory(h => [...h, { gen: nextGen, score: newPool[0].score }])
        addLog(`✓ Gen ${nextGen} — Meilleur: ${newPool[0].score.toFixed(1)} (${newPool[0].id})`)
        setEvolving(false)
      }, 1200)
      return nextGen
    })
  }

  useEffect(() => {
    if (autoMode) { autoRef.current = setInterval(evolve, 4000) }
    else { clearInterval(autoRef.current) }
    return () => clearInterval(autoRef.current)
  }, [autoMode])

  const deployStrategy = (s) => addLog(`🚀 Stratégie ${s.id} déployée sur cTrader`)

  return (
    <div style={{ padding: '24px', minHeight: '100vh', fontFamily: "'Courier New', monospace" }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Brain size={20} color="#c9a227" />
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#e0e0e0', letterSpacing: '1px' }}>AUTO EVOLUTION</span>
          </div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>
            Algorithme génétique · PHG ICT · Génération {generation} · Pool de {pool.length} stratégies
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setAutoMode(!autoMode)} style={{ background: autoMode ? '#1a2e0a' : '#0d150d', border: `1px solid ${autoMode ? '#c9a227' : '#2a3a2a'}`, color: autoMode ? '#c9a227' : '#5a7a5a', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', fontWeight: '700' }}>
            AUTO {autoMode ? '⏸' : '▶'}
          </button>
          <button onClick={evolve} disabled={evolving} style={{ background: '#1a2e0a', border: '1px solid #c9a227', color: '#c9a227', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', opacity: evolving ? 0.6 : 1 }}>
            <Zap size={14} />
            {evolving ? 'Évolution...' : 'Évoluer'}
          </button>
        </div>
      </div>

      {best && (
        <div style={{ background: 'linear-gradient(135deg, #1a0e00, #0d1a0d)', border: '1px solid #c9a227', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 30px #c9a22715' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={20} color="#c9a227" />
            <div>
              <div style={{ fontSize: '11px', color: '#c9a227', fontWeight: '700', letterSpacing: '1px' }}>MEILLEURE STRATÉGIE GLOBALE</div>
              <div style={{ fontSize: '16px', color: '#e0e0e0', fontWeight: '700' }}>{best.id}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['Score', best.score], ['WinRate', best.winrate + '%'], ['R:R', '1:' + best.rr], ['DD', best.drawdown + '%']].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#5a7a5a' }}>{l}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#c9a227' }}>{v}</div>
              </div>
            ))}
          </div>
          <button onClick={() => deployStrategy(best)} style={{ background: '#1a0e00', border: '1px solid #c9a227', color: '#c9a227', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={13} /> DÉPLOYER
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: '#5a7a5a', marginBottom: '10px', fontWeight: '700' }}>PROGRESSION DES GÉNÉRATIONS</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '40px' }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: '20px', height: Math.max(4, (h.score / 100) * 36) + 'px', background: `hsl(${h.score * 1.2}, 70%, 45%)`, borderRadius: '2px' }} />
                <span style={{ fontSize: '9px', color: '#3a4a3a' }}>G{h.gen}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: '11px', color: '#5a7a5a', marginBottom: '10px', fontWeight: '700', letterSpacing: '1px' }}>
        POOL DE STRATÉGIES — GÉNÉRATION {generation}
      </div>

      {pool.map((s, idx) => (
        <div key={s.id} style={{ background: '#0d1a0d', border: `1px solid ${idx === 0 ? '#c9a227' : '#1a2e1a'}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '10px', boxShadow: idx === 0 ? '0 0 15px #c9a22715' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {idx === 0 && <span style={{ fontSize: '14px' }}>👑</span>}
              <div>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#e0e0e0' }}>{s.id}</span>
                <span style={{ fontSize: '11px', color: '#5a7a5a', marginLeft: '8px' }}>Gen {s.generation}</span>
              </div>
              <span style={{ background: statusBg[s.status], border: `1px solid ${statusColor[s.status]}`, color: statusColor[s.status], padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{s.status}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Sparkline data={s.equity} color={s.winrate >= 55 ? '#00cc66' : '#ff4444'} />
              {[['Score', s.score, '#c9a227'], ['WinRate', s.winrate + '%', s.winrate >= 55 ? '#00cc66' : '#ff9900'], ['R:R', '1:' + s.rr, '#00cc66'], ['DD', s.drawdown + '%', s.drawdown <= 15 ? '#00cc66' : '#ff4444']].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: 'center', minWidth: '45px' }}>
                  <div style={{ fontSize: '9px', color: '#5a7a5a' }}>{l}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: c }}>{v}</div>
                </div>
              ))}
              <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} style={{ background: 'none', border: 'none', color: '#5a7a5a', cursor: 'pointer' }}>
                {expanded === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {s.mutations.map((m, j) => (
              <span key={j} style={{ background: '#0a1a0a', border: '1px solid #1a3a1a', color: '#5a9a5a', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>⚡ {m}</span>
            ))}
          </div>

          {expanded === s.id && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #1a2e1a' }}>
              <div style={{ fontSize: '10px', color: '#5a7a5a', marginBottom: '10px', fontWeight: '700' }}>PARAMÈTRES ICT</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {[['EMA Rapide', s.params.ema_fast], ['EMA Lente', s.params.ema_slow], ['BOS Lookback', s.params.bos_lookback], ['RSI Filtre', s.params.rsi_filter], ['Kill Zone', s.params.kill_zone], ['SL', s.params.sl_pips + ' pips'], ['TP', s.params.tp_pips + ' pips'], ['Trades', s.trades]].map(([l, v]) => (
                  <div key={l} style={{ background: '#0a120a', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '9px', color: '#5a7a5a' }}>{l}</div>
                    <div style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: '700' }}>{v}</div>
                  </div>
                ))}
              </div>
              {s.status !== 'FAIBLE' && (
                <button onClick={() => deployStrategy(s)} style={{ background: '#0a2e0a', border: '1px solid #00cc66', color: '#00cc66', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={13} /> DÉPLOYER {s.id} SUR CTRADER
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <div style={{ background: '#080f08', border: '1px solid #1a2e1a', borderRadius: '10px', padding: '14px', marginTop: '20px' }}>
        <div style={{ fontSize: '11px', color: '#5a7a5a', marginBottom: '8px', fontWeight: '700' }}>LOG SYSTÈME</div>
        {log.slice(0, 8).map((l, i) => (
          <div key={i} style={{ fontSize: '11px', color: i === 0 ? '#00cc66' : '#3a4a3a', marginBottom: '3px', fontFamily: 'inherit' }}>{l}</div>
        ))}
      </div>
    </div>
  )
}