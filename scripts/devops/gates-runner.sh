#!/bin/bash
# Script para ejecutar quality gates localmente (mismo proceso que CI)

set -e

echo "🔍 Running Quality Gates..."

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=true

# Función para ejecutar un gate
run_gate() {
  local name=$1
  local command=$2
  local required=${3:-true}

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 Gate: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if eval "$command"; then
    echo -e "${GREEN}✅ $name passed${NC}"
    return 0
  else
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ $name failed (REQUIRED)${NC}"
      SUCCESS=false
      return 1
    else
      echo -e "${YELLOW}⚠️  $name failed (OPTIONAL)${NC}"
      return 0
    fi
  fi
}

# Gate 1: Skills Lint (Required)
run_gate "Skills Lint" \
  "pnpm --filter @skills-fabrik/skills-cli build && pnpm --filter @skills-fabrik/skills-cli start index ./skills --out ./registry/index.json" \
  true

# Gate 2: Skills Eval (Optional)
run_gate "Skills Eval" \
  "pnpm --filter @skills-fabrik/skills-cli start eval ./skills" \
  false

# Gate 3: Type Check (Required)
run_gate "Type Check" \
  "pnpm --filter @skills-fabrik/skills-cli exec tsc --noEmit" \
  true

# Gate 4: Prettier Check (Required)
run_gate "Prettier Check" \
  "pnpm exec prettier --check ." \
  true

# Gate 5: No Mess Left Behind (Required)
run_gate "Build Check" \
  "pnpm --filter @skills-fabrik/skills-cli build" \
  true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$SUCCESS" = true ]; then
  echo -e "${GREEN}✅ All required gates passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some required gates failed${NC}"
  exit 1
fi
