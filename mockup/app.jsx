/* global React, ReactDOM,
   AkagiBackground, Header, Footer,
   SceneOpening, SceneTheme, SceneInputData, SceneCouncil, SceneIssueMap,
   SceneLetter, SceneComparison, SceneAccord, SceneClosing,
   TweaksPanel, TweakSection, TweakSlider, TweakRadio, TweakSelect, TweakToggle, useTweaks
*/
const { useState, useEffect, useCallback, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────
// Tweak defaults — block must remain valid JSON for host persistence
// ─────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "intensity": "balanced",
  "voice": "hanako",
  "tempo": "cinema"
}/*EDITMODE-END*/;

// ─────────────────────────────────────────────────────────
// Scene flow
// ─────────────────────────────────────────────────────────
const SCENES = [
  { id: "opening",   step: "open",    label: "Opening" },
  { id: "theme",     step: "open",    label: "Theme" },
  { id: "input",     step: "input",   label: "Input Data" },
  { id: "council",   step: "council", label: "5 Voices" },
  { id: "issue",     step: "issue",   label: "Issue Map" },
  { id: "letter",    step: "letter",  label: "Letter from 2050" },
  { id: "compare",   step: "accord",  label: "Comparison" },
  { id: "accord",    step: "accord",  label: "Accord Draft" },
  { id: "closing",   step: "accord",  label: "Closing" },
];

// Tempo profiles (passed down to scenes via context vars on document)
const TEMPO_PROFILES = {
  pitch:        { letterParaInterval: 700,  letterStart: 200,  inputStep: 200, scale: 0.4 },
  cinema:       { letterParaInterval: 1900, letterStart: 600,  inputStep: 450, scale: 1.0 },
  contemplative:{ letterParaInterval: 3200, letterStart: 1000, inputStep: 700, scale: 1.6 },
};

// Intensity profiles — applied as CSS variables on :root
const INTENSITY_PROFILES = {
  quiet: {
    "--forge-orange-glow": "0 0 12px rgba(255,107,53,0.15)",
    "--ridge-opacity": "0.25",
    "--spark-count": 4,
    "--spark-opacity": "0.3",
    "--orange-text-shadow": "0 0 8px rgba(255,107,53,0.15)",
  },
  balanced: {
    "--forge-orange-glow": "0 0 32px rgba(255,107,53,0.35)",
    "--ridge-opacity": "0.5",
    "--spark-count": 18,
    "--spark-opacity": "0.9",
    "--orange-text-shadow": "0 0 24px rgba(255,107,53,0.4)",
  },
  blazing: {
    "--forge-orange-glow": "0 0 64px rgba(255,107,53,0.7)",
    "--ridge-opacity": "0.85",
    "--spark-count": 48,
    "--spark-opacity": "1",
    "--orange-text-shadow": "0 0 48px rgba(255,107,53,0.75)",
  },
};

function App() {
  const seed = window.MIRAI_SEED;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [sceneIdx, setSceneIdx] = useState(0);
  const scene = SCENES[sceneIdx];

  // Apply intensity profile as CSS vars on :root
  useEffect(() => {
    const profile = INTENSITY_PROFILES[t.intensity] || INTENSITY_PROFILES.balanced;
    const root = document.documentElement;
    Object.entries(profile).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [t.intensity]);

  // Tempo profile available globally
  const tempo = TEMPO_PROFILES[t.tempo] || TEMPO_PROFILES.cinema;
  useEffect(() => {
    window.MIRAI_TEMPO = tempo;
  }, [t.tempo]);

  // Voice → letter + paired draft v2
  const letter = seed.letters[t.voice] || seed.letters.hanako;
  const draftV2 = seed.draftV2_by_voice[t.voice] || seed.draftV2_by_voice.hanako;

  const go = (i) => setSceneIdx(Math.max(0, Math.min(SCENES.length - 1, i)));
  const next = () => go(sceneIdx + 1);
  const prev = () => go(sceneIdx - 1);
  const restart = () => go(0);

  useEffect(() => {
    const onKey = (e) => {
      // ignore arrows when focus is in tweaks panel inputs
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Home") { restart(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sceneIdx]);

  const renderScene = () => {
    switch (scene.id) {
      case "opening": return <SceneOpening onStart={next}/>;
      case "theme":   return <SceneTheme ctx={seed.context} onPick={next}/>;
      case "input":   return <SceneInputData ctx={seed.context} data={seed.inputData} onContinue={next} tempo={tempo}/>;
      case "council": return <SceneCouncil agents={seed.agents} ctx={seed.context} tempo={tempo}/>;
      case "issue":   return <SceneIssueMap issueMap={seed.issueMap} agents={seed.agents}/>;
      case "letter":  return <SceneLetter letter={letter} tempo={tempo}/>;
      case "compare": return <SceneComparison v1={seed.draftV1} letter={letter} v2={draftV2}/>;
      case "accord":  return <SceneAccord v2={draftV2} letter={letter} ctx={seed.context}/>;
      case "closing": return <SceneClosing onRestart={restart}/>;
      default: return null;
    }
  };

  const showFab = !["opening"].includes(scene.id);

  return (
    <div key={scene.id + t.voice + t.tempo} style={{position:"relative", minHeight:"100vh"}}>
      <AkagiBackground intensity={t.intensity}/>
      <Header stepKey={scene.step}/>
      {renderScene()}
      <Footer note={`MODE: cached  ·  ${String(sceneIdx+1).padStart(2,'0')}/${String(SCENES.length).padStart(2,'0')}  ${scene.label}  ·  ${t.intensity} / ${t.voice} / ${t.tempo}`}/>

      <div className="scene-skip">
        <kbd>←</kbd><kbd>→</kbd>
        <span>でシーン切替</span>
      </div>

      {showFab && (
        <div className="nav-fab">
          <button className="btn btn-ghost" onClick={prev} disabled={sceneIdx === 0}
            style={{opacity: sceneIdx === 0 ? 0.4 : 1}}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M11 6H1M5 1L1 6l4 5" stroke="currentColor" strokeWidth="1.5"/></svg>
            前へ
          </button>
          <button className="btn btn-primary" onClick={next} disabled={sceneIdx === SCENES.length - 1}
            style={{opacity: sceneIdx === SCENES.length - 1 ? 0.4 : 1}}>
            次のシーンへ
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M7 1l4 5-4 5" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Forge Intensity"/>
        <div style={{fontSize:10.5, color:"rgba(41,38,27,.6)", lineHeight:1.5, marginBottom:4}}>
          鍛冶場の熱量。火花密度・山稜の濃さ・赤橙のグロウを連動。
        </div>
        <TweakRadio
          label="Heat"
          value={t.intensity}
          options={["quiet","balanced","blazing"]}
          onChange={(v) => setTweak("intensity", v)}
        />

        <TweakSection label="2050年の語り手"/>
        <div style={{fontSize:10.5, color:"rgba(41,38,27,.6)", lineHeight:1.5, marginBottom:4}}>
          手紙・3カラム比較・草案v2が、語り手に応じて鍛え直されます。
        </div>
        <TweakSelect
          label="Future Citizen"
          value={t.voice}
          options={[
            { value: "hanako",  label: "田中花子 82歳 — 取り残される人" },
            { value: "ren",     label: "佐藤蓮 24歳 — 直せる余白" },
            { value: "misaki",  label: "小林美咲 41歳 — 決め続ける人" },
          ]}
          onChange={(v) => setTweak("voice", v)}
        />

        <TweakSection label="Stage Tempo"/>
        <div style={{fontSize:10.5, color:"rgba(41,38,27,.6)", lineHeight:1.5, marginBottom:4}}>
          手紙のフェード速度・データ列の表示間隔を制御。
        </div>
        <TweakRadio
          label="Pace"
          value={t.tempo}
          options={["pitch","cinema","contemplative"]}
          onChange={(v) => setTweak("tempo", v)}
        />

        <div style={{
          marginTop: 6, padding: "10px 12px",
          background: "rgba(0,0,0,0.04)", borderRadius: 8,
          fontSize: 10.5, lineHeight: 1.6, color: "rgba(41,38,27,0.7)",
        }}>
          <b style={{display:"block", marginBottom:3, color:"#29261b"}}>合言葉</b>
          手紙で泣かせるな。手紙で草案を変えろ。
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
