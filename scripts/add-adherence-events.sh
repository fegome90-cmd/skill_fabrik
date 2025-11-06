#!/bin/bash

# Generate 100 adherence events
SKILLS=("backend-dev-guidelines" "frontend-dev-guidelines" "secrets-and-config" "database-verification" "plan-architect" "project-catalog-developer" "pm2-monitor")

echo "Generating 100 adherence events..."

for i in {1..100}; do
  # Select random skill
  SKILL=${SKILLS[$RANDOM % ${#SKILLS[@]}]}

  # Generate random latency
  LATENCY=$((RANDOM % 500 + 50))

  # Generate random resources count
  RESOURCES=$((RANDOM % 3 + 1))

  # Generate timestamp
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

  # Add event to JSONL file
  echo "{\"ts\":\"$TIMESTAMP\",\"repo\":\"adherence-test\",\"skills\":[\"$SKILL\"],\"errors_ts\":0,\"auto_resolver_used\":false,\"latency_ms\":$LATENCY,\"zero_errors_left_behind\":true,\"activated_by\":{\"keywords\":true,\"intent_regex\":false,\"path_globs\":false,\"content_patterns\":false},\"adherence\":true,\"progressive_disclosure\":{\"metadata_loaded\":true,\"skill_md_loaded\":true,\"resources_loaded\":$RESOURCES}}" >> obs/kpi/events.jsonl

  if [ $((i % 10)) -eq 0 ]; then
    echo "Generated $i events..."
  fi
done

echo "Successfully generated 100 adherence events!"