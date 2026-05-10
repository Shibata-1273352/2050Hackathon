# AGENTS.md — Mirai Forge エージェント実装の不変条件

> 本書は要件定義書 §3.4「安全策(AGENTS.md に必須記載)」の **verbatim 写し** + 実装側でそれをどこに落とすかのマップ。
> 文言は要件定義書を単一ソースオブトゥルースとし、本書はコードに対するチェックリストとして機能する。

---

## 1. 安全策 8項目 (要件定義 §3.4 原文)

```
1. 各エージェントは独立した API call として実行する。
   プロンプト内で他エージェント応答を捏造することは禁止。

2. Synthesis Agent が手紙の内容を予測して先に v2 を生成することは禁止。
   手紙が実際に生成されてから入力として使う。

3. 対立が見つからない場合は「対立を検出できませんでした」と正直に出力する。
   無理やり対立を演出することは禁止。

4. Future Citizen Agent は政策決定を行わない。視座提供のみ。
   全出力は「草案」「議論たたき台」表記。

5. 各エージェント出力は最低1つの根拠ソース表示を必須とする。
   根拠がない主張は「仮説」ラベルを付ける。

6. LLM出力は必ず JSON Schema を経由してUIに渡す。
   structured output を強制する(response_format=json_schema, strict=true)。
   パース失敗時は最大3回再試行し、それでも失敗する場合は cached JSON に
   フォールバックする。これは failure mode として正常に処理されるべき経路。

7. Synthesis Agent は、草案 v2 生成時に必ず changes_from_letter と
   summary_label を出力する。「手紙によって何が変わったか」を明示できなければ、
   その草案は不採用とする。

8. 各現在エージェントの system prompt に「他の視点(行政・環境・企業・生活者・
   次世代のうち自分以外)が言いそうな主張を1つ先取りし、それに対する反駁または
   条件付き同意を claim 内に必ず含めること」を強制する。これにより、temperature
   差(0.2〜0.9)以外に構造的な対立軸を与え、5体の意見が同質化するリスクを
   事前に低減する。実装上は AgentOutput.claim 内に「他視点への応答」要素が
   含まれているかを post-hoc で検証し、欠落していれば再生成する(最大2回)。
   再生成しても満たせない場合は、その issue を IssueMap の open_questions に
   降格させる。これは Section 14 の「Temperature 差で意見が収束する」リスクへの
   事前対策であり、Section 3.1 の「絶対譲らない条件」と組で機能する。
```

---

## 2. 実装ガイド — ドメイン不変条件 × 実装上の強制ポイント

CLAUDE.md §3.3「ドメイン不変条件」の中核 4 つを、Pydantic / オーケストレータ / テストのどこで守るかをマップする。**この対応を崩すコミットは Refs: §3.4 を含まない限り通さない。**

### 2.1 Synthesis は手紙より先に v2 を出さない (§3.4 第2項 / §7)

| レイヤ | 強制方法 |
|---|---|
| Pydantic | `SynthesisV2Input` に `letter: LetterOutput` を必須フィールドで持たせる (Optional 禁止) |
| Orchestrator | `backend/orchestrator/pipeline.py` の Phase 4 関数は引数で `letter` を受け取り、`None` の時点で `SynthesisError` を raise |
| Test | `backend/tests/test_pipeline.py::test_synthesis_v2_blocks_when_letter_missing` (TDD §3.2 で定義する第1リスク) |

### 2.2 Future Citizen は決定権を持たない (§3.4 第4項)

| レイヤ | 強制方法 |
|---|---|
| Pydantic | `FutureCitizenOutput` に `decision`, `recommendation`, `verdict` 等の決定系フィールドを置かない。`stance` も present 5体専用にし、未来視点には付与しない |
| Schema test | `backend/tests/test_schemas.py::test_future_citizen_has_no_decision_fields` で `decision`/`recommendation`/`verdict` がスキーマに含まれないことを assert |
| UI 文言 | コンポーネント側で「草案」「議論たたき台」以外の表記を出さない (§3.3 ユビキタス言語表) |

### 2.3 対立は捏造しない (§3.4 第3項)

| レイヤ | 強制方法 |
|---|---|
| Pydantic | `IssueMapOutput.conflicts: list[Conflict]` は空配列許容 (`default_factory=list`)。代わりに `IssueMapOutput.no_conflicts_detected: bool` を持たせる |
| Synthesis (Phase 2) | プロンプトに「対立が観測できなければ `conflicts: []` と `no_conflicts_detected: true` を返せ」を明示。LLM 側に対立を強制する語彙を入れない |
| Test | `backend/tests/test_pipeline.py::test_no_synthetic_conflicts_when_agents_agree` (cached fixture で 5体が同方向に振れたケースを使う) |

### 2.4 草案 v2 は `changes_from_letter` と `summary_label` を必ず出す (§3.4 第7項)

| レイヤ | 強制方法 |
|---|---|
| Pydantic | `DraftV2Output.changes_from_letter: list[str]` (min_length=1) と `DraftV2Output.summary_label: str` (min_length=1) を必須化 |
| Orchestrator | strict パース失敗 → 最大3回再試行 → cached フォールバック (§3.4 第6項) のフローを `backend/orchestrator/retry.py` に集約 |
| UI | `frontend/components/scenes/comparison.tsx` で `changes_from_letter` を **diff として視覚の支配項目** にする (CLAUDE.md §10.5) |

---

## 3. 補足 — 8項目に直結する派生ルール

- **第1項 (独立 API call)**: `asyncio.gather` で5体並列実行 (`backend/agents/present/`)。プロンプトテンプレートから「他エージェントが言うであろう…」のサンプル応答を埋め込まないこと。第8項の「他視点先取り」は **system prompt の指示としてのみ** 与え、context に他エージェント出力を渡さない。
- **第5項 (根拠ソース必須)**: `AgentOutput.evidence: list[Evidence]` は `min_length=1` 強制。根拠なし主張は `Evidence(source_type="hypothesis", ...)` で表現し、UI badge は `source.hypothesis` semantic を使う。
- **第6項 (cached フォールバックは正常経路)**: `?mode=cached` (デモ既定) と「strict パース3連続失敗 → cache 読込」の両方が同じ `backend/cache/demo_seed.json` を読む。fallback で UI が崩れていないことを TDD §3.2 第2リスクとして必ずテストする。
- **第8項 (他視点先取り検証)**: post-hoc 検証 → 最大2回再生成 → それでも欠落なら IssueMap の `open_questions` に降格。降格ロジックは `backend/orchestrator/synthesis_phase2.py` に集約する。

---

## 4. 何を AGENTS.md に書かないか

- 個別エージェントの system prompt 全文 → `backend/agents/*/prompts.py` に置く (§3.1 SDD: 仕様 → コード片方向)
- 5視点それぞれの口調・立場 → 要件定義 §13 (Winning Demo Seed) と `backend/cache/demo_seed.json` が正本
- ユビキタス言語の禁止表記表 → CLAUDE.md §3.3 を参照 (重複させない)

> 本書を更新する手順は CLAUDE.md §3.1「仕様の伝播フロー」と §8.1「Plan mode 必須」に従う。要件定義 §3.4 の更新を伴う場合は Plan mode 必須。
