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
# shlex で実際にトークン化し、各 pipeline segment ごとに「先頭トークン (env var
# prefix を skip 後) が git で、続く非フラグトークンが commit か」を判定する。
# これで `cd /x && git commit ...` / `git -C /x commit` / `GIT_AUTHOR=foo git commit`
# / `/usr/bin/git commit` / `git --git-dir=/x commit` 等の bypass 形態を全て拾う。
# QG_DRY_RUN=1 のときは stdin を読まず、現在 staged 内容に対して実行する。
if [ "${QG_DRY_RUN:-0}" != "1" ]; then
  INPUT=$(cat)
  IS_COMMIT=$(printf '%s' "$INPUT" | python3 -c '
import json, re, shlex, sys
try:
    cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
except Exception:
    print("0"); sys.exit(0)
ENV_VAR = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
GIT_OPTS_WITH_VAL = {"-C", "--git-dir", "--work-tree", "--namespace", "--super-prefix"}
for seg in re.split(r"[;&|]+|\$\(|\)|`", cmd):
    try:
        toks = shlex.split(seg)
    except ValueError:
        continue
    i = 0
    while i < len(toks) and ENV_VAR.match(toks[i]):
        i += 1
    if i >= len(toks):
        continue
    head = toks[i]
    if head != "git" and not head.endswith("/git"):
        continue
    j = i + 1
    while j < len(toks):
        t = toks[j]
        if t in GIT_OPTS_WITH_VAL:
            j += 2
            continue
        if t.startswith("-"):
            j += 1
            continue
        break
    if j < len(toks) and toks[j] == "commit":
        print("1"); sys.exit(0)
print("0")
' 2>/dev/null || echo "0")
  if [ "$IS_COMMIT" != "1" ]; then
    exit 0
  fi
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
