#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

SKILLS_BIN="${PNPM_HOME:-$HOME/Library/pnpm}/skills-cli"
if [ ! -x "$SKILLS_BIN" ]; then
  # fallback to local dist if global not present
  SKILLS_BIN="node packages/skills-cli/dist/index.js"
fi

echo "[Guardrails] BLOCK test (deleteMany without where)"
if $SKILLS_BIN guardrail "." --file test-guardrails/repository/user-repository.ts >/tmp/guardrail_block.out 2>&1; then
  echo "❌ Expected BLOCK but command exited 0"
  cat /tmp/guardrail_block.out
  exit 1
fi
grep -q "BLOCKED" /tmp/guardrail_block.out || { echo "❌ BLOCK not detected"; cat /tmp/guardrail_block.out; exit 1; }
echo "✅ BLOCK detected"

echo "[Guardrails] WARN/SUGGEST test (updateMany/findMany without where)"
$SKILLS_BIN guardrail "." --file test-guardrails/repository/warn-suggest.ts >/tmp/guardrail_warn.out 2>&1 || true
grep -q "WARNING: 2 risky pattern(s)" /tmp/guardrail_warn.out || { echo "❌ Expected warnings not found"; cat /tmp/guardrail_warn.out; exit 1; }
grep -q "HIGH: updateMany" /tmp/guardrail_warn.out || { echo "❌ updateMany warn not found"; cat /tmp/guardrail_warn.out; exit 1; }
grep -q "MEDIUM: findMany" /tmp/guardrail_warn.out || { echo "❌ findMany suggest not found"; cat /tmp/guardrail_warn.out; exit 1; }
echo "✅ WARN/SUGGEST detected"

echo "✅ Guardrails examples passed"

