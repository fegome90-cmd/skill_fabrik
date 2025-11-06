# 📖 Guía Completa - Prompt Builder v2

## Tabla de Contenidos
1. [Instalación y Setup](#instalación-y-setup)
2. [Comandos Básicos](#comandos-básicos)
3. [Flags y Opciones](#flags-y-opciones)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [Casos de Uso](#casos-de-uso)
6. [Template v1.1.0](#template-v110)
7. [TAGs System](#tags-system)
8. [Buenas Prácticas](#buenas-prácticas)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Instalación y Setup

### Prerrequisitos
```bash
# Node.js 18+
node --version

# pnpm 8+ (recomendado)
pnpm --version

# Proyecto Skills Fabrik
cd /Users/felipe/Developer/skills-fabrik
pnpm -w build
```

### Instalación
```bash
# Opción 1: Directo (recomendado)
node packages/skills-cli/dist/index.js prompt-builder <skill> <descripción> --v2 [flags]

# Opción 2: Usando pnpm
pnpm -w --filter @skills-fabrik/skills-cli exec skills prompt-builder <skill> <descripción> --v2 [flags]

# Opción 3: Link global
pnpm -w --filter @skills-fabrik/skills-cli link -g
skills prompt-builder <skill> <descripción> --v2 [flags]
```

### Verificar Instalación
```bash
node packages/skills-cli/dist/index.js --help
```

---

## Comandos Básicos

### Estructura Básica
```bash
node packages/skills-cli/dist/index.js prompt-builder <SCRIPT> <DESCRIPCIÓN> --v2 [flags]
```

### Skins Disponibles
- `plan-architect` - Planificación y arquitectura
- `backend-architecture-patterns` - Backend y arquitectura
- `frontend-dev-guidelines` - Desarrollo frontend
- `api-design-and-testing` - APIs y testing
- `database-verification` - Verificación de base de datos
- `security-testing-guide` - Testing de seguridad
- `ci-cd-pipelines` - CI/CD pipelines
- `test-driven-development` - Desarrollo basado en tests

### Múltiples Skills
```bash
# Separados por coma
node packages/skills-cli/dist/index.js prompt-builder \
  "backend-dev-guidelines,database-verification" \
  "Crear endpoint con validación" \
  --v2 --multiple-skills
```

---

## Flags y Opciones

### Flags Esenciales
```bash
--v2                      # Usar Prompt Builder v2 (OBLIGATORIO)
--include-template        # Aplicar Template v1.1.0 (8/8 componentes)
--include-tags           # Generar TAGs [K][C][U]
--include-plan-context   # Incluir contexto del plan activo
--include-files          # Detectar y sugerir archivos relevantes
--show-score            # Mostrar desglose de puntuaciones
--multiple-skills       # Permitir múltiples skills
```

### Complejidad (configurada automáticamente)
```bash
# Baja
[node packages/skills-cli/dist/index.js prompt-builder plan-architect "Tarea simple" --v2]

# Media
[node packages/skills-cli/dist/index.js prompt-builder plan-architect "Tarea media" --v2 --include-tags]

# Alta
[node packages/skills-cli/dist/index.js prompt-builder plan-architect "Tarea compleja" --v2 --include-template --include-tags]

# Muy Alta
[node packages/skills-cli/dist/index.js prompt-builder plan-architect "Tarea muy compleja" --v2 --include-template --include-tags --include-files --show-score]
```

---

## Ejemplos Prácticos

### 1. Planificación Básica
```bash
node packages/skills-cli/dist/index.js prompt-builder plan-architect \
  "Diseñar sistema de autenticación" \
  --v2 --include-template --include-tags

# Salida:
# ✅ Prompt optimizado
# ✅ Template v1.1.0 aplicado
# ✅ TAGs generados
```

### 2. Backend con Validación
```bash
node packages/skills-cli/dist/index.js prompt-builder \
  "backend-dev-guidelines,database-verification" \
  "Crear endpoint de usuarios con validaciones y PostgreSQL" \
  --v2 --multiple-skills --include-tags --show-score

# Salida:
# ✅ Múltiples skills activados
# ✅ Archivos sugeridos
# ✅ Score detallado
```

### 3. Con CLOOP + TAGs
```bash
node packages/skills-cli/dist/index.js prompt-builder plan-architect \
  "[Clarify] Definir objetivos del proyecto. [Layout] Diseñar arquitectura. [U] ¿Qué stack usar?" \
  --v2 --include-template --include-tags --include-plan-context --show-score

# Salida:
# ✅ CLOOP detectado
# ✅ TAGs [K][C][U] procesados
# ✅ Plan contexto incluido
```

### 4. Testing y Seguridad
```bash
node packages/skills-cli/dist/index.js prompt-builder \
  "security-testing-guide,api-design-and-testing" \
  "Probar API contra vulnerabilidades comunes" \
  --v2 --multiple-skills --include-files

# Salida:
# ✅ Skills de testing activados
# ✅ Archivos de test sugeridos
# ✅ Métricas de seguridad
```

---

## Casos de Uso

### 🎯 Planificación de Proyecto
```bash
# Solicitud
node packages/skills-cli/dist/index.js prompt-builder plan-architect \
  "[Layout] Planificar desarrollo de e-commerce. [K] Requerimientos definidos. [U] ¿Qué tecnologías?" \
  --v2 --include-template --include-tags

# Resultado:
# ✅ Plan estructurado
# ✅ Recomendaciones tecnológicas
# ✅ Cronograma sugerido
```

### 🏗️ Arquitectura Backend
```bash
# Solicitud
node packages/skills-cli/dist/index.js prompt-builder \
  "backend-architecture-patterns" \
  "Diseñar microservicios con Node.js y PostgreSQL" \
  --v2 --include-template --include-tags --include-files

# Resultado:
# ✅ Patrones de arquitectura
# ✅ Estructura de código
# ✅ Archivos a crear/editar
```

### 🔒 Seguridad
```bash
# Solicitud
node packages/skills-cli/dist/index.js prompt-builder \
  "security-testing-guide" \
  "[Operate] Validar input contra XSS y SQL injection" \
  --v2 --include-tags --show-score

# Resultado:
# ✅ Tests de seguridad
# ✅ Validaciones específicas
# ✅ Score de seguridad
```

### 📊 CI/CD
```bash
# Solicitud
node packages/skills-cli/dist/index.js prompt-builder \
  "ci-cd-pipelines" \
  "Configurar pipeline GitHub Actions con testing automático" \
  --v2 --include-template --include-files

# Resultado:
# ✅ Configuración de CI/CD
# ✅ Archivos de workflow
# ✅ Comandos de testing
```

---

## Template v1.1.0

### Componentes Incluidos (8/8)
- **C1: CSE_Completo** ✅ - Descripción completa del sistema
- **C2: TAGs_Cobertura** ✅ - Sistema de tags [K][C][U]
- **C3: Boundary_Markers** ✅ - Delimitadores claros
- **C4: Frontmatter_YAML** ✅ - Metadatos estructurados
- **C5: Anti_Drift** ✅ - Prevención de desviación
- **C6: Objetivos_SMART** ✅ - Objetivos específicos
- **C7: Tests_Ejecutables** ✅ - Casos de test definidos
- **C8: Separacion_EVIDENCIA_PROPUESTA** ✅ - Separación clara

### Cómo Aplicarlo
```bash
--include-template  # Aplica automáticamente
```

### Ejemplo de Output
```
Template v1.1.0 aplicado (8/8 componentes):
  • C1: CSE_Completo ✅
  • C2: TAGs_Cobertura ✅ (5 tags)
  • C3: Boundary_Markers ✅
  • C4: Frontmatter_YAML ✅
  • C5: Anti_Drift ✅
  • C6: Objetivos_SMART ✅
  • C7: Tests_Ejecutables ✅
  • C8: Separacion_EVIDENCIA_PROPUESTA ✅
```

---

## TAGs System

### Tipos de TAGs
- **[K:...]** - Knowledge tags (hechos, información)
- **[C:...]** - Context tags (cálculos, contexto)
- **[U:...]** - Usage tags (uso, workflow)
- **[EVIDENCIA:...]** - Referencias a evidencias
- **[PROPUESTA:...]** - Propuestas de acción

### Ejemplos
```bash
# Input
"[K] Análisis completado. [C] Riesgos: XSS, SQLi. [U] ¿Cómo mitigar? [EVIDENCIA] docs/security.md"

# Output generado
🏷️ TAGs aplicados:
  [K:BACKEND-ARCHITECTURE]
  [C:API-DEVELOPMENT]
  [K:DATABASE-CONNECTION]
  [C:INFRASTRUCTURE-SETUP]
```

### Mejores Prácticas
```bash
# ✅ Bien estructurado
"[K] Estado actual: completado. [C] Próximo paso: testing. [U] Recursos necesarios?"

# ❌ Mal estructurado
"Tenemos que hacer algo para mejorar"
```

---

## Buenas Prácticas

### 1. Usar CLOOP Method
```bash
# Siempre especificar fase
[Clarify] - Definir objetivos
[Layout] - Diseñar estructura
[Operate] - Implementar
[Observe] - Monitorear
[Reflect] - Analizar
```

### 2. Incluir Evidencia
```bash
# ✅ Mejor
"[K] Requerimientos: API REST. [EVIDENCIA] docs/api-spec.md"

# ❌ Peor
"Crear API"
```

### 3. Especificar Skills Correctos
```bash
# ✅ Específico
node packages/skills-cli/dist/index.js prompt-builder \
  "backend-dev-guidelines,database-verification" \
  "Crear CRUD usuarios" \
  --v2 --multiple-skills

# ❌ Genérico
node packages/skills-cli/dist/index.js prompt-builder \
  plan-architect \
  "Algo con base de datos"
```

### 4. Usar Flags Apropiados
```bash
# Para planning
--include-template --include-tags --include-plan-context

# Para development
--include-files --include-tags --show-score

# Para testing
--multiple-skills --include-tags --show-score
```

### 5. Mejorar Coverage
```bash
# Añadir contexto para ≥60% coverage
"[Layout] Diseñar arquitectura. [K] Stack: Node+PostgreSQL. [U] ¿Patrones?"
```

---

## Troubleshooting

### Error: Command not found
```bash
# Solución: Usar ruta completa
node packages/skills-cli/dist/index.js prompt-builder <comando>

# O crear alias
alias skills='node packages/skills-cli/dist/index.js'
```

### Error: Skill not found
```bash
# Listar skills disponibles
cat configs/skill-rules.json | grep '":'

# Skills válidos ejemplos:
# - plan-architect
# - backend-architecture-patterns
# - frontend-dev-guidelines
# - api-design-and-testing
# - database-verification
# - security-testing-guide
```

### Score bajo (<0.6)
```bash
# Mejorar con:
--include-files      # Detectar archivos reales
--include-template   # Aplicar estructura completa
--include-tags      # Generar más tags
```

### TAGs coverage bajo
```bash
# Añadir más contexto:
"[K] Conocimiento específico. [C] Contexto amplio. [U] Uso claro."

# Verificar archivos abiertos en editor
# Usar --include-files
```

### Cache alerts
```bash
# Normal en primer uso
# Se resuelve automáticamente
# No afecta funcionalidad
```

### Performance lenta
```bash
# Primera ejecución: normal (carga índices)
# Subsequent: rápido (cache activo)
# Ejemplo real: 473ms → 1ms (99.7% mejora)
```

---

## FAQ

### P: ¿Es seguro?
**R**: ✅ **SÍ**. Prompt Builder v2 **NUNCA ejecuta comandos**, **NUNCA modifica archivos**, **NUNCA hace network requests**. Solo genera prompts optimizados.

### P: ¿Puede hacer daño?
**R**: ✅ **NO**. Probado contra: `rm -rf`, `chmod 777`, `killall`, "exportar credenciales". Todos ignorados, solo texto en prompt.

### P: ¿Qué hace realmente?
**R**: Optimiza tu descripción de tarea en un prompt estructurado con:
- Template v1.1.0 (8/8 componentes)
- TAGs [K][C][U]
- Detección de archivos relevantes
- Score de calidad

### P: ¿Cuándo usarlo?
**R**:
- Planificación de proyectos
- Definición de arquitectura
- Testing y QA
- Documentación
- Reviews de código

### P: ¿Reemplaza a otros tools?
**R**: **NO**. Es un **prompt builder** que optimiza tus instrucciones para usar con Claude/Cursor.

### P: ¿Funciona sin internet?
**R**: **SÍ**. Funciona completamente offline una vez instalado.

### P: ¿Cuál es el score mínimo?
**R**: Recomendado: **≥0.6**. Usa `--include-files`, `--include-template`, `--include-tags` para mejorar.

### P: ¿Cuántos skills puedo usar?
**R**: Hasta **3-6 skills** simultáneamente. Usa `--multiple-skills`.

---

## Ejemplos de Output

### Prompt Input
```
"[Layout] Diseñar sistema autenticación. [K] JWT + bcrypt. [U] ¿Refresh tokens?"
```

### Prompt Output
```
genera, planes, estructurados: [Layout] Diseñar sistema autenticación. [K] JWT + bcrypt. [U] ¿Refresh tokens?

Template v1.1.0 aplicado (8/8 componentes):
  • C1: CSE_Completo ✅
  • C2: TAGs_Cobertura ✅ (5 tags)
  • C3: Boundary_Markers ✅
  • C4: Frontmatter_YAML ✅
  • C5: Anti_Drift ✅
  • C6: Objetivos_SMART ✅
  • C7: Tests_Ejecutables ✅
  • C8: Separacion_EVIDENCIA_PROPUESTA ✅

🏷️ TAGs aplicados:
  [K:PLAN-MANAGEMENT]
  [C:CLOOP-METHODOLOGY]
  [U:DEVELOPER-WORKFLOW]

Audit 4D: 6.45/10
Tags: APPROVED
```

---

## Enlaces Útiles

- **Documentación completa**: `/prompt-builder-v2/documentation/`
- **Skills disponibles**: `configs/skill-rules.json`
- **Ejemplos de testing**: `/mcp-prompt-builder/TEST-TASK.ts`
- **Agent SDK**: `/mcp-prompt-builder/agent-sdk-example.ts`
- **MCP Server**: `/mcp-prompt-builder/src/index.ts`

---

## 🎯 Resumen de Comandos

```bash
# BÁSICO
node packages/skills-cli/dist/index.js prompt-builder <skill> "<descripción>" --v2

# CON TEMPLATE + TAGS
--include-template --include-tags

# CON ARCHIVOS + SCORE
--include-files --show-score

# MULTI-SKILLS
"<skill1>,<skill2>" --multiple-skills

# COMPLETO
--include-template --include-tags --include-files --show-score
```

**¡Listo para usar!** 🚀
