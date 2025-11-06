#!/bin/bash
# CLI Compilation Fix Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
CLI_DIR="$PROJECT_ROOT/packages/skills-cli/src"

echo "🔧 Fixing CLI compilation errors..."

# Fix 1: Replace chalk header/command/number with format functions
echo "  📝 Fixing chalk color references..."

find "$CLI_DIR" -name "*.ts" -type f | while read file; do
  # Skip the colors.ts file itself
  if [[ "$file" == *"colors.ts" ]]; then
    continue
  fi

  echo "    Processing: $(basename "$file")"

  # Replace chalk.header with format.header
  sed -i '' 's/chalk\.header(/format.header(/g' "$file"

  # Replace chalk.command with format.command
  sed -i '' 's/chalk\.command(/format.command(/g' "$file"

  # Replace chalk.number with format.number
  sed -i '' 's/chalk\.number(/format.number(/g' "$file"

  # Replace bare chalk.header with format.header
  sed -i '' 's/chalk\.header/format.header/g' "$file"

  # Replace bare chalk.command with format.command
  sed -i '' 's/chalk\.command/format.command/g' "$file"

  # Replace bare chalk.number with format.number
  sed -i '' 's/chalk\.number/format.number/g' "$file"
done

# Fix 2: Update imports to include format functions
echo "  📦 Updating imports..."

find "$CLI_DIR" -name "*.ts" -type f | while read file; do
  if [[ "$file" == *"colors.ts" ]]; then
    continue
  fi

  # Check if file uses chalk and needs format import
  if grep -q "chalk\." "$file" && ! grep -q "import.*format" "$file"; then
    # Add format import to existing colors import
    sed -i '' 's/import { colors } from/import { colors, format } from/g' "$file"
    echo "    Added format import to: $(basename "$file")"
  fi
done

# Fix 3: Fix Spinner API calls
echo "  🔄 Fixing Spinner API calls..."

find "$CLI_DIR" -name "*.ts" -type f | while read file; do
  # Replace spinner.succeed() with spinner.succeed('Message')
  sed -i '' 's/spinner\.succeed()/spinner.succeed("Operation completed")/g' "$file"
  sed -i '' 's/spinner\.fail()/spinner.fail("Operation failed")/g' "$file"
  sed -i '' 's/spinner\.stop()/spinner.stop()/g' "$file"
done

# Fix 4: Fix ProgressBar calls
echo "  📊 Fixing ProgressBar API calls..."

find "$CLI_DIR" -name "*.ts" -type f | while read file; do
  # Replace progressBar.stop() with proper completion
  sed -i '' 's/progressBar\.stop()/progressBar.update(1, { completed: true })/g' "$file"
done

# Fix 5: Fix Box border color parameters
echo "  📦 Fixing Box border parameters..."

find "$CLI_DIR" -name "*.ts" -type f | while read file; do
  # Replace borderColor objects with color strings
  sed -i '' 's/borderColor: .borderColor./borderColor: colors.border/g' "$file"
  sed -i '' 's/borderColor: .primary./borderColor: colors.primary/g' "$file"
  sed -i '' 's/borderColor: .success./borderColor: colors.success/g' "$file"
  sed -i '' 's/borderColor: .error./borderColor: colors.error/g' "$file"
done

# Fix 6: Add proper chalk import where missing
echo "  🎨 Adding proper chalk imports..."

find "$CLI_DIR" -name "*.ts" -type f | while read file; do
  if [[ "$file" == *"colors.ts" ]]; then
    continue
  fi

  # If file uses chalk but doesn't import it
  if grep -q "chalk\." "$file" && ! grep -q "import.*chalk" "$file"; then
    # Add chalk import at the top
    sed -i '' '1i\
import { format } from '\''./utils/colors'\'';
' "$file"
    echo "    Added chalk import to: $(basename "$file")"
  fi
done

echo "✅ Compilation fixes applied!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm --filter @skills-fabrik/skills-cli build' to test compilation"
echo "2. Run 'pnpm test:integration' to verify functionality"
echo "3. Fix any remaining issues manually"