import { useState } from "react";

const STRATS = [
  { name: "G64-VKBU", badge: "ELITE", wr: 95, rr: 5, dd: 5, score: 140.5, mutations: ["Filtre HTF activé", "FVG gap threshold réduit"] },
  { name: "G64-J8QX", badge: "ELITE", wr: 93.5, rr: 5, dd: 5, score: 139.9, mutations: ["EMA période ajustée", "Filtre HTF activé", "FVG gap threshold réduit"] },
  { name: "G64-RVAM", badge: "ELITE", wr: 95, rr: 4.93, dd: 5.13, score: 139.3, mutations: ["EMA période ajustée", "Seuil BOS renforcé", "Session Kill Zone étendue"] },
  { name: "G64-6WAE", badge: "ELITE", wr: 95, rr: 4.81, dd: 7.2, score: 136.5, mutations: ["Seuil BOS renforcé", "Session Kill Zone étendue"] },
  { name: "G64-50UN", badge: "VIABLE", wr: 63, rr: 2.3, dd: 25, score: 72.1, mutations: ["Session Kill Zone étendue"] },
];

const gold = "#D4AF37";
const dark = "#1a1a0e";
const darkCard = "#111108";
const green = "#1D9E75";
const amber = "#BA7517";
const red = "#E24B4A";
const muted = "#888870";

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: "#1e1e10", borderRadius: 8, padding: "12px 10px", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 11, color: muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || gold }}>{value}</div>
    </div>
  );
}

function Badge({ type }) {
  const styles = {
    ELITE: { background: "#FAC775", color: "#633806" },
    VIABLE: { background: "#C0DD97", color: "#27500A" },
  };
  return (
    <span style={{ ...styles[type], fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
      {type}
    </span>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px", fontSize: 13, borderRadius: 8, cursor: "pointer",
        border: "1px solid " + (active ? gold : "#333"),
        background: active ? gold : "transparent",
        color: active ? dark : muted, fontWeight: active ? 600 : 400,
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

function SliderRow({ label, min, max, step, value, onChange, display }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <span style={{ fontSize: 13, color: muted, minWidth: 120 }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: gold }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: gold, minWidth: 70, textAlign: "right" }}>{display}</span>
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid #2a2a1a", fontSize: 13 }}>
      <span style={{ color: muted }}>{label}</span>
      <span style={{ fontWeight: 600, color: valueColor || gold }}>{value}</span>
    </div>
  );
}

function ResultBox({ type, title, detail }) {
  const styles = {
    go: { background: "#0d2a1a", border: "1px solid #1D9E75", titleColor: green },
    caution: { background: "#2a1e08", border: "1px solid #BA7517", titleColor: amber },
    stop: { background: "#2a0d0d", border: "1px solid #E24B4A", titleColor: red },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.background, border: s.border, borderRadius: 8, padding: "14px 16px", marginTop: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: s.titleColor, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}

export default function TradingDecisionSimulator() {
  const [tab, setTab] = useState("comprendre");
  const [selectedStrat, setSelectedStrat] = useState(0);
  const [capital, setCapital] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [simStrat, setSimStrat] = useState(0);
  const [kCapital, setKCapital] = useState(10000);
  const [kWr, setKWr] = useState(95);
  const [kRr, setKRr] = useState(5);

  const s = STRATS[selectedStrat];
  const p = s.wr / 100;
  const ev = (p * s.rr - (1 - p)) * 1;
  const ddColor = s.dd <= 10 ? green : s.dd <= 20 ? amber : red;
  const rrColor = s.rr >= 3 ? green : s.rr >= 1.5 ? amber : red;
  const wrColor = s.wr >= 80 ? green : s.wr >= 60 ? amber : red;
  const evColor = ev > 0 ? green : red;

  const sim = STRATS[simStrat];
  const riskAmt = capital * riskPct / 100;
  const gainAmt = riskAmt * sim.rr;
  const simEv = (sim.wr / 100) * gainAmt - (1 - sim.wr / 100) * riskAmt;
  const maxLoss = capital * sim.dd / 100;
  const tradesRecover = simEv > 0 ? Math.ceil(maxLoss / simEv) : "∞";
  const decisionType = sim.dd > 20 ? "stop" : riskPct > 2 ? "caution" : "go";
  const decisionTitle = decisionType === "go" ? "TRADE RECOMMANDÉ" : decisionType === "caution" ? "RISQUE TROP ÉLEVÉ" : "ATTENTION — DD DANGEREUX";
  const decisionDetail = decisionType === "go"
    ? `Espérance +${simEv.toFixed(2)}€/trade. Gain potentiel : ${gainAmt.toFixed(0)}€. Sur 20 trades/mois ≈ ${(simEv * 20).toFixed(0)}€.`
    : decisionType === "caution"
    ? `Risque de ${riskPct}% trop élevé. Réduis à 1-2% max. Montant risqué actuel : ${riskAmt.toFixed(0)}€.`
    : `DD de ${sim.dd}% = perte potentielle de ${maxLoss.toFixed(0)}€. Utilise cette stratégie en demo uniquement.`;

  const kelly = kWr / 100 - (1 - kWr / 100) / kRr;
  const halfKelly = kelly / 2;
  const kellyType = kelly > 0.5 ? "caution" : kelly > 0 ? "go" : "stop";
  const safeRisk = Math.min(Math.max(halfKelly * 100, 0), 2).toFixed(1);

  return (
    <div style={{ background: dark, minHeight: "100vh", padding: "24px 20px", fontFamily: "system-ui, sans-serif", color: "#e8e8d0" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: gold }}>Trading Decision Simulator</div>
          <div style={{ fontSize: 12, color: muted }}>PHG ICT · Auto Evolution · Génération 64</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tab label="Comprendre" active={tab === "comprendre"} onClick={() => setTab("comprendre")} />
        <Tab label="Simulateur" active={tab === "simulateur"} onClick={() => setTab("simulateur")} />
        <Tab label="Kelly Sizing" active={tab === "kelly"} onClick={() => setTab("kelly")} />
      </div>

      {/* TAB 1 */}
      {tab === "comprendre" && (
        <div>
          <div style={{ background: darkCard, borderRadius: 10, border: "1px solid #2a2a1a", marginBottom: 14, overflow: "hidden" }}>
            {STRATS.map((st, i) => (
              <div key={st.name} onClick={() => setSelectedStrat(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer",
                  borderBottom: i < STRATS.length - 1 ? "0.5px solid #2a2a1a" : "none",
                  background: selectedStrat === i ? "#1e1e10" : "transparent",
                  borderLeft: selectedStrat === i ? `3px solid ${gold}` : "3px solid transparent",
                  transition: "all 0.15s",
                }}>
                <Badge type={st.badge} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: selectedStrat === i ? gold : "#e8e8d0" }}>{st.name}</span>
                <span style={{ fontSize: 12, color: muted }}>Score {st.score} · WR {st.wr}% · R:R 1:{st.rr} · DD {st.dd}%</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <MetricCard label="WinRate" value={s.wr + "%"} color={wrColor} />
            <MetricCard label="Risk/Reward" value={"1:" + s.rr.toFixed(2)} color={rrColor} />
            <MetricCard label="Drawdown" value={s.dd.toFixed(1) + "%"} color={ddColor} />
            <MetricCard label="Espérance" value={(ev >= 0 ? "+" : "") + ev.toFixed(2) + "€"} color={evColor} />
          </div>

          <div style={{ background: darkCard, borderRadius: 10, border: "1px solid #2a2a1a", padding: "16px" }}>
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "0.5px solid #2a2a1a" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: gold, marginBottom: 6 }}>WinRate — probabilité de gagner</div>
              <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>
                Sur 100 trades, <strong style={{ color: "#e8e8d0" }}>{s.wr} gagnants</strong> et {(100 - s.wr).toFixed(0)} perdants.{" "}
                {s.wr >= 80 ? "Excellent : tu peux encaisser plusieurs pertes sans paniquer." : s.wr >= 60 ? "Correct, mais surveille les séries de pertes." : "Fragile. Le R:R doit compenser fortement."}
              </div>
            </div>
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "0.5px solid #2a2a1a" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: gold, marginBottom: 6 }}>R:R — ce que tu gagnes vs ce que tu risques</div>
              <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>
                Pour chaque <strong style={{ color: "#e8e8d0" }}>1€ risqué</strong>, tu peux gagner <strong style={{ color: green }}>{s.rr.toFixed(2)}€</strong>.{" "}
                {s.rr >= 3 ? "Exceptionnel. Même avec 50% WR tu serais profitable." : s.rr >= 2 ? "Bon. Tu peux perdre 1 trade sur 3 et rester gagnant." : "Limite. Le WinRate devient critique."}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: gold, marginBottom: 6 }}>Drawdown — la pire baisse à encaisser</div>
              <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>
                Sur 10 000€, le DD max est de <strong style={{ color: ddColor }}>{(10000 * s.dd / 100).toFixed(0)}€</strong>.{" "}
                {s.dd <= 10 ? "Très sain. Tu peux trader sans stress." : s.dd <= 20 ? "Acceptable, mais impose-toi des pauses." : "Dangereux. Un DD de 25% exige +33% pour récupérer."}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {s.mutations.map(m => (
              <span key={m} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#1e1e10", border: "1px solid #333", color: muted }}>⚡ {m}</span>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {tab === "simulateur" && (
        <div>
          <div style={{ background: darkCard, borderRadius: 10, border: "1px solid #2a2a1a", padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: gold, marginBottom: 14 }}>Paramètres du trade</div>
            <SliderRow label="Capital (€)" min={1000} max={50000} step={500} value={capital} onChange={setCapital} display={capital.toLocaleString("fr-FR") + "€"} />
            <SliderRow label="Risque / trade" min={0.5} max={5} step={0.5} value={riskPct} onChange={setRiskPct} display={riskPct + "%"} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: muted, marginBottom: 8 }}>Stratégie</div>
              <select value={simStrat} onChange={e => setSimStrat(parseInt(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #333", background: "#1a1a0e", color: "#e8e8d0", fontSize: 13 }}>
                {STRATS.map((st, i) => (
                  <option key={st.name} value={i}>{st.name} · WR {st.wr}% · R:R 1:{st.rr} · DD {st.dd}%</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: darkCard, borderRadius: 10, border: "1px solid #2a2a1a", padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: gold, marginBottom: 10 }}>Résultats calculés</div>
            <InfoRow label="Montant risqué" value={riskAmt.toFixed(0) + "€"} valueColor={amber} />
            <InfoRow label="Gain potentiel" value={gainAmt.toFixed(0) + "€"} valueColor={green} />
            <InfoRow label="Espérance / trade" value={(simEv >= 0 ? "+" : "") + simEv.toFixed(2) + "€"} valueColor={simEv > 0 ? green : red} />
            <InfoRow label="Perte max (DD)" value={maxLoss.toFixed(0) + "€"} valueColor={red} />
            <InfoRow label="Trades pour récupérer DD" value={tradesRecover + (simEv > 0 ? " trades" : "")} valueColor={muted} />
            <InfoRow label="Espérance mensuelle (×20)" value={(simEv > 0 ? "+" : "") + (simEv * 20).toFixed(0) + "€"} valueColor={simEv > 0 ? green : red} />
          </div>

          <ResultBox type={decisionType} title={decisionTitle} detail={decisionDetail} />
        </div>
      )}

      {/* TAB 3 */}
      {tab === "kelly" && (
        <div>
          <div style={{ background: darkCard, borderRadius: 10, border: "1px solid #2a2a1a", padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: gold, marginBottom: 14 }}>Critère de Kelly</div>
            <SliderRow label="Capital (€)" min={1000} max={100000} step={1000} value={kCapital} onChange={setKCapital} display={kCapital.toLocaleString("fr-FR") + "€"} />
            <SliderRow label="WinRate (%)" min={50} max={99} step={0.5} value={kWr} onChange={setKWr} display={kWr + "%"} />
            <SliderRow label="R:R" min={1} max={10} step={0.1} value={kRr} onChange={setKRr} display={"1:" + kRr.toFixed(1)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <MetricCard label="Kelly complet" value={(kelly * 100).toFixed(1) + "%"} color={kelly > 0 ? green : red} />
            <MetricCard label="Demi-Kelly" value={(halfKelly * 100).toFixed(1) + "%"} color={amber} />
            <MetricCard label="Montant Kelly" value={(Math.max(kelly, 0) * kCapital).toFixed(0) + "€"} color={kelly > 0 ? green : red} />
            <MetricCard label="Montant prudent" value={(Math.max(halfKelly, 0) * kCapital).toFixed(0) + "€"} color={amber} />
          </div>

          <div style={{ background: "#111", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: muted, lineHeight: 1.9, marginBottom: 12 }}>
            <span style={{ color: gold }}>Kelly (%)</span> = WinRate − [(1 − WinRate) / R:R]<br />
            <span style={{ color: "#e8e8d0" }}>= {(kWr / 100).toFixed(2)} − [{(1 - kWr / 100).toFixed(2)} / {kRr.toFixed(1)}]</span><br />
            <span style={{ color: green }}>= {(kelly * 100).toFixed(1)}%</span><br />
            <span style={{ color: amber }}>→ Demi-Kelly recommandé : {(halfKelly * 100).toFixed(1)}%</span><br />
            <span style={{ color: red }}>→ Plafonné à 2% en pratique : {safeRisk}%</span>
          </div>

          <ResultBox
            type={kellyType}
            title={kellyType === "go" ? "Sizing optimal calculé" : kellyType === "caution" ? "Kelly très élevé — appliquer le plafond" : "Espérance négative — ne pas trader"}
            detail={`Risque recommandé : ${safeRisk}% = ${(kCapital * parseFloat(safeRisk) / 100).toFixed(0)}€. Kelly pur (${(kelly * 100).toFixed(1)}%) trop agressif — toujours utiliser 25-50% du Kelly.`}
          />
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "0.5px solid #2a2a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>PHG ICT ELITE · v2.0 LIVE</span>
        <span style={{ fontSize: 11, color: gold }}>PHARAOH GOLD PHG</span>
      </div>
    </div>
  );
}