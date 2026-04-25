import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const PAIRS = ['EURUSD', 'GBPUSD', 'XAUUSD']
const SESSIONS = ['LONDON', 'NEW YORK']

function generateSignal(pair, session) {
  const score = Math.floor(Math.random() * 35) + 60
  const confidence = Math.floor(Math.random() * 25) + 65
  const probability = Math.floor(Math.random() * 20) + 65
  const direction = Math.random() > 0.5 ? 'BUY' : 'SELL'
  let status, color
  if (score >= 85 && confidence >= 80 && probability >= 70) { status = 'READY'; color = '#00cc66' }
  else if (score >= 70) { status = 'WEAK'; color = '#ff9900' }
  else { status = 'WAIT'; color = '#5a7a5a' }
  return {
    pair, session, score, confidence, probability, direction, status, color,
    bos: score > 75, fvg: probability > 70, ema: confidence > 75, htf: score > 80,
    timestamp: new Date().toLocaleTimeString()
  }
}

function SignalCard({ signal, onTrade }) {
  const isReady = signal.status === 'READY'
  return (
    <div style={{ background:'#0d1a0d', border:`1px solid ${isReady ? '#00cc66' : '#1a2e1a'}`, borderRadius:'12px', padding:'20px', marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'18px', fontWeight:'700', color:'#e0e0e0' }}>{signal.pair}</span>
          <span style={{ background: signal.direction === 'BUY' ? '#0a2e0a' : '#2e0a0a', color: signal.direction === 'BUY' ? '#00cc66' : '#ff4444', padding:'3px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:'700' }}>{signal.direction}</span>
          <span style={{ color:'#5a7a5a', fontSize:'12px' }}>{signal.session}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ background: isReady ? '#0a2e0a' : '#1a1a0a', border:`1px solid ${signal.color}`, color: signal.color, padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'700' }}>{signal.status}</span>
          <span style={{ color:'#5a7a5a', fontSize:'11px' }}>{signal.timestamp}</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
        {[['Score IA', signal.score + '/100', signal.score >= 85 ? '#00cc66' : '#ff9900'],
          ['Confiance', signal.confidence + '%', signal.confidence >= 80 ? '#00cc66' : '#ff9900'],
          ['Probabilité', signal.probability + '%', signal.probability >= 70 ? '#00cc66' : '#ff9900']
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:'#0a120a', borderRadius:'8px', padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:'11px', color:'#5a7a5a', marginBottom:'4px' }}>{l}</div>
            <div style={{ fontSize:'20px', fontWeight:'700', color:c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'16px' }}>
        {[['BOS', signal.bos], ['FVG', signal.fvg], ['EMA', signal.ema], ['HTF', signal.htf]].map(([l,v]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#0a120a', padding:'8px', borderRadius:'6px' }}>
            {v ? <CheckCircle size={14} color="#00cc66"/> : <XCircle size={14} color="#5a7a5a"/>}
            <span style={{ fontSize:'12px', color: v ? '#e0e0e0' : '#5a7a5a' }}>{l}</span>
          </div>
        ))}
      </div>
      {isReady && (
        <button onClick={() => onTrade(signal)} style={{ width:'100%', background:'#0a2e0a', border:'1px solid #00cc66', color:'#00cc66', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer', letterSpacing:'1px' }}>
          ✓ VALIDER & ENVOYER SUR CTRADER
        </button>
      )}
    </div>
  )
}

export default function SignalSimulator() {
  const [signals, setSignals] = useState([])
  const [auto, setAuto] = useState(false)
  const [pair, setPair] = useState('EURUSD')
  const [session, setSession] = useState('LONDON')
  const [validated, setValidated] = useState([])

  const scan = () => {
    const results = PAIRS.map(p => generateSignal(p, session))
    setSignals(results)
  }

  useEffect(() => { scan() }, [])
  useEffect(() => {
    if (!auto) return
    const t = setInterval(scan, 10000)
    return () => clearInterval(t)
  }, [auto, session])

  const handleTrade = (signal) => {
    setValidated(v => [{ ...signal, validated: new Date().toLocaleTimeString() }, ...v.slice(0,4)])
    alert(`✅ Signal ${signal.pair} ${signal.direction} envoyé sur cTrader!\n\nScore: ${signal.score}/100\nProb: ${signal.probability}%`)
  }

  return (
    <div style={{ padding:'24px', minHeight:'100vh' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <div style={{ fontSize:'22px', fontWeight:'700', color:'#e0e0e0', display:'flex', alignItems:'center', gap:'10px' }}>
            <Activity size={22} color="#c9a227"/> Signal Simulator
          </div>
          <div style={{ fontSize:'13px', color:'#5a7a5a', marginTop:'2px' }}>Analyse PHG — BOS + FVG + EMA + Session</div>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <select value={session} onChange={e => setSession(e.target.value)} style={{ background:'#0d1a0d', border:'1px solid #1a2e1a', color:'#e0e0e0', padding:'8px 12px', borderRadius:'8px', fontSize:'13px' }}>
            {SESSIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={scan} style={{ background:'#1a2e0a', border:'1px solid #c9a227', color:'#c9a227', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>
            🔄 Scanner
          </button>
          <button onClick={() => setAuto(a => !a)} style={{ background: auto ? '#0a2e0a' : '#0d1a0d', border:`1px solid ${auto ? '#00cc66' : '#1a2e1a'}`, color: auto ? '#00cc66' : '#5a7a5a', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>
            {auto ? '⏸ Auto ON' : '▶ Auto OFF'}
          </button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'24px' }}>
        <div>
          <div style={{ fontSize:'13px', color:'#5a7a5a', marginBottom:'12px' }}>SIGNAUX ACTIFS — {signals.filter(s => s.status === 'READY').length} READY</div>
          {signals.map((s, i) => <SignalCard key={i} signal={s} onTrade={handleTrade}/>)}
        </div>
        <div>
          <div style={{ background:'#0d1a0d', border:'1px solid #1a2e1a', borderRadius:'12px', padding:'20px' }}>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#c9a227', marginBottom:'16px' }}>📋 Trades Validés</div>
            {validated.length === 0 ? (
              <div style={{ color:'#5a7a5a', fontSize:'13px', textAlign:'center', padding:'20px' }}>Aucun trade validé</div>
            ) : validated.map((t, i) => (
              <div key={i} style={{ borderBottom:'1px solid #1a2e1a', paddingBottom:'10px', marginBottom:'10px' }}>
                <div style={{ display:'flex'
@'
import { useState } from 'react'
import { TrendingUp, Zap, Shield, AlertTriangle } from 'lucide-react'

const MODES = [
  { id:'SAFE', label:'Safe', color:'#4a9fff', trades:1, prob:80, rr:'1:2', desc:'1 trade max / jour · Prob ≥ 80%' },
  { id:'BALANCED', label:'Balanced', color:'#00cc66', trades:2, prob:75, rr:'1:1.5', desc:'2 trades / jour · Prob ≥ 75%' },
  { id:'AGGRESSIVE', label:'Aggressive', color:'#c9a227', trades:3, prob:70, rr:'1:1', desc:'3 trades / jour · Prob ≥ 70% · Expérimenté' },
]

const winrateData = [
  { date:'07/04', wr:62 }, { date:'08/04', wr:65 }, { date:'09/04', wr:68 },
  { date:'10/04', wr:70 }, { date:'14/04', wr:69 }, { date:'15/04', wr:71 }, { date:'22/04', wr:70 },
]

export default function AutoEvolution() {
  const [mode, setMode] = useState('AGGRESSIVE')
  const current = MODES.find(m => m.id === mode)
  const score = 78
  const winrate = 70
  const dd = 0.74
  const pnl = 510

  return (
    <div style={{ padding:'24px', minHeight:'100vh' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <div style={{ fontSize:'22px', fontWeight:'700', color:'#e0e0e0', display:'flex', alignItems:'center', gap:'10px' }}>
            <TrendingUp size={22} color="#c9a227"/> Auto Evolution IA
          </div>
          <div style={{ fontSize:'13px', color:'#5a7a5a', marginTop:'2px' }}>Adaptation automatique du mode de trading</div>
        </div>
        <div style={{ background:'#0a2e0a', border:'1px solid #00cc66', color:'#00cc66', padding:'4px 12px', borderRadius:'20px', fontSize:'12px' }}>
          ● AUTO-ADAPT
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }}>
        {MODES.map(m => (
          <div key={m.id} onClick={() => setMode(m.id)} style={{ background: mode === m.id ? '#0d1a0d' : '#080f08', border:`2px solid ${mode === m.id ? m.color : '#1a2e1a'}`, borderRadius:'12px', padding:'16px', cursor:'pointer' }}>
            <div style={{ fontSize:'14px', fontWeight:'700', color: mode === m.id ? m.color : '#5a7a5a', marginBottom:'6px' }}>{m.label}</div>
            <div style={{ fontSize:'11px', color:'#5a7a5a' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ background:'#0d1a0d', border:`1px solid ${current.color}`, borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'16px', fontWeight:'700', color: current.color }}>🚀 MODE {current.label.toUpperCase()}</div>
          <div style={{ fontSize:'12px', color:'#5a7a5a' }}>RR minimum : {current.rr}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
          {[['Perf. Score', score+'/100', score >= 75 ? '#00cc66' : '#ff9900'],
            ['Winrate', winrate+'%', '#00cc66'],
            ['DD Total', dd+'%', '#c9a227'],
            ['Net P&L', '+'+pnl, '#00cc66']
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:'#0a120a', borderRadius:'8px', padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:'11px', color:'#5a7a5a', marginBottom:'6px' }}>{l}</div>
              <div style={{ fontSize:'22px', fontWeight:'700', color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Mode bar */}
        <div style={{ marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#5a7a5a', marginBottom:'6px' }}>
            <span>LOCK</span><span>SAFE</span><span>BALANCED</span><span>AGGR.</span>
          </div>
          <div style={{ height:'6px', background:'#1a2e1a', borderRadius:'3px', position:'relative' }}>
            <div style={{ position:'absolute', left: mode === 'SAFE' ? '25%' : mode === 'BALANCED' ? '60%' : '90%', top:'-4px', width:'14px', height:'14px', borderRadius:'50%', background: current.color, border:'2px solid #0d1a0d', transform:'translateX(-50%)' }}></div>
            <div style={{ height:'100%', width: mode === 'SAFE' ? '30%' : mode === 'BALANCED' ? '65%' : '95%', background: current.color, borderRadius:'3px', opacity:0.4 }}></div>
          </div>
        </div>

        <div style={{ background:'#0a120a', borderRadius:'8px', padding:'12px', borderLeft:`3px solid ${current.color}` }}>
          <div style={{ fontSize:'13px', color: current.color, fontWeight:'600' }}>
            {score >= 75 ? '⚡ Performance solide → opportunités à exploiter pleinement.' : '⚠️ Performance modérée → rester discipliné.'}
          </div>
          <div style={{ fontSize:'12px', color:'#5a7a5a', marginTop:'4px' }}>Conditions optimales détectées — maintenir la discipline.</div>
        </div>
      </div>

      {/* Winrate chart simple */}
      <div style={{ background:'#0d1a0d', border:'1px solid #1a2e1a', borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
        <div style={{ fontSize:'13px', color:'#5a7a5a', letterSpacing:'1px', marginBottom:'16px' }}>ÉVOLUTION WINRATE ROLLING (FENÊTRE 10 TRADES)</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', height:'80px' }}>
          {winrateData.map((d, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'100%', background:'#00cc66', borderRadius:'3px 3px 0 0', height: (d.wr - 55) * 4 + 'px', opacity:0.7 }}></div>
              <div style={{ fontSize:'9px', color:'#5a7a5a' }}>{d.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Best / Avoid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
        <div style={{ background:'#0d1a0d', border:'1px solid #1a2e1a', borderRadius:'12px', padding:'16px' }}>
          <div style={{ fontSize:'11px', color:'#5a7a5a', marginBottom:'8px' }}>MEILLEUR SETUP</div>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#00cc66' }}>EURUSD</div>
          <div style={{ fontSize:'12px', color:'#5a7a5a' }}>NEW YORK</div>
        </div>
        <div style={{ background:'#0d1a0d', border:'1px solid #1a2e1a', borderRadius:'12px', padding:'16px' }}>
          <div style={{ fontSize:'11px', color:'#5a7a5a', marginBottom:'8px' }}>À ÉVITER</div>
          <div style={{ fontSize:'18px', fontWeight:'700', color:'#ff4444' }}>USDJPY</div>
          <div style={{ fontSize:'12px', color:'#5a7a5a' }}>LONDON</div>
        </div>
      </div>
    </div>
  )
}
