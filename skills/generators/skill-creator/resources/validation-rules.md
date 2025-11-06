# Validation Rules - Reglas de Validación

## Overview de Validación

Validar un skill requiere verificar:
- **Estructura**: Archivos, directorios, organización
- **Metadatos**: YAML frontmatter, campos, formatos
- **Contenido**: Secciones, ejemplos, calidad
- **Consistencia**: Naming, estándares, patrones

## Categorías de Validación

### 1. Structural Validation

#### Verificar Estructura de Directorios

**Check**: Skill debe tener estructura estándar
```bash
# Estructura esperada
skills/{category}/{skill-name}/
├── SKILL.md
└── resources/
    ├── file-1.md
    ├── file-2.md
    ├── file-3.md
    └── file-4.md
```

**Implementación**:
```bash
validate_structure() {
  local skill_path="$1"
  local category="$2"
  local skill_name="$3"

  # Verificar SKILL.md existe
  if [ ! -f "$skill_path/SKILL.md" ]; then
    echo "❌ Missing SKILL.md in $skill_path"
    return 1
  fi

  # Verificar directorio resources existe
  if [ ! -d "$skill_path/resources" ]; then
    echo "❌ Missing resources/ directory in $skill_path"
    return 1
  fi

  # Verificar recursos
  local resource_count=$(find "$skill_path/resources" -name "*.md" | wc -l)
  if [ "$resource_count" -ne 4 ]; then
    echo "❌ Expected 4 resources, found $resource_count in $skill_path/resources"
    return 1
  fi

  echo "✅ Structure valid: $skill_path"
}
```

#### Verificar Naming Conventions

**Check**: Nombres en kebab-case

```bash
validate_naming() {
  local skill_path="$1"
  local skill_name="$2"

  # Verificar nombre del skill
  if ! echo "$skill_name" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
    echo "❌ Invalid skill name format: $skill_name (use kebab-case)"
    return 1
  fi

  # Verificar recursos
  for resource in "$skill_path/resources"/*.md; do
    basename "$resource" | grep -Eq '^[a-z0-9-]+\.md$|^[a-z0-9_]+\.md$' || {
      echo "❌ Invalid resource name: $(basename $resource) (use kebab-case or snake_case)"
      return 1
    }
  done

  echo "✅ Naming valid: $skill_path"
}
```

**Validación Automática**:
```bash
#!/bin/bash
# validate-all-skills.sh

ERRORS=0

for skill_dir in skills/*/*/; do
  category=$(basename "$(dirname "$skill_dir")")
  skill_name=$(basename "$skill_dir")

  echo "Validating: $category/$skill_name"

  # Structure
  if ! validate_structure "$skill_dir" "$category" "$skill_name"; then
    ((ERRORS++))
  fi

  # Naming
  if ! validate_naming "$skill_dir" "$skill_name"; then
    ((ERRORS++))
  fi

  echo
done

echo "Total errors: $ERRORS"
exit $ERRORS
```

### 2. Metadata Validation

#### Verificar YAML Frontmatter

**Check**: YAML válido y campos completos

```bash
validate_yaml() {
  local skill_file="$1"

  # Extraer YAML entre ---
  local yaml_content=$(sed -n '/^---$/,/^---$/p' "$skill_file")

  if [ -z "$yaml_content" ]; then
    echo "❌ No YAML frontmatter found in $skill_file"
    return 1
  fi

  # Verificar YAML válido
  if ! echo "$yaml_content" | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)" 2>/dev/null; then
    echo "❌ Invalid YAML in $skill_file"
    return 1
  fi

  echo "✅ YAML valid: $skill_file"
}
```

#### Verificar Campos Obligatorios

```bash
validate_required_fields() {
  local skill_file="$1"
  local yaml_content=$(sed -n '/^---$/,/^---$/p' "$skill_file")

  # Campos obligatorios
  local required_fields=(
    "id:"
    "version:"
    "type:"
    "enforcement:"
    "summary:"
    "audience:"
    "when_to_use:"
    "provides:"
    "resources:"
    "scripts:"
  )

  for field in "${required_fields[@]}"; do
    if ! echo "$yaml_content" | grep -q "$field"; then
      echo "❌ Missing required field: ${field%:} in $skill_file"
      return 1
    fi
  done

  echo "✅ All required fields present: $skill_file"
}
```

#### Validar Formatos Específicos

**Check ID**:
```bash
validate_id() {
  local id="$1"

  # Formato kebab-case
  if ! echo "$id" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
    echo "❌ Invalid ID format: $id (use kebab-case)"
    return 1
  fi

  # Longitud ≤50
  if [ ${#id} -gt 50 ]; then
    echo "❌ ID too long: $id (max 50 chars, got ${#id})"
    return 1
  fi

  echo "✅ ID valid: $id"
}
```

**Check Summary**:
```bash
validate_summary() {
  local summary="$1"

  # Longitud ≤200
  if [ ${#summary} -gt 200 ]; then
    echo "❌ Summary too long: ${#summary} chars (max 200)"
    return 1
  fi

  # No markdown
  if echo "$summary" | grep -q '[*_`#\[\]()]'; then
    echo "❌ Summary contains markdown formatting"
    return 1
  fi

  echo "✅ Summary valid"
}
```

**Check Version**:
```bash
validate_version() {
  local version="$1"

  # Semver format
  if ! echo "$version" | grep -Eq '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[\dA-Za-z-]+(\.[\dA-Za-z-]+)*)?(\+[\dA-Za-z-]+(\.[\dA-Za-z-]+)*)?$'; then
    echo "❌ Invalid semver format: $version"
    return 1
  fi

  echo "✅ Version valid: $version"
}
```

**Check Type/Enforcement Matrix**:
```bash
validate_type_enforcement() {
  local type="$1"
  local enforcement="$2"

  case "$type" in
    guideline)
      if [[ "$enforcement" != "suggest" && "$enforcement" != "warn" ]]; then
        echo "❌ Invalid enforcement for guideline: $enforcement (use suggest or warn)"
        return 1
      fi
      ;;
    guardrail)
      if [[ "$enforcement" != "warn" && "$enforcement" != "block" && "$enforcement" != "require" ]]; then
        echo "❌ Invalid enforcement for guardrail: $enforcement (use warn, block, or require)"
        return 1
      fi
      ;;
    workflow)
      if [[ "$enforcement" != "suggest" && "$enforcement" != "require" ]]; then
        echo "❌ Invalid enforcement for workflow: $enforcement (use suggest or require)"
        return 1
      fi
      ;;
    generator)
      if [[ "$enforcement" != "suggest" ]]; then
        echo "❌ Invalid enforcement for generator: $enforcement (use suggest)"
        return 1
      fi
      ;;
    test)
      if [[ "$enforcement" != "require" && "$enforcement" != "suggest" ]]; then
        echo "❌ Invalid enforcement for test: $enforcement (use require or suggest)"
        return 1
      fi
      ;;
    *)
      echo "❌ Invalid type: $type"
      return 1
      ;;
  esac

  echo "✅ Type/Enforcement valid: $type/$enforcement"
}
```

### 3. Content Validation

#### Verificar Secciones del SKILL.md

```bash
validate_skill_content() {
  local skill_file="$1"

  # Secciones obligatorias
  local required_sections=(
    "## Objetivo"
    "## Procedimiento"
    "## Checklist"
    "## Ejemplos"
  )

  for section in "${required_sections[@]}"; do
    if ! grep -q "$section" "$skill_file"; then
      echo "❌ Missing required section: $section in $skill_file"
      return 1
    fi
  done

  # Secciones recomendadas
  local recommended_sections=(
    "## Comandos Útiles"
    "## Recursos"
  )

  for section in "${recommended_sections[@]}"; do
    if ! grep -q "$section" "$skill_file"; then
      echo "⚠️  Missing recommended section: $section in $skill_file"
    fi
  done

  echo "✅ Content structure valid: $skill_file"
}
```

#### Verificar Longitud

```bash
validate_skill_length() {
  local skill_file="$1"

  # Contar líneas
  local line_count=$(wc -l < "$skill_file")

  # SKILL.md debe ser < 400 líneas
  if [ "$line_count" -gt 400 ]; then
    echo "❌ SKILL.md too long: $line_count lines (max 400)"
    return 1
  fi

  # SKILL.md debe ser > 100 líneas (mínimo substance)
  if [ "$line_count" -lt 100 ]; then
    echo "⚠️  SKILL.md very short: $line_count lines (recommend ≥150)"
  fi

  echo "✅ Length valid: $line_count lines"
}
```

#### Verificar Recursos

```bash
validate_resources() {
  local skill_path="$1"
  local skill_file="$1/SKILL.md"

  # Extraer lista de recursos del YAML
  local yaml_content=$(sed -n '/^---$/,/^---$/p' "$skill_file")
  local declared_resources=$(echo "$yaml_content" | grep "resources:" -A 5 | grep "\.md$" | sed 's/.*resources\///' | sed 's/\.md.*//')

  # Verificar que cada recurso existe
  for resource in $declared_resources; do
    if [ ! -f "$skill_path/resources/${resource}.md" ]; then
      echo "❌ Resource declared but missing: $skill_path/resources/${resource}.md"
      return 1
    fi

    # Verificar longitud mínima
    local resource_lines=$(wc -l < "$skill_path/resources/${resource}.md")
    if [ "$resource_lines" -lt 50 ]; then
      echo "⚠️  Resource very short: ${resource}.md ($resource_lines lines, recommend ≥200)"
    fi
  done

  # Contar ejemplos de código en cada recurso
  for resource_file in "$skill_path/resources"/*.md; do
    local code_blocks=$(grep -c "```" "$resource_file" 2>/dev/null || echo 0)
    local actual_blocks=$((code_blocks / 2))  # Cada bloque cuenta 2 (opening y closing)

    if [ "$actual_blocks" -lt 3 ]; then
      echo "⚠️  Resource low on examples: $(basename $resource_file) ($actual_blocks code blocks, recommend ≥5)"
    fi
  done

  echo "✅ Resources valid: $skill_path/resources"
}
```

### 4. Script Validation

```bash
validate_scripts() {
  local skill_file="$1"
  local yaml_content=$(sed -n '/^---$/,/^---$/p' "$skill_file")

  # Extraer scripts
  local script_count=$(echo "$yaml_content" | grep -A 10 "scripts:" | grep -c "name:" || echo 0)

  if [ "$script_count" -eq 0 ]; then
    echo "⚠️  No scripts defined (recommend 2-5)"
  elif [ "$script_count" -gt 10 ]; then
    echo "⚠️  Too many scripts: $script_count (recommend ≤10)"
  fi

  # Verificar estructura de cada script
  local current_script=""
  local name_found=false
  local run_found=false
  local note_found=false

  while IFS= read -r line; do
    if echo "$line" | grep -q "name:"; then
      if [ "$name_found" = true ]; then
        # Verificar script anterior
        if [ "$run_found" = false ] || [ "$note_found" = false ]; then
          echo "❌ Script '$current_script' missing required fields"
          return 1
        fi
      fi
      current_script=$(echo "$line" | sed 's/.*name: //' | tr -d '"')
      name_found=true
      run_found=false
      note_found=false
    elif echo "$line" | grep -q "run:"; then
      run_found=true
    elif echo "$line" | grep -q "note:"; then
      note_found=true
    fi
  done <<< "$(echo "$yaml_content" | grep -A 10 "scripts:")"

  # Verificar último script
  if [ "$name_found" = true ] && ([ "$run_found" = false ] || [ "$note_found" = false ]); then
    echo "❌ Script '$current_script' missing required fields"
    return 1
  fi

  echo "✅ Scripts valid: $script_count scripts"
}
```

### 5. CLI Integration Validation

```bash
validate_cli_integration() {
  local skill_path="$1"
  local skill_name="$2"

  # Verificar que skill-cli puede parsearlo
  if command -v skills-cli > /dev/null 2>&1; then
    if ! skills-cli skills validate "$skill_path" 2>/dev/null; then
      echo "⚠️  skills-cli validation failed for $skill_name"
      return 1
    fi
    echo "✅ CLI validation passed: $skill_name"
  else
    echo "⚠️  skills-cli not available, skipping CLI validation"
  fi
}
```

## Script de Validación Completo

### validate-skill.sh

```bash
#!/bin/bash
# validate-skill.sh - Validador completo de skills

set -e

SKILL_PATH="$1"
SKILL_NAME="$2"

if [ -z "$SKILL_PATH" ] || [ -z "$SKILL_NAME" ]; then
  echo "Usage: $0 <skill-path> <skill-name>"
  exit 1
fi

echo "=== Validating Skill: $SKILL_NAME ==="
echo "Path: $SKILL_PATH"
echo

ERRORS=0

# 1. Structural Validation
echo "1. Structural Validation"
if ! validate_structure "$SKILL_PATH" "$(basename "$(dirname "$SKILL_PATH")")" "$SKILL_NAME"; then
  ((ERRORS++))
fi
if ! validate_naming "$SKILL_PATH" "$SKILL_NAME"; then
  ((ERRORS++))
fi
echo

# 2. Metadata Validation
echo "2. Metadata Validation"
if ! validate_yaml "$SKILL_PATH/SKILL.md"; then
  ((ERRORS++))
fi
if ! validate_required_fields "$SKILL_PATH/SKILL.md"; then
  ((ERRORS++))
fi
echo

# Extraer y validar campos específicos
YAML_CONTENT=$(sed -n '/^---$/,/^---$/p' "$SKILL_PATH/SKILL.md")

SKILL_ID=$(echo "$YAML_CONTENT" | grep "^id:" | cut -d: -f2- | tr -d ' ')
if ! validate_id "$SKILL_ID"; then
  ((ERRORS++))
fi

SUMMARY=$(echo "$YAML_CONTENT" | grep "^summary:" | cut -d: -f2- | tr -d ' "')
if ! validate_summary "$SUMMARY"; then
  ((ERRORS++))
fi

VERSION=$(echo "$YAML_CONTENT" | grep "^version:" | cut -d: -f2- | tr -d ' ')
if ! validate_version "$VERSION"; then
  ((ERRORS++))
fi

TYPE=$(echo "$YAML_CONTENT" | grep "^type:" | cut -d: -f2- | tr -d ' ')
ENFORCEMENT=$(echo "$YAML_CONTENT" | grep "^enforcement:" | cut -d: -f2- | tr -d ' ')
if ! validate_type_enforcement "$TYPE" "$ENFORCEMENT"; then
  ((ERRORS++))
fi

echo

# 3. Content Validation
echo "3. Content Validation"
if ! validate_skill_content "$SKILL_PATH/SKILL.md"; then
  ((ERRORS++))
fi
if ! validate_skill_length "$SKILL_PATH/SKILL.md"; then
  ((ERRORS++))
fi
echo

# 4. Resources Validation
echo "4. Resources Validation"
if ! validate_resources "$SKILL_PATH"; then
  ((ERRORS++))
fi
echo

# 5. Scripts Validation
echo "5. Scripts Validation"
if ! validate_scripts "$SKILL_PATH/SKILL.md"; then
  ((ERRORS++))
fi
echo

# 6. CLI Integration
echo "6. CLI Integration"
if ! validate_cli_integration "$SKILL_PATH" "$SKILL_NAME"; then
  ((ERRORS++))
fi
echo

# Resultado
echo "=== Validation Result ==="
if [ $ERRORS -eq 0 ]; then
  echo "✅ All validations passed"
  exit 0
else
  echo "❌ Found $ERRORS error(s)"
  exit 1
fi
```

### validate-all-skills.sh

```bash
#!/bin/bash
# validate-all-skills.sh - Validador global

ERRORS=0
WARNINGS=0

for skill_dir in skills/*/*/; do
  category=$(basename "$(dirname "$skill_dir")")
  skill_name=$(basename "$skill_dir")

  echo "========================================"
  echo "Validating: $category/$skill_name"
  echo "========================================"

  if ! ./validate-skill.sh "$skill_dir" "$skill_name"; then
    ((ERRORS++))
  fi

  echo
done

echo "========================================"
echo "Global Validation Summary"
echo "========================================"
echo "Total errors: $ERRORS"

if [ $WARNINGS -gt 0 ]; then
  echo "Total warnings: $WARNINGS"
fi

exit $ERRORS
```

## Integration con Skills CLI

### Comando skills-cli validate

```bash
# Validar skill específico
skills-cli skills validate ./skills/guidelines/my-skill

# Validar todos los skills
skills-cli skills validate ./skills

# Validar con output detallado
skills-cli skills validate ./skills --verbose

# Validar solo estructura (sin contenido)
skills-cli skills validate ./skills --structure-only
```

### Output Formatter

```bash
# Formato de salida
{
  "skill": "guidelines/my-skill",
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "type": "short-content",
      "message": "SKILL.md only 95 lines (recommend ≥150)",
      "file": "SKILL.md",
      "line": 1
    }
  ],
  "score": 85,
  "checks": {
    "structure": "pass",
    "metadata": "pass",
    "content": "warn",
    "resources": "pass",
    "scripts": "pass"
  }
}
```

## Automated Checks (CI/CD)

### GitHub Actions Workflow

```yaml
# .github/workflows/validate-skills.yml
name: Validate Skills

on:
  push:
    paths:
      - 'skills/**'
  pull_request:
    paths:
      - 'skills/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install -g skills-cli

      - name: Validate all skills
        run: |
          skills-cli skills lint ./skills --strict
          skills-cli skills validate ./skills

      - name: Check formatting
        run: |
          yamllint skills/*/*/SKILL.md
          markdownlint skills/*/*/SKILL.md skills/*/*/resources/*.md

      - name: Check for broken links
        run: |
          for file in skills/*/*/SKILL.md; do
            grep -o '\[[^]]\+\]([^)]*)' "$file" | while read link; do
              url=$(echo "$link" | sed 's/.*](\(.*\)).*/\1/')
              if [[ "$url" == http* ]]; then
                curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q 200 || echo "Broken link: $url in $file"
              fi
            done
          done

      - name: Generate validation report
        run: |
          skills-cli skills index ./skills --out ./registry/index.json
          cat > validation-report.md << EOF
          # Skills Validation Report

          - **Skills validated**: $(find skills -name "SKILL.md" | wc -l)
          - **Errors found**: $ERRORS
          - **Warnings**: $WARNINGS

          ## Details
          $(skills-cli skills validate ./skills --format json | jq -r '.[] | "- \(.skill): \(.status)"')
          EOF
```

## Continuous Validation

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Solo validar si se modificaron skills
if git diff --cached --name-only | grep -q '^skills/'; then
  echo "Validating modified skills..."

  for file in $(git diff --cached --name-only | grep '^skills/.*SKILL\.md$'); do
    skill_dir=$(dirname "$file")
    skill_name=$(basename "$skill_dir")

    if ! ./validate-skill.sh "$skill_dir" "$skill_name"; then
      echo "❌ Validation failed for $file"
      echo "Fix errors before committing"
      exit 1
    fi
  done

  echo "✅ All modified skills validated"
fi
```

### Makefile

```makefile
# Makefile

.PHONY: validate-skills validate-all lint-skills

validate-skills:
	@for skill in skills/*/*/; do \
		skill_name=$$(basename "$$skill"); \
		category=$$(basename $$(dirname "$$skill")); \
		./validate-skill.sh "$$skill" "$$skill_name"; \
	done

validate-all: validate-skills
	@skills-cli skills lint ./skills --strict
	@skills-cli skills validate ./skills

lint-skills:
	@yamllint skills/*/*/SKILL.md
	@markdownlint skills/*/*/SKILL.md skills/*/*/resources/*.md

help:
	@echo "Skills validation commands:"
	@echo "  make validate-skills   - Validate all skills structure"
	@echo "  make validate-all      - Full validation with CLI"
	@echo "  make lint-skills       - Lint formatting"
```

## Troubleshooting Validation

### Common Errors

| Error | Causa | Solución |
|-------|-------|----------|
| "Invalid YAML" | YAML malformado | Validar con `yq` o `yamlint` |
| "Missing required field" | Campo faltante | Revisar campos obligatorios |
| "Invalid ID format" | No kebab-case | Usar `kebab-case` naming |
| "SKILL.md too long" | >400 líneas | Mover a resources/ |
| "Resource declared but missing" | Archivo no existe | Crear archivo o corregir path |
| "Invalid enforcement" | Incompatible con type | Revisar matriz type×enforcement |

### Debug Commands

```bash
# Debug YAML parsing
sed -n '/^---$/,/^---$/p' SKILL.md | yq eval '.' -

# Debug resource paths
grep "resources:" -A 5 SKILL.md | grep "\.md$"

# Debug sections
grep "^## " SKILL.md

# Debug line count
wc -l SKILL.md
```

---

## Checklist Final

Antes de marcar skill como "validado":

### Structural
- [ ] SKILL.md existe
- [ ] resources/ directory existe
- [ ] 4 recursos en resources/
- [ ] Naming en kebab-case

### Metadata
- [ ] YAML válido
- [ ] 11 campos obligatorios presentes
- [ ] ID válido (kebab-case, ≤50)
- [ ] Summary ≤200 chars
- [ ] Version en semver
- [ ] Type/enforcement compatible

### Content
- [ ] Secciones obligatorias presentes
- [ ] SKILL.md < 400 líneas
- [ ] ≥150 líneas recomendadas
- [ ] Recursos ≥200 líneas recomendadas

### Resources
- [ ] Todos los recursos existen
- [ ] ≥5 ejemplos de código por recurso
- [ ] No contenido duplicado

### Scripts
- [ ] 2-5 scripts definidos
- [ ] Cada script tiene name, run, note
- [ ] Comandos válidos y ejecutables

### Integration
- [ ] skills-cli validation pass
- [ ] Linting pass (YAML, Markdown)
- [ ] Sin enlaces rotos

---

**Estado de la Validación**: READY ✅
**Herramientas**: validate-skill.sh, skills-cli, yamllint, markdownlint
**CI/CD**: GitHub Actions, pre-commit hooks, Makefile
