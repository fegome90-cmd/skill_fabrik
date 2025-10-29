#!/bin/bash
# Script para recolectar métricas de workflows GitHub
# Basado en plan CLOOP - Phase Observe

set -e

echo "📊 GitHub Workflows Metrics Collector"
echo "======================================"
echo ""

# Verificar que gh CLI está instalado
if ! command -v gh &> /dev/null; then
  echo "❌ Error: GitHub CLI (gh) is not installed"
  echo "Install it with: brew install gh"
  exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
  echo "❌ Error: Not authenticated with GitHub CLI"
  echo "Authenticate with: gh auth login"
  exit 1
fi

REPO="fegome90-cmd/skill_fabrik"
DATE_FORMAT="+%Y-%m-%d"

echo "Repository: $REPO"
echo "Date: $(date $DATE_FORMAT)"
echo ""

# Métrica 1: Dependabot PR Rate
echo "📈 Metric 1: Dependabot PR Rate"
echo "--------------------------------"
DEPENDABOT_PRS=$(gh pr list --repo "$REPO" --author "app/dependabot" --state all --limit 100 --json number --jq 'length')
echo "Total Dependabot PRs: $DEPENDABOT_PRS"
DEPENDABOT_OPEN=$(gh pr list --repo "$REPO" --author "app/dependabot" --state open --limit 100 --json number --jq 'length')
echo "Open Dependabot PRs: $DEPENDABOT_OPEN"
echo ""

# Métrica 2: Stale Issues Closed
echo "📈 Metric 2: Stale Issues Closed"
echo "--------------------------------"
STALE_CLOSED=$(gh issue list --repo "$REPO" --label "stale" --state closed --limit 100 --json number --jq 'length')
echo "Stale issues closed: $STALE_CLOSED"
STALE_OPEN=$(gh issue list --repo "$REPO" --label "stale" --state open --limit 100 --json number --jq 'length')
echo "Stale issues open: $STALE_OPEN"
echo ""

# Métrica 3: No Response Closed
echo "📈 Metric 3: No Response Closed"
echo "--------------------------------"
NO_RESPONSE_CLOSED=$(gh issue list --repo "$REPO" --label "status/need-information" --state closed --limit 100 --json number --jq 'length')
echo "No-response issues/PRs closed: $NO_RESPONSE_CLOSED"
NO_RESPONSE_OPEN=$(gh issue list --repo "$REPO" --label "status/need-information" --state open --limit 100 --json number --jq 'length')
echo "No-response issues/PRs open: $NO_RESPONSE_OPEN"
echo ""

# Métrica 4: CI Pipeline Success Rate
echo "📈 Metric 4: CI Pipeline Success Rate"
echo "--------------------------------"
CI_RUNS=$(gh run list --repo "$REPO" --workflow "CI Pipeline" --limit 10 --json conclusion --jq '[.[] | .conclusion]')
CI_SUCCESS=$(echo "$CI_RUNS" | jq '[.[] | select(. == "success")] | length')
CI_TOTAL=$(echo "$CI_RUNS" | jq 'length')
if [ "$CI_TOTAL" -gt 0 ]; then
  CI_SUCCESS_RATE=$(echo "scale=2; $CI_SUCCESS * 100 / $CI_TOTAL" | bc)
  echo "CI Pipeline Success Rate: ${CI_SUCCESS_RATE}% ($CI_SUCCESS/$CI_TOTAL)"
else
  echo "CI Pipeline Success Rate: N/A (no runs found)"
fi
echo ""

# Métrica 5: PR Template Usage (aproximado - requiere análisis manual)
echo "📈 Metric 5: PR Template Usage"
echo "--------------------------------"
echo "Note: This metric requires manual analysis of recent PRs"
echo "Check if PRs contain sections: TLDR, Dive Deeper, Reviewer Test Plan"
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Dependabot PRs: $DEPENDABOT_PRS total, $DEPENDABOT_OPEN open"
echo "✅ Stale issues: $STALE_CLOSED closed, $STALE_OPEN open"
echo "✅ No-response: $NO_RESPONSE_CLOSED closed, $NO_RESPONSE_OPEN open"
if [ "$CI_TOTAL" -gt 0 ]; then
  echo "✅ CI Success Rate: ${CI_SUCCESS_RATE}%"
fi
echo ""
echo "For detailed analysis, export to JSON:"
echo "  gh pr list --json number,title,author --limit 100 > metrics-prs.json"
echo "  gh issue list --json number,title,labels --limit 100 > metrics-issues.json"

