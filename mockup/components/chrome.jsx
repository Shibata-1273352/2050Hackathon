/* global React */
const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────
// Background — Akagi mountain silhouette + sparks
// ─────────────────────────────────────────────────────────
function AkagiBackground({ intensity }) {
  const sparkCount = intensity === "quiet" ? 4 : intensity === "blazing" ? 48 : 18;
  const ridgeOpacity = intensity === "quiet" ? 0.25 : intensity === "blazing" ? 0.85 : 0.5;
  const sparkOpacity = intensity === "quiet" ? 0.3 : intensity === "blazing" ? 1 : 0.9;
  return (
    <div className="akagi-bg" aria-hidden="true">
      <div className="akagi-grid"/>
      <svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYEnd meet" style={{opacity: ridgeOpacity}}>
        <defs>
          <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2548" stopOpacity="0"/>
            <stop offset="100%" stopColor="#0B1020" stopOpacity="0.95"/>
          </linearGradient>
          <linearGradient id="ridge2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E1530" stopOpacity="0"/>
            <stop offset="100%" stopColor="#0B1020"/>
          </linearGradient>
        </defs>
        <path d="M0,520 L0,380 L120,360 L220,300 L320,340 L440,260 L560,320 L680,250 L820,310 L940,240 L1080,300 L1220,260 L1360,320 L1480,280 L1600,330 L1600,520 Z" fill="url(#ridge2)" opacity="0.7"/>
        <path d="M0,520 L0,440 L100,420 L200,380 L320,420 L420,340 L520,400 L640,330 L760,380 L880,330 L1000,400 L1140,350 L1280,420 L1400,370 L1520,420 L1600,400 L1600,520 Z" fill="url(#ridge)" opacity="0.85"/>
        <path d="M0,600 L0,490 L80,470 L180,500 L300,440 L420,490 L540,440 L680,490 L820,440 L960,490 L1100,440 L1240,490 L1380,460 L1520,490 L1600,470 L1600,600 Z" fill="#0B1020"/>
      </svg>
      {Array.from({length: sparkCount}).map((_,i)=>(
        <span key={i} className="spark" style={{
          left: `${(i*53)%100}%`,
          bottom: `${(i*17)%30}%`,
          animationDelay: `${(i*0.7)%8}s`,
          animationDuration: `${6 + (i%5)}s`,
          opacity: sparkOpacity,
          ['--spark-max-opacity']: sparkOpacity,
        }}/>
      ))}
    </div>
  );
}
window.AkagiBackground = AkagiBackground;

// ─────────────────────────────────────────────────────────
// Header / Step indicator
// ─────────────────────────────────────────────────────────
const STEPS = [
  { key: "open",    label: "問いを置く" },
  { key: "input",   label: "入力データ" },
  { key: "council", label: "現在の声" },
  { key: "issue",   label: "論点マップ" },
  { key: "letter",  label: "2050年の手紙" },
  { key: "accord",  label: "協議の出発点" },
];

function Header({ stepKey }) {
  const idx = STEPS.findIndex(s => s.key === stepKey);
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14" stroke="#FF6B35" strokeWidth="1"/>
            <path d="M18 6 L21 18 L18 30 L15 18 Z" fill="#FF6B35"/>
            <circle cx="18" cy="18" r="2.5" fill="#0B1020" stroke="#FF6B35" strokeWidth="1"/>
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">Mirai <em>Forge</em> / ぐんま未来工房</div>
          <div className="brand-sub">Civic Reasoning Pipeline</div>
        </div>
      </div>
      <div className="step-indicator">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`step-item ${i === idx ? "active" : i < idx ? "done" : ""}`}>
              <span className="step-num">{String(i+1).padStart(2,'0')}</span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="step-sep"/>}
          </React.Fragment>
        ))}
      </div>
    </header>
  );
}
window.Header = Header;

// ─────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────
function Footer({ note }) {
  return (
    <div className="app-footer">
      <div className="principle">
        <span className="dot"/>
        <span>AIは決めない。AIは、市民協議の出発点をつくる。決めるのは、市民と行政である。</span>
      </div>
      <div>{note}</div>
    </div>
  );
}
window.Footer = Footer;
