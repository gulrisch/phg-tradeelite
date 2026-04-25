import { TrendingUp, Target, DollarSign, Activity, Clock, Shield } from 'lucide-react'

const s = {
  page: { padding: '24px', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#e0e0e0' },
  sub: { fontSize: '13px', color: '#5a7a5a', marginTop: '2px' },
  live: { background: '#0a2e0a', border: '1px solid #00cc66', color: '#00cc66', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' },
  card: { background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '20px' },
  label: { fontSize: '11px', color: '#5a7a5a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' },
  value: (c) => ({ fontSize: '28px', fontWeight: '700', color: c || '#e0e0e0' }),
  small: { fontSize: '12px', color: '#5a7a5a', marginTop: '4px' },
}

function Card({ label, value, color, sub, icon: Icon }) {
  return (
    <div style={s.card}>
      <div style={s.label}><Icon size={14}/>{label}</div>
      <div style={s.value(color)}>{value}</div>
      {sub && <div style={s.small}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.title}>PHG Dashboard</div>
          <div style={s.sub}>Performance overview & live stats</div>
        </div>
        <div style={s.live}><div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00cc66' }}></div>LIVE</div>
      </div>
      <div style={s.grid4}>
        <Card label="Total Trades" value="10" color="#e0e0e0" icon={Activity}/>
        <Card label="Winrate" value="70.0%" color="#00cc66" sub="7W / 2L" icon={Target}/>
        <Card label="Net Profit" value="+$510" color="#00cc66" sub="Total P&L" icon={DollarSign}/>
        <Card label="Total Pips" value="+225" color="#c9a227" sub="Accumulated" icon={TrendingUp}/>
      </div>
      <div style={s.grid4}>
        <Card label="Buy Winrate" value="83.3%" color="#00cc66" sub="6 trades" icon={TrendingUp}/>
        <Card label="Sell Winrate" value="50.0%" color="#ff4444" sub="4 trades" icon={TrendingUp}/>
        <Card label="London WR" value="66.7%" color="#4a9fff" sub="6 trades" icon={Clock}/>
        <Card label="New York WR" value="75.0%" color="#c9a227" sub="4 trades" icon={Clock}/>
      </div>
      <div style={{ ...s.card, marginBottom:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Shield size={16} color="#c9a227"/>
            <span style={{ fontSize:'14px', fontWeight:'600', color:'#c9a227' }}>FTMO Challenge Monitor</span>
          </div>
          <div style={{ background:'#0a2e0a', border:'1px solid #00cc66', color:'#00cc66', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:'700' }}>✓ TRADING AUTORISÉ</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', textAlign:'center' }}>
          {[['P&L Jour','+0%','#00cc66'],['DD Jour','-0.00%','#c9a227'],['DD Total','-0.00%','#c9a227']].map(([l,v,c]) => (
            <div key={l}>
              <div style={{ fontSize:'11px', color:'#5a7a5a', marginBottom:'4px' }}>{l}</div>
              <div style={{ fontSize:'18px', fontWeight:'700', color:c }}>{v}</div>
              <div style={{ height:'4px', background:'#1a2e1a', borderRadius:'2px', marginTop:'8px' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
