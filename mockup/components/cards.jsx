/* global React */

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────
function SourceBadge({ type, label }) {
  const cls =
    type === "official" ? "badge-official"
    : type === "open_data" ? "badge-open"
    : type === "hypothesis" ? "badge-hyp"
    : "badge-claim";
  const text =
    type === "official" ? "公式"
    : type === "open_data" ? "オープン"
    : type === "hypothesis" ? "仮説"
    : type;
  return (
    <span className={`badge ${cls}`}>
      <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="currentColor" /></svg>
      {text}{label ? <span style={{opacity:0.85, fontWeight:500, marginLeft:4}}>{label}</span> : null}
    </span>
  );
}
window.SourceBadge = SourceBadge;

// Custom geometric icon per agent — no emoji
function AgentIcon({ id }) {
  const stroke = "currentColor";
  if (id === "admin")    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3.5" width="11" height="9" stroke={stroke} strokeWidth="1.2"/><path d="M2.5 6.5h11M5.5 3.5v9M10.5 3.5v9" stroke={stroke} strokeWidth="1.2"/></svg>;
  if (id === "env")      return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2 L13 9 L8 14 L3 9 Z" stroke={stroke} strokeWidth="1.2"/><circle cx="8" cy="9" r="2" stroke={stroke} strokeWidth="1.2"/></svg>;
  if (id === "biz")      return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13 L6 7 L9 10 L14 4" stroke={stroke} strokeWidth="1.2"/><path d="M14 4 L14 8 M14 4 L10 4" stroke={stroke} strokeWidth="1.2"/></svg>;
  if (id === "citizen")  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.5" stroke={stroke} strokeWidth="1.2"/><path d="M3 14 C3 11 5 9.5 8 9.5 C11 9.5 13 11 13 14" stroke={stroke} strokeWidth="1.2"/></svg>;
  if (id === "next_gen") return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke={stroke} strokeWidth="1.2"/><path d="M8 2.5 L8 13.5 M2.5 8 L13.5 8" stroke={stroke} strokeWidth="1.2"/></svg>;
  return null;
}
window.AgentIcon = AgentIcon;

// ─────────────────────────────────────────────────────────
// Agent Card
// ─────────────────────────────────────────────────────────
function AgentCard({ agent, delay = 0 }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`card agent-card ${entered ? "entered" : ""}`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(14px)",
        transition: "opacity .6s ease, transform .6s ease",
      }}
    >
      <div className="agent-head">
        <div className="agent-icon"><AgentIcon id={agent.agent_id} /></div>
        <div style={{flex:1, minWidth:0}}>
          <div className="agent-name">{agent.agent_name}</div>
          <div className="agent-sub">{agent.subtitle}</div>
        </div>
      </div>

      <div>
        <span className={`agent-stance stance-${agent.stance}`}>{agent.stance}</span>
      </div>

      <div className="agent-claim">{agent.claim}</div>

      <div className="agent-evidence-block">
        <div className="agent-evidence-block-label">根拠</div>
        <div className="tag-row">
          {agent.evidence.map((ev, i) => (
            <SourceBadge key={i} type={ev.type} label={ev.label} />
          ))}
          {agent.hypotheses.length > 0 && (
            <SourceBadge type="hypothesis" label={`仮説 ${agent.hypotheses.length}`} />
          )}
        </div>
      </div>
    </div>
  );
}
window.AgentCard = AgentCard;

// ─────────────────────────────────────────────────────────
// Issue Map row
// ─────────────────────────────────────────────────────────
function AgentChip({ agentId, kind, agentMap }) {
  const a = agentMap[agentId];
  if (!a) return null;
  const cls =
    kind === "supporter" ? "agent-chip-supporter"
    : kind === "objector" ? "agent-chip-objector"
    : "agent-chip-conditional";
  const sym = kind === "supporter" ? "＋" : kind === "objector" ? "−" : "±";
  return (
    <span className={`agent-chip ${cls}`}>
      <span style={{fontWeight:700}}>{sym}</span>
      {a.agent_name}
    </span>
  );
}

function IssueMap({ issues, agentMap }) {
  return (
    <div className="issue-map">
      {issues.map((iss, idx) => (
        <div className="issue-row scene-enter" key={idx} style={{animationDelay:`${idx*0.15}s`}}>
          <div className="issue-side">
            <div className="issue-side-label">推進する理由 / 支持</div>
            <div className="tag-row">
              {iss.supporters.map(id => <AgentChip key={id} agentId={id} kind="supporter" agentMap={agentMap}/>)}
              {iss.conditional_supporters.map(id => <AgentChip key={`c${id}`} agentId={id} kind="conditional" agentMap={agentMap}/>)}
            </div>
          </div>
          <div className="issue-center">
            <div className="eyebrow" style={{fontSize:10}}>論点 {String(idx+1).padStart(2,'0')}</div>
            <div className="issue-title">{iss.issue}</div>
            <div className="muted" style={{fontSize:11, lineHeight:1.7, marginTop:6}}>
              {iss.open_questions.map((q, i) => <div key={i}>— {q}</div>)}
            </div>
          </div>
          <div className="issue-side" style={{alignItems:"flex-end", textAlign:"right"}}>
            <div className="issue-side-label">議論すべき懸念 / 反対</div>
            <div className="tag-row" style={{justifyContent:"flex-end"}}>
              {iss.objectors.length === 0 && iss.conditional_supporters.length === 0 ? (
                <span className="muted" style={{fontSize:11}}>明確な反対者は検出されませんでした</span>
              ) : (
                iss.objectors.map(id => <AgentChip key={id} agentId={id} kind="objector" agentMap={agentMap}/>)
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
window.IssueMap = IssueMap;

// ─────────────────────────────────────────────────────────
// Letter
// ─────────────────────────────────────────────────────────
function FutureLetterCard({ letter, autoplay = true, tempo }) {
  const [revealed, setRevealed] = useState(0);
  const [closingShown, setClosingShown] = useState(false);
  const [discShown, setDiscShown] = useState(false);

  useEffect(() => {
    if (!autoplay) return;
    const T = tempo || window.MIRAI_TEMPO || { letterParaInterval: 1900, letterStart: 600 };
    setRevealed(0); setClosingShown(false); setDiscShown(false);
    const timers = [];
    letter.paragraphs.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealed(r => Math.max(r, i + 1)), T.letterStart + i * T.letterParaInterval));
    });
    const closeAt = T.letterStart + letter.paragraphs.length * T.letterParaInterval + Math.round(T.letterParaInterval * 0.25);
    timers.push(setTimeout(() => setClosingShown(true), closeAt));
    timers.push(setTimeout(() => setDiscShown(true), closeAt + Math.round(T.letterParaInterval * 0.7)));
    return () => timers.forEach(clearTimeout);
  }, [letter, autoplay, tempo]);

  return (
    <div className="letter-stage">
      <div className="letter">
        <div className="letter-meta">
          <span>FROM 2050 — 前橋市</span>
          <span>{letter.year} / 仮想シナリオ</span>
        </div>
        <div className="letter-from">
          {letter.citizen_location} / {letter.citizen_name}（{letter.citizen_age}歳）
        </div>
        {letter.paragraphs.map((p, i) => (
          <p key={i} className={`letter-p ${i < revealed ? "visible" : ""}`}>{p}</p>
        ))}
        <div className={`letter-closing ${closingShown ? "visible" : ""}`}>
          {letter.closing_question}
        </div>
        <div className={`letter-disclaimer ${discShown ? "visible" : ""}`}>
          <span className="letter-disclaimer-label">仮想シナリオ</span>
          これは2050年の仮想市民からの手紙です。未来予測ではなく、現在の協議で見落としうる視点を明らかにするためのシナリオです。
        </div>
      </div>
    </div>
  );
}
window.FutureLetterCard = FutureLetterCard;

// ─────────────────────────────────────────────────────────
// Comparison 3-column
// ─────────────────────────────────────────────────────────
function ComparisonView({ v1, letter, v2 }) {
  return (
    <div className="compare-grid">
      <div className="compare-col scene-enter">
        <div className="compare-head">
          <div className="compare-eyebrow"><span className="ja">手紙の前</span>BEFORE / 草案 v1</div>
          <div className="compare-summary-label">{v1.summary_label}</div>
        </div>
        <div className="compare-body">
          {v1.keyPhrases.map((p, i) => (
            <div className="compare-key" key={i}><span className="dot"/><span>{p}</span></div>
          ))}
          <div className="muted-2" style={{fontSize:11, marginTop:6, lineHeight:1.7}}>
            {v1.shared_direction}
          </div>
        </div>
      </div>

      <div className="compare-col compare-col-letter scene-enter" style={{animationDelay:".15s"}}>
        <div className="compare-head" style={{borderBottomColor:"rgba(167,243,208,0.2)"}}>
          <div className="compare-eyebrow" style={{color:"var(--forge-cyan)"}}>
            <span className="ja" style={{color:"var(--forge-cyan)"}}>2050年の手紙</span>LETTER
          </div>
          <div className="compare-summary-label">{letter.short_label}</div>
        </div>
        <div className="compare-body">
          {letter.keyPhrases.map((p, i) => (
            <div className="compare-key" key={i}><span className="dot"/><span>{p}</span></div>
          ))}
          <div className="muted-2" style={{fontSize:11, marginTop:6, lineHeight:1.7, fontStyle:"italic"}}>
            「{letter.closing_question}」
          </div>
          <div className="muted" style={{fontSize:10, marginTop:8, letterSpacing:"0.1em"}}>
            — {letter.citizen_name}（{letter.citizen_age}歳・{letter.citizen_location}）
          </div>
        </div>
      </div>

      <div className="compare-col scene-enter" style={{animationDelay:".3s"}}>
        <div className="compare-head">
          <div className="compare-eyebrow"><span className="ja">手紙の後</span>AFTER / 草案 v2</div>
          <div className="compare-summary-label">{v2.summary_label}</div>
        </div>
        <div className="compare-body">
          {v2.keyPhrases.map((p, i) => (
            <div className="compare-key" key={i}><span className="dot"/><span>{p}</span></div>
          ))}
          <div className="changes-from-letter">
            <div className="label">手紙によって変わった点</div>
            <ul>
              {v2.changes_from_letter.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
window.ComparisonView = ComparisonView;

// ─────────────────────────────────────────────────────────
// Accord Draft (市民協議の出発点 v0.1)
// ─────────────────────────────────────────────────────────
function AccordDraft({ v2, letter, ctx }) {
  return (
    <div className="accord scene-enter">
      <div className="accord-head">
        <div>
          <div className="eyebrow" style={{marginBottom:6}}>市民協議の出発点 v0.1</div>
          <div className="accord-title">{ctx.region} × {ctx.theme}</div>
        </div>
        <div className="accord-meta">
          発行: Mirai Forge / Civic Reasoning Pipeline<br/>
          根拠: 群馬県5つのゼロ宣言 ほか<br/>
          <span style={{color:"var(--forge-amber)"}}>※ 最終決定は市民・行政が行います</span>
        </div>
      </div>
      <div className="accord-grid">
        <div className="accord-section">
          <h4><span className="num">01</span>今日の問い</h4>
          <p>{v2.question}</p>
        </div>
        <div className="accord-section">
          <h4><span className="num">02</span>共有できそうな方向</h4>
          <p>{v2.shared_direction}</p>
        </div>
        <div className="accord-section">
          <h4><span className="num">03</span>まだ議論すべき論点</h4>
          <ul>{v2.discussion_points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
        <div className="accord-section">
          <h4><span className="num">04</span>2050年の手紙で変わった点</h4>
          <ul>{v2.changes_from_letter.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
        <div className="accord-section">
          <h4><span className="num">05</span>根拠</h4>
          <ul>{v2.evidence.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
        <div className="accord-section">
          <h4><span className="num">06</span>仮説</h4>
          <ul>{v2.hypotheses.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
        <div className="accord-section full">
          <h4><span className="num">07</span>次に市民へ聞くべき質問</h4>
          <ul>{v2.citizen_questions.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
        <div className="accord-section full">
          <h4><span className="num">08</span>90日アクション</h4>
          <ul>{v2.actions_90days.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
window.AccordDraft = AccordDraft;

Object.assign(window, { SourceBadge, AgentCard, AgentIcon, IssueMap, FutureLetterCard, ComparisonView, AccordDraft });
