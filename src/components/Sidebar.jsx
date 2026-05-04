import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Activity, TrendingUp,
  Trophy, BarChart2, FlaskConical, Zap
} from "lucide-react";

const nav = [
  { path: "/",          icon: LayoutDashboard, label: "Tableau de bord" },
  { path: "/journal",   icon: BookOpen,         label: "Journal commercial" },
  { path: "/signal",    icon: Activity,         label: "Simulateur de signal" },
  { path: "/evolution", icon: TrendingUp,        label: "Auto Evolution" },
  { path: "/ftmo",      icon: Trophy,            label: "Défi FTMO" },
  { path: "/chart",     icon: BarChart2,         label: "Graphique de trading" },
  { path: "/backtest",  icon: FlaskConical,      label: "Test rétrospectif" },
  { path: "/decision",  icon: Zap,               label: "Decision Simulator" },
];

const gold = "#D4AF37";
const dark = "#0f0f08";
const muted = "#666655";

export default function Sidebar() {
  const location = useLocation();

  return (
    <div style={{
      width: 200, minHeight: "100vh", background: dark,
      borderRight: "1px solid #2a2a1a", display: "flex",
      flexDirection: "column", padding: "20px 0",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 16px 24px", borderBottom: "1px solid #2a2a1a" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: gold }}>PHG FTMO</div>
        <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>PRO MAX IA ÉLITE</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {nav.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                background: active ? "#1e1e10" : "transparent",
                borderLeft: active ? `3px solid ${gold}` : "3px solid transparent",
                color: active ? gold : muted,
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.15s", cursor: "pointer",
              }}>
                <Icon size={15} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #2a2a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75" }} />
          <span style={{ fontSize: 10, color: muted }}>v2.0 ÉLITE · EN DIRECT</span>
        </div>
      </div>
    </div>
  );
}