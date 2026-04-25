import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Activity, Target, TrendingUp } from 'lucide-react'

const nav = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/journal', icon: BookOpen, label: 'Trade Journal' },
  { path: '/signals', icon: Activity, label: 'Signal Simulator' },
  { path: '/evolution', icon: TrendingUp, label: 'Auto Evolution' },
  { path: '/ftmo', icon: Target, label: 'FTMO Challenge' },
]

function HorusEye() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#0a120a" rx="8"/>
      <g transform="translate(50,50)">
        <path d="M-32,0 C-20,-18 -8,-24 0,-24 C8,-24 20,-18 32,0 C20,18 8,24 0,24 C-8,24 -20,18 -32,0 Z" fill="#0a120a" stroke="#c9a227" strokeWidth="2"/>
        <circle cx="0" cy="0" r="14" fill="#1c2e0a" stroke="#c9a227" strokeWidth="1.5"/>
        <circle cx="0" cy="0" r="8" fill="#c9a227"/>
        <circle cx="0" cy="0" r="3" fill="#060d06"/>
        <path d="M-24,-26 C-10,-35 10,-35 24,-26" fill="none" stroke="#c9a227" strokeWidth="2" strokeLinecap="round"/>
        <path d="M-12,20 L-16,34 L-10,36 L-6,24" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12,20 L14,34 L9,36" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  )
}

export default function Sidebar() {
  return (
    <div style={{ width:'220px', minHeight:'100vh', background:'#080f08', borderRight:'1px solid #1a2e1a', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>
      <div style={{ padding:'20px 16px', borderBottom:'1px solid #1a2e1a', display:'flex', alignItems:'center', gap:'10px' }}>
        <HorusEye />
        <div>
          <div style={{ fontSize:'14px', fontWeight:'700', color:'#c9a227', letterSpacing:'1px' }}>PHG FTMO</div>
          <div style={{ fontSize:'9px', color:'#7a6010', letterSpacing:'2px' }}>PRO MAX IA ELITE</div>
        </div>
      </div>
      <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:'2px' }}>
        {nav.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px',
            fontSize:'13px', color: isActive ? '#c9a227' : '#7a9a7a', background: isActive ? '#1a2e0a' : 'transparent',
            borderLeft: isActive ? '2px solid #c9a227' : '2px solid transparent', textDecoration:'none'
          })}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding:'12px 16px', borderTop:'1px solid #1a2e1a', fontSize:'11px', color:'#00cc66', display:'flex', alignItems:'center', gap:'6px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00cc66' }}></div>
        v2.0 ELITE · LIVE
      </div>
    </div>
  )
}
