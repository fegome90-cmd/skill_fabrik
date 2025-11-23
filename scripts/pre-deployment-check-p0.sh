#!/bin/bash
echo "P0 Critical Readiness Check"
SCORE=0

# Build Check
if pnpm -w build > /dev/null 2>&1; then
    echo "✅ Build: PASS"
    SCORE=$((SCORE + 25))
else
    echo "❌ Build: FAIL"
    exit 1
fi

# Security Check  
if pnpm audit --audit-level=high > /dev/null 2>&1; then
    echo "✅ Security: PASS (0 critical/high)"
    SCORE=$((SCORE + 25))
else
    echo "❌ Security: FAIL"
    exit 1
fi

# Services Check
SERVICES=$(pm2 status | grep -c "online" || echo "0")
if [ "$SERVICES" -ge "2" ]; then
    echo "✅ Services: PASS ($SERVICES online)"
    SCORE=$((SCORE + 25))
else
    echo "❌ Services: FAIL"
    exit 1
fi

# Performance Check
ROUTER=$(curl -s http://localhost:3000/health | jq -r ".status" 2>/dev/null || echo "fail")
DAEMON=$(curl -s http://localhost:7727/health | jq -r ".status" 2>/dev/null || echo "fail")
if [[ "$ROUTER" == "healthy" ]] && [[ "$DAEMON" == "healthy" || "$DAEMON" == "degraded" ]]; then
    echo "✅ Performance: PASS"
    SCORE=$((SCORE + 25))
else
    echo "❌ Performance: FAIL"
    exit 1
fi

echo ""
echo "FINAL SCORE: $SCORE/100"
if [ "$SCORE" -ge "80" ]; then
    echo "✅ PHASE 0 COMPLETE - Ready for migration"
else
    echo "❌ PHASE 0 INCOMPLETE"
    exit 1
fi
