import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Activity, ChevronDown } from 'lucide-react'

const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'LTCUSDT', 'ADAUSDT']
const TIMEFRAMES = [
  { label: '1m', value: '1m' }, { label: '5m', value: '5m' },
  { label: '15m', value: '15m' }, { label: '1h', value: '1h' },
  { label: '4h', value: '4h' }, { label: '1j', value: '1d' },
]
const INDICATORS = ['EMA', 'FVG', 'BOS', 'OB', 'CHoCH']

const TOOLBAR_GROUPS = [
  {
    id: 'cursor', label: 'Curseur', tools: null,
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 2L12 7.5L7.5 9L6 13L3 2Z" fill="currentColor"/></svg>
  },
  {
    id: 'fibonacci', label: 'Fibonacci',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="2" y1="11" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="8.5" x2="13" y2="8.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/><line x1="2" y1="6.5" x2="13" y2="6.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/></svg>,
    tools: [
      { id: 'fib_ret', label: 'Retracement de Fibonacci' },
      { id: 'fib_fan', label: 'Eventail de Fibonacci' },
      { id: 'fib_tz', label: 'Fuseaux horaires de Fibonacci' },
      { id: 'fib_ext', label: 'Extension de Fibonacci' },
    ]
  },
  {
    id: 'lines', label: 'Lignes',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="2" y1="13" x2="13" y2="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="2" cy="13" r="1.5" fill="currentColor"/><circle cx="13" cy="2" r="1.5" fill="currentColor"/></svg>,
    tools: [
      { id: 'line_v', label: 'Ligne verticale' },
      { id: 'line_h', label: 'Ligne horizontale' },
      { id: 'line_t', label: 'Ligne de tendance' },
      { id: 'line_r', label: 'Rayon' },
      { id: 'line_a', label: 'Fleche' },
    ]
  },
  {
    id: 'shapes', label: 'Formes',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="4" width="11" height="7" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    tools: [
      { id: 'rect', label: 'Rectangle' },
      { id: 'ellipse', label: 'Ellipse' },
    ]
  },
  {
    id: 'rr', label: 'Risque/Rendement',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="4" rx="1" fill="rgba(0,204,102,0.3)" stroke="#00cc66" strokeWidth="1"/><rect x="2" y="9" width="11" height="4" rx="1" fill="rgba(255,68,68,0.3)" stroke="#ff4444" strokeWidth="1"/></svg>,
    tools: [
      { id: 'rr_buy', label: 'Achat risque-rendement' },
      { id: 'rr_sell', label: 'Vente risque-rendement' },
    ]
  },
  { id: 'divider' },
  {
    id: 'text', label: 'Texte', tools: null,
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><text x="2" y="13" fontSize="13" fontWeight="bold" fill="currentColor" fontFamily="serif">T</text></svg>
  },
  {
    id: 'measure', label: 'Mesure', tools: null,
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="2" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="5" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5"/><line x1="13" y1="5" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
  },
  {
    id: 'eraser', label: 'Effacer', tools: null,
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M9 2L13 6L6 13H2V9L9 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="6.5" y1="4.5" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1"/></svg>
  },
  {
    id: 'screenshot', label: 'Capture', tools: null,
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="4" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="7.5" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 4L6.5 2H8.5L9.5 4" stroke="currentColor" strokeWidth="1.2"/></svg>
  },
  {
    id: 'alert', label: 'Alerte', tools: null,
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L9.5 6H13.5L10.5 8.5L11.5 12.5L7.5 10L3.5 12.5L4.5 8.5L1.5 6H5.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
  },
]

function calcEMA(candles, period) {
  const k = 2 / (period + 1); let ema = candles[0].close
  return candles.map(c => { ema = c.close * k + ema * (1 - k); return ema })
}
function detectFVG(candles) {
  const fvgs = []
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1], next = candles[i + 1]
    if (next.low > prev.high) fvgs.push({ type: 'bull', top: next.low, bottom: prev.high, index: i })
    if (next.high < prev.low) fvgs.push({ type: 'bear', top: prev.low, bottom: next.high, index: i })
  }
  return fvgs
}
function detectBOS(candles) {
  const result = [], lb = 8
  for (let i = lb; i < candles.length; i++) {
    const w = candles.slice(i - lb, i)
    const sh = Math.max(...w.map(c => c.high)), sl = Math.min(...w.map(c => c.low))
    if (candles[i].close > sh && (result.length === 0 || result[result.length - 1].index < i - 3))
      result.push({ type: 'bull', price: sh, index: i })
    if (candles[i].close < sl && (result.length === 0 || result[result.length - 1].index < i - 3))
      result.push({ type: 'bear', price: sl, index: i })
  }
  return result.slice(-6)
}
function detectCHoCH(candles) {
  const result = []; let lastDir = null
  for (let i = 5; i < candles.length; i++) {
    const slice = candles.slice(i - 5, i)
    const isUp = candles[i].close > Math.max(...slice.map(c => c.high))
    const isDown = candles[i].close < Math.min(...slice.map(c => c.low))
    if (isUp && lastDir === 'bear') { result.push({ type: 'bull', price: candles[i].close, index: i }); lastDir = 'bull' }
    else if (isDown && lastDir === 'bull') { result.push({ type: 'bear', price: candles[i].close, index: i }); lastDir = 'bear' }
    else if (!lastDir) lastDir = candles[i].close > candles[i].open ? 'bull' : 'bear'
  }
  return result.slice(-4)
}
function detectOrderBlocks(candles) {
  const obs = []
  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i], n1 = candles[i + 1], n2 = candles[i + 2]
    const bullMove = (n1.close - n1.open) / n1.open > 0.003 && (n2.close - n2.open) / n2.open > 0.001
    const bearMove = (n1.open - n1.close) / n1.open > 0.003 && (n2.open - n2.close) / n2.open > 0.001
    if (c.close < c.open && bullMove) obs.push({ type: 'bull', top: Math.max(c.open, c.close), bottom: Math.min(c.open, c.close), index: i })
    if (c.close > c.open && bearMove) obs.push({ type: 'bear', top: Math.max(c.open, c.close), bottom: Math.min(c.open, c.close), index: i })
  }
  return obs.slice(-6)
}

function drawChart(canvas, candles, activeIndicators) {
  if (!canvas || !candles.length) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const PAD = { top: 20, right: 80, bottom: 40, left: 10 }
  const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#080f08'; ctx.fillRect(0, 0, W, H)
  const prices = candles.flatMap(c => [c.high, c.low])
  const minP = Math.min(...prices) * 0.9995, maxP = Math.max(...prices) * 1.0005
  const priceRange = maxP - minP
  const toX = (i) => PAD.left + (i / (candles.length - 1)) * chartW
  const toY = (p) => PAD.top + ((maxP - p) / priceRange) * chartH
  ctx.strokeStyle = '#1a2e1a'; ctx.lineWidth = 0.5
  for (let i = 0; i <= 5; i++) {
    const y = PAD.top + (i / 5) * chartH
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke()
    ctx.fillStyle = '#3a5a3a'; ctx.font = '10px Courier New'; ctx.textAlign = 'left'
    ctx.fillText((maxP - (i / 5) * priceRange).toFixed(maxP > 100 ? 1 : 4), W - PAD.right + 4, y + 3)
  }
  const candleW = Math.max(2, chartW / candles.length - 1)
  if (activeIndicators.includes('OB')) {
    detectOrderBlocks(candles).forEach(ob => {
      const x = toX(ob.index), top = toY(ob.top), bot = toY(ob.bottom)
      ctx.fillStyle = ob.type === 'bull' ? 'rgba(0,204,102,0.12)' : 'rgba(255,68,68,0.12)'
      ctx.strokeStyle = ob.type === 'bull' ? 'rgba(0,204,102,0.4)' : 'rgba(255,68,68,0.4)'
      ctx.lineWidth = 1; ctx.fillRect(x, top, chartW - x + PAD.left, bot - top); ctx.strokeRect(x, top, chartW - x + PAD.left, bot - top)
      ctx.fillStyle = ob.type === 'bull' ? '#00cc66' : '#ff4444'; ctx.font = 'bold 9px Courier New'
      ctx.fillText('OB ' + (ob.type === 'bull' ? '\u25B2' : '\u25BC'), x + 2, top - 2)
    })
  }
  if (activeIndicators.includes('FVG')) {
    detectFVG(candles).forEach(fvg => {
      const x = toX(fvg.index), top = toY(fvg.top), bot = toY(fvg.bottom)
      ctx.fillStyle = fvg.type === 'bull' ? 'rgba(0,204,102,0.08)' : 'rgba(255,153,0,0.08)'
      ctx.strokeStyle = fvg.type === 'bull' ? 'rgba(0,204,102,0.3)' : 'rgba(255,153,0,0.3)'
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1
      ctx.fillRect(x - candleW, top, chartW - x + PAD.left + candleW, bot - top)
      ctx.strokeRect(x - candleW, top, chartW - x + PAD.left + candleW, bot - top)
      ctx.setLineDash([]); ctx.fillStyle = fvg.type === 'bull' ? '#00cc66' : '#ff9900'
      ctx.font = '8px Courier New'; ctx.fillText('FVG', x - candleW + 2, top - 2)
    })
  }
  candles.forEach((c, i) => {
    const x = toX(i), open = toY(c.open), close = toY(c.close), high = toY(c.high), low = toY(c.low)
    const bull = c.close >= c.open, color = bull ? '#00cc66' : '#ff4444'
    ctx.strokeStyle = color; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, high); ctx.lineTo(x, low); ctx.stroke()
    ctx.fillStyle = bull ? 'rgba(0,204,102,0.85)' : 'rgba(255,68,68,0.85)'
    ctx.fillRect(x - candleW / 2, Math.min(open, close), candleW, Math.max(1, Math.abs(close - open)))
  })
  if (activeIndicators.includes('EMA')) {
    [{ period: 20, color: '#c9a227' }, { period: 50, color: '#00aaff' }, { period: 200, color: '#ff6600' }].forEach(({ period, color }) => {
      if (candles.length < period) return
      const emas = calcEMA(candles, period)
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([])
      ctx.beginPath(); emas.forEach((e, i) => { const x = toX(i), y = toY(e); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }); ctx.stroke()
      ctx.fillStyle = color; ctx.font = '9px Courier New'
      ctx.fillText('EMA' + period, W - PAD.right + 4, toY(emas[emas.length - 1]) + 3)
    })
  }
  if (activeIndicators.includes('BOS')) {
    detectBOS(candles).forEach(b => {
      const y = toY(b.price), x = toX(b.index)
      ctx.strokeStyle = b.type === 'bull' ? '#00cc66' : '#ff4444'; ctx.lineWidth = 1; ctx.setLineDash([5, 3])
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(W - PAD.right, y); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = b.type === 'bull' ? '#00cc66' : '#ff4444'; ctx.font = 'bold 9px Courier New'
      ctx.fillText('BOS ' + (b.type === 'bull' ? '\u25B2' : '\u25BC'), x + 2, y - 2)
    })
  }
  if (activeIndicators.includes('CHoCH')) {
    detectCHoCH(candles).forEach(c => {
      const y = toY(c.price), x = toX(c.index)
      ctx.strokeStyle = c.type === 'bull' ? '#00ffaa' : '#ff88aa'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 4])
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(W - PAD.right, y); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = c.type === 'bull' ? '#00ffaa' : '#ff88aa'; ctx.font = 'bold 9px Courier New'
      ctx.fillText('CHoCH', x + 2, y - 2)
    })
  }
  const lastClose = candles[candles.length - 1].close, lastY = toY(lastClose)
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1; ctx.setLineDash([2, 2])
  ctx.beginPath(); ctx.moveTo(PAD.left, lastY); ctx.lineTo(W - PAD.right, lastY); ctx.stroke(); ctx.setLineDash([])
  ctx.fillStyle = '#c9a227'; ctx.fillRect(W - PAD.right, lastY - 8, PAD.right - 2, 16)
  ctx.fillStyle = '#000'; ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'
  ctx.fillText(lastClose.toFixed(lastClose > 100 ? 1 : 4), W - PAD.right / 2, lastY + 3); ctx.textAlign = 'left'
}

function DrawingToolbar({ activeTool, onSelectTool }) {
  const [openGroup, setOpenGroup] = useState(null)
  const timerRef = useRef(null)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      background: '#0a140a', border: '1px solid #1e3a1e', borderRadius: '10px',
      padding: '6px 4px', width: '36px', flexShrink: 0, position: 'relative', zIndex: 20,
    }}>
      {TOOLBAR_GROUPS.map((group, idx) => {
        if (group.id === 'divider') return (
          <div key={idx} style={{ width: '20px', height: '1px', background: '#1a2e1a', margin: '2px 0' }} />
        )
        const isActive = activeTool === group.id || (group.tools && group.tools.some(t => t.id === activeTool))
        const isOpen = openGroup === group.id
        return (
          <div key={group.id} style={{ position: 'relative' }}
            onMouseEnter={() => { clearTimeout(timerRef.current); if (group.tools) setOpenGroup(group.id) }}
            onMouseLeave={() => { timerRef.current = setTimeout(() => setOpenGroup(null), 180) }}
          >
            <button
              onClick={() => { if (!group.tools) onSelectTool(group.id) }}
              title={!group.tools ? group.label : undefined}
              style={{
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? '#1a3a0a' : 'transparent',
                border: `1px solid ${isActive ? '#c9a227' : 'transparent'}`,
                borderRadius: '6px', color: isActive ? '#c9a227' : '#5a8a5a',
                cursor: 'pointer', transition: 'all 0.12s', position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#00cc66'; e.currentTarget.style.background = '#0f1f0f' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#5a8a5a'; e.currentTarget.style.background = 'transparent' } }}
            >
              {group.icon}
              {group.tools && (
                <span style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '5px', color: 'currentColor', opacity: 0.6, lineHeight: 1 }}>&#9654;</span>
              )}
            </button>

            {group.tools && isOpen && (
              <div
                onMouseEnter={() => clearTimeout(timerRef.current)}
                onMouseLeave={() => { timerRef.current = setTimeout(() => setOpenGroup(null), 180) }}
                style={{
                  position: 'absolute', left: '34px', top: '0',
                  background: '#0d1a0d', border: '1px solid #1a3a1a',
                  borderRadius: '8px', minWidth: '220px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)', zIndex: 999, overflow: 'hidden',
                }}
              >
                <div style={{ padding: '5px 10px', fontSize: '9px', color: '#3a5a3a', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #1a2e1a', fontFamily: "'Courier New', monospace" }}>
                  {group.label}
                </div>
                {group.tools.map(tool => (
                  <div key={tool.id}
                    onClick={() => { onSelectTool(tool.id); setOpenGroup(null) }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: activeTool === tool.id ? '#c9a227' : '#9abf9a', background: activeTool === tool.id ? '#1a3a0a' : 'transparent', fontFamily: "'Courier New', monospace", display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => { if (activeTool !== tool.id) e.currentTarget.style.background = '#0f1f0f' }}
                    onMouseLeave={e => { if (activeTool !== tool.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: activeTool === tool.id ? '#c9a227' : '#2a4a2a', flexShrink: 0 }} />
                    {tool.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function getToolLabel(id) {
  for (const g of TOOLBAR_GROUPS) {
    if (g.id === id) return g.label
    if (g.tools) { const t = g.tools.find(t => t.id === id); if (t) return t.label }
  }
  return null
}

export default function TradingChart() {
  const [pair, setPair] = useState('BTCUSDT')
  const [tf, setTf] = useState('1h')
  const [candles, setCandles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeIndicators, setActiveIndicators] = useState(['EMA', 'FVG', 'BOS', 'OB'])
  const [showPairs, setShowPairs] = useState(false)
  const [stats, setStats] = useState(null)
  const [activeTool, setActiveTool] = useState('cursor')
  const canvasRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${tf}&limit=120`)
      if (!res.ok) throw new Error('Erreur Binance API')
      const raw = await res.json()
      const parsed = raw.map(k => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]) }))
      setCandles(parsed)
      const first = parsed[0].close, last = parsed[parsed.length - 1].close
      setStats({ last, change: ((last - first) / first) * 100, high24: Math.max(...parsed.map(c => c.high)), low24: Math.min(...parsed.map(c => c.low)) })
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [pair, tf])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !candles.length) return
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; drawChart(canvas, candles, activeIndicators) }
    resize(); window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [candles, activeIndicators])

  const toggleIndicator = (ind) => setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind])
  const indicatorColors = { EMA: '#c9a227', FVG: '#00cc66', BOS: '#00aaff', OB: '#ff9900', CHoCH: '#ff88aa' }
  const toolLabel = getToolLabel(activeTool)

  return (
    <div style={{ padding: '20px', minHeight: '100vh', fontFamily: "'Courier New', monospace" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={20} color="#c9a227" />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#e0e0e0', letterSpacing: '1px' }}>PHG TRADING CHART</div>
            <div style={{ fontSize: '11px', color: '#5a7a5a' }}>ICT Analysis · Binance Live Data</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowPairs(!showPairs)} style={{ background: '#0d1a0d', border: '1px solid #c9a227', color: '#c9a227', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {pair} <ChevronDown size={12} />
            </button>
            {showPairs && (
              <div style={{ position: 'absolute', top: '36px', left: 0, background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '8px', zIndex: 100, minWidth: '140px' }}>
                {PAIRS.map(p => (
                  <div key={p} onClick={() => { setPair(p); setShowPairs(false) }}
                    style={{ padding: '8px 14px', cursor: 'pointer', color: p === pair ? '#c9a227' : '#e0e0e0', fontSize: '12px', background: p === pair ? '#1a2e0a' : 'none' }}>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {TIMEFRAMES.map(t => (
              <button key={t.value} onClick={() => setTf(t.value)} style={{ background: tf === t.value ? '#1a2e0a' : '#0d150d', border: `1px solid ${tf === t.value ? '#00cc66' : '#1a2e1a'}`, color: tf === t.value ? '#00cc66' : '#5a7a5a', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', fontWeight: '700' }}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} disabled={loading} style={{ background: '#1a2e0a', border: '1px solid #c9a227', color: '#c9a227', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#5a7a5a' }}>PRIX</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#e0e0e0' }}>{stats.last > 100 ? stats.last.toFixed(2) : stats.last.toFixed(5)}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: stats.change >= 0 ? '#00cc66' : '#ff4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {stats.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
            </span>
          </div>
          {[['HAUT', stats.high24, '#00cc66'], ['BAS', stats.low24, '#ff4444']].map(([label, val, color]) => (
            <div key={label} style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '8px', padding: '10px 16px' }}>
              <div style={{ fontSize: '10px', color: '#5a7a5a', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color }}>{val > 100 ? val.toFixed(2) : val.toFixed(5)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Indicators */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {INDICATORS.map(ind => (
          <button key={ind} onClick={() => toggleIndicator(ind)} style={{ background: activeIndicators.includes(ind) ? '#0a1a0a' : '#080f08', border: `1px solid ${activeIndicators.includes(ind) ? indicatorColors[ind] : '#1a2e1a'}`, color: activeIndicators.includes(ind) ? indicatorColors[ind] : '#3a4a3a', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', fontWeight: '700' }}>
            {ind}
          </button>
        ))}
      </div>

      {/* Chart + Toolbar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <DrawingToolbar activeTool={activeTool} onSelectTool={setActiveTool} />
        <div style={{ flex: 1 }}>
          {activeTool !== 'cursor' && toolLabel && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '3px 10px', background: '#0a1a0a', border: '1px solid #1a3a0a', borderRadius: '6px', fontSize: '11px', color: '#c9a227', fontFamily: 'inherit' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c9a227' }} />
              {toolLabel}
              <button onClick={() => setActiveTool('cursor')} style={{ background: 'none', border: 'none', color: '#5a7a5a', cursor: 'pointer', fontSize: '11px', padding: '0 0 0 4px' }}>✕</button>
            </div>
          )}
          <div style={{ background: '#080f08', border: '1px solid #1a2e1a', borderRadius: '12px', overflow: 'hidden', height: '460px', position: 'relative' }}>
            {error && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4444', fontSize: '14px' }}>⚠️ {error}</div>}
            {loading && !candles.length && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a7a5a', fontSize: '13px', gap: '8px' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Chargement Binance...
              </div>
            )}
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
        {[['EMA 20', '#c9a227'], ['EMA 50', '#00aaff'], ['EMA 200', '#ff6600'], ['FVG Bull', '#00cc66'], ['FVG Bear', '#ff9900'], ['BOS', '#00cc66'], ['OB', '#ff9900'], ['CHoCH', '#ff88aa']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '3px', background: color, borderRadius: '2px' }} />
            <span style={{ fontSize: '10px', color: '#3a4a3a' }}>{label}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}