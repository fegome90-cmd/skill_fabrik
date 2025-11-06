# Template Skill - Integración

## Overview de Integración

Los templates de skills deben **integrarse seamlessly** con:
- **skill-creator**: Para completar contenido
- **skills-cli**: Para validación y linting
- **registry/index.json**: Para activación automática
- **configs/skill-rules.json**: Para matching rules
- **Cursor hooks**: Para IDE integration

## Integración con skill-creator

### Flujo Completo Template → skill-creator

```bash
# Paso 1: Generar template
skills create-template guidelines my-guideline

# Paso 2: skill-creator completa el contenido
skills-cli skills execute skill-creator --params='{
  "skill_path": "./skills/guidelines/my-guideline",
  "action": "generate-content",
  "context": "mi-contexto-específico"
}'

# Paso 3: Validar resultado
skills validate-template ./skills/guidelines/my-guideline
```

### API Contract skill-creator

**Input Schema**:
```json
{
  "skill_path": "string (path to skill directory)",
  "action": "enum (generate-content | validate | customize)",
  "context": "object (optional, context for generation)",
  "options": {
    "placeholder_mode": "boolean (replace placeholders)",
    "example_count": "number (minimum examples)",
    "resource_depth": "enum (basic | detailed | comprehensive)"
  }
}
```

**Output Schema**:
```json
{
  "success": "boolean",
  "skill_path": "string",
  "generated": {
    "skill_md": "boolean",
    "resources": "number",
    "placeholders_replaced": "number"
  },
  "validation": {
    "structure": "pass | warn | fail",
    "metadata": "pass | warn | fail",
    "content": "pass | warn | fail"
  },
  "errors": ["array of error messages"],
  "warnings": ["array of warning messages"]
}
```

### Ejemplo de Integración

```typescript
// TypeScript integration
import { SkillCreator } from '@skills-fabrik/skill-creator';

const skillCreator = new SkillCreator();

// Generar desde template
const result = await skillCreator.generateFromTemplate({
  templatePath: './templates/guideline-template',
  outputPath: './skills/guidelines/my-guideline',
  customization: {
    category: 'guidelines',
    name: 'my-guideline',
    context: 'react-typescript-development'
  }
});

console.log(result);
// Output:
// {
//   success: true,
//   generated: { skill_md: true, resources: 4, placeholders_replaced: 15 },
//   validation: { structure: 'pass', metadata: 'pass', content: 'pass' }
// }
```

### Integration Script

```bash
#!/bin/bash
# integrate-template.sh

TEMPLATE_CATEGORY="$1"
TEMPLATE_NAME="$2"
CUSTOM_CONTEXT="$3"

echo "=== Template Integration Workflow ==="

# 1. Generate template
echo "1. Generating template..."
skills create-template "$TEMPLATE_CATEGORY" "$TEMPLATE_NAME" \
  --output="./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME"

# 2. Enhance with skill-creator
echo "2. Enhancing with skill-creator..."
skills-cli skills execute skill-creator --params='{
  "skill_path": "./skills/'$TEMPLATE_CATEGORY'/'$TEMPLATE_NAME'",
  "action": "generate-content",
  "context": "'$CUSTOM_CONTEXT'",
  "options": {
    "placeholder_mode": true,
    "example_count": 15,
    "resource_depth": "detailed"
  }
}'

# 3. Validate integration
echo "3. Validating integration..."
skills validate-template "./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME"

# 4. Index in registry
echo "4. Indexing in registry..."
skills-cli skills index ./skills --out ./registry/index.json

# 5. Update activation rules
echo "5. Updating activation rules..."
skills-cli skills rules update \
  --skill "./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME" \
  --out ./configs/skill-rules.json

echo "✅ Integration complete: ./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME"
```

## Integración con skills-cli

### CLI Commands Soportados

#### skills create-template
```bash
# Sintaxis
skills create-template <category> <name> [options]

# Ejemplos
skills create-template guidelines git-worktrees
skills create-template guardrails secrets --enforcement block
skills create-template test api --validate

# Options
--type <type>              # Override tipo
--enforcement <level>      # Override enforcement
--skill-only               # Solo SKILL.md
--resources-only           # Solo recursos
--validate                 # Validar después
--output <path>            # Directorio custom
--config <file>            # Config file
```

#### skills validate-template
```bash
# Validar template generado
skills validate-template ./skills/guidelines/my-guideline

# Output
{
  "valid": true,
  "structure": {
    "skill_md": true,
    "resources_dir": true,
    "resource_count": 4,
    "naming": "compliant"
  },
  "metadata": {
    "fields_complete": true,
    "yaml_valid": true,
    "format_valid": true
  },
  "content": {
    "placeholders_remaining": 0,
    "sections_present": true,
    "examples_count": 15,
    "scripts_valid": true
  },
  "score": 95,
  "errors": [],
  "warnings": []
}
```

#### skills list-templates
```bash
# Listar templates disponibles
skills list-templates

# Output
Available Templates:
  - guideline        (enforcement: suggest, audience: engineers)
  - guardrail        (enforcement: block, audience: [engineers, qa])
  - workflow         (enforcement: require, audience: [engineers, architects])
  - generator        (enforcement: suggest, audience: engineers)
  - test             (enforcement: require, audience: [engineers, qa])
```

### CLI Integration Code

```typescript
// packages/skills-cli/src/commands/template.ts

export const createTemplateHandler = async (args: TemplateArgs) => {
  const { category, name, options } = args;

  // 1. Load template configuration
  const config = await loadTemplateConfig(category, options.type);

  // 2. Generate skill structure
  const skillPath = await generateSkillFromTemplate({
    category,
    name,
    config,
    options
  });

  // 3. Create resources from template
  await generateResourcesFromTemplate({
    skillPath,
    category,
    config
  });

  // 4. Validate if requested
  if (options.validate) {
    const validation = await validateTemplate(skillPath);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }
  }

  // 5. Update registry
  await indexSkill(skillPath);

  return {
    success: true,
    skillPath,
    message: `Template created: ${category}/${name}`
  };
};
```

## Integración con Registry

### Registry Structure

```json
{
  "version": "1.0.0",
  "skills": [
    {
      "id": "using-git-worktrees",
      "category": "guidelines",
      "path": "skills/guidelines/using-git-worktrees",
      "version": "0.1.0",
      "type": "guideline",
      "enforcement": "suggest",
      "summary": "Técnica para desarrollo paralelo seguro...",
      "keywords": ["git", "worktree", "parallel", "branches"],
      "intentPatterns": [
        "desarrollar en paralelo",
        "multiple branches",
        "code review"
      ],
      "fileTriggers": {
        "pathPatterns": ["**/.git/**", "**/.gitignore"],
        "contentPatterns": ["git worktree", "branch"]
      },
      "resources": [
        "resources/basic-commands.md",
        "resources/use-cases.md",
        "resources/advanced-techniques.md",
        "resources/troubleshooting.md"
      ]
    }
  ]
}
```

### Registry Integration Script

```bash
#!/bin/bash
# update-registry.sh

SKILL_PATH="$1"

echo "Updating registry for: $SKILL_PATH"

# Index skill in registry
skills-cli skills index ./skills --out ./registry/index.json --incremental

# Verify registry update
if grep -q "$(basename "$SKILL_PATH")" ./registry/index.json; then
  echo "✅ Registry updated successfully"
else
  echo "❌ Registry update failed"
  exit 1
fi

# Validate registry format
jq '.' ./registry/index.json > /dev/null && echo "✅ Registry format valid" || echo "❌ Registry format invalid"
```

### Auto-Registration on Template Creation

```typescript
// Auto-register template when created
export const registerTemplateInRegistry = async (skillPath: string) => {
  // Extract metadata from SKILL.md
  const metadata = await extractSkillMetadata(skillPath);

  // Generate activation rules
  const activationRules = await generateActivationRules(metadata);

  // Update registry
  await updateRegistry(metadata, activationRules);

  // Validate registration
  const isRegistered = await verifyRegistryEntry(metadata.id);
  if (!isRegistered) {
    throw new Error(`Failed to register ${metadata.id} in registry`);
  }

  return {
    registered: true,
    metadata,
    activationRules
  };
};
```

## Integración con Activation Rules

### Skill Rules Structure

```json
{
  "rules": [
    {
      "skillId": "using-git-worktrees",
      "promptTriggers": {
        "keywords": ["git", "worktree", "parallel", "branch"],
        "intentPatterns": [
          "desarrollar en paralelo",
          "multiple branches",
          "code review simultaneously",
          "switch between branches"
        ]
      },
      "fileTriggers": {
        "pathPatterns": [
          "**/.git/**",
          "**/.gitignore",
          "**/package.json"
        ],
        "contentPatterns": [
          "git worktree",
          "git branch",
          "git checkout"
        ]
      },
      "enforcement": "suggest",
      "threshold": 0.6
    }
  ]
}
```

### Rules Generation from Template

```bash
#!/bin/bash
# generate-rules.sh

SKILL_PATH="$1"
SKILL_ID="$2"

echo "Generating activation rules for: $SKILL_ID"

# Extract summary for keyword generation
SUMMARY=$(grep "^summary:" "$SKILL_PATH/SKILL.md" | cut -d: -f2- | tr -d ' "' | tr '[:upper:]' '[:lower:]')

# Generate keywords from summary and id
KEYWORDS=$(echo "$SKILL_ID $SUMMARY" | \
  tr ' ' '\n' | \
  sort | uniq | \
  grep -v '^(a|an|the|and|or|to|for|of|in|on|at)$' | \
  head -10 | \
  tr '\n' ',' | sed 's/,$//')

# Create rule template
cat > /tmp/rule-template.json << EOF
{
  "skillId": "$SKILL_ID",
  "promptTriggers": {
    "keywords": [$KEYWORDS],
    "intentPatterns": []
  },
  "fileTriggers": {
    "pathPatterns": [],
    "contentPatterns": []
  },
  "enforcement": "suggest",
  "threshold": 0.6
}
EOF

# Merge into skill-rules.json
jq ".rules += [$(cat /tmp/rule-template.json)]" ./configs/skill-rules.json > ./configs/skill-rules.json.tmp
mv ./configs/skill-rules.json.tmp ./configs/skill-rules.json

echo "✅ Rules generated and added to skill-rules.json"
```

### Integration with skill-creator

```typescript
// skill-creator integrates rules generation
export const completeSkillFromTemplate = async (skillPath: string) => {
  // 1. Validate template structure
  await validateTemplateStructure(skillPath);

  // 2. Generate metadata
  const metadata = await generateMetadata(skillPath);

  // 3. Generate activation rules
  const rules = await generateActivationRules(metadata);

  // 4. Update skill-rules.json
  await updateSkillRules(rules);

  // 5. Update registry
  await updateRegistry(metadata);

  // 6. Validate complete integration
  const validation = await validateCompleteIntegration(skillPath);
  if (!validation.isValid) {
    throw new Error(`Integration validation failed: ${validation.errors.join(', ')}`);
  }

  return { success: true, metadata, rules };
};
```

## Integración con Cursor Hooks

### Cursor Hook Configuration

```json
{
  "hooks": {
    "userPromptSubmit": {
      "script": "scripts/hooks/pre-invoke.mjs",
      "enabled": true,
      "timeout": 5000
    },
    "stop": {
      "script": "scripts/hooks/stop.mjs",
      "enabled": true,
      "timeout": 10000
    }
  }
}
```

### Hook Integration Points

#### Pre-Invoke Hook

```javascript
// scripts/hooks/pre-invoke.mjs
import { activateSkills } from '@skills-fabrik/skills-cli';

const preInvoke = async ({ prompt, openFiles, activeFileContent, cwd }) => {
  console.log('🔍 Analyzing prompt for skill activation...');

  // 1. Load registry
  const registry = await loadRegistry();

  // 2. Match skills based on prompt and files
  const matchedSkills = await activateSkills({
    prompt,
    openFiles,
    activeFileContent,
    registry,
    cwd
  });

  // 3. Return activated skills
  return {
    activated: matchedSkills.map(s => s.id),
    metadata: matchedSkills
  };
};

export { preInvoke };
```

#### Stop Hook

```javascript
// scripts/hooks/stop.mjs
import { validateCode } from '@skills-fabrik/skills-cli';

const stop = async ({ editLog, reposChanged, cwd }) => {
  console.log('🔍 Validating code changes...');

  // 1. Apply relevant skills
  const results = [];

  for (const skill of matchedSkills) {
    // Run skill validation
    const result = await validateCode({
      skill,
      editLog,
      reposChanged,
      cwd
    });

    results.push(result);
  }

  // 2. Return validation results
  return {
    formatted: results.filter(r => r.type === 'formatting'),
    typecheck: results.filter(r => r.type === 'typecheck'),
    hints: results.filter(r => r.type === 'hint'),
    autoResolved: results.some(r => r.autoResolved),
    kpiEvent: {
      event: 'skill_validation',
      timestamp: Date.now(),
      results_count: results.length
    }
  };
};

export { stop };
```

### Template Integration with Hooks

```bash
#!/bin/bash
# integrate-with-hooks.sh

SKILL_PATH="$1"
SKILL_ID="$2"

echo "Integrating template with Cursor hooks..."

# 1. Update hooks config with new skill
jq ".skills += [\"$SKILL_ID\"]" .cursor/hooks/hooks-config.json > .cursor/hooks/hooks-config.json.tmp
mv .cursor/hooks/hooks-config.json.tmp .cursor/hooks/hooks-config.json

# 2. Rebuild hooks
cd scripts/hooks
npm run build

# 3. Test hooks integration
node -e "
import('./pre-invoke.mjs').then(m => {
  m.preInvoke({
    prompt: 'test prompt',
    openFiles: [],
    activeFileContent: '',
    cwd: '.'
  }).then(result => {
    console.log('✅ Hooks integration successful');
    console.log(JSON.stringify(result, null, 2));
  });
});
"

echo "✅ Hooks integration complete"
```

## Integración Completa - End-to-End

### Complete Integration Script

```bash
#!/bin/bash
# complete-template-integration.sh

set -e

TEMPLATE_CATEGORY="$1"
TEMPLATE_NAME="$2"
CUSTOM_CONTEXT="$3"

echo "=== Complete Template Integration ==="
echo "Category: $TEMPLATE_CATEGORY"
echo "Name: $TEMPLATE_NAME"
echo "Context: $CUSTOM_CONTEXT"
echo

# Step 1: Generate template
echo "1️⃣  Generating template..."
skills create-template "$TEMPLATE_CATEGORY" "$TEMPLATE_NAME" \
  --output="./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME" \
  --validate
echo "   ✅ Template generated"
echo

# Step 2: Complete with skill-creator
echo "2️⃣  Completing with skill-creator..."
skills-cli skills execute skill-creator --params='{
  "skill_path": "./skills/'$TEMPLATE_CATEGORY'/'$TEMPLATE_NAME'",
  "action": "generate-content",
  "context": "'$CUSTOM_CONTEXT'"
}' 2>&1 | sed 's/^/   /'
echo "   ✅ Content completed"
echo

# Step 3: Update registry
echo "3️⃣  Updating registry..."
skills-cli skills index ./skills --out ./registry/index.json
echo "   ✅ Registry updated"
echo

# Step 4: Update activation rules
echo "4️⃣  Updating activation rules..."
./scripts/generate-rules.sh "./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME" "$TEMPLATE_NAME"
echo "   ✅ Activation rules updated"
echo

# Step 5: Integrate with hooks
echo "5️⃣  Integrating with Cursor hooks..."
./scripts/integrate-with-hooks.sh "./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME" "$TEMPLATE_NAME"
echo "   ✅ Hooks integrated"
echo

# Step 6: Final validation
echo "6️⃣  Final validation..."
skills-cli skills lint "./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME" --strict
echo "   ✅ Linting passed"
echo

# Step 7: Generate integration report
echo "7️⃣  Generating report..."
cat > "./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME/INTEGRATION-REPORT.md" << EOF
# Integration Report

## Template: $TEMPLATE_NAME
**Category**: $TEMPLATE_CATEGORY
**Date**: $(date)
**Context**: $CUSTOM_CONTEXT

## Integration Status

- ✅ Template generated
- ✅ Content completed
- ✅ Registry updated
- ✅ Activation rules added
- ✅ Cursor hooks integrated
- ✅ Validation passed

## Files Modified

- \`./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME/\` - Skill structure
- \`./registry/index.json\` - Registry updated
- \`./configs/skill-rules.json\` - Activation rules added
- \`.cursor/hooks/hooks-config.json\` - Hooks configured

## Next Steps

1. Review generated content
2. Customize placeholders
3. Test skill activation
4. Commit changes

## Skill Activation

To activate this skill:
\`\`\`bash
skills-cli skills check "test prompt" --v2
\`\`\`

## Skill Execution

To execute this skill:
\`\`\`bash
skills-cli skills execute $TEMPLATE_NAME
\`\`\`
EOF

echo "   ✅ Report generated"
echo

# Final summary
echo "========================================="
echo "🎉 INTEGRATION COMPLETE"
echo "========================================="
echo "Skill path: ./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME"
echo "Registry: Updated"
echo "Rules: Updated"
echo "Hooks: Integrated"
echo "Validation: Passed"
echo
echo "Next steps:"
echo "  1. cd ./skills/$TEMPLATE_CATEGORY/$TEMPLATE_NAME"
echo "  2. Review INTEGGRATION-REPORT.md"
echo "  3. Customize placeholders"
echo "  4. Test activation: skills-cli skills check 'test' --v2"
echo "========================================="
```

### Usage

```bash
# Complete integration workflow
./complete-template-integration.sh guidelines my-guideline "react-typescript-development"

# Output will show integration status and generate report
```

## Testing Integration

### Integration Test Suite

```bash
#!/bin/bash
# test-integration.sh

TEMPLATE_CATEGORY="$1"

echo "Testing template integration: $TEMPLATE_CATEGORY"

# Test 1: Generate template
echo "Test 1: Template generation"
if skills create-template "$TEMPLATE_CATEGORY" test-skill-$$ --validate; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Test 2: skill-creator integration
echo "Test 2: skill-creator integration"
if skills-cli skills execute skill-creator --params='{
  "skill_path": "./skills/'$TEMPLATE_CATEGORY'/test-skill-$$",
  "action": "validate"
}'; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi

# Test 3: Registry update
echo "Test 3: Registry update"
if skills-cli skills index ./skills --out ./test-registry.json; then
  if grep -q "test-skill-$$" ./test-registry.json; then
    echo "✅ PASS"
  else
    echo "❌ FAIL"
    exit 1
  fi
else
  echo "❌ FAIL"
  exit 1
fi

# Cleanup
rm -rf "./skills/$TEMPLATE_CATEGORY/test-skill-$$"
rm -f ./test-registry.json

echo "========================================="
echo "🎉 ALL INTEGRATION TESTS PASSED"
echo "========================================="
```

## Troubleshooting Integration

### Common Issues

#### Issue 1: Registry Update Failed

**Symptoms**:
```
Error: Failed to update registry
```

**Solution**:
```bash
# Check registry format
jq '.' ./registry/index.json > /dev/null || echo "Invalid JSON"

# Validate skill metadata
skills-cli skills validate ./skills/guidelines/my-skill

# Manual update
skills-cli skills index ./skills --out ./registry/index.json --force
```

#### Issue 2: Hooks Not Loading

**Symptoms**:
```
Warning: Hooks not configured for new skill
```

**Solution**:
```bash
# Rebuild hooks
cd scripts/hooks
npm run build

# Reload Cursor
# Restart Cursor IDE

# Verify hooks config
cat .cursor/hooks/hooks-config.json
```

#### Issue 3: Activation Rules Not Matching

**Symptoms**:
```
Skill not activating for relevant prompts
```

**Solution**:
```bash
# Debug matching
skills-cli skills check "test prompt" --v2 --debug

# Check rules
cat ./configs/skill-rules.json | jq ".rules[] | select(.skillId == 'my-skill')"

# Regenerate rules
./scripts/generate-rules.sh ./skills/guidelines/my-skill my-skill
```

## Best Practices

### ✅ Integration Do's

1. **Always validate after integration**
   ```bash
   skills-cli skills lint ./skills/guidelines/my-skill --strict
   ```

2. **Update registry incrementally**
   ```bash
   skills-cli skills index ./skills --incremental
   ```

3. **Test hooks after integration**
   ```bash
   node scripts/hooks/pre-invoke.mjs --test
   ```

4. **Document integration changes**
   ```bash
   # Create integration report
   echo "# Changes" > CHANGES.md
   git diff --stat >> CHANGES.md
   ```

### ❌ Integration Don'ts

1. **Don't skip validation steps**
2. **Don't manually edit registry.json** (use CLI)
3. **Don't modify hooks without rebuilding**
4. **Don't commit integration without testing**

---

**Estado**: Integration completa y automatizada
**Herramientas**: skills-cli, skill-creator, hooks scripts
**Validación**: Automática en cada step
**Testing**: Suite de integración disponible
