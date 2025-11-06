#!/bin/bash
# Script para indexar todos los prompts de startkit-main

STARTKIT_DIR="/Users/felipe/Developer/startkit-main"
OUTPUT_DIR="docs/analisis-startkit"

mkdir -p "$OUTPUT_DIR"

echo "🔍 Indexando prompts de startkit-main..."

# 1. Prompts por tipo
echo "## Prompts por tipo" > "$OUTPUT_DIR/INDEX-PROMPTS.md"

echo "### Prompts de Ejecución (Executors)" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
find "$STARTKIT_DIR" -name "*PROMPT*.md" -type f | grep -E "(ejecutor|SPRINT)" | sort >> "$OUTPUT_DIR/INDEX-PROMPTS.md"

echo "" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
echo "### Prompts de Auditoría (Auditors)" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
find "$STARTKIT_DIR" -name "*AUDIT*.md" -type f | grep -i prompt | sort >> "$OUTPUT_DIR/INDEX-PROMPTS.md"

echo "" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
echo "### Meta-Prompts" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
find "$STARTKIT_DIR" -name "*META-PROMPT*.md" -o -name "meta-prompt*.md" -type f | sort >> "$OUTPUT_DIR/INDEX-PROMPTS.md"

echo "" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
echo "### Templates" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
find "$STARTKIT_DIR" -name "*TEMPLATE*.md" -type f | sort >> "$OUTPUT_DIR/INDEX-PROMPTS.md"

echo "" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
echo "### Handoffs" >> "$OUTPUT_DIR/INDEX-PROMPTS.md"
find "$STARTKIT_DIR/cloop-research" -name "*HANDOFF*.md" -type f | sort >> "$OUTPUT_DIR/INDEX-PROMPTS.md"

echo "✅ Indexación completada. Ver: $OUTPUT_DIR/INDEX-PROMPTS.md"

