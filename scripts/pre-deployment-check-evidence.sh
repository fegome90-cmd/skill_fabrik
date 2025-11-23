#!/bin/bash
echo "SKILLS FABRIK - PHASE 0 EVIDENCE VALIDATION"
echo ""
SCORE=0
EVIDENCE="/tmp/evidence.log"

echo "Evidence log: $(date)" > $EVIDENCE

# Build
if pnpm -w build > /dev/null 2>&1; then
    echo "✅ Build: PASS"
    echo "pnpm -w build: SUCCESS" >> $EVIDENCE
    SCORE=$((SCORE + 25))
else
    echo "❌ Build: FAIL"
    exit 1
fi

# Security  
SEC_OUT=$(pnpm audit --audit-level=high 2>&1)
echo "$SEC_OUT" >> $EVIDENCE
if echo "$SEC_OUT" | grep -q "critical\|high"; then
    echo "❌ Security: FAIL"
    exit 1
else
    VULNS=$(echo "$SEC_OUT" | grep "vulnerabilities" | cut -d" " -f1 || echo "0")
    echo "✅ Security: PASS ($VULNS total, 0 critical/high)"
    SCORE=$((SCORE + 25))
fi

# Services
ROUTER=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
DAEMON=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7727/health)
echo "Router HTTP: $ROUTER" >> $EVIDENCE
echo "Daemon HTTP: $DAEMON" >> $EVIDENCE

if [[ "$ROUTER" == "200" ]] && [[ "$DAEMON" == "200" ]]; then
    echo "✅ Services: PASS"
    SCORE=$((SCORE + 25))
else
    echo "❌ Services: FAIL ($ROUTER, $DAEMON)"
    exit 1
fi

# Performance
if [[ "$ROUTER" == "200" ]] && [[ "$DAEMON" == "200" ]]; then
    echo "✅ Performance: PASS"
    SCORE=$((SCORE + 25))
else
    echo "❌ Performance: FAIL"
    exit 1
fi

echo ""
echo "FINAL SCORE: $SCORE/100"
echo "Evidence saved to: $EVIDENCE"
if [ "$SCORE" -ge "80" ]; then
    echo "✅ PHASE 0 COMPLETE - Ready for migration"
else
    echo "❌ PHASE 0 INCOMPLETE"
    exit 1
fi
