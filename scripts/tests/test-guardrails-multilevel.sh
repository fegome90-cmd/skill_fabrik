#!/bin/bash
# Test script para guardrails multi-nivel

set -e

echo "🧪 Testing Guardrails Multi-nivel (SUGGEST → WARN → BLOCK)"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/../.."

# Test 1: findMany sin where (debe generar SUGGEST)
echo "Test 1: findMany sin where (SUGGEST)"
echo "const users = await prisma.user.findMany();" > /tmp/test-suggest.ts
RESULT=$(node packages/skills-cli/dist/index.js guardrail --file /tmp/test-suggest.ts 2>&1 || echo "EXIT:$?")
if echo "$RESULT" | grep -qi "sugerencia\|suggest"; then
  echo -e "${GREEN}✅ PASS: Sugerencia generada${NC}"
else
  echo -e "${RED}❌ FAIL: No se generó sugerencia${NC}"
  echo "$RESULT" | head -5
fi
echo ""

# Test 2: updateMany sin where (debe generar WARN)
echo "Test 2: updateMany sin where (WARN)"
echo "await prisma.user.updateMany({ data: { active: false } });" > /tmp/test-warn.ts
RESULT=$(node packages/skills-cli/dist/index.js guardrail --file /tmp/test-warn.ts 2>&1 || echo "EXIT:$?")
if echo "$RESULT" | grep -qi "advertencia\|warn\|warning"; then
  echo -e "${GREEN}✅ PASS: Advertencia generada${NC}"
else
  echo -e "${RED}❌ FAIL: No se generó advertencia${NC}"
  echo "$RESULT" | head -5
fi
echo ""

# Test 3: deleteMany sin where (debe generar BLOCK)
echo "Test 3: deleteMany sin where (BLOCK)"
echo "await prisma.user.deleteMany();" > /tmp/test-block.ts
RESULT=$(node packages/skills-cli/dist/index.js guardrail --file /tmp/test-block.ts 2>&1 || echo "EXIT:$?")
if echo "$RESULT" | grep -qi "bloqueado\|block\|BLOCKED"; then
  echo -e "${GREEN}✅ PASS: Bloqueo generado${NC}"
  EXIT_CODE=$(echo "$RESULT" | grep -o "EXIT:[0-9]*" | cut -d: -f2 || echo "0")
  if [ "$EXIT_CODE" = "1" ]; then
    echo -e "${GREEN}✅ PASS: Exit code correcto (1)${NC}"
  fi
else
  echo -e "${RED}❌ FAIL: No se generó bloqueo${NC}"
  echo "$RESULT" | head -5
fi
echo ""

# Test 4: deleteMany CON where (no debe generar violación)
echo "Test 4: deleteMany CON where (debe ser permitido)"
echo "await prisma.user.deleteMany({ where: { id: '123' } });" > /tmp/test-safe.ts
RESULT=$(node packages/skills-cli/dist/index.js guardrail --file /tmp/test-safe.ts 2>&1 || echo "EXIT:$?")
if echo "$RESULT" | grep -qi "bloqueado\|block"; then
  echo -e "${RED}❌ FAIL: No debería bloquear cuando tiene where${NC}"
else
  echo -e "${GREEN}✅ PASS: Permite deleteMany con where${NC}"
fi
echo ""

# Limpiar
rm -f /tmp/test-*.ts

echo "=== Tests completados ==="

