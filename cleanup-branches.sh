#!/bin/bash
# Branch Cleanup Script - Delete Merged Branches
# Generated: 2025-01-14

echo "🧹 Branch Cleanup Script"
echo "========================"
echo ""
echo "This script will delete 5 remote branches that are fully merged to main."
echo ""
echo "Branches to delete:"
echo "  1. feature/forensic-analysis-v2-complete (merged in PR #26)"
echo "  2. claude/analiza-es-011CUrsDB6WiFFYFrvnPEL4a (merged in PR #22)"
echo "  3. claude/analyze-compatibility-issues-011CUdR1y5pTWR86iQyB6NUb (merged)"
echo "  4. dependabot/github_actions/main/actions/checkout-5 (merged in PR #2)"
echo "  5. dependabot/github_actions/main/actions/setup-node-6 (merged in PR #3)"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Deleting branches..."
echo ""

# Delete branch 1
echo "→ Deleting feature/forensic-analysis-v2-complete..."
git push origin --delete feature/forensic-analysis-v2-complete
if [ $? -eq 0 ]; then
    echo "  ✅ Deleted"
else
    echo "  ❌ Failed (may already be deleted)"
fi

# Delete branch 2
echo "→ Deleting claude/analiza-es-011CUrsDB6WiFFYFrvnPEL4a..."
git push origin --delete claude/analiza-es-011CUrsDB6WiFFYFrvnPEL4a
if [ $? -eq 0 ]; then
    echo "  ✅ Deleted"
else
    echo "  ❌ Failed (may already be deleted)"
fi

# Delete branch 3
echo "→ Deleting claude/analyze-compatibility-issues-011CUdR1y5pTWR86iQyB6NUb..."
git push origin --delete claude/analyze-compatibility-issues-011CUdR1y5pTWR86iQyB6NUb
if [ $? -eq 0 ]; then
    echo "  ✅ Deleted"
else
    echo "  ❌ Failed (may already be deleted)"
fi

# Delete branch 4
echo "→ Deleting dependabot/github_actions/main/actions/checkout-5..."
git push origin --delete dependabot/github_actions/main/actions/checkout-5
if [ $? -eq 0 ]; then
    echo "  ✅ Deleted"
else
    echo "  ❌ Failed (may already be deleted)"
fi

# Delete branch 5
echo "→ Deleting dependabot/github_actions/main/actions/setup-node-6..."
git push origin --delete dependabot/github_actions/main/actions/setup-node-6
if [ $? -eq 0 ]; then
    echo "  ✅ Deleted"
else
    echo "  ❌ Failed (may already be deleted)"
fi

echo ""
echo "Cleanup local references..."
git fetch --all --prune

echo ""
echo "✅ Done!"
echo ""
echo "Remaining branches:"
git branch -r | grep origin | sort
echo ""
echo "Expected: Only origin/main should remain"
