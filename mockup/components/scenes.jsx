/* global React, AgentCard, IssueMap, FutureLetterCard, ComparisonView, AccordDraft, SourceBadge */
const { useState, useEffect, useMemo } = React;

// ─────────────────────────────────────────────────────────
// SCENE 1: Opening
// ─────────────────────────────────────────────────────────
function SceneOpening({ onStart }) {
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow" style={{textAlign:"center", paddingTop:40}}>
        <div className="eyebrow" style={{marginBottom:24}}>2050年からの手紙で、群馬の次の一歩を鍛えるAI</div>
        <h1 className="serif" style={{
          fontSize: "clamp(36px, 5vw, 64px)",
          lineHeight: 1.5,
          margin: "0 0 20px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textWrap: "balance",
        }}>
          未来は予測しない。<br/>
          <span style={{color:"var(--forge-orange)", textShadow:"0 0 32px rgba(255,107,53,0.4)"}}>2050年の声を聞いて、</span><br/>
          2026年の一歩を変える。
        </h1>
        <p className="muted-2" style={{
          fontSize: 15,
          maxWidth: 640,
          margin: "32px auto 48px",
          lineHeight: 1.9,
          letterSpacing: "0.04em",
        }}>
          群馬県の「5つのゼロ」を、5つの現在の視点と1つの未来の視点から問い直し、<br/>
          市民協議の出発点をつくります。
        </p>
        <button className="btn btn-primary" onClick={onStart}>
          市民協議を始める
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
        <div className="muted" style={{fontSize:11, marginTop:32, letterSpacing:"0.16em"}}>
          GUNMA × 2050 × CIVIC FORGE
        </div>
      </div>
    </div>
  );
}
window.SceneOpening = SceneOpening;

// ─────────────────────────────────────────────────────────
// SCENE 2: Theme select
// ─────────────────────────────────────────────────────────
function SceneTheme({ onPick, ctx }) {
  const themes = [
    { id: "blackout", title: "災害時の停電ゼロ", desc: "公共施設を、平時はクールシェア、災害時は電気避難所として使い直す", live: true },
    { id: "ghg", title: "温室効果ガス排出量ゼロ", desc: "前橋市の排出経路と再エネ転換を市民協議で組み立てる", live: false },
    { id: "disaster", title: "自然災害による死者ゼロ", desc: "避難計画を当事者起点で問い直す", live: false },
    { id: "plastic", title: "プラごみゼロ", desc: "Coming Soon", live: false },
    { id: "foodloss", title: "食品ロスゼロ", desc: "Coming Soon", live: false },
  ];
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow">
        <div className="eyebrow">SCENE 02 / テーマ選択</div>
        <h2 className="serif" style={{fontSize:32, margin:"8px 0 6px", letterSpacing:"0.04em"}}>
          地域: <span style={{color:"var(--forge-orange)"}}>{ctx.region}</span> × 5つのゼロ
        </h2>
        <p className="muted-2" style={{fontSize:13, marginBottom:28, letterSpacing:"0.04em"}}>
          今日の問い: 公共施設を、平時はクールシェア、災害時は電気避難所として使い直せるか？
        </p>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14}}>
          {themes.map(t => (
            <div
              key={t.id}
              className={`card card-hover ${!t.live ? "card-locked" : ""}`}
              onClick={() => t.live && onPick(t)}
              style={{minHeight: 160}}
            >
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                <span className={`badge ${t.live ? "badge-claim" : "badge-soon"}`}>
                  {t.live ? "MVP実装" : "Coming Soon"}
                </span>
                <span className="muted" style={{fontSize:11, letterSpacing:"0.1em"}}>
                  GUNMA / 5 ZEROS
                </span>
              </div>
              <div className="serif" style={{fontSize:18, fontWeight:700, marginBottom:10, lineHeight:1.4}}>
                {t.title}
              </div>
              <div className="muted-2" style={{fontSize:12, lineHeight:1.7}}>
                {t.desc}
              </div>
              {t.live && (
                <div style={{marginTop:14, fontSize:11, color:"var(--forge-orange)", letterSpacing:"0.1em"}}>
                  問いを始める →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.SceneTheme = SceneTheme;

// ─────────────────────────────────────────────────────────
// SCENE 2.5: Input data reveal
// ─────────────────────────────────────────────────────────
function SceneInputData({ data, ctx, onContinue, tempo }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const T = tempo || window.MIRAI_TEMPO || { inputStep: 450 };
    const timers = data.map((_, i) => setTimeout(() => setStep(s => Math.max(s, i+1)), 400 + i*T.inputStep));
    timers.push(setTimeout(() => setStep(s => Math.max(s, data.length+1)), 400 + data.length*T.inputStep + 400));
    return () => timers.forEach(clearTimeout);
  }, [data, tempo]);
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow" style={{maxWidth:780}}>
        <div className="eyebrow" style={{marginBottom:8}}>SCENE 02.5 / INPUT DATA</div>
        <h2 className="serif" style={{fontSize:28, margin:"0 0 24px", letterSpacing:"0.06em"}}>
          入力データ
        </h2>
        <div className="card" style={{padding:"28px 32px"}}>
          <div className="muted" style={{fontSize:11, letterSpacing:"0.16em", marginBottom:16}}>
            前橋市 × 災害時の停電ゼロ — 根拠ソース
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {data.map((d, i) => (
              <div
                key={i}
                style={{
                  display:"flex", alignItems:"center", gap:14,
                  padding:"10px 0",
                  borderBottom: i < data.length-1 ? "1px dashed var(--forge-line)" : "none",
                  opacity: step > i ? 1 : 0,
                  transform: step > i ? "translateX(0)" : "translateX(-12px)",
                  transition: "opacity .5s, transform .5s",
                }}
              >
                <span style={{fontFamily:"monospace", color:"var(--forge-muted)", fontSize:11, width:30}}>
                  {String(i+1).padStart(2,'0')}
                </span>
                <SourceBadge type={d.type}/>
                <span style={{fontSize:14, flex:1}}>{d.label}</span>
                <span className="muted" style={{fontSize:11}}>{d.note}</span>
              </div>
            ))}
          </div>
          <div className="divider divider-strong" style={{marginTop:20}}/>
          <div style={{
            fontSize:13,
            color:"var(--forge-orange)",
            letterSpacing:"0.06em",
            opacity: step > data.length ? 1 : 0,
            transition: "opacity .8s",
            textAlign:"center",
            padding: "8px 0",
          }}>
            これらの根拠から、市民協議の問いを鍛えます
          </div>
        </div>
        {step > data.length && (
          <div style={{textAlign:"center", marginTop:24, opacity: 0, animation:"sceneIn .6s .3s forwards"}}>
            <button className="btn btn-ghost" onClick={onContinue}>5つの現在の声を集める →</button>
          </div>
        )}
      </div>
    </div>
  );
}
window.SceneInputData = SceneInputData;

// ─────────────────────────────────────────────────────────
// SCENE 3: Civic Council (5 agents)
// ─────────────────────────────────────────────────────────
function SceneCouncil({ agents, ctx }) {
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow" style={{maxWidth:1300}}>
        <div className="eyebrow">SCENE 03 / 現在の声</div>
        <h2 className="serif" style={{fontSize:26, margin:"6px 0 4px", letterSpacing:"0.04em"}}>
          5つの現在の声が、問いを分解します
        </h2>
        <p className="scene-caption">
          {ctx.region} × {ctx.theme} — 各エージェントは独立して並列推論しています
        </p>
        <div className="agent-grid">
          {agents.map((a, i) => <AgentCard key={a.agent_id} agent={a} delay={i * 220}/>)}
        </div>
        <div style={{
          marginTop:24,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          fontSize:11, color:"var(--forge-muted)", letterSpacing:"0.1em",
        }}>
          <span>5体並列実行 / asyncio.gather / GPT-4o-mini</span>
          <span>各主張は最低1つの根拠ソース付き · 仮説には [仮説] ラベル</span>
        </div>
      </div>
    </div>
  );
}
window.SceneCouncil = SceneCouncil;

// ─────────────────────────────────────────────────────────
// SCENE 4: Issue Map
// ─────────────────────────────────────────────────────────
function SceneIssueMap({ issueMap, agents }) {
  const agentMap = useMemo(() => Object.fromEntries(agents.map(a => [a.agent_id, a])), [agents]);
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow" style={{maxWidth:1280}}>
        <div className="eyebrow">SCENE 04 / 論点マップ</div>
        <h2 className="serif" style={{fontSize:26, margin:"6px 0 4px"}}>
          共有できる方向と、まだ議論すべき懸念が見えてきました
        </h2>
        <p className="scene-caption">
          5体の主張を構造化 — 内部実装名 IssueMap
        </p>
        <IssueMap issues={issueMap.issues} agentMap={agentMap}/>
      </div>
    </div>
  );
}
window.SceneIssueMap = SceneIssueMap;

// ─────────────────────────────────────────────────────────
// SCENE 5: Letter
// ─────────────────────────────────────────────────────────
function SceneLetter({ letter, tempo, audioBlocked, onRetryAudio }) {
  return (
    <div className="stage scene-enter" style={{paddingTop:80}}>
      <div className="stage-narrow" style={{maxWidth:900, textAlign:"center"}}>
        <div className="eyebrow">SCENE 05 / LETTER FROM 2050</div>
        <h2 className="serif" style={{fontSize:24, margin:"6px 0 24px", color:"var(--forge-cyan)"}}>
          2050年の前橋市民から、手紙が届きました
        </h2>
        {audioBlocked && (
          <button className="letter-audio-retry" onClick={onRetryAudio}>
            音声を再生
          </button>
        )}
        <FutureLetterCard letter={letter} tempo={tempo}/>
      </div>
    </div>
  );
}
window.SceneLetter = SceneLetter;

// ─────────────────────────────────────────────────────────
// SCENE 6a: Comparison
// ─────────────────────────────────────────────────────────
function SceneComparison({ v1, letter, v2 }) {
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow" style={{maxWidth:1280}}>
        <div className="eyebrow">SCENE 06a / 手紙の前後</div>
        <h2 className="serif" style={{fontSize:26, margin:"6px 0 4px"}}>
          手紙によって、草案はこう鍛え直されました
        </h2>
        <p className="scene-caption">
          3つの変化ラベルが、Mirai Forge のクライマックスです
        </p>
        <ComparisonView v1={v1} letter={letter} v2={v2}/>
      </div>
    </div>
  );
}
window.SceneComparison = SceneComparison;

// ─────────────────────────────────────────────────────────
// SCENE 6b: Accord Draft
// ─────────────────────────────────────────────────────────
function SceneAccord({ v2, letter, ctx }) {
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow" style={{maxWidth:1100}}>
        <div className="eyebrow">SCENE 06b / 市民協議の出発点 v0.1</div>
        <h2 className="serif" style={{fontSize:24, margin:"6px 0 4px"}}>
          今日AIが出したのは答えではありません。明日、市民に聞くべき問いです
        </h2>
        <p className="scene-caption">
          行政資料と市民ワークショップ資料の中間 — Civic Reasoning Pipeline 最終出力
        </p>
        <AccordDraft v2={v2} letter={letter} ctx={ctx}/>
      </div>
    </div>
  );
}
window.SceneAccord = SceneAccord;

// ─────────────────────────────────────────────────────────
// SCENE 7: Closing
// ─────────────────────────────────────────────────────────
function SceneClosing({ onRestart }) {
  return (
    <div className="stage scene-enter">
      <div className="stage-narrow" style={{textAlign:"center", maxWidth:760}}>
        <div className="eyebrow" style={{marginBottom:32}}>SCENE 07 / CLOSING</div>
        <p className="serif" style={{
          fontSize: 22,
          lineHeight: 2,
          margin: "0 0 48px",
          letterSpacing: "0.06em",
          textWrap: "balance",
          color: "var(--forge-paper)",
        }}>
          Mirai Forge がつくるのは、政策の答えではない。<br/>
          市民が未来を創るための、<span style={{color:"var(--forge-orange)"}}>最初の問い</span>である。
        </p>
        <div style={{
          padding: "24px 0",
          borderTop: "1px solid var(--forge-line)",
          borderBottom: "1px solid var(--forge-line)",
          margin: "0 0 48px",
          fontSize: 14,
          color: "var(--forge-muted-2)",
          letterSpacing: "0.08em",
          lineHeight: 2.2,
        }}>
          AIは決めない。<br/>
          AIは、市民協議の出発点をつくる。<br/>
          決めるのは、市民と行政である。
        </div>
        <h2 className="serif" style={{
          fontSize: "clamp(28px, 4vw, 44px)",
          lineHeight: 1.6,
          margin: 0,
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}>
          未来は予測しない。<br/>
          <span style={{color:"var(--forge-orange)"}}>2050年の声を聞いて、</span><br/>
          2026年の一歩を変える。
        </h2>
        <div style={{marginTop:48}}>
          <button className="btn btn-ghost" onClick={onRestart}>もう一度はじめから</button>
        </div>
      </div>
    </div>
  );
}
window.SceneClosing = SceneClosing;
