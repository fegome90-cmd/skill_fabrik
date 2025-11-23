#!/bin/bash
# pre-deployment-check.sh - Automated Pre-Deployment Readiness Check

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Skills Fabrik - Pre-Deployment Readiness Check          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SCORE=0
MAX_SCORE=100
CRITICAL_FAIL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
check_build() {
    echo "🔨 [P0] Checking Build System..."
    if pnpm -w build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Build: PASS${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${RED}❌ Build: FAIL${NC}"
        CRITICAL_FAIL=1
    fi
    echo ""
}

check_security() {
    echo "🔐 [P0] Checking Security Vulnerabilities..."
    VULNS=$(pnpm audit --audit-level=high --json 2>/dev/null | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' 2>/dev/null || echo "999")
    
    if [ "$VULNS" = "0" ]; then
        echo -e "${GREEN}✅ Security: PASS (0 critical/high vulnerabilities)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${RED}❌ Security: FAIL ($VULNS critical/high vulnerabilities)${NC}"
        CRITICAL_FAIL=1
    fi
    echo ""
}

check_services() {
    echo "⚙️  [P0] Checking PM2 Services..."
    ONLINE=$(pm2 jlist 2>/dev/null | jq '[.[] | select(.pm2_env.status == "online")] | length' 2>/dev/null || echo "0")
    
    if [ "$ONLINE" -ge 3 ]; then
        echo -e "${GREEN}✅ Services: PASS ($ONLINE services online)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${RED}❌ Services: FAIL ($ONLINE/3 services online)${NC}"
        CRITICAL_FAIL=1
    fi
    echo ""
}

check_tests() {
    echo "🧪 [P1] Checking Test Suite..."
    if pnpm test:phase3 > /tmp/test-results.txt 2>&1; then
        PASSED=$(grep -c "passed" /tmp/test-results.txt || echo "0")
        echo -e "${GREEN}✅ Tests: PASS ($PASSED tests passing)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  Tests: WARN (some tests failing)${NC}"
        SCORE=$((SCORE + 5))
    fi
    echo ""
}

check_lint() {
    echo "🎨 [P1] Checking Code Quality (Lint)..."
    LINT_ERRORS=$(pnpm lint 2>&1 | grep -c "error" || echo "0")
    
    if [ "$LINT_ERRORS" = "0" ]; then
        echo -e "${GREEN}✅ Lint: PASS (0 errors)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  Lint: WARN ($LINT_ERRORS errors)${NC}"
        SCORE=$((SCORE + 5))
    fi
    echo ""
}

check_health() {
    echo "🏥 [P1] Checking Service Health Endpoints..."
    HEALTH_COUNT=0
    
    if curl -s http://localhost:7727/health > /dev/null 2>&1; then
        HEALTH_COUNT=$((HEALTH_COUNT + 1))
    fi
    
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        HEALTH_COUNT=$((HEALTH_COUNT + 1))
    fi
    
    if curl -s http://localhost:8877/health > /dev/null 2>&1; then
        HEALTH_COUNT=$((HEALTH_COUNT + 1))
    fi
    
    if [ "$HEALTH_COUNT" = "3" ]; then
        echo -e "${GREEN}✅ Health Checks: PASS (3/3 endpoints responding)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  Health Checks: WARN ($HEALTH_COUNT/3 endpoints responding)${NC}"
        SCORE=$((SCORE + 3))
    fi
    echo ""
}

check_config() {
    echo "⚙️  [P1] Checking Configuration..."
    if [ -f "configs/skill-rules.json" ]; then
        SKILLS_COUNT=$(node -e "console.log(Object.keys(require('./configs/skill-rules.json')).length)" 2>/dev/null || echo "0")
        if [ "$SKILLS_COUNT" -gt "20" ]; then
            echo -e "${GREEN}✅ Config: PASS ($SKILLS_COUNT skills configured)${NC}"
            SCORE=$((SCORE + 10))
        else
            echo -e "${YELLOW}⚠️  Config: WARN ($SKILLS_COUNT skills configured)${NC}"
            SCORE=$((SCORE + 5))
        fi
    else
        echo -e "${RED}❌ Config: FAIL (skill-rules.json not found)${NC}"
    fi
    echo ""
}

check_dependencies() {
    echo "📦 [P2] Checking Dependencies..."
    OUTDATED=$(pnpm outdated 2>/dev/null | grep -c "│" || echo "0")
    
    if [ "$OUTDATED" -lt "10" ]; then
        echo -e "${GREEN}✅ Dependencies: PASS ($OUTDATED outdated)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  Dependencies: WARN ($OUTDATED outdated)${NC}"
        SCORE=$((SCORE + 7))
    fi
    echo ""
}

check_repository() {
    echo "📁 [P2] Checking Repository Cleanliness..."
    UNTRACKED=$(git status --short | grep -c "^??" || echo "0")
    
    if [ "$UNTRACKED" -lt "5" ]; then
        echo -e "${GREEN}✅ Repository: PASS ($UNTRACKED untracked files)${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  Repository: WARN ($UNTRACKED untracked files)${NC}"
        SCORE=$((SCORE + 5))
    fi
    echo ""
}

check_documentation() {
    echo "📚 [INFO] Checking Documentation..."
    if [ -f "docs/dev-docs/context.md" ] && [ -f "docs/dev-docs/plan.md" ] && [ -f "docs/dev-docs/tasks.md" ]; then
        echo -e "${GREEN}✅ Documentation: COMPLETE${NC}"
        SCORE=$((SCORE + 10))
    else
        echo -e "${YELLOW}⚠️  Documentation: INCOMPLETE${NC}"
        SCORE=$((SCORE + 5))
    fi
    echo ""
}

# Run all checks
check_build
check_security
check_services
check_tests
check_lint
check_health
check_config
check_dependencies
check_repository
check_documentation

# Summary
echo "════════════════════════════════════════════════════════════"
echo "                      SUMMARY                               "
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Overall Score: $SCORE/$MAX_SCORE"
echo ""

if [ $CRITICAL_FAIL -eq 1 ]; then
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ NO-GO: Critical failures detected                    ║${NC}"
    echo -e "${RED}║   DO NOT PROCEED with deployment                          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Action Required:"
    echo "1. Fix P0 issues (Build, Security, Services)"
    echo "2. Re-run: ./scripts/pre-deployment-check.sh"
    echo ""
    exit 1
elif [ $SCORE -lt 80 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   ⚠️  CAUTION: Score below threshold (80/100)             ║${NC}"
    echo -e "${YELLOW}║   Review P1 issues before deployment                      ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Action Recommended:"
    echo "1. Fix P1 issues (Tests, Lint, Performance)"
    echo "2. Re-run: ./scripts/pre-deployment-check.sh"
    echo ""
    exit 2
else
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ GO: System ready for deployment                       ║${NC}"
    echo -e "${GREEN}║   Score: $SCORE/100 (Threshold: 80/100)                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Review: docs/analysis/PRE-DEPLOYMENT-READINESS-REPORT.md"
    echo "2. Proceed: Start Fase 1 (Preparación Local)"
    echo "3. Branch: git checkout -b feature/remote-api"
    echo ""
    exit 0
fi
