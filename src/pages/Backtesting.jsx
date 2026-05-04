import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, RefreshCw, BarChart2, Settings, ChevronDown, Zap, TrendingUp, TrendingDown, Square, Upload, Cpu, Webhook } from 'lucide-react'

const PAIRS = ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','XAUUSD','XAGUSD','NAS100','US30','BTCUSD']
const TIMEFRAMES = [{label:'15m',value:'15m'},{label:'1h',value:'1h'},{label:'4h',value:'4h'},{label:'1j',value:'1d'}]
const MODES = [
  {id:'demo',label:'DEMO',color:'#c9a227'},
  {id:'backtest',label:'BACKTEST',color:'#00aaff'},
  {id:'paper',label:'PAPER LIVE',color:'#00cc66'},
  {id:'robot',label:'ROBOT',color:'#ff88aa'},
]
const ROBOT_TYPES = [
  {id:'ai',label:'Robot IA Interne',icon:'Cpu',desc:'RSI+Momentum vs ICT en parallèle'},
  {id:'webhook',label:'cTrader Webhook',icon:'Webhook',desc:'Connecte FTMO_ICT_ELITE_PLUS'},
  {id:'import',label:'Import CSV/JSON',icon:'Upload',desc:'Importe trades robot externe'},
]

function calcEMA(candles,period){const k=2/(period+1);let e=candles[0].close;return candles.map(c=>{e=c.close*k+e*(1-k);return e})}

function genDemo(n=300){let p=45000+Math.random()*10000;return Array.from({length:n},(_,i)=>{const ch=(Math.random()-0.48)*p*0.012,o=p,c=Math.max(100,p+ch);p=c;return{time:Date.now()-(n-i)*3600000,open:o,high:Math.max(o,c)*(1+Math.random()*0.005),low:Math.min(o,c)*(1-Math.random()*0.005),close:c}})}

function runICT(candles,cfg){
  const{sl_pips:sl,rr,ema_fast:ef,ema_slow:es,capital:cap,risk_pct:rp,use_fvg,use_bos,use_ob}=cfg
  let ef_=candles[0].close,es_=candles[0].close
  const kf=2/(ef+1),ks=2/(es+1),trades=[],curve=[cap]
  let eq=cap,pk=cap,mdd=0
  for(let i=8;i<candles.length-5;i++){
    ef_=candles[i].close*kf+ef_*(1-kf);es_=candles[i].close*ks+es_*(1-ks)
    const c=candles[i],pv=candles[i-1],nx=candles[i+1],win=candles.slice(i-8,i)
    const sH=Math.max(...win.map(x=>x.high)),sL=Math.min(...win.map(x=>x.low))
    const long=ef_>es_&&(!use_bos||c.close>sH)&&(!use_fvg||nx.low>pv.high)&&(!use_ob||(pv.close<pv.open&&c.close>c.open))
    const short=ef_<es_&&(!use_bos||c.close<sL)&&(!use_fvg||nx.high<pv.low)&&(!use_ob||(pv.close>pv.open&&c.close<c.open))
    if(!long&&!short){curve.push(eq);continue}
    const dir=long?'BUY':'SELL',ent=c.close
    const slp=dir==='BUY'?ent*(1-sl/10000):ent*(1+sl/10000)
    const tp=dir==='BUY'?ent*(1+sl*rr/10000):ent*(1-sl*rr/10000)
    let w=false,ep=slp
    for(let j=i+1;j<Math.min(i+25,candles.length);j++){
      const fc=candles[j]
      if(dir==='BUY'){if(fc.low<=slp){w=false;ep=slp;break}if(fc.high>=tp){w=true;ep=tp;break}}
      else{if(fc.high>=slp){w=false;ep=slp;break}if(fc.low<=tp){w=true;ep=tp;break}}
      ep=fc.close;w=dir==='BUY'?fc.close>ent:fc.close<ent
    }
    const pnl=w?eq*(rp/100)*rr:-eq*(rp/100)
    eq=Math.max(0,eq+pnl);pk=Math.max(pk,eq)
    const dd=((pk-eq)/pk)*100;if(dd>mdd)mdd=dd
    trades.push({dir,entry:ent.toFixed(2),exit:ep.toFixed(2),win:w,pnl:pnl.toFixed(2),equity:eq.toFixed(2),time:new Date(c.time).toLocaleDateString('fr-FR')})
    curve.push(eq);i+=4
  }
  const wins=trades.filter(t=>t.win).length,gw=trades.filter(t=>t.win).reduce((s,t)=>s+parseFloat(t.pnl),0),gl=Math.abs(trades.filter(t=>!t.win).reduce((s,t)=>s+parseFloat(t.pnl),0))
  return{trades,curve,stats:{total:trades.length,wins,losses:trades.length-wins,winrate:trades.length?((wins/trades.length)*100).toFixed(1):0,maxDD:mdd.toFixed(1),pf:gl>0?(gw/gl).toFixed(2):'∞',pnl:(eq-cap).toFixed(2),final:eq.toFixed(2)}}
}

function runRobot(candles,cfg){
  const{capital:cap,risk_pct:rp,rr,sl_pips:sl}=cfg
  const trades=[],curve=[cap]
  let eq=cap,pk=cap,mdd=0
  for(let i=14;i<candles.length-3;i++){
    const sl2=candles.slice(i-14,i+1),cl=sl2.map(c=>c.close)
    const gains=cl.slice(1).map((v,j)=>Math.max(0,v-cl[j])),losses=cl.slice(1).map((v,j)=>Math.max(0,cl[j]-v))
    const ag=gains.reduce((a,b)=>a+b,0)/14,al=losses.reduce((a,b)=>a+b,0)/14
    const rsi=al===0?100:100-(100/(1+ag/al)),mom=cl[cl.length-1]-cl[cl.length-5]
    const long=rsi<35&&mom>0,short=rsi>65&&mom<0
    if(!long&&!short){curve.push(eq);continue}
    const dir=long?'BUY':'SELL',ent=candles[i].close
    const slp=dir==='BUY'?ent*(1-sl/10000):ent*(1+sl/10000)
    const tp=dir==='BUY'?ent*(1+sl*rr/10000):ent*(1-sl*rr/10000)
    let w=false,ep=slp
    for(let j=i+1;j<Math.min(i+20,candles.length);j++){
      const fc=candles[j]
      if(dir==='BUY'){if(fc.low<=slp){w=false;ep=slp;break}if(fc.high>=tp){w=true;ep=tp;break}}
      else{if(fc.high>=slp){w=false;ep=slp;break}if(fc.low<=tp){w=true;ep=tp;break}}
      ep=fc.close;w=dir==='BUY'?fc.close>ent:fc.close<ent
    }
    const pnl=w?eq*(rp/100)*rr:-eq*(rp/100)
    eq=Math.max(0,eq+pnl);pk=Math.max(pk,eq)
    const dd=((pk-eq)/pk)*100;if(dd>mdd)mdd=dd
    trades.push({dir,entry:ent.toFixed(2),exit:ep.toFixed(2),win:w,pnl:pnl.toFixed(2),equity:eq.toFixed(2),time:new Date(candles[i].time).toLocaleDateString('fr-FR')})
    curve.push(eq);i+=3
  }
  const wins=trades.filter(t=>t.win).length,gw=trades.filter(t=>t.win).reduce((s,t)=>s+parseFloat(t.pnl),0),gl=Math.abs(trades.filter(t=>!t.win).reduce((s,t)=>s+parseFloat(t.pnl),0))
  return{trades,curve,stats:{total:trades.length,wins,losses:trades.length-wins,winrate:trades.length?((wins/trades.length)*100).toFixed(1):0,maxDD:mdd.toFixed(1),pf:gl>0?(gw/gl).toFixed(2):'∞',pnl:(eq-cap).toFixed(2),final:eq.toFixed(2)}}
}

function EqChart({curves,capital,colors=['#00cc66']}){
  const ref=useRef(null)
  useEffect(()=>{
    const c=ref.current;if(!c||!curves[0]||curves[0].length<2)return
    c.width=c.offsetWidth;c.height=c.offsetHeight
    const ctx=c.getContext('2d'),W=c.width,H=c.height,PAD={top:12,right:16,bottom:20,left:70}
    const cW=W-PAD.left-PAD.right,cH=H-PAD.top-PAD.bottom
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#080f08';ctx.fillRect(0,0,W,H)
    const all=curves.flat(),mn=Math.min(...all)*0.995,mx=Math.max(...all)*1.005
    const tx=(i,n)=>PAD.left+(i/(n-1))*cW,ty=v=>PAD.top+((mx-v)/(mx-mn))*cH
    for(let i=0;i<=4;i++){const y=PAD.top+(i/4)*cH;ctx.strokeStyle='#1a2e1a';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(PAD.left,y);ctx.lineTo(W-PAD.right,y);ctx.stroke();ctx.fillStyle='#3a5a3a';ctx.font='9px Courier New';ctx.textAlign='right';ctx.fillText(Math.round(mx-(i/4)*(mx-mn)).toLocaleString(),PAD.left-3,y+3)}
    ctx.strokeStyle='#2a3a2a';ctx.lineWidth=1;ctx.setLineDash([4,4]);const cy=ty(capital);ctx.beginPath();ctx.moveTo(PAD.left,cy);ctx.lineTo(W-PAD.right,cy);ctx.stroke();ctx.setLineDash([])
    curves.forEach((curve,ci)=>{
      const col=colors[ci]||'#00cc66'
      const g=ctx.createLinearGradient(0,PAD.top,0,H);g.addColorStop(0,col+'25');g.addColorStop(1,col+'05')
      ctx.beginPath();curve.forEach((v,i)=>{const x=tx(i,curve.length),y=ty(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
      ctx.lineTo(tx(curve.length-1,curve.length),H-PAD.bottom);ctx.lineTo(tx(0,curve.length),H-PAD.bottom);ctx.closePath();ctx.fillStyle=g;ctx.fill()
      ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();curve.forEach((v,i)=>{const x=tx(i,curve.length),y=ty(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.stroke()
      const lx=tx(curve.length-1,curve.length),ly=ty(curve[curve.length-1]);ctx.fillStyle=col;ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fill()
    })
  },[curves,capital,colors])
  return <canvas ref={ref} style={{width:'100%',height:'100%',display:'block'}}/>
}

function TradeTable({trades,color}){
  return(
    <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'10px',overflow:'hidden',maxHeight:'300px',overflowY:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
        <thead><tr style={{background:'#0a120a',position:'sticky',top:0}}>
          {['#','Date','Dir','Entrée','Sortie','P&L','Équité','Résultat'].map(h=><th key={h} style={{padding:'7px 10px',color:'#5a7a5a',textAlign:'left',fontWeight:'700',borderBottom:'1px solid #1a2e1a'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {trades.length===0&&<tr><td colSpan="8" style={{padding:'20px',textAlign:'center',color:'#3a4a3a'}}>Aucun trade</td></tr>}
          {trades.map((t,idx)=>(
            <tr key={idx} style={{borderBottom:'1px solid #0a120a',background:idx%2===0?'#0d1a0d':'#0a150a'}}>
              <td style={{padding:'6px 10px',color:'#5a7a5a'}}>{idx+1}</td>
              <td style={{padding:'6px 10px',color:'#7a9a7a',fontSize:'10px'}}>{t.time}</td>
              <td style={{padding:'6px 10px'}}><span style={{background:t.dir==='BUY'?'#0a2e0a':'#2e0a0a',color:t.dir==='BUY'?'#00cc66':'#ff4444',padding:'2px 7px',borderRadius:'4px',fontSize:'10px',fontWeight:'700'}}>{t.dir}</span></td>
              <td style={{padding:'6px 10px',color:'#e0e0e0'}}>{t.entry}</td>
              <td style={{padding:'6px 10px',color:'#e0e0e0'}}>{t.exit}</td>
              <td style={{padding:'6px 10px',fontWeight:'700',color:parseFloat(t.pnl)>=0?'#00cc66':'#ff4444'}}>{parseFloat(t.pnl)>=0?'+':''}{parseFloat(t.pnl).toFixed(0)}$</td>
              <td style={{padding:'6px 10px',color:color||'#c9a227'}}>{parseFloat(t.equity).toFixed(0)}$</td>
              <td style={{padding:'6px 10px',color:t.win?'#00cc66':'#ff4444'}}>{t.win?'✓ WIN':'✗ LOSS'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Backtesting(){
  const [mode,setMode]=useState('backtest')
  const [subMode,setSubMode]=useState('auto')
  const [robotType,setRobotType]=useState('ai')
  const [cfg,setCfg]=useState({pair:'BTCUSDT',tf:'1h',sl_pips:50,rr:2,ema_fast:20,ema_slow:50,capital:10000,risk_pct:1,use_fvg:true,use_bos:true,use_ob:true})
  const [ictRes,setIctRes]=useState(null)
  const [botRes,setBotRes]=useState(null)
  const [loading,setLoading]=useState(false)
  const [tab,setTab]=useState('compare')
  const [showPairs,setShowPairs]=useState(false)
  const [period,setPeriod]=useState(500)
  const [error,setError]=useState(null)
  const [whLog,setWhLog]=useState([])
  const [importTxt,setImportTxt]=useState('')
  const [paperTrades,setPaperTrades]=useState([])
  const [paperEq,setPaperEq]=useState([10000])
  const [paperRun,setPaperRun]=useState(false)
  const [livePrice,setLivePrice]=useState(null)
  const [openTrade,setOpenTrade]=useState(null)
  const [pStats,setPStats]=useState({equity:10000,wins:0,losses:0,total:0})
  const pRef=useRef(null),eqRef=useRef([10000]),stRef=useRef({equity:10000,wins:0,losses:0,total:0})
  const upd=(k,v)=>setCfg(p=>({...p,[k]:v}))

  const fetchCandles=async()=>{
    if(mode==='demo')return genDemo(300)
    const res=await fetch(`https://api.binance.com/api/v3/klines?symbol=${cfg.pair}&interval=${cfg.tf}&limit=${period}`)
    if(!res.ok)throw new Error('Erreur Binance API')
    return(await res.json()).map(k=>({time:k[0],open:parseFloat(k[1]),high:parseFloat(k[2]),low:parseFloat(k[3]),close:parseFloat(k[4])}))
  }

  const runAll=useCallback(async()=>{
    setLoading(true);setError(null);setIctRes(null);setBotRes(null)
    try{
      if(mode==='demo')await new Promise(r=>setTimeout(r,800))
      const candles=await fetchCandles()
      setIctRes(runICT(candles,cfg))
      if(mode==='robot'&&robotType==='ai')setBotRes(runRobot(candles,cfg))
    }catch(e){setError(e.message)}
    setLoading(false)
  },[mode,cfg,robotType])

  const parseImport=()=>{
    try{
      const txt=importTxt.trim();let trades=[]
      if(txt.startsWith('[')){trades=JSON.parse(txt)}
      else{
        const lines=txt.split('\n').filter(l=>l.trim())
        const headers=lines[0].split(',').map(h=>h.trim().toLowerCase())
        trades=lines.slice(1).map(line=>{const vals=line.split(',');const obj={};headers.forEach((h,i)=>obj[h]=vals[i]?.trim());return{dir:(obj.direction||obj.dir||'BUY').toUpperCase(),entry:parseFloat(obj.entry||0),exit:parseFloat(obj.exit||0),pnl:parseFloat(obj.pnl||obj.profit||0),win:parseFloat(obj.pnl||obj.profit||0)>0,time:obj.date||obj.time||'—'}})
      }
      let eq=cfg.capital,pk=cfg.capital,mdd=0;const curve=[eq]
      const processed=trades.map(t=>{const pnl=parseFloat(t.pnl)||0;eq=Math.max(0,eq+pnl);pk=Math.max(pk,eq);const dd=((pk-eq)/pk)*100;if(dd>mdd)mdd=dd;curve.push(eq);return{...t,equity:eq.toFixed(2)}})
      const wins=processed.filter(t=>t.win).length
      const gw=processed.filter(t=>t.win).reduce((s,t)=>s+parseFloat(t.pnl),0)
      const gl=Math.abs(processed.filter(t=>!t.win).reduce((s,t)=>s+parseFloat(t.pnl),0))
      setBotRes({trades:processed,curve,stats:{total:processed.length,wins,losses:processed.length-wins,winrate:processed.length?((wins/processed.length)*100).toFixed(1):0,maxDD:mdd.toFixed(1),pf:gl>0?(gw/gl).toFixed(2):'∞',pnl:(eq-cfg.capital).toFixed(2),final:eq.toFixed(2)}})
    }catch(e){setError('Format invalide: '+e.message)}
  }

  const fetchLive=useCallback(async()=>{
    try{
      const res=await fetch(`https://api.binance.com/api/v3/klines?symbol=${cfg.pair}&interval=1m&limit=30`)
      if(!res.ok)return
      const candles=(await res.json()).map(k=>({time:k[0],open:parseFloat(k[1]),high:parseFloat(k[2]),low:parseFloat(k[3]),close:parseFloat(k[4])}))
      const price=candles[candles.length-1].close;setLivePrice(price)
      if(openTrade){const{dir,sl,tp}=openTrade;const hitTP=dir==='BUY'?price>=tp:price<=tp;const hitSL=dir==='BUY'?price<=sl:price>=sl;if(hitTP||hitSL)closeTrade(price,hitTP)}
      else if(subMode==='auto'){
        const ef=calcEMA(candles,cfg.ema_fast),es=calcEMA(candles,Math.min(cfg.ema_slow,candles.length-1))
        const bull=ef[ef.length-1]>es[es.length-1],c=candles[candles.length-2],pv=candles[candles.length-3]
        if(bull&&pv.close<pv.open&&c.close>c.open)openTrd('BUY',price)
        else if(!bull&&pv.close>pv.open&&c.close<c.open)openTrd('SELL',price)
      }
    }catch(e){}
  },[cfg,subMode,openTrade])

  useEffect(()=>{
    if(mode==='paper'&&paperRun){pRef.current=setInterval(fetchLive,10000);fetchLive()}
    else clearInterval(pRef.current)
    return()=>clearInterval(pRef.current)
  },[mode,paperRun,fetchLive])

  const openTrd=(dir,price)=>{
    if(openTrade)return
    const sl=dir==='BUY'?price*(1-cfg.sl_pips/10000):price*(1+cfg.sl_pips/10000)
    const tp=dir==='BUY'?price*(1+cfg.sl_pips*cfg.rr/10000):price*(1-cfg.sl_pips*cfg.rr/10000)
    setOpenTrade({dir,entry:price,sl,tp})
  }

  const closeTrade=(price,win)=>{
    if(!openTrade)return
    const risk=stRef.current.equity*(cfg.risk_pct/100),pnl=win?risk*cfg.rr:-risk
    const newEq=Math.max(0,stRef.current.equity+pnl)
    const ns={equity:newEq,wins:stRef.current.wins+(win?1:0),losses:stRef.current.losses+(win?0:1),total:stRef.current.total+1}
    stRef.current=ns;eqRef.current=[...eqRef.current,newEq]
    setPStats({...ns});setPaperEq([...eqRef.current])
    setPaperTrades(p=>[{dir:openTrade.dir,entry:openTrade.entry.toFixed(2),exit:price.toFixed(2),pnl:pnl.toFixed(2),equity:newEq.toFixed(2),win,time:new Date().toLocaleTimeString('fr-FR')},...p.slice(0,49)])
    setOpenTrade(null)
  }

  const resetPaper=()=>{
    setPaperTrades([]);eqRef.current=[cfg.capital];stRef.current={equity:cfg.capital,wins:0,losses:0,total:0}
    setPStats({equity:cfg.capital,wins:0,losses:0,total:0});setPaperEq([cfg.capital]);setOpenTrade(null);setLivePrice(null)
  }

  const simWebhook=()=>{
    const dir=['BUY','SELL'][Math.floor(Math.random()*2)]
    setWhLog(p=>[{time:new Date().toLocaleTimeString('fr-FR'),dir,pair:cfg.pair,price:(44000+Math.random()*10000).toFixed(2),source:'cTrader FTMO_ICT',status:'✓ REÇU'},...p.slice(0,19)])
  }

  const modeColor=MODES.find(m=>m.id===mode)?.color||'#c9a227'
  const is=ictRes?.stats,rs=botRes?.stats

  const StatCard=({label,val,color})=>(
    <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'8px',padding:'10px 12px',textAlign:'center'}}>
      <div style={{fontSize:'9px',color:'#5a7a5a',marginBottom:'3px',textTransform:'uppercase'}}>{label}</div>
      <div style={{fontSize:'18px',fontWeight:'700',color}}>{val}</div>
    </div>
  )

  const Slider=({label,k,min,max,step})=>(
    <div style={{marginBottom:'9px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'2px'}}>
        <span style={{fontSize:'10px',color:'#5a7a5a'}}>{label}</span>
        <span style={{fontSize:'11px',color:'#c9a227',fontWeight:'700'}}>{cfg[k]}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={cfg[k]} onChange={e=>upd(k,parseFloat(e.target.value))} style={{width:'100%',accentColor:'#c9a227',cursor:'pointer'}}/>
    </div>
  )

  return(
    <div style={{padding:'20px',minHeight:'100vh',fontFamily:"'Courier New',monospace"}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <BarChart2 size={20} color="#c9a227"/>
          <div>
            <div style={{fontSize:'18px',fontWeight:'700',color:'#e0e0e0',letterSpacing:'1px'}}>BACKTESTING PHG</div>
            <div style={{fontSize:'11px',color:'#5a7a5a'}}>ICT · Robot · Paper · Demo · Comparaison live</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
          {MODES.map(m=>(
            <button key={m.id} onClick={()=>{setMode(m.id);setIctRes(null);setBotRes(null);setPaperRun(false);resetPaper()}}
              style={{background:mode===m.id?'#0a1a0a':'#080f08',border:`1px solid ${mode===m.id?m.color:'#1a2e1a'}`,color:mode===m.id?m.color:'#5a7a5a',padding:'7px 13px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:'700'}}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'255px 1fr',gap:'14px'}}>
        <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'12px',padding:'14px'}}>
          <div style={{fontSize:'10px',color:'#c9a227',fontWeight:'700',letterSpacing:'1px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px'}}><Settings size={12}/> CONFIG</div>

          <div style={{marginBottom:'10px'}}>
            <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'4px'}}>MODE DE TRADING</div>
            <div style={{display:'flex',gap:'4px'}}>
              {[['auto','🤖 AUTO'],['manual','✋ MANUEL']].map(([id,lbl])=>(
                <button key={id} onClick={()=>setSubMode(id)} style={{flex:1,background:subMode===id?'#1a2e0a':'#0a120a',border:`1px solid ${subMode===id?'#c9a227':'#1a2e1a'}`,color:subMode===id?'#c9a227':'#5a7a5a',padding:'6px 4px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>{lbl}</button>
              ))}
            </div>
            <div style={{fontSize:'9px',color:'#3a5a3a',marginTop:'3px'}}>{subMode==='auto'?'IA génère signaux auto':'Tu cliques BUY/SELL toi-même'}</div>
          </div>

          {mode==='robot'&&(
            <div style={{marginBottom:'10px'}}>
              <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'4px'}}>TYPE DE ROBOT</div>
              {ROBOT_TYPES.map(rt=>(
                <div key={rt.id} onClick={()=>setRobotType(rt.id)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',background:robotType===rt.id?'#0a1a0a':'#0a120a',border:`1px solid ${robotType===rt.id?'#ff88aa':'#1a2e1a'}`,borderRadius:'6px',cursor:'pointer',marginBottom:'4px'}}>
                  <div><div style={{fontSize:'11px',color:robotType===rt.id?'#ff88aa':'#e0e0e0',fontWeight:'700'}}>{rt.label}</div><div style={{fontSize:'9px',color:'#3a5a3a'}}>{rt.desc}</div></div>
                </div>
              ))}
            </div>
          )}

          <div style={{marginBottom:'9px'}}>
            <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'3px'}}>PAIRE</div>
            <div style={{position:'relative'}}>
              <button onClick={()=>setShowPairs(!showPairs)} style={{width:'100%',background:'#0a120a',border:'1px solid #1a2e1a',color:'#e0e0e0',padding:'7px 10px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',fontWeight:'700',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                {cfg.pair}<ChevronDown size={12}/>
              </button>
              {showPairs&&<div style={{position:'absolute',top:'34px',left:0,right:0,background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'6px',zIndex:100}}>
                {PAIRS.map(p=><div key={p} onClick={()=>{upd('pair',p);setShowPairs(false)}} style={{padding:'7px 10px',cursor:'pointer',color:p===cfg.pair?'#c9a227':'#e0e0e0',fontSize:'12px',background:p===cfg.pair?'#1a2e0a':'none'}}>{p}</div>)}
              </div>}
            </div>
          </div>

          {mode!=='paper'&&<div style={{marginBottom:'9px'}}>
            <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'3px'}}>TIMEFRAME</div>
            <div style={{display:'flex',gap:'3px'}}>
              {TIMEFRAMES.map(t=><button key={t.value} onClick={()=>upd('tf',t.value)} style={{flex:1,background:cfg.tf===t.value?'#1a2e0a':'#0a120a',border:`1px solid ${cfg.tf===t.value?'#00cc66':'#1a2e1a'}`,color:cfg.tf===t.value?'#00cc66':'#5a7a5a',padding:'5px 2px',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>{t.label}</button>)}
            </div>
          </div>}

          <div style={{marginBottom:'10px',background:'#0a140a',border:'1px solid #1a3a1a',borderRadius:'8px',padding:'9px 10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
            <div style={{fontSize:'10px',color:'#5a7a5a',fontWeight:'700'}}>PERIODE (BOUGIES)</div>
            <div style={{fontSize:'11px',color:'#c9a227',fontWeight:'700'}}>{period}</div>
          </div>
          <div style={{display:'flex',gap:'3px',marginBottom:'6px'}}>
            {[100,200,500,1000,1500].map(p=>(
              <button key={p} onClick={()=>setPeriod(p)} style={{flex:1,background:period===p?'#1a3a0a':'#0a120a',border:`1px solid ${period===p?'#c9a227':'#1a2e1a'}`,color:period===p?'#c9a227':'#5a7a5a',padding:'5px 2px',borderRadius:'5px',cursor:'pointer',fontSize:'10px',fontFamily:'inherit',fontWeight:'700'}}>{p}</button>
            ))}
          </div>
          <input type="range" min={50} max={1500} step={50} value={period} onChange={e=>setPeriod(parseInt(e.target.value))} style={{width:'100%',accentColor:'#c9a227',cursor:'pointer'}}/>
        </div>
        <Slider label="Capital ($)" k="capital" min={1000} max={100000} step={1000}/>
          <Slider label="Risque/trade (%)" k="risk_pct" min={0.5} max={5} step={0.5}/>
          <Slider label="Stop Loss (pips)" k="sl_pips" min={10} max={200} step={10}/>
          <Slider label="Risk/Reward" k="rr" min={1} max={5} step={0.5}/>
          <Slider label="EMA Rapide" k="ema_fast" min={5} max={50} step={1}/>
          <Slider label="EMA Lente" k="ema_slow" min={20} max={200} step={5}/>

          <div style={{fontSize:'10px',color:'#5a7a5a',margin:'6px 0 5px',fontWeight:'700'}}>FILTRES ICT</div>
          {[['BOS','use_bos'],['FVG','use_fvg'],['OB','use_ob']].map(([lbl,k])=>(
            <div key={k} onClick={()=>upd(k,!cfg[k])} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:cfg[k]?'#0a1a0a':'#0a120a',border:`1px solid ${cfg[k]?'#00cc66':'#1a2e1a'}`,borderRadius:'6px',cursor:'pointer',marginBottom:'4px'}}>
              <span style={{fontSize:'12px',color:cfg[k]?'#e0e0e0':'#5a7a5a',fontWeight:'700'}}>{lbl}</span>
              <div style={{width:'28px',height:'14px',background:cfg[k]?'#00cc66':'#1a2e1a',borderRadius:'7px',position:'relative'}}><div style={{position:'absolute',top:'1px',left:cfg[k]?'14px':'1px',width:'12px',height:'12px',background:'#fff',borderRadius:'50%',transition:'left 0.2s'}}/></div>
            </div>
          ))}

          <div style={{marginTop:'12px'}}>
            {mode==='paper'?(
              <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                <button onClick={()=>setPaperRun(!paperRun)} style={{width:'100%',background:paperRun?'#2e0a0a':'#0a2e0a',border:`1px solid ${paperRun?'#ff4444':'#00cc66'}`,color:paperRun?'#ff4444':'#00cc66',padding:'9px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px'}}>
                  {paperRun?<><Square size={13}/> STOPPER</>:<><Zap size={13}/> DÉMARRER PAPER</>}
                </button>
                <button onClick={resetPaper} style={{width:'100%',background:'#0a120a',border:'1px solid #1a2e1a',color:'#5a7a5a',padding:'7px',borderRadius:'8px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit'}}>Réinitialiser</button>
              </div>
            ):(
              <button onClick={runAll} disabled={loading} style={{width:'100%',background:'#1a2e0a',border:`1px solid ${modeColor}`,color:modeColor,padding:'10px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:loading?0.7:1}}>
                {loading?<RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/>:<Play size={14}/>}
                {loading?'Analyse...':`LANCER ${mode.toUpperCase()} ${subMode==='auto'?'AUTO':'MANUEL'}`}
              </button>
            )}
          </div>
        </div>

        <div>
          {error&&<div style={{background:'#1a0a0a',border:'1px solid #ff4444',borderRadius:'8px',padding:'10px 14px',color:'#ff4444',fontSize:'12px',marginBottom:'10px'}}>⚠️ {error}</div>}

          {mode==='paper'&&(
            <>
              <div style={{background:'#0d1a0d',border:`1px solid ${paperRun?'#00cc66':'#1a2e1a'}`,borderRadius:'12px',padding:'16px',marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
                  <div>
                    <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'3px'}}>PRIX LIVE · {cfg.pair}</div>
                    <div style={{fontSize:'26px',fontWeight:'700',color:'#e0e0e0'}}>{livePrice?livePrice.toFixed(2):'—'}</div>
                    {paperRun&&<div style={{fontSize:'10px',color:'#00cc66',marginTop:'2px'}}>● EN DIRECT · refresh 10s</div>}
                  </div>
                  {openTrade&&(
                    <div style={{background:'#0a1a0a',border:'1px solid #c9a227',borderRadius:'8px',padding:'10px 14px'}}>
                      <div style={{color:'#c9a227',fontWeight:'700',fontSize:'11px',marginBottom:'3px'}}>TRADE OUVERT</div>
                      <div style={{color:openTrade.dir==='BUY'?'#00cc66':'#ff4444',fontWeight:'700'}}>{openTrade.dir} @ {openTrade.entry.toFixed(2)}</div>
                      <div style={{color:'#5a7a5a',fontSize:'10px'}}>SL: {openTrade.sl.toFixed(2)} · TP: {openTrade.tp.toFixed(2)}</div>
                      {subMode==='manual'&&livePrice&&(
                        <div style={{display:'flex',gap:'5px',marginTop:'7px'}}>
                          <button onClick={()=>closeTrade(livePrice,true)} style={{background:'#0a2e0a',border:'1px solid #00cc66',color:'#00cc66',padding:'4px 10px',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>TP ✓</button>
                          <button onClick={()=>closeTrade(livePrice,false)} style={{background:'#2e0a0a',border:'1px solid #ff4444',color:'#ff4444',padding:'4px 10px',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>SL ✗</button>
                        </div>
                      )}
                    </div>
                  )}
                  {subMode==='manual'&&!openTrade&&paperRun&&(
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>openTrd('BUY',livePrice||45000)} style={{background:'#0a2e0a',border:'2px solid #00cc66',color:'#00cc66',padding:'12px 22px',borderRadius:'10px',cursor:'pointer',fontSize:'14px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',gap:'6px'}}><TrendingUp size={16}/> BUY</button>
                      <button onClick={()=>openTrd('SELL',livePrice||45000)} style={{background:'#2e0a0a',border:'2px solid #ff4444',color:'#ff4444',padding:'12px 22px',borderRadius:'10px',cursor:'pointer',fontSize:'14px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',gap:'6px'}}><TrendingDown size={16}/> SELL</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'12px'}}>
                <StatCard label="Capital" val={'$'+parseFloat(pStats.equity).toFixed(0)} color={pStats.equity>=cfg.capital?'#00cc66':'#ff4444'}/>
                <StatCard label="Gains" val={pStats.wins} color="#00cc66"/>
                <StatCard label="Pertes" val={pStats.losses} color="#ff4444"/>
                <StatCard label="Trades" val={pStats.total} color="#c9a227"/>
              </div>
              {paperEq.length>1&&<div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'10px',padding:'12px',marginBottom:'12px',height:'160px'}}>
                <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'6px',fontWeight:'700'}}>COURBE D'ÉQUITÉ PAPER</div>
                <div style={{height:'120px'}}><EqChart curves={[paperEq]} capital={cfg.capital} colors={['#00cc66']}/></div>
              </div>}
              <TradeTable trades={paperTrades} color="#00cc66"/>
            </>
          )}

          {mode==='robot'&&!ictRes&&!loading&&(
            <>
              {robotType==='webhook'&&(
                <div style={{background:'#0d1a0d',border:'1px solid #ff88aa',borderRadius:'12px',padding:'16px',marginBottom:'12px'}}>
                  <div style={{fontSize:'12px',color:'#ff88aa',fontWeight:'700',marginBottom:'10px'}}>⚡ WEBHOOK CTRADER</div>
                  <div style={{fontSize:'11px',color:'#5a7a5a',marginBottom:'6px'}}>URL à configurer dans ton bot :</div>
                  <div style={{background:'#0a120a',border:'1px solid #1a2e1a',borderRadius:'6px',padding:'10px',fontSize:'11px',color:'#c9a227',marginBottom:'10px',wordBreak:'break-all'}}>
                    https://phg-tradeelite.vercel.app/api/webhook/{cfg.pair.toLowerCase()}
                  </div>
                  <div style={{fontSize:'11px',color:'#5a7a5a',marginBottom:'6px'}}>Format JSON attendu :</div>
                  <div style={{background:'#0a120a',border:'1px solid #1a2e1a',borderRadius:'6px',padding:'10px',fontSize:'10px',color:'#7a9a7a',marginBottom:'12px'}}>{'{"signal":"BUY","pair":"BTCUSDT","price":45000}'}</div>
                  <button onClick={simWebhook} style={{background:'#1a0a1a',border:'1px solid #ff88aa',color:'#ff88aa',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:'700',marginBottom:'10px'}}>⚡ Simuler signal webhook</button>
                  {whLog.map((w,i)=>(
                    <div key={i} style={{display:'flex',gap:'10px',padding:'6px 10px',background:i===0?'#0a1a0a':'none',borderRadius:'5px',fontSize:'11px',marginBottom:'2px'}}>
                      <span style={{color:'#5a7a5a'}}>{w.time}</span>
                      <span style={{color:w.dir==='BUY'?'#00cc66':'#ff4444',fontWeight:'700'}}>{w.dir}</span>
                      <span style={{color:'#e0e0e0'}}>{w.pair} @ {w.price}</span>
                      <span style={{color:'#00cc66'}}>{w.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {robotType==='import'&&(
                <div style={{background:'#0d1a0d',border:'1px solid #ff88aa',borderRadius:'12px',padding:'16px',marginBottom:'12px'}}>
                  <div style={{fontSize:'12px',color:'#ff88aa',fontWeight:'700',marginBottom:'8px'}}>📂 IMPORT CSV / JSON</div>
                  <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'6px'}}>Colle tes trades (JSON array ou CSV avec headers: date,direction,entry,exit,pnl)</div>
                  <textarea value={importTxt} onChange={e=>setImportTxt(e.target.value)} placeholder={'[{"dir":"BUY","entry":45000,"exit":46000,"pnl":250,"win":true}]'}
                    style={{width:'100%',height:'140px',background:'#0a120a',border:'1px solid #1a2e1a',borderRadius:'6px',color:'#e0e0e0',padding:'10px',fontSize:'11px',fontFamily:'inherit',resize:'vertical',boxSizing:'border-box'}}/>
                  <button onClick={parseImport} style={{marginTop:'8px',background:'#1a0a1a',border:'1px solid #ff88aa',color:'#ff88aa',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:'700'}}>📊 Analyser</button>
                  {botRes&&<div style={{marginTop:'8px',color:'#00cc66',fontSize:'11px'}}>✓ {botRes.stats.total} trades · WinRate {botRes.stats.winrate}%</div>}
                </div>
              )}
              {robotType==='ai'&&(
                <div style={{background:'#0d1a0d',border:'1px solid #ff88aa',borderRadius:'12px',padding:'16px',marginBottom:'12px'}}>
                  <div style={{fontSize:'12px',color:'#ff88aa',fontWeight:'700',marginBottom:'8px'}}>🤖 ROBOT IA PHG — RSI + Momentum</div>
                  <div style={{fontSize:'11px',color:'#5a7a5a',lineHeight:'1.6',marginBottom:'12px'}}>Robot RSI+Momentum tourne en parallèle avec la stratégie ICT sur les mêmes données. Les 2 courbes sont comparées.</div>
                  <button onClick={runAll} disabled={loading} style={{background:'#1a2e0a',border:'1px solid #ff88aa',color:'#ff88aa',padding:'10px 20px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',fontWeight:'700',display:'flex',alignItems:'center',gap:'8px'}}>
                    {loading?<RefreshCw size={14} style={{animation:'spin 1s linear infinite'}}/>:<Play size={14}/>}
                    {loading?'Analyse...':'LANCER ICT vs ROBOT'}
                  </button>
                </div>
              )}
            </>
          )}

          {loading&&<div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'12px',height:'200px',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'10px'}}>
            <RefreshCw size={28} color="#c9a227" style={{animation:'spin 1s linear infinite'}}/><div style={{color:'#c9a227',fontSize:'13px'}}>Analyse sur 500 bougies...</div>
          </div>}

          {(ictRes||botRes)&&!loading&&mode!=='paper'&&(
            <>
              <div style={{display:'flex',gap:'5px',marginBottom:'12px'}}>
                {[['compare','⚖️ Comparaison'],['ict','📊 ICT'],['robot','🤖 Robot']].map(([id,lbl])=>(
                  <button key={id} onClick={()=>setTab(id)} style={{background:tab===id?'#1a2e0a':'#0d150d',border:`1px solid ${tab===id?'#c9a227':'#1a2e1a'}`,color:tab===id?'#c9a227':'#5a7a5a',padding:'6px 14px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit',fontWeight:'700'}}>
                    {lbl}
                  </button>
                ))}
              </div>

              {tab==='compare'&&(
                <>
                  <div style={{display:'grid',gridTemplateColumns:botRes?'1fr 1fr':'1fr',gap:'10px',marginBottom:'12px'}}>
                    {[{lbl:'🎯 ICT PHG',s:is,col:'#00aaff'},{lbl:'🤖 Robot',s:rs,col:'#ff88aa'}].filter(x=>x.s).map(({lbl,s,col})=>(
                      <div key={lbl} style={{background:'#0d1a0d',border:`1px solid ${col}30`,borderRadius:'10px',padding:'14px'}}>
                        <div style={{fontSize:'11px',color:col,fontWeight:'700',marginBottom:'10px'}}>{lbl}</div>
                        {[['Trades',s.total,col],['Win Rate',s.winrate+'%',parseFloat(s.winrate)>=50?'#00cc66':'#ff4444'],['Profit Factor',s.pf,parseFloat(s.pf)>=1.5?'#00cc66':'#ff9900'],['Max DD',s.maxDD+'%',parseFloat(s.maxDD)<=15?'#00cc66':'#ff4444'],['P&L Net',(parseFloat(s.pnl)>=0?'+':'')+parseFloat(s.pnl).toFixed(0)+'$',parseFloat(s.pnl)>=0?'#00cc66':'#ff4444'],['Capital Final',parseFloat(s.final).toFixed(0)+'$',col]].map(([k,v,c])=>(
                          <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #0a120a'}}>
                            <span style={{fontSize:'11px',color:'#5a7a5a'}}>{k}</span>
                            <span style={{fontSize:'12px',color:c,fontWeight:'700'}}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {is&&rs&&(
                    <div style={{background:'#0a1a0a',border:'1px solid #c9a227',borderRadius:'10px',padding:'12px 16px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'20px'}}>🏆</span>
                      <div>
                        <div style={{fontSize:'11px',color:'#c9a227',fontWeight:'700'}}>VAINQUEUR</div>
                        <div style={{fontSize:'14px',color:'#e0e0e0',fontWeight:'700'}}>
                          {parseFloat(is.final)>=parseFloat(rs.final)?'Stratégie ICT PHG':'Robot IA RSI'}
                          {' — '}<span style={{color:'#00cc66'}}>${Math.max(parseFloat(is.final),parseFloat(rs.final)).toFixed(0)} capital final</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'10px',padding:'12px',height:'200px'}}>
                    <div style={{fontSize:'10px',color:'#5a7a5a',marginBottom:'6px',fontWeight:'700'}}>COURBES D'ÉQUITÉ {ictRes?'— ICT (bleu)':''} {botRes?'— Robot (rose)':''}</div>
                    <div style={{height:'155px'}}>
                      <EqChart curves={[ictRes?.curve,botRes?.curve].filter(Boolean)} capital={cfg.capital} colors={['#00aaff','#ff88aa']}/>
                    </div>
                  </div>
                </>
              )}
              {tab==='ict'&&ictRes&&<TradeTable trades={ictRes.trades} color="#00aaff"/>}
              {tab==='robot'&&botRes&&<TradeTable trades={botRes.trades} color="#ff88aa"/>}
            </>
          )}

          {!ictRes&&!botRes&&!loading&&mode!=='paper'&&mode!=='robot'&&(
            <div style={{background:'#0d1a0d',border:'1px solid #1a2e1a',borderRadius:'12px',height:'300px',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'10px'}}>
              <Play size={36} color="#1a2e1a"/><div style={{color:'#3a4a3a',fontSize:'13px'}}>Configure et lance le backtest</div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
