import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, RefreshCw, BarChart2, List, Settings, ChevronDown, Zap, FlaskConical, TrendingUp, TrendingDown, Square } from 'lucide-react'

const PAIRS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT']
const TIMEFRAMES = [{label:'15m',value:'15m'},{label:'1h',value:'1h'},{label:'4h',value:'4h'},{label:'1j',value:'1d'}]
const MODES = [
  {id:'demo',label:'DEMO',color:'#c9a227',desc:'Données simulées · Sans API'},
  {id:'backtest',label:'BACKTEST',color:'#00aaff',desc:'Historique réel Binance'},
  {id:'paper',label:'PAPER LIVE',color:'#00cc66',desc:'Prix réels · Trades virtuels'},
]

function calcEMA(candles, period) {
  const k = 2/(period+1); let ema = candles[0].close
  return candles.map(c => { ema = c.close*k + ema*(1-k); return ema })
}

function genDemoCandles(n=300) {
  let price = 45000+Math.random()*10000
  return Array.from({length:n},(_,i)=>{
    const change=(Math.random()-0.48)*price*0.012
    const open=price, close=Math.max(100,price+change)
    const high=Math.max(open,close)*(1+Math.random()*0.005)
    const low=Math.min(open,close)*(1-Math.random()*0.005)
    price=close
    return {time:Date.now()-(n-i)*3600000,open,high,low,close}
  })
}

function runStrategy(candles,config) {
  const {sl_pips,rr,ema_fast,ema_slow,capital,risk_pct,use_fvg,use_bos,use_ob}=config
  let ema_f=candles[0].close, ema_s=candles[0].close
  const kf=2/(ema_fast+1), ks=2/(ema_slow+1)
  const trades=[],equityCurve=[capital]
  let equity=capital, peak=capital, maxDD=0
  const lb=8
  for(let i=lb;i<candles.length-5;i++){
    ema_f=candles[i].close*kf+ema_f*(1-kf)
    ema_s=candles[i].close*ks+ema_s*(1-ks)
    const c=candles[i],prev=candles[i-1],next=candles[i+1]
    const bullTrend=ema_f>ema_s, bearTrend=ema_f<ema_s
    const win=candles.slice(i-lb,i)
    const swH=Math.max(...win.map(x=>x.high)), swL=Math.min(...win.map(x=>x.low))
    const bos_b=!use_bos||c.close>swH, bos_s=!use_bos||c.close<swL
    const fvg_b=!use_fvg||(i>0&&next&&next.low>prev.high)
    const fvg_s=!use_fvg||(i>0&&next&&next.high<prev.low)
    const ob_b=!use_ob||(prev.close<prev.open&&c.close>c.open)
    const ob_s=!use_ob||(prev.close>prev.open&&c.close<c.open)
    const long=bullTrend&&bos_b&&fvg_b&&ob_b
    const short=bearTrend&&bos_s&&fvg_s&&ob_s
    if(!long&&!short){equityCurve.push(equity);continue}
    const dir=long?'BUY':'SELL', entry=c.close
    const sl=dir==='BUY'?entry*(1-sl_pips/10000):entry*(1+sl_pips/10000)
    const tp=dir==='BUY'?entry*(1+sl_pips*rr/10000):entry*(1-sl_pips*rr/10000)
    let win2=false, exit_price=sl
    for(let j=i+1;j<Math.min(i+25,candles.length);j++){
      const fc=candles[j]
      if(dir==='BUY'){if(fc.low<=sl){win2=false;exit_price=sl;break}if(fc.high>=tp){win2=true;exit_price=tp;break}}
      else{if(fc.high>=sl){win2=false;exit_price=sl;break}if(fc.low<=tp){win2=true;exit_price=tp;break}}
      exit_price=fc.close; win2=dir==='BUY'?fc.close>entry:fc.close<entry
    }
    const risk_amount=equity*(risk_pct/100)
    const pnl=win2?risk_amount*rr:-risk_amount
    equity=Math.max(0,equity+pnl); peak=Math.max(peak,equity)
    const dd=((peak-equity)/peak)*100; if(dd>maxDD)maxDD=dd
    trades.push({dir,entry:entry.toFixed(2),exit:exit_price.toFixed(2),sl:sl.toFixed(2),tp:tp.toFixed(2),win:win2,pnl:pnl.toFixed(2),equity:equity.toFixed(2),time:new Date(c.time).toLocaleDateString('fr-FR')})
    equityCurve.push(equity); i+=4
  }
  const wins=trades.filter(t=>t.win).length
  const gw=trades.filter(t=>t.win).reduce((s,t)=>s+parseFloat(t.pnl),0)
  const gl=Math.abs(trades.filter(t=>!t.win).reduce((s,t)=>s+parseFloat(t.pnl),0))
  return {trades,equityCurve,stats:{total:trades.length,wins,losses:trades.length-wins,winrate:trades.length?((wins/trades.length)*100).toFixed(1):0,maxDD:maxDD.toFixed(1),profitFactor:gl>0?(gw/gl).toFixed(2):'∞',totalPnl:(equity-capital).toFixed(2),finalEquity:equity.toFixed(2)}}
}

function EquityChart({curve,capital,color='#00cc66'}) {
  const ref=useRef(null)
  useEffect(()=>{
    const c=ref.current; if(!c||curve.length<2)return
    c.width=c.offsetWidth; c.height=c.offsetHeight
    const ctx=c.getContext('2d'),W=c.width,H=c.height
    const PAD={top:12,right:16,bottom:20,left:65}
    const cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#080f08'; ctx.fillRect(0,0,W,H)
    const mn=Math.min(...curve)*0.995, mx=Math.max(...curve)*1.005
    const tx=i=>PAD.left+(i/(curve.length-1))*cW
    const ty=v=>PAD.top+((mx-v)/(mx-mn))*cH
    for(let i=0;i<=4;i++){
      const y=PAD.top+(i/4)*cH
      ctx.strokeStyle='#1a2e1a'; ctx.lineWidth=0.5
      ctx.beginPath(); ctx.moveTo(PAD.left,y); ctx.lineTo(W-PAD.right,y); ctx.stroke()
      ctx.fillStyle='#3a5a3a'; ctx.font='9px Courier New'; ctx.textAlign='right'
      ctx.fillText(Math.round(mx-(i/4)*(mx-mn)).toLocaleString(),PAD.left-3,y+3)
    }
    ctx.strokeStyle='#2a3a2a'; ctx.lineWidth=1; ctx.setLineDash([4,4])
    const cy=ty(capital); ctx.beginPath(); ctx.moveTo(PAD.left,cy); ctx.lineTo(W-PAD.right,cy); ctx.stroke(); ctx.setLineDash([])
    const grad=ctx.createLinearGradient(0,PAD.top,0,H)
    grad.addColorStop(0,color+'40'); grad.addColorStop(1,color+'05')
    ctx.beginPath(); curve.forEach((v,i)=>{const x=tx(i),y=ty(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.lineTo(tx(curve.length-1),H-PAD.bottom); ctx.lineTo(tx(0),H-PAD.bottom); ctx.closePath(); ctx.fillStyle=grad; ctx.fill()
    ctx.strokeStyle=color; ctx.lineWidth=2
    ctx.beginPath(); curve.forEach((v,i)=>{const x=tx(i),y=ty(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}); ctx.stroke()
    const lx=tx(curve.length-1),ly=ty(curve[curve.length-1])
    ctx.fillStyle=color; ctx.beginPath(); ctx.arc(lx,ly,4,0,Math.PI*2); ctx.fill()
  },[curve,capital,color])
  return <canvas ref={ref} style={{width:'100%',height:'100%',display:'block'}}/>
}

export default function Backtesting() {
  const [mode,setMode]=useState('backtest')
  const [subMode,setSubMode]=useState('auto') // auto | manual
  const [config,setConfig]=useState({pair:'BTCUSDT',tf:'1h',sl_pips:50,rr:2,ema_fast:20,ema_slow:50,capital:10000,risk_pct:1,use_fvg:true,use_bos:true,use_ob:true})
  const [result,setResult]=useState(null)
  const [loading,setLoading]=useState(false)
  const [tab,setTab]=useState('stats')
  const [showPairs,setShowPairs]=useState(false)
  const [error,setError]=useState(null)

  // Paper state
  const [paperTrades,setPaperTrades]=useState([])
  const [paperEquity,setPaperEquity]=useState([])
  const [paperRunning,setPaperRunning]=useState(false)
  const [livePrice,setLivePrice]=useState(null)
  const [liveCandles,setLiveCandles]=useState([])
  const [openTrade,setOpenTrade]=useState(null)
  const paperRef=useRef(null)
  const equityRef=useRef([10000])
  const statsRef=useRef({equity:10000,wins:0,losses:0,total:0})
  const [paperStats,setPaperStats]=useState({equity:10000,wins:0,losses:0,total:0})

  const upd=(k,v)=>setConfig(p=>({...p,[k]:v}))

  // ── AUTO BACKTEST / DEMO ──
  const runBacktest=useCallback(async()=>{
    setLoading(true); setError(null); setResult(null)
    try{
      let candles
      if(mode==='demo'){await new Promise(r=>setTimeout(r,900));candles=genDemoCandles(300)}
      else{
        const res=await fetch(`https://api.binance.com/api/v3/klines?symbol=${config.pair}&interval=${config.tf}&limit=500`)
        if(!res.ok)throw new Error('Erreur Binance API')
        const raw=await res.json()
        candles=raw.map(k=>({time:k[0],open:parseFloat(k[1]),high:parseFloat(k[2]),low:parseFloat(k[3]),close:parseFloat(k[4])}))
      }
      setResult(runStrategy(candles,config))
    }catch(e){setError(e.message)}
    setLoading(false)
  },[mode,config])

  // ── PAPER: fetch live price ──
  const fetchLive=useCallback(async()=>{
    try{
      const res=await fetch(`https://api.binance.com/api/v3/klines?symbol=${config.pair}&interval=1m&limit=30`)
      if(!res.ok)return
      const raw=await res.json()
      const candles=raw.map(k=>({time:k[0],open:parseFloat(k[1]),high:parseFloat(k[2]),low:parseFloat(k[3]),close:parseFloat(k[4])}))
      setLiveCandles(candles)
      setLivePrice(candles[candles.length-1].close)

      // AUTO mode: trigger signal automatically
      if(subMode==='auto'&&!openTrade){
        const emas=calcEMA(candles,config.ema_fast)
        const emasl=calcEMA(candles,Math.min(config.ema_slow,candles.length-1))
        const bull=emas[emas.length-1]>emasl[emasl.length-1]
        const c=candles[candles.length-2], prev=candles[candles.length-3]
        const ob_b=prev.close<prev.open&&c.close>c.open
        const ob_s=prev.close>prev.open&&c.close<c.open
        if(bull&&ob_b) executePaperTrade('BUY',candles[candles.length-1].close)
        else if(!bull&&ob_s) executePaperTrade('SELL',candles[candles.length-1].close)
      }

      // Close open trade if TP/SL hit
      if(openTrade){
        const price=candles[candles.length-1].close
        const {dir,entry,sl,tp}=openTrade
        const hitTP=dir==='BUY'?price>=tp:price<=tp
        const hitSL=dir==='BUY'?price<=sl:price>=sl
        if(hitTP||hitSL) closePaperTrade(price,hitTP)
      }
    }catch(e){}
  },[config,subMode,openTrade])

  useEffect(()=>{
    if(mode==='paper'&&paperRunning){
      paperRef.current=setInterval(fetchLive,10000)
      fetchLive()
    }else{clearInterval(paperRef.current)}
    return()=>clearInterval(paperRef.current)
  },[mode,paperRunning,fetchLive])

  const executePaperTrade=(dir,price)=>{
    if(openTrade)return
    const sl=dir==='BUY'?price*(1-config.sl_pips/10000):price*(1+config.sl_pips/10000)
    const tp=dir==='BUY'?price*(1+config.sl_pips*config.rr/10000):price*(1-config.sl_pips*config.rr/10000)
    setOpenTrade({dir,entry:price,sl,tp,time:new Date().toLocaleTimeString('fr-FR')})
  }

  const closePaperTrade=(price,win)=>{
    if(!openTrade)return
    const risk=statsRef.current.equity*(config.risk_pct/100)
    const pnl=win?risk*config.rr:-risk
    const newEq=Math.max(0,statsRef.current.equity+pnl)
    const ns={equity:newEq,wins:statsRef.current.wins+(win?1:0),losses:statsRef.current.losses+(win?0:1),total:statsRef.current.total+1}
    statsRef.current=ns
    equityRef.current=[...equityRef.current,newEq]
    setPaperStats({...ns})
    setPaperEquity([...equityRef.current])
    setPaperTrades(p=>[{dir:openTrade.dir,entry:openTrade.entry.toFixed(2),exit:price.toFixed(2),pnl:pnl.toFixed(2),equity:newEq.toFixed(2),win,time:new Date().toLocaleTimeString('fr-FR')},...p.slice(0,49)])
    setOpenTrade(null)
  }

  const resetPaper=()=>{
    setPaperTrades([]); equityRef.current=[config.capital]; statsRef.current={equity:config.capital,wins:0,losses:0,total:0}
    setPaperStats({equity:config.capital,wins:0,losses:0,total:0}); setPaperEquity([config.capital]); setOpenTrade(null); setLivePrice(null)
  }

  const s=result?.stats

  return (
    <div style={{padding:'20px',minHeight:'100vh',fontFamily:"'Courier New', monospace"}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px',flexWrap:'wrap',gap:'10px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <BarChart2 size={20} color="#c9a227"/>
          <div>
            <div style={{fontSize:'18px',fontWeight:'700',color:'#e0e0e0',letterSpacing:'1px'}}>BACKTESTING PHG</div>
            <div style={{fontSize:'11px',color:'#5a7a5a'}}>{MODES.find(m=>m.id===mode)?.desc}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {MODES.map(m=>(
            <button key={m.id} onClick={()=>{setMode(m.id);setResult(null);setPaperRunning(false);resetPaper()}}
              style={{background:mode===m.id?'#0a1a0a':'#080f08',border:`1px solid ${mode===m.id?m.color:'#1a2e1a'}`,color:mode===m.id?m.color:'#5a7a5a',padding:'7px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:'700'}}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:'14px'}}>

        {/* Config */}
        <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'12px',padding:'14px'}}>
          <div style={{fontSize:'10px',color:'#c9a227',fontWeight:'700',letterSpacing:'1px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
            <Settings size={12}/> CONFIGURATION
          </div>

          {/* Sub-mode toggle — ALL modes */}
          <div style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'5px'}}>MODE DE TRADING</div>
            <div style={{display:'flex',gap:'4px'}}>
              {[['auto','🤖 AUTO'],['manual','✋ MANUEL']].map(([id,label])=>(
                <button key={id} onClick={()=>setSubMode(id)}
                  style={{flex:1,background:subMode===id?'#1a2e0a':'#0a120a',border:`1px solid ${subMode===id?'#c9a227':'#1a2e1a'}`,color:subMode===id?'#c9a227':'#5a7a5a',padding:'7px 4px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{fontSize:'9px',color:'#3a5a3a',marginTop:'4px'}}>
              {subMode==='auto'?'IA génère les signaux automatiquement':'Tu cliques BUY/SELL toi-même'}
            </div>
          </div>

          {/* Pair */}
          <div style={{marginBottom:'10px'}}>
            <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'4px'}}>PAIRE</div>
            <div style={{position:'relative'}}>
              <button onClick={()=>setShowPairs(!showPairs)} style={{width:'100%',background:'#0a120a',border:'1px solid #1a2e1a',color:'#e0e0e0',padding:'7px 10px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',fontWeight:'700',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                {config.pair} <ChevronDown size={12}/>
              </button>
              {showPairs&&(
                <div style={{position:'absolute',top:'34px',left:0,right:0,background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'6px',zIndex:100}}>
                  {PAIRS.map(p=><div key={p} onClick={()=>{upd('pair',p);setShowPairs(false)}} style={{padding:'7px 10px',cursor:'pointer',color:p===config.pair?'#c9a227':'#e0e0e0',fontSize:'12px',background:p===config.pair?'#1a2e0a':'none'}}>{p}</div>)}
                </div>
              )}
            </div>
          </div>

          {/* TF */}
          {mode!=='paper'&&(
            <div style={{marginBottom:'10px'}}>
              <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'4px'}}>TIMEFRAME</div>
              <div style={{display:'flex',gap:'4px'}}>
                {TIMEFRAMES.map(t=><button key={t.value} onClick={()=>upd('tf',t.value)} style={{flex:1,background:config.tf===t.value?'#1a2e0a':'#0a120a',border:`1px solid ${config.tf===t.value?'#00cc66':'#1a2e1a'}`,color:config.tf===t.value?'#00cc66':'#5a7a5a',padding:'5px 2px',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>{t.label}</button>)}
              </div>
            </div>
          )}

          {/* Sliders */}
          {[['Capital ($)','capital',1000,100000,1000],['Risque / trade (%)','risk_pct',0.5,5,0.5],['Stop Loss (pips)','sl_pips',10,200,10],['Risk / Reward','rr',1,5,0.5],['EMA Rapide','ema_fast',5,50,1],['EMA Lente','ema_slow',20,200,5]].map(([label,key,min,max,step])=>(
            <div key={key} style={{marginBottom:'9px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'2px'}}>
                <span style={{fontSize:'10px',color:'#5a7a5a'}}>{label}</span>
                <span style={{fontSize:'11px',color:'#c9a227',fontWeight:'700'}}>{config[key]}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={config[key]} onChange={e=>upd(key,parseFloat(e.target.value))} style={{width:'100%',accentColor:'#c9a227',cursor:'pointer'}}/>
            </div>
          ))}

          {/* ICT Filters */}
          <div style={{fontSize:'10px',color:'#5a7a5a',margin:'6px 0 5px',fontWeight:'700'}}>FILTRES ICT</div>
          {[['BOS','use_bos'],['FVG','use_fvg'],['OB','use_ob']].map(([label,key])=>(
            <div key={key} onClick={()=>upd(key,!config[key])} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:config[key]?'#0a1a0a':'#0a120a',border:`1px solid ${config[key]?'#00cc66':'#1a2e1a'}`,borderRadius:'6px',cursor:'pointer',marginBottom:'4px'}}>
              <span style={{fontSize:'12px',color:config[key]?'#e0e0e0':'#5a7a5a',fontWeight:'700'}}>{label}</span>
              <div style={{width:'28px',height:'14px',background:config[key]?'#00cc66':'#1a2e1a',borderRadius:'7px',position:'relative'}}>
                <div style={{position:'absolute',top:'1px',left:config[key]?'14px':'1px',width:'12px',height:'12px',background:'#fff',borderRadius:'50%',transition:'left 0.2s'}}/>
              </div>
            </div>
          ))}

          {/* CTA */}
          <div style={{marginTop:'12px'}}>
            {mode!=='paper'?(
              <button onClick={runBacktest} disabled={loading} style={{width:'100%',background:'#1a2e0a',border:`1px solid ${mode==='demo'?'#c9a227':'#00aaff'}`,color:mode==='demo'?'#c9a227':'#00aaff',padding:'10px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:loading?0.7:1}}>
                {loading?<RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/>:<Play size={14}/>}
                {loading?'Analyse...':`LANCER ${mode==='demo'?'DEMO':'BACKTEST'} ${subMode==='auto'?'AUTO':'MANUEL'}`}
              </button>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <button onClick={()=>setPaperRunning(!paperRunning)} style={{width:'100%',background:paperRunning?'#2e0a0a':'#0a2e0a',border:`1px solid ${paperRunning?'#ff4444':'#00cc66'}`,color:paperRunning?'#ff4444':'#00cc66',padding:'9px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px'}}>
                  {paperRunning?<><Square size={13}/> STOPPER</>:<><Zap size={13}/> DÉMARRER PAPER</>}
                </button>
                <button onClick={resetPaper} style={{width:'100%',background:'#0a120a',border:'1px solid #1a2e1a',color:'#5a7a5a',padding:'7px',borderRadius:'8px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit'}}>
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          {error&&<div style={{background:'#1a0a0a',border:'1px solid #ff4444',borderRadius:'8px',padding:'10px 14px',color:'#ff4444',fontSize:'12px',marginBottom:'10px'}}>⚠️ {error}</div>}

          {/* ─── PAPER LIVE UI ─── */}
          {mode==='paper'&&(
            <>
              {/* Live Price + Manual Controls */}
              <div style={{background:'#0d1a0d',border:`1px solid ${paperRunning?'#00cc66':'#1a2e1a'}`,borderRadius:'12px',padding:'16px 20px',marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
                  <div>
                    <div style={{fontSize:'11px',color:'#5a7a5a',marginBottom:'4px'}}>PRIX LIVE · {config.pair}</div>
                    <div style={{fontSize:'28px',fontWeight:'700',color:'#e0e0e0'}}>{livePrice?livePrice.toFixed(2):'—'}</div>
                    {paperRunning&&<div style={{fontSize:'10px',color:'#00cc66',marginTop:'2px',display:'flex',alignItems:'center',gap:'4px'}}><div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#00cc66'}}/> EN DIRECT · refresh 10s</div>}
                  </div>

                  {/* Open trade status */}
                  {openTrade&&(
                    <div style={{background:'#0a1a0a',border:'1px solid #c9a227',borderRadius:'8px',padding:'10px 14px',fontSize:'12px'}}>
                      <div style={{color:'#c9a227',fontWeight:'700',marginBottom:'4px'}}>TRADE OUVERT</div>
                      <div style={{color:openTrade.dir==='BUY'?'#00cc66':'#ff4444'}}>{openTrade.dir} @ {openTrade.entry.toFixed(2)}</div>
                      <div style={{color:'#5a7a5a',fontSize:'10px'}}>SL: {openTrade.sl.toFixed(2)} · TP: {openTrade.tp.toFixed(2)}</div>
                      {subMode==='manual'&&livePrice&&(
                        <div style={{display:'flex',gap:'6px',marginTop:'8px'}}>
                          <button onClick={()=>closePaperTrade(livePrice,true)} style={{background:'#0a2e0a',border:'1px solid #00cc66',color:'#00cc66',padding:'5px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>TP ✓</button>
                          <button onClick={()=>closePaperTrade(livePrice,false)} style={{background:'#2e0a0a',border:'1px solid #ff4444',color:'#ff4444',padding:'5px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>SL ✗</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual BUY/SELL */}
                  {subMode==='manual'&&!openTrade&&paperRunning&&(
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>executePaperTrade('BUY',livePrice||45000)} style={{background:'#0a2e0a',border:'2px solid #00cc66',color:'#00cc66',padding:'12px 24px',borderRadius:'10px',cursor:'pointer',fontSize:'14px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',gap:'6px'}}>
                        <TrendingUp size={16}/> BUY
                      </button>
                      <button onClick={()=>executePaperTrade('SELL',livePrice||45000)} style={{background:'#2e0a0a',border:'2px solid #ff4444',color:'#ff4444',padding:'12px 24px',borderRadius:'10px',cursor:'pointer',fontSize:'14px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',gap:'6px'}}>
                        <TrendingDown size={16}/> SELL
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Paper Stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'12px'}}>
                {[['Capital','$'+parseFloat(paperStats.equity).toFixed(0),paperStats.equity>=config.capital?'#00cc66':'#ff4444'],['Gains',paperStats.wins,'#00cc66'],['Pertes',paperStats.losses,'#ff4444'],['Trades',paperStats.total,'#c9a227']].map(([label,val,color])=>(
                  <div key={label} style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'8px',padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:'9px',color:'#5a7a5a',marginBottom:'3px'}}>{label}</div>
                    <div style={{fontSize:'18px',fontWeight:'700',color}}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Paper Equity Curve */}
              {paperEquity.length>1&&(
                <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'10px',padding:'12px',marginBottom:'12px',height:'160px'}}>
                  <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'6px',fontWeight:'700'}}>COURBE D'ÉQUITÉ PAPER</div>
                  <div style={{height:'120px'}}><EquityChart curve={paperEquity} capital={config.capital} color="#00cc66"/></div>
                </div>
              )}

              {/* Paper Trade Log */}
              <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'10px',overflow:'hidden',maxHeight:'260px',overflowY:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
                  <thead><tr style={{background:'#0a120a',position:'sticky',top:0}}>
                    {['#','Heure','Dir','Entrée','Sortie','P&L','Équité','Résultat'].map(h=><th key={h} style={{padding:'8px 10px',color:'#5a7a5a',textAlign:'left',fontWeight:'700',borderBottom:'1px solid #1a2e1a'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {paperTrades.length===0&&<tr><td colSpan="8" style={{padding:'20px',textAlign:'center',color:'#3a4a3