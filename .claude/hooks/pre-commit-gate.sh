#!/usr/bin/env bash
# Mirai Forge ローカル品質ゲート (CLAUDE.md §9 のうち機械チェック可能な部分のみ)
#
# 起動経路:
#   - Claude Code PreToolUse hook (Bash matcher) として settings.json から呼ばれる
#     → stdin に tool_input JSON が入る。git commit 以外は即 exit 0
#   - 手動 dry-run: QG_DRY_RUN=1 bash .claude/hooks/pre-commit-gate.sh
#
# 機械チェック内容:
#   1. §3.3 ユビキタス言語違反 (複合語の正確一致のみ。単独語は false-positive 多発のため対象外)
#   2. ruff check (pyproject.toml + uv が揃ってる時のみ)
#   3. npm run lint (frontend/package.json が存在する時のみ)
#
# 自動チェック対象外 (§9 のうち人間判断が要る部分):
#   - §13 整合 / cached path 通過 / Schema test / 設計契約 (§10) 全般
#   - 単独語の「合意」「予測」「結論」「メール」等 (文脈依存)

set -uo pipefail

ROOT="/Users/shibata/Desktop/2050Hackathon"
cd "$ROOT" || exit 2

# --- 自己フィルタ: git commit でない Bash 呼び出しは即通過 ---
if [ "${QG_DRY_RUN:-0}" != "1" ]; then
  INPUT=$(cat)
  CMD=$(printf '%s' "$INPUT" | python3 -c 'import json,sys
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("command", ""))
except Exception:
    print("")
' 2>/dev/null || true)
  case "$CMD" in
    "git commit"*) ;;          # gate 対象
    *) exit 0 ;;                # その他は通過
  esac
fi

FAIL=0

# 1. §3.3 禁止語 (複合語のみ。単独「合意」「予測」「結論」「アジェンダ」等は対象外)
#    ここに入れる語は「ほぼ確実にユビキタス言語違反」のもののみ。
FORBIDDEN='下書き|素案|ドラフト|合意案|提案書|論点リスト|シミュレーション結果'
CODE_FILES=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null \
  | grep -E '\.(tsx?|jsx?|py|html|json|css)$' || true)
if [ -n "$CODE_FILES" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ -f "$f" ] || continue
    HITS=$(git diff --cached -- "$f" | grep -nE '^\+[^+]' | grep -E "$FORBIDDEN" || true)
    if [ -n "$HITS" ]; then
      echo "[Quality Gate] FAIL: §3.3 禁止語 in $f" >&2
      echo "$HITS" >&2
      FAIL=1
    fi
  done <<< "$CODE_FILES"
fi

# 2. ruff (pyproject.toml + uv が揃ってる時のみ)
if [ -f pyproject.toml ] && command -v uv >/dev/null 2>&1 && [ -d backend ]; then
  if ! uv run --frozen ruff check backend/ 1>&2; then
    echo "[Quality Gate] FAIL: uv run ruff check backend/" >&2
    FAIL=1
  fi
fi

# 3. npm run lint (frontend/package.json が存在する時のみ)
if [ -f frontend/package.json ]; then
  if ! (cd frontend && npm run lint --silent 1>&2); then
    echo "[Quality Gate] FAIL: npm run lint (frontend/)" >&2
    FAIL=1
  fi
fi

if [ "$FAIL" -ne 0 ]; then
  echo "[Quality Gate] BLOCKED. 修正して再ステージしてください。" >&2
  exit 2
fi
exit 0
