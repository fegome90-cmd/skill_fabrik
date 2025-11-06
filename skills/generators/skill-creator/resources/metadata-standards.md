# Metadata Standards - Estándares de Metadatos

## YAML Frontmatter Structure

Todos los skills deben tener **YAML frontmatter** en las primeras líneas del SKILL.md.

### Ubicación Estándar
```markdown
---
id: skill-name
version: 0.1.0
type: guideline|guardrail|workflow|generator|test
enforcement: suggest|warn|block|require
summary: 'Descripción concisa del propósito del skill'
audience: engineers|qa|architects|all
when_to_use: 'Contexto específico de aplicación'
provides: 'Qué beneficios o capacidades entrega'
resources:
  - resources/file-1.md
  - resources/file-2.md
  - resources/file-3.md
  - resources/file-4.md
scripts:
  - name: script-name
    run: command to execute
    note: descripción del comando
limits: 'Restricciones y limitaciones conocidas'
---

## Resto del contenido...
```

## Campos Obligatorios

### 1. id

**Tipo**: `string`
**Formato**: `kebab-case`
**Restricciones**:
- Único globalmente
- Descriptivo y claro
- Sin espacios, usar `-`
- No empezar ni terminar con `-`
- Máximo 50 caracteres

**Ejemplos**:
```yaml
✅ Válidos:
id: using-git-worktrees
id: test-driven-development
id: systematic-debugging
id: secret-scanning

❌ Inválidos:
id: using_git_worktrees     # snake_case no permitido
id: using git worktrees     # espacios no permitidos
id: -worktree-              # empieza/termina con -
id: g                      # muy corto, no descriptivo
id: this-is-an-extremely-long-skill-name-that-exceeds-fifty-characters # muy largo
```

**Validación**:
```bash
# Verificar formato
echo "$id" | grep -E '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
```

### 2. version

**Tipo**: `string`
**Formato**: `semver` (Semantic Versioning)
**Patrón**: `MAJOR.MINOR.PATCH`

**Reglas**:
- MAJOR: Cambios incompatibles
- MINOR: Nuevas features compatibles
- PATCH: Bug fixes compatibles
- Inicial: `0.1.0` (no usar `0.0.1` para skills)
- Beta: `0.1.0-beta.1` (opcional)
- RC: `1.0.0-rc.1` (opcional)

**Ejemplos**:
```yaml
✅ Válidos:
version: 0.1.0           # Primera versión
version: 0.2.0           # Nueva feature compatible
version: 0.2.1           # Bug fix
version: 1.0.0           # Primera versión estable
version: 1.1.0-beta.1    # Beta de nueva feature
version: 2.0.0-rc.1      # Release candidate

❌ Inválidos:
version: 0.0.1          # No usar para skills
version: 1.0            # Falta PATCH
version: v1.0.0         # Prefijo 'v' no permitido
version: 1.2.3.4        # Demasiados componentes
```

**Validación**:
```bash
# Verificar semver
npm semver 1.0.0 || echo "Invalid semver"
```

### 3. type

**Tipo**: `enum`
**Valores válidos**: `guideline`, `guardrail`, `workflow`, `generator`, `test`

**Definiciones**:

#### guideline
- **Propósito**: Buenas prácticas y metodologías
- **Enforcement**: `suggest` o `warn`
- **Audiencia**: Engineers principalmente
- **Ejemplos**: test-driven-development, using-git-worktrees

#### guardrail
- **Propósito**: Reglas de seguridad y compliance
- **Enforcement**: `block` o `require`
- **Audiencia**: Engineers, Qa
- **Ejemplos**: secret-scanning, database-verification

#### workflow
- **Propósito**: Procesos automatizados
- **Enforcement**: `suggest` o `require`
- **Audiencia**: Engineers, Architects
- **Ejemplos**: pm2-deploy, plan-save-workflow

#### generator
- **Propósito**: Generar código, templates, estructuras
- **Enforcement**: `suggest`
- **Audiencia**: Engineers
- **Ejemplos**: skill-creator, template-skill

#### test
- **Propósito**: Testing y validación
- **Enforcement**: `require` o `suggest`
- **Audiencia**: Engineers, Qa
- **Ejemplos**: webapp-testing, cli-integration-testing

**Ejemplos**:
```yaml
✅ Válidos:
type: guideline
type: guardrail
type: workflow
type: generator
type: test

❌ Inválidos:
type: best-practice      # Debe ser enum exacto
type: security           # Debe ser enum exacto
type: testing            # Debe ser enum exacto
```

### 4. enforcement

**Tipo**: `enum`
**Valores válidos**: `suggest`, `warn`, `block`, `require`

**Definiciones y Comportamiento**:

#### suggest
- **Descripción**: Recomendación, no obligatorio
- **Comportamiento**: Muestra hint/sugerencia
- **Usar para**: Buenas prácticas, optimizaciones
- **Ejemplo**: "Considera usar git worktrees para desarrollo paralelo"

#### warn
- **Descripción**: Advierte sobre riesgo, requiere justificación
- **Comportamiento**: Muestra warning con justificación requerida
- **Usar para**: Patrones con riesgos potenciales
- **Ejemplo**: "Usar eval() puede ser peligroso, justifica su uso"

#### block
- **Descripción**: Impide ejecución, falla el proceso
- **Comportamiento**: Bloquea, error con mensaje
- **Usar para**: Patrones peligrosos conocidos
- **Ejemplo**: "deleteMany() sin where es bloqueado"

#### require
- **Descripción**: Obligatorio, debe cumplirse
- **Comportamiento**: Valida cumplimiento
- **Usar para**: Checks obligatorios, compliance
- **Ejemplo**: "Secret scanning es requerido antes de commit"

**Matriz type × enforcement**:
```yaml
guideline:    suggest | warn
guardrail:    warn | block | require
workflow:     suggest | require
generator:    suggest
test:         require | suggest
```

**Ejemplos**:
```yaml
✅ Válidos:
type: guideline
enforcement: suggest

type: guardrail
enforcement: block

type: test
enforcement: require

❌ Inválidos:
type: generator
enforcement: block     # Generator nunca es block

type: guideline
enforcement: require   # Guideline raramente es require
```

### 5. summary

**Tipo**: `string`
**Restricciones**:
- Máximo 200 caracteres
- Descriptivo y conciso
- Sin markdown formatting
- Sin emojis
- Punto final opcional

**Template**:
```yaml
summary: '[VERBO] [OBJETO] [BENEFICIO/COMPORTAMIENTO]'
```

**Ejemplos**:
```yaml
✅ Válidos (≤200 chars):
summary: 'Técnica para desarrollo paralelo seguro usando múltiples рабочие árboles'
summary: 'Ciclo RED-GREEN-REFACTOR para desarrollo guiado por pruebas'
summary: 'Marco de 4 fases para debugging sistemático: Observar → Formular → Experimentar → Validar'
summary: 'Genera nuevos skills siguiendo el estándar Skills Fabric'

❌ Inválidos:
summary: 'Este skill es muy bueno y te ayudará mucho con tus problemas'  # Genérico
summary: 'Git worktrees allow you to manage multiple working trees'     # En inglés (debe ser español)
summary: 'Este es un skill muy detallado que incluye muchos ejemplos y casos de uso complejos que explican todo lo que necesitas saber sobre la técnica'  # >200 chars
```

**Validación**:
```bash
# Verificar longitud
summary="..."
if [ ${#summary} -le 200 ]; then
  echo "✅ Valid length"
else
  echo "❌ Too long: ${#summary} chars"
fi
```

### 6. audience

**Tipo**: `string` o `array`
**Valores válidos**: `engineers`, `qa`, `architects`, `all`

**Formatos**:
```yaml
# String simple
audience: engineers

# Array para múltiples
audience: [engineers, qa]
audience: [engineers, architects, qa]

# All
audience: all
```

**Ejemplos**:
```yaml
✅ Válidos:
audience: engineers
audience: [engineers, qa]
audience: all

❌ Inválidos:
audience: developers       # Usar 'engineers'
audience: [engineer]       # Singular, usar plural
audience: everyone         # Usar 'all'
```

### 7. when_to_use

**Tipo**: `string`
**Restricciones**:
- Máximo 300 caracteres
- Descriptivo de contexto
- Usar lenguaje claro
- Específico, no genérico

**Template**:
```yaml
when_to_use: 'Al [CONTEXTO/ACCIÓN]. [CUÁNDO/QUÉ SITUACIÓN]'
```

**Ejemplos**:
```yaml
✅ Válidos:
when_to_use: 'Al desarrollar features en paralelo, hacer code reviews de múltiples PRs, o trabajar en hotfixes'
when_to_use: 'Al implementar nuevas features o corregir bugs, antes de escribir código de producción'
when_to_use: 'Al crear un nuevo skill desde cero siguiendo el estándar Skills Fabric'

❌ Inválidos:
when_to_use: 'Siempre'                    # Muy genérico
when_to_use: 'Cuando tengas tiempo'       # No específico
when_to_use: 'Si quieres'                 # Vago
```

### 8. provides

**Tipo**: `string`
**Restricciones**:
- Máximo 300 caracteres
- Lista de beneficios/capacidades
- Separar con comas
- Enfoque en valor entregado

**Template**:
```yaml
provides: '[CAPACIDAD 1], [CAPACIDAD 2], [CAPACIDAD 3]'
```

**Ejemplos**:
```yaml
✅ Válidos:
provides: 'Desarrollo paralelo seguro, comparación de branches, workspace aislado, manejo de múltiples contextos'
provides: 'Metodología TDD, estructura de pruebas, ejemplos prácticos, comandos automatizados'
provides: 'Estructura de skill completa, templates automatizados, validación de metadatos, generación de recursos técnicos'

❌ Inválidos:
provides: 'Ayuda'                     # Muy vago
provides: 'Muchas cosas útiles'       # No específico
```

### 9. resources

**Tipo**: `array`
**Restricciones**:
- Exactamente 4 elementos
- Formato: `resources/filename.md`
- Archivos deben existir
- Kebab-case o snake_case

**Ejemplos**:
```yaml
✅ Válidos:
resources:
  - resources/basic-commands.md
  - resources/use-cases.md
  - resources/advanced-techniques.md
  - resources/troubleshooting.md

resources:
  - resources/conceptual_foundations.md
  - resources/procedural_guide.md
  - resources/examples.md
  - resources/troubleshooting.md

❌ Inválidos:
resources:                          # Array vacío
  - resources/file.md               # Solo 1 archivo

resources:
  - resources/file1.md
  - resources/file2.md
  - resources/file3.md
  - resources/file4.md
  - resources/file5.md              # 5 archivos (máx 4)

resources:
  - file.md                         # Falta 'resources/'
  - resources/file2.md

resources:
  - resources/file.md
  - resources/file.md               # Duplicado
```

**Validación**:
```bash
# Verificar que existen
for resource in resources/*.md; do
  [ -f "$resource" ] || echo "Missing: $resource"
done
```

### 10. scripts

**Tipo**: `array` de objetos
**Estructura**:
```yaml
scripts:
  - name: script-name
    run: command to execute
    note: descripción del comando
```

**Restricciones por campo**:
- `name`: kebab-case, único en el skill
- `run`: comando válido y ejecutable
- `note`: descripción breve (≤100 chars)

**Ejemplos**:
```yaml
✅ Válidos:
scripts:
  - name: worktree-add
    run: git worktree add <path> <branch>
    note: Crea nuevo worktree con branch específico
  - name: worktree-list
    run: git worktree list
    note: Lista todos los worktrees activos

❌ Inválidos:
scripts: []                          # Array vacío (recomendado: 2-5 scripts)

scripts:
  - name: test                       # Muy genérico
    run: npm test
    note: Ejecutar tests

  - name: test                       # Duplicado
    run: jest
    note: Ejecutar jest

scripts:
  - name: custom-script
    run:                             # Falta comando
    note: Descripción
```

### 11. limits

**Tipo**: `string`
**Restricciones**:
- Máximo 200 caracteres
- Describir restricciones técnicas
- Conocidas limitaciones

**Ejemplos**:
```yaml
✅ Válidos:
limits: 'Requiere Git 2.5+. No compartir worktrees entre desarrolladores. Mantener sincronización con branch principal.'
limits: 'Requiere framework de testing (jest/vitest/mocha) y configuración previa.'
limits: 'Requiere categoría válida (guidelines/guardrails/workflows/generators/test). Template necesario.'

❌ Inválidos:
limits: 'Ninguna'                     # Siempre hay límites
limits: 'Requiere muchas cosas complicadas'  # Vago
```

## Campos Opcionales

### category

**Tipo**: `string`
**Uso**: Categorización adicional, sub-tipo

**Ejemplos**:
```yaml
category: development
category: security
category: automation
```

### tags

**Tipo**: `array` de `string`
**Uso**: Tags para búsqueda y clasificación

**Ejemplos**:
```yaml
tags: [git, parallel-development, branches]
tags: [testing, tdd, red-green-refactor]
tags: [debugging, systematic, troubleshooting]
```

### dependencies

**Tipo**: `array` de `string` (skill IDs)
**Uso**: Otros skills requeridos

**Ejemplos**:
```yaml
dependencies:
  - git-basics
  - branch-management
```

### examples_count

**Tipo**: `integer`
**Uso**: Tracking de cantidad de ejemplos

**Ejemplos**:
```yaml
examples_count: 15
```

### lines_count

**Tipo**: `integer`
**Uso**: Tracking de líneas en SKILL.md

**Ejemplos**:
```yaml
lines_count: 185
```

## Ejemplos Completos

### Guideline Skill (Completo)
```yaml
---
id: using-git-worktrees
version: 0.1.0
type: guideline
enforcement: suggest
summary: 'Técnica para desarrollo paralelo seguro usando múltiples рабочие árboles'
audience: engineers
when_to_use: 'Al desarrollar features en paralelo, hacer code reviews de múltiples PRs, o trabajar en hotfixes mientras desarrollas.'
provides: 'Desarrollo paralelo seguro, comparación de branches, workspace aislado, manejo de múltiples contextos'
resources:
  - resources/basic-commands.md
  - resources/use-cases.md
  - resources/advanced-techniques.md
  - resources/troubleshooting.md
scripts:
  - name: worktree-add
    run: git worktree add <path> <branch>
    note: Crea nuevo worktree con branch específico
  - name: worktree-list
    run: git worktree list
    note: Lista todos los worktrees activos
  - name: worktree-remove
    run: git worktree remove <path>
    note: Elimina worktree específico
  - name: worktree-prune
    run: git worktree prune
    note: Limpia worktrees huérfanos
limits: 'Requiere Git 2.5+. No compartir worktrees entre desarrolladores. Mantener sincronización con branch principal.'
---
```

### Guardrail Skill (Completo)
```yaml
---
id: secret-scanning
version: 0.1.0
type: guardrail
enforcement: require
summary: 'Detección automática de secrets y credenciales en código para prevenir leaks'
audience: [engineers, qa]
when_to_use: 'Antes de cada commit, en CI/CD, o al revisar código de terceros.'
provides: 'Detección de API keys, passwords, tokens, certificados privados, validación automática'
resources:
  - resources/enforcement-levels.md
  - resources/common-patterns.md
  - resources/risk-mitigation.md
  - resources/examples.md
scripts:
  - name: scan-code
    run: gitleaks detect --source . --report-format json
    note: Escanea código en busca de secrets
  - name: scan-git
    run: gitleaks detect --no-git
    note: Escanea cambios sin commitear
limits: 'Requiere gitleaks instalado. Puede generar falsos positivos en comentarios.'
---
```

## Validación Automática

### Schema JSON

```json
{
  "type": "object",
  "required": ["id", "version", "type", "enforcement", "summary", "audience", "when_to_use", "provides", "resources", "scripts"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$",
      "maxLength": 50
    },
    "version": {
      "type": "string",
      "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-[\\dA-Za-z-]+(?:\\.[\\dA-Za-z-]+)*)?(?:\\+[\\dA-Za-z-]+(?:\\.[\\dA-Za-z-]+)*)?$"
    },
    "type": {
      "type": "string",
      "enum": ["guideline", "guardrail", "workflow", "generator", "test"]
    },
    "enforcement": {
      "type": "string",
      "enum": ["suggest", "warn", "block", "require"]
    },
    "summary": {
      "type": "string",
      "maxLength": 200
    },
    "audience": {
      "oneOf": [
        {"type": "string"},
        {
          "type": "array",
          "items": {"type": "string"},
          "minItems": 1,
          "maxItems": 3
        }
      ]
    },
    "when_to_use": {
      "type": "string",
      "maxLength": 300
    },
    "provides": {
      "type": "string",
      "maxLength": 300
    },
    "resources": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 4,
      "maxItems": 4
    },
    "scripts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "run", "note"],
        "properties": {
          "name": {
            "type": "string",
            "pattern": "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
          },
          "run": {"type": "string"},
          "note": {"type": "string", "maxLength": 100}
        }
      },
      "minItems": 1,
      "maxItems": 10
    },
    "limits": {
      "type": "string",
      "maxLength": 200
    }
  }
}
```

### Script de Validación

```bash
#!/bin/bash
# validate-skill-metadata.sh

SKILL_FILE="$1"

if [ -z "$SKILL_FILE" ]; then
  echo "Usage: $0 <skill-file>"
  exit 1
fi

echo "Validating: $SKILL_FILE"

# Extraer YAML frontmatter
YAML_CONTENT=$(sed -n '/^---$/,/^---$/p' "$SKILL_FILE")

# Verificar campos obligatorios
for field in id version type enforcement summary audience when_to_use provides resources scripts; do
  if ! echo "$YAML_CONTENT" | grep -q "^${field}:"; then
    echo "❌ Missing required field: $field"
    exit 1
  fi
done

echo "✅ All required fields present"
echo "✅ Metadata validation passed"
```

### Validación con jq

```bash
# Extraer y validar frontmatter
YAML_CONTENT=$(sed -n '/^---$/,/^---$/p' SKILL.md)
echo "$YAML_CONTENT" | yq eval '.' - > /tmp/metadata.json

# Validar con schema
jq -c --schema schema.json '.metadata' /tmp/metadata.json
```

## Herramientas Recomendadas

### YAML Linting
```bash
# Verificar YAML válido
yamllint skills/guidelines/*/SKILL.md

# Formatear YAML
yamlfmt -w skills/guidelines/*/SKILL.md
```

### Schema Validation
```bash
# Con yq
yq eval 'has("id", "version", "type")' SKILL.md

# Con Python
python3 -c "import yaml; yaml.safe_load(open('SKILL.md'))"
```

### Lint Personalizado
```bash
# Custom linter para skill metadata
skills-cli skills validate-metadata ./skills
```

## Checklist de Metadatos

Antes de considerar un skill completo:

- [ ] `id` en kebab-case, único, ≤50 chars
- [ ] `version` en semver, empezar en 0.1.0
- [ ] `type` en enum válido
- [ ] `enforcement` compatible con `type`
- [ ] `summary` ≤200 chars, descriptivo
- [ ] `audience` válido (string o array)
- [ ] `when_to_use` ≤300 chars, específico
- [ ] `provides` ≤300 chars, específico
- [ ] `resources` array con exactamente 4 elementos
- [ ] Cada resource existe físicamente
- [ ] `scripts` array con 1-10 elementos
- [ ] Cada script tiene `name`, `run`, `note`
- [ ] `limits` ≤200 chars, si aplica
- [ ] YAML válido y bienformado
- [ ] YAML pasa schema validation

---

**Referencia**: Usar este documento como guía al crear o auditar metadatos de skills en Skills Fabric.
