# Project: Mirai Forge / ぐんま未来工房

> 群馬県の2050年「5つのゼロ」を、5つの現在の視点と1つの未来の視点から問い直し、市民協議の出発点をつくる Civic Reasoning Pipeline。
> 2050ハッカソン群馬・JSAI2026 連動作品。

---

**判断に迷ったらここに戻る (Internal Only):**

> 手紙で泣かせるな。
> 手紙で草案を変えろ。

すべての実装・演出判断は、最終的に「**手紙が草案 v2 を変えていることが視覚的に証明されているか**」で判断する。これに寄与しないコードは書かない。

---

## 0. このファイルの読み方

本リポジトリの**開発手法と禁則**を定める。Claude Code セッションは毎回これを前置文脈とする。

- **判断に迷ったら**: 要件定義書 v1.3.1 §13 (Winning Demo Seed Scenario) を**唯一の正**として参照する
- **三軸開発手法**: SDD (仕様駆動) + TDD (テスト駆動) + DDD (ドメイン駆動) を**ハッカソン現実主義**で適用する
- **デザイン契約**: フロントエンドの視覚的判断はすべて §10 Design Contract に従属する (このハッカソンの勝敗を分ける軸)
- **書かれていない仕様は作らない**: 速度の最大ブースターは「やらないこと」を増やすこと

| ドキュメント | 役割 |
|---|---|
| `docs/mirai_forge_requirements_v1_3_1_full.md` (v1.3.1, 2026-05-10 凍結版+レビュー反映マイクロパッチ) | 単一ソースオブトゥルース (本書はこれに従属) |
| └ §13 Winning Demo Seed | 草案v1/v2/手紙の**正本テキスト** |
| └ §3.4 エージェント安全策 8項目 | → `AGENTS.md` (未作成) で別途切り出す |
| └ §15 受入基準チェックリスト | 提出前ゲート (5/16) |
| └ §16 CLAUDE.md 推奨内容 | 本書はこれを継承拡張 |
| `AGENTS.md` (未作成) | エージェント実装の不変条件 |
| `README.md` | プロジェクト対外説明 |

---

## 1. プロジェクト要約

| 項目 | 値 |
|---|---|
| 一文定義 | 5視点 + 2050年からの手紙で、市民協議の出発点をつくる Civic Reasoning Pipeline |
| 提出締切 | 2026-05-16 23:59 (スライドPDF + デモURL) |
| 本選 | 2026-05-23 GITY |
| JSAI 最終発表 | 2026-06-09 Gメッセ高崎 |
| スタック | Next.js 14 / TypeScript / Tailwind / shadcn/ui / FastAPI / Python (uv 管理) / OpenAI Agents SDK / Pydantic |
| デモモード | `?mode=cached` 既定。`?mode=live` は Q&A 拡張のみ |

---

## 2. 現状ステータス (2026-05-10 時点)

§5 Architecture に書かれた構造は**到達目標**である。下記のうち ❌ のものを「読め」と指示された場合は、まず存在確認してから動くこと。

| 領域 | 状態 |
|---|---|
| `mockup/index.html` (静的プロトタイプ / GH Pages 配信) | ✅ 存在 |
| `mockup/data/seed.js` (§13 反映済み) | ✅ 存在 |
| `mockup/components/{cards,chrome,scenes}.jsx` | ✅ 存在 |
| `mockup/styles/forge.css` | ✅ 存在 (Tailwind 化が次工程) |
| `docs/mirai_forge_requirements_v1_3_1_full.md` (凍結版) | ✅ 存在 |
| Next.js App Router 化 (`frontend/app/`) | ❌ 未着手 (本実装は `frontend/` に新設) |
| `backend/` 全体 (FastAPI / agents / orchestrator / schemas / RAG) | ❌ 未作成 |
| `pyproject.toml` / `uv.lock` / `.python-version` | ❌ 未作成 |
| `AGENTS.md` (要件定義 §3.4 の切り出し) | ❌ 未作成 |
| `backend/cache/demo_seed.json` | ❌ 未作成 (`seed.js` から移植予定) |

**現在地**: P0 着手前、足場づくりフェーズ。

---

## 3. 三軸開発手法

教科書的な SDD/TDD/DDD は重い。残り日数で勝つために、各手法から**デモが死ぬリスクを潰す要素だけ**を取る。

### 3.1 SDD — 仕様駆動開発 (Spec-Driven Development)

**原則**: 仕様 → 型 → 実装 → UI の片方向フロー。逆走禁止。

- **単一ソースオブトゥルース**: 要件定義書 §13。コード内ハードコード文言と§13 が乖離した場合は **§13 が勝つ**
- **仕様の伝播フロー**:
  ```
  要件定義 §13     (自然言語)
       ↓
  JSON Schema §8  (構造)
       ↓
  Pydantic        (/backend/schemas)
       ↓
  TypeScript型    (/frontend/types, datamodel-code-generator 等で生成)
       ↓
  UI (/frontend/components)
  ```
- **スキーマファースト**: 新しい出力フィールドを足したくなったら、Pydantic 先 → API 先 → UI 後。逆順で書き始めない
- **コミット粒度**: コミットメッセージの footer に参照 §番号を含める (フォーマットは §8.3 Conventional Commits 1.0.0)
  - 例: `feat(letter): add closing_question field` + footer `Refs: §3.3, §8.3`
- **仕様変更の手順**: 先に要件定義書を更新する PR (またはチームの口頭合意 + ドキュメント差分) を作ってから、コードを書く

### 3.2 TDD — テスト駆動開発 (Test-Driven Development)

**原則**: 100% カバレッジは捨てる。「**ここが落ちたらデモが死ぬ**」3 領域に集中投下する。

- **テスト 3 階層**:
  - **L1 Schema** — Pydantic / JSON Schema 構造テスト。全エージェント出力が strict=true でパースできること
  - **L2 Pipeline** — Phase 1〜4 の単独テスト + 結合テスト。LLM 呼び出しは cached fixture でモック
  - **L3 Demo** — `backend/cache/demo_seed.json` が §13 と完全一致するスナップショットテスト
- **赤→緑→リファクタを死守する箇所** (= デモ落ちる三大リスク):
  1. **Synthesis Agent が手紙より先に v2 を生成しない** (§3.4 第2項)。Phase 4 入力に letter が無ければ例外
  2. **cached フォールバック経路** (§3.4 第6項)。LLM パース 3 連続失敗 → cache 読込 → UI 正常表示の通しテスト
  3. **Future Citizen Agent が決定権を持たない** (§3.4 第4項)。出力に `decision` 系フィールドが無いことを assert
- **フロント**: Playwright で**7 シーンの visual regression のみ**書く (`toHaveScreenshot()`)
- **TDD のリズム**: スキーマを書く → 失敗テストを書く (Red) → 最小実装 (Green) → リファクタ

### 3.3 DDD — ドメイン駆動設計 (Domain-Driven Design)

**原則**: ユビキタス言語は要件定義書と一字一句一致させる。比喩は UI 内に閉じ込め、コードへ漏らさない。

- **ユビキタス言語** (要件定義書からの逸脱禁止):

  | 用語 (正) | 英訳 (コード識別子) | 禁止表記 |
  |---|---|---|
  | 草案 v1 / 草案 v2 | `Draft v1` / `Draft v2` | 「下書き」「ドラフト」「素案」 |
  | 5視点 | `Five Voices` (行政/環境/企業/生活者/次世代) | 「5 エージェント」「5 AI」 |
  | 手紙 | `Letter` (from 2050) | 「メッセージ」「メール」 |
  | 論点マップ | `Issue Map` | 「論点リスト」「アジェンダ」 |
  | 市民協議の出発点 | `Civic Starting Point` | 「合意案」「提案書」「結論」 |
  | 鍛造 / 鍛え直す | (UI 比喩のみ) | API 名・型名・関数名で使わない |
  | 仮想シナリオ | `simulated scenario` | 「予測」「シミュレーション結果」 |

- **集約ルート**: `CivicReasoningSession` — 1 セッション = 1 地域 × 1 テーマ × 1 語り手
  - 配下に `InputData` / `AgentClaims[5]` / `IssueMap` / `Letter` / `DraftV1` / `DraftV2` を持つ
- **境界づけられたコンテキスト** (4 つ):

  | コンテキスト | 責務 | ディレクトリ |
  |---|---|---|
  | RAG | 公式資料・公開データの根拠抽出 | `backend/rag/` |
  | 5視点 (現在) | 5 体並列推論 (asyncio.gather) | `backend/agents/present/` |
  | 未来視点 | Future Citizen Agent | `backend/agents/future/` |
  | 合成 | Synthesis Agent (Phase 2 と Phase 4 で別実行) | `backend/agents/synthesis/` |

- **ドメイン不変条件**: 詳細は `AGENTS.md` / 要件定義 §3.4 / 本書 §7 に集約。中核 4 つ:
  - Synthesis は手紙より先に v2 を出さない
  - Future Citizen は決定権を持たない (`decision: null` 強制)
  - 対立は捏造しない (`conflicts: []` は許容)
  - 草案 v2 は `changes_from_letter` と `summary_label` を必ず出す

### 3.4 三軸が捨てるもの (Won't Do List)

ハッカソン規模で**やらないこと**を 1 箇所に集約する。やってよいか迷ったら最初にここを見る。

- **SDD で**: §13 / §8 / §3.1 にないフィールド・画面・エージェントの追加 / 思いつきの拡張 (ピッチ後に)
- **TDD で**: ログ整形テスト / Tailwind スタイル細部テスト / URL ルーティングのエッジケース / 3世代切替の網羅 (P1 範囲) / コンポーネント単位のユニットテスト / Red を 5 分以上引きずる
- **DDD で**: Repository パターン / UoW / CQRS / Event Sourcing (ハッカソン規模では過剰)

---

## 4. Commands

### Frontend

| コマンド | 用途 |
|---|---|
| `npm run dev` | Next.js 開発サーバー (port 3000) |
| `npm run lint` | ESLint + 型チェック (TS strict) |
| `npm run build` | プロダクションビルド |
| `npm run test:visual` | Playwright 7 シーン visual regression |

### Backend ([uv](https://docs.astral.sh/uv/) 一本管理)

`pip` / `poetry` / `python -m venv` / `pyenv` を直接使わない。依存追加は必ず `uv add <pkg>` 経由。`pyproject.toml` だけ変えて `uv.lock` を更新しない PR は不可。Python バージョンは `pyproject.toml` で固定 (`requires-python = ">=3.12"` 想定、`uv python install` でローカル取得可)。`uv.lock` はコミット必須。

| コマンド | 用途 |
|---|---|
| `uv sync` | `pyproject.toml` + `uv.lock` から仮想環境を同期 (初回 / pull 後の標準動作) |
| `uv add <pkg>` | 依存追加 (例: `uv add fastapi openai pydantic`) |
| `uv add --dev <pkg>` | 開発依存追加 (例: `uv add --dev pytest ruff`) |
| `uv remove <pkg>` | 依存削除 |
| `uv lock` | lockfile 更新 (依存解決の固定化) |
| `uv run uvicorn backend.api.routes:app --reload` | バックエンド開発サーバー |
| `uv run pytest` | バックエンドテスト (Schema / Pipeline / Demo) |
| `uv run python -m backend.tools.regenerate_seed` | `cache/demo_seed.json` を §13 から再生成 |
| `uv run ruff check backend/` | Python lint (高速) |
| `uv run mypy backend/` | 型チェック (strict) |

`uv run` で venv 有効化が自動。CI でも `uv sync --frozen` → `uv run pytest` の 2 コマンドで完結する。

---

## 5. Architecture (到達目標)

> 下記は **§2 現状ステータス** に従い、現時点では一部未作成。到達目標としての構造を示す。

```
pyproject.toml      # uv が読む。依存・Python バージョン・ツール設定の単一ファイル
uv.lock             # コミット必須。再現可能ビルドの源
.python-version     # uv が読む Python バージョンピン

backend/
  agents/
    present/        # 5視点コンテキスト (行政/環境/企業/生活者/次世代)
    future/         # 未来視点コンテキスト (Future Citizen)
    synthesis/      # 合成コンテキスト (Phase 2 / Phase 4)
  orchestrator/     # 4 Phase の Civic Reasoning Pipeline
  schemas/          # Pydantic 集約 (AgentOutput / IssueMapOutput / LetterOutput / DraftOutput)
  rag/              # RAG コンテキスト (PDF 投入 + 検索)
  cache/
    demo_seed.json  # §13 反映 cached JSON (= デモの正本)
  api/              # FastAPI ルート
  tests/

frontend/
  app/              # Next.js App Router
  components/       # Civic Theater UI (シーン / カード / クローム)
  types/            # Pydantic から生成した TS 型
  styles/           # Tailwind 設定 (custom CSS 禁止)
```

- **集約ルート** = `CivicReasoningSession` (`backend/schemas/session.py`)
- **Phase 順序は不変**: 1 (5視点並列) → 2 (草案v1) → 3 (手紙) → 4 (草案v2)。順序変更は Plan mode 必須
- **Next.js 化の足場**: `mockup/data/seed.js` の構造を `backend/cache/demo_seed.json` に移植する (`mockup/` は静的プロトタイプ。本実装の `frontend/` は別途新設)

---

## 6. Code Style

- **TypeScript strict mode**、`any` 禁止。型は Pydantic から自動生成したものを使う
- **Python は型ヒント必須**、Pydantic ベース。`dict[str, Any]` を API 境界に出さない
- **Tailwind utility classes のみ**、カスタム CSS 禁止 (現プロトタイプ `forge.css` は移行時に Tailwind 化)。色・モーション・タイポは §10 のトークンを参照する (semantic 層のみ可、primitive 直参照不可)
- **LLM 呼び出しは structured output 強制** (`response_format=json_schema, strict=true`)
- **LLM 出力は必ず Pydantic でパースしてから UI に渡す**。生 dict を fetch から直接渡さない
- **パース失敗時は最大3回再試行 → cached JSON フォールバック**。これは failure mode として正常経路
- 命名はユビキタス言語に従う (§3.3 の表)

> uv / lockfile / Python バージョンに関する規約は §4 に集約 (重複回避)。

---

## 7. Constraints

- **`.env` を絶対にコミットしない** (`uv.lock` は逆に必ずコミット)
- **API key はバックエンドのみ**で参照、フロントエンド露出禁止
- **エージェント間でプロンプト内シミュレーションを禁止** (各エージェントは独立した API call)
- **UI 文言の禁止表記は §3.3 の表に従う** (「合意」「下書き」「ドラフト」「メッセージ」「結論」 等)
- **信頼度スコアを表示しない**
- **草案 v2 は `changes_from_letter` と `summary_label` を必ず出す** (出力できなければ再生成)
- **本番デモは `?mode=cached` を既定**とする
- **手紙には「仮想シナリオ」ラベルを必ず併記**
- **AGENTS.md の 8 項目を遵守** (要件定義 §3.4)

---

## 8. Claude Code 運用ルール

### 8.1 Plan mode

**必須 (重大変更)**:

- エージェントスキーマ (Pydantic) の変更
- Phase 1〜4 の順序変更
- `backend/cache/demo_seed.json` の編集 (= §13 の正本に触る)
- 新しいエージェントの追加
- ユビキタス言語の更新

**不要 (フリースタイル可)**:

- Tailwind 範囲内のスタイル調整
- typo / コピー修正 (§13 の正本テキスト以外)
- ログメッセージ追加
- テストケース追加 (既存スキーマの範囲内)

### 8.2 実装優先順位 (ハッカソン用)

| 優先度 | 期限 | 内容 |
|---|---|---|
| **P0** | 5/16 必達 | cached path で 7 シーンが回る / §13 の手紙が表示される / 3 カラム比較で `changes_from_letter` が見える |
| **P1** | 5/23 まで | live mode / 3 世代切替 (花子/蓮/美咲) / CivicHandoffQR |
| **P2** | 6/9 以降 | 他テーマ実装 / RAG 拡張 / Decidim 連携 |

**P0 が通る前に P1 を触らない。P1 が通る前に P2 を触らない。** ハッカソン下では P2 着手を Plan mode で明示承認なしに行わない。

### 8.3 コミット運用 — Conventional Commits 1.0.0

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/ja/v1.0.0/) 準拠。コミットメッセージは git log + future-self + Claude Code が読む契約であり、`feat:` 等のプレフィックス推奨ではなく**規約として強制**する。

**フォーマット**:

```
<type>(<scope>)<!>: <subject>

[optional body — なぜを書く]

Refs: §<section>[, §<section>...]
```

footer は Conventional Commits 1.0.0 仕様に従い、`Token: value` または `Token #value` の **git trailer 形式**で書く (区切りのコロン+空白を省略しない)。トークンは `-` で空白を置換する (例: `Reviewed-by`、ただし `BREAKING CHANGE` だけは例外的に空白可)。

**type (許容セット)**:

| type | 用途 |
|---|---|
| `feat` | 新機能追加 (UI / API / エージェント / スキーマフィールド) |
| `fix` | バグ修正 (既存仕様の不具合) |
| `refactor` | 仕様変化なしの内部改善 |
| `test` | テスト追加・修正 |
| `docs` | ドキュメント・コメントのみ |
| `chore` | 依存・ツール・lockfile・CI 設定 |
| `revert` | 直前コミットの取り消し |

`!` は**破壊的変更**を示す (例: `feat(schemas)!: rename Letter.body to Letter.message`)。本ハッカソンでは §8.1 で Plan mode 必須となるスキーマ変更が破壊的に該当することが多い。

**scope (推奨セット)**:

`frontend` / `backend` / `schemas` / `orchestrator` / `rag` / `cache` / `infra` (uv / pyproject 等) / `docs`。エージェント単独は `agents/present` / `agents/future` / `agents/synthesis` まで割って良い。

**subject 規約**:

- 命令形・現在形・小文字始まり (`add` / `move` / `fix`、 `added` ではない)
- 末尾ピリオドなし
- **50字以内目安、72字超不可**
- ユビキタス言語 §3.3 の正本表記を破らない (`Letter` を `message` に置換しない等)

**body / footer**:

- body は**「なぜ」を書く**。「何」は diff が説明する
- footer に **§番号参照を必ず付ける** (`Refs: §13.5, §8.3` の git trailer 形式)。仕様駆動 (§3.1) の伝播経路を git log に残すため
- `cache/demo_seed.json` の変更は**単独コミット** (混ぜない)
- 1コミットで複数 §番号にまたがる場合は §8.1 Plan mode で分割を検討する

**例**:

```
feat(letter): add closing_question field to LetterOutput

手紙末尾に「あなたが今、もう一度立てるべき問い」を保持する。
§3.3 の Letter 集約に対応する Pydantic フィールド追加。

Refs: §3.3, §8.3
```

```
fix(synthesis): block DraftV2 when letter is missing

Phase 4 入力に letter が無い場合 SynthesisError を raise。
§3.4 第2項「Synthesis は手紙より先に v2 を出さない」の不変条件強制。

Refs: §3.4
```

```
chore(infra): pin python to 3.12 via .python-version

uv が読み込む python ピン。CI 再現性のため。

Refs: §4
```

---

## 9. Done の定義

各 PR / マージ前ゲート:

1. **Schema test pass** — Pydantic strict パースが全グリーン
2. **cached demo path 通過** — `?mode=cached` で 7 シーンが最後まで再生される
3. **Lint pass** — `npm run lint` / Python 型チェック green
4. **ユビキタス言語チェック** — §3.3 の禁止表記が UI 文言に混入していない
5. **§13 整合** — `cache/demo_seed.json` を変更した場合、要件定義 §13 と一致する
6. **デザイン契約セルフレビュー** — §10 のトークン3層 (semantic 層を飛ばして primitive 直参照していない)・スプリングモーション・「やらないこと」表に違反していない (内部基準。提出ゲートではない。要件定義 §15 が提出 SoT)

提出前 (5/16) チェックリストは要件定義書 §15 に従う。

---

## 10. Design Contract — Civic Theater UI

> **デザインの北極星**: その視覚決定が「v1→v2 列で `changes_from_letter` をより明白にする」か。寄与しないなら削る。色・間・モーション・コピーのすべてはこの一行に従属する。「手紙で草案を変えろ」の視覚側ミラー。

2026年5月時点の SOTA — Google Labs `DESIGN.md` 形式 / W3C Design Tokens 2025.10 / Material 3 Expressive スプリングモーション / WCAG 2.2 + JIS X 8341-3 / マルチエージェント可視化コンセンサス — を、ハッカソン6日で運用できる最小集合に削っている。網羅的な design system docs は書かない。

### 10.1 Design Tokens — 3層構造 (W3C DTCG 2025.10)

W3C Design Tokens Community Group 2025.10 安定仕様の **primitive → semantic → component** 3層を採用する。**コンポーネントは semantic 層のみ参照** (primitive 直参照は lint で落とす)。shadcn/ui v4 の `@theme inline` + `:root` / `.dark` CSS変数方式に乗せる。

| 層 | 例 | 使用場所 |
|---|---|---|
| Primitive | `color.indigo.900`, `color.ember.500` | トークン定義ファイルのみ |
| Semantic | `agent.gyosei`, `letter.future`, `draft.v2`, `diff.added`, `source.official` | コンポーネント・Tailwind config |
| Component | `card.draft.v2.bg` | 当該コンポーネント内のみ |

5視点それぞれに**固有 semantic 色 + 固有幾何アイコン** (現プロトタイプ `mockup/components/cards.jsx` の `AgentIcon` を継承) を 1:1 で割り当てる:

| ID | semantic | primitive |
|---|---|---|
| admin (行政AI) | `agent.gyosei` | TBD (チームで合意・要件定義に追記後に確定) |
| env (環境AI) | `agent.kankyo` | TBD |
| biz (企業AI) | `agent.kigyo` | TBD |
| citizen (生活者AI) | `agent.seikatsu` | TBD |
| next_gen (次世代AI) | `agent.jisedai` | TBD |
| 2050年からの手紙 | `letter.future` | TBD |
| 草案 v1 / v2 | `draft.v1` / `draft.v2` | TBD (**主役・最後決定**) |
| `changes_from_letter` の diff | `diff.added` | TBD |

source 種別は確定済み (現 `forge.css` の `badge-official/open/hyp/claim` をそのまま `source.official/open/hypothesis/claim` に semantic 昇格する)。

### 10.2 Typography

- **本文**: `Noto Sans JP` (palt 有効) → Hiragino Kaku Gothic ProN → Yu Gothic → Inter フォールバック
- **見出し / 手紙本文**: `Noto Serif JP` (`.serif` クラス継承)
- **数値・コード**: 1書体のみ
- **スケール 4ステップ以内** (`text-xs` / `text-sm` / `text-base` / `text-2xl` 程度)
- **行間**: 本文 1.7 / 見出し 1.4 / **手紙本文のみ 1.9** (例外として許容)

### 10.3 Motion — Spring tokens (Material 3 Expressive 流)

`duration + easing` ではなく **stiffness / damping / mass のスプリングトークン**で記述する。Framer Motion 11+ もしくは CSS `linear()` で実装。

| トークン | 用途 |
|---|---|
| `spring.gentle` | カードのフェードイン、5視点の一斉登場 |
| `spring.snappy` | ボタン押下、シーン内の小さな状態遷移 |
| `spring.bouncy` | 手紙の出現、v1→v2 のフリップ (**シーン跨ぎの主役モーションのみ**) |

- **1シーン境界 = シグネチャモーション 1つ**。要素ごとに別モーションを足さない
- **即時フィードバック < 100ms / 遷移 150–300ms**
- **`prefers-reduced-motion: reduce` は非交渉**: 手紙→v2 の主役演出は**モーションなしでも diff が伝わる別経路** (色 + アイコン + テキストハイライト) を必ず併走させる。法令要件であると同時に、デモ機の重さでアニメが詰まったときの保険でもある

### 10.4 Accessibility — 内部品質目標としての WCAG 2.2 AA

> **位置付けの注意**: 要件定義書 §15 の受入基準に**アクセシビリティ準拠は含まれていない**。本節は提出ゲートではなく、視認性破綻でデモが落ちないための**内部実装ガイドライン**である。提出物への準拠表明や対外的な準拠主張を新たに掲げる場合は、要件定義書の更新 (§3.1 SDD 仕様変更手順) を先に通すこと。

3カラム比較画面で**視認性が壊れやすい**ため、WCAG 2.2 AA を実装上の参照基準として使う:

- **2.4.11 Focus Not Obscured / 2.4.7 Focus Visible**: カラム跨ぎでフォーカスリングが隠れない・見える
- **2.5.8 Target Size (24×24px)**: タップ領域を確保
- **1.4.3 Contrast (Minimum)**: 本文 4.5:1 / 大文字 3:1。`forge-muted` (alpha 0.55) は本文に使わない
- **1.4.11 Non-text Contrast**: badge と diff ハイライトの境界 3:1

**DOM 順 = タブ順 = シーン進行順**。`flex-direction: row-reverse` 等で逆転させない。

### 10.5 AI-native UI Patterns (マルチエージェント可視化)

2026 マルチエージェント UX のコンセンサスに従う。§7 の制約を視覚言語に翻訳した版:

- **信頼度スコアを出さない** (§7 と一致)。代わりに**根拠の出所**を出す (公式 / オープン / 仮説 / 主張 の 4-tier badge)
- **ペルソナ分離は装飾でなく信頼性の足場**。5視点の幾何アイコン + 固有色 + 名乗り口調を**一字一句変えない** (§3.3)
- **トポロジを画面の構図で語る**: 5視点並列 (peer-to-peer = 横並び5枚) → Synthesis (hierarchical = 中央集約1枚)。空間配置そのものがアーキテクチャの説明になる
- **Timed reveal で擬似ストリーム化**: cached モードでもカードが順に立ち上がる演出を入れる (Vercel AI SDK 6 の知覚遅延設計と同じ思想)
- **「仮想シナリオ」ラベルを透かしや小キャプションで隠さない** (§7)。本文と同じ階層で読まれる位置に置く
- **`changes_from_letter` は diff として視覚の支配項目**。他の文より色・太さ・余白で目立たせる (それが審査員に v1→v2 が変わったことを納得させる唯一の証拠)

### 10.6 7-Scene Civic Theater — シーン設計

- 各シーンは **State A → B → C** の3ビート構成。要件 §13 の正本テキストを破らない
- **シーン境界では背景レイヤー** (Akagi シルエット + grid + spark particles) **のテンポを変える**。それ以外の演出は最小限
- **シーン内で新規の色・書体を投入しない**。既出のトークンだけで構成する
- 進行は基本前進のみ。戻り遷移は P1 の語り手切替時のみ許容

### 10.7 やらないこと (Design Won't Do)

- マルチブランド / 配色プリセット (1ブランド固定)
- レスポンシブ網羅 (デモ環境は既知のプロジェクタ + ブラウザ)
- empty / error state カタログ (cached mode は表向きエラーを出さない)
- アイコンの新規発注 (現プロトタイプの幾何アイコンを Tailwind 化のみ)
- カスタム CSS の継続 (§6 と一致。`forge.css` は Tailwind `@theme` + `@layer components` に分解して廃止)
- Style Dictionary 等のトークンビルドパイプライン (CSS変数を直書き)
- 信頼度メーター / 進捗パーセンテージ / "AI thinking..." ローディング文言
- 絵文字 / イラスト / 写真素材 / ストック写真
- 同時に出す Tailwind の text サイズ 5以上 / 色 7以上

---

## 決め台詞 (Public)

> 未来は予測しない。
> 2050年の声を聞いて、2026年の一歩を変える。
