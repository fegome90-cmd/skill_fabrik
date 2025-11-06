# 📚 Guía Completa del CLI - Skills Fabric

**Versión:** 0.1.0  
**Última actualización:** 2025-01-29

Esta guía proporciona documentación completa de todos los comandos disponibles en `skills-cli`, organizados por categorías funcionales.

---

## 📋 Tabla de Contenidos

1. [Instalación y Configuración](#instalación-y-configuración)
2. [Comandos de Skills](#comandos-de-skills)
3. [Comandos CLOOP](#comandos-cloop)
4. [Gestión de Planes](#gestión-de-planes)
5. [Desarrollo y Documentación](#desarrollo-y-documentación)
6. [Calidad y Guardrails](#calidad-y-guardrails)
7. [Build y CI](#build-y-ci)
8. [Monitoreo y Métricas](#monitoreo-y-métricas)
9. [Servicios y Daemon](#servicios-y-daemon)
10. [Sistemas Avanzados](#sistemas-avanzados)
11. [Herramientas de Activación](#herramientas-de-activación)

---

## 🔧 Instalación y Configuración

### Instalación Global

```bash
pnpm --filter @skills-fabrik/skills-cli link --global
```

### Verificar Instalación

```bash
skills-cli --version
```

### Inicializar CLOOP

```bash
skills-cli init cloop
```

Inicializa la configuración CLOOP en el proyecto actual.

---

## 📦 Comandos de Skills

### Indexar Skills

```bash
skills-cli skills index [path] [opciones]
```

**Descripción:** Indexa skills y genera el registro en formato JSON.

**Parámetros:**
- `[path]` - Directorio de skills (por defecto: `./skills`)

**Opciones:**
- `-o, --out <file>` - Archivo de salida (por defecto: `./registry/index.json`)
- `-v, --verbose` - Salida detallada

**Ejemplo:**
```bash
skills-cli skills index ./skills -o ./registry/index.json -v
```

---

### Validar Skills (Lint)

```bash
skills-cli skills lint [path] [opciones]
```

**Descripción:** Valida descripciones y estructura de skills.

**Parámetros:**
- `[path]` - Directorio de skills (por defecto: `./skills`)

**Opciones:**
- `-v, --verbose` - Salida detallada
- `--strict` - Falla en advertencias

**Ejemplo:**
```bash
skills-cli skills lint ./skills --strict
```

---

### Verificar Matches (Check)

```bash
skills-cli skills check <intent> [opciones]
```

**Descripción:** Verifica qué skills coinciden con una intención del usuario.

**Parámetros:**
- `<intent>` - Intención del usuario a verificar

**Opciones:**
- `-v, --verbose` - Salida detallada
- `--open-files <files...>` - Archivos abiertos para considerar triggers de ruta
- `--threshold <number>` - Umbral de activación (0-1, por defecto: 0.6)
- `--v2` - Usar Prompt Builder v2 para análisis mejorado

**Ejemplo:**
```bash
skills-cli skills check "implementar autenticación de usuario" --threshold 0.7 --v2
```

---

### Empaquetar Skill (Pack)

```bash
skills-cli skills pack <skillDir> [opciones]
```

**Descripción:** Empaqueta un directorio de skill en un .tgz reproducible con manifest.

**Parámetros:**
- `<skillDir>` - Ruta al directorio del skill

**Opciones:**
- `-o, --out <dir>` - Directorio de salida (por defecto: `.registry`)
- `--manifest-version <version>` - Versión para incluir en el manifest

**Ejemplo:**
```bash
skills-cli skills pack ./skills/guidelines/security-skill -o .registry --manifest-version 1.0.0
```

---

### Verificar Paquete (Verify)

```bash
skills-cli skills verify <package> [opciones]
```

**Descripción:** Verifica un skill empaquetado (.tgz) contra su manifest y esquema.

**Parámetros:**
- `<package>` - Ruta al paquete de skill (.tgz)

**Opciones:**
- `--manifest <path>` - Ruta al manifest JSON (por defecto: mismo directorio con .manifest.json)

**Ejemplo:**
```bash
skills-cli skills verify .registry/security-skill-1.0.0.tgz
```

---

### Instalar Skill (Install)

```bash
skills-cli skills install <package> [opciones]
```

**Descripción:** Instala un skill empaquetado en el workspace local (política read-only).

**Parámetros:**
- `<package>` - Ruta al paquete (.tgz o file://)

**Opciones:**
- `--manifest <path>` - Ruta al manifest JSON
- `--target <dir>` - Directorio destino (por defecto: `skills`)
- `--force` - Sobrescribir instalación existente

**Ejemplo:**
```bash
skills-cli skills install file://.registry/security-skill-1.0.0.tgz --target ./skills
```

---

### Activar Skill

```bash
skills-cli skills activate <skill-id> [opciones]
```

**Descripción:** Activa un skill específico.

**Ejemplo:**
```bash
skills-cli skills activate security-audit
```

---

### Ejecutar Skill

```bash
skills-cli skills execute <skill-id> [opciones]
```

**Descripción:** Ejecuta un skill con confirmación si es necesario.

**Ejemplo:**
```bash
skills-cli skills execute security-audit
```

---

### Confirmar Challenge S1

```bash
skills-cli skills confirm [opciones]
```

**Descripción:** Confirma un challenge write-safe (S1) para un skill.

**Opciones requeridas:**
- `--challenge <id>` - Identificador del challenge retornado por `/execute preflight`

**Opciones opcionales:**
- `--nonce <value>` - Nonce retornado cuando CONFIRM_TEST_EXPOSE_NONCE=true (solo dev)
- `--cwd <path>` - Directorio de trabajo (por defecto: `.`)
- `--skill-id <id>` - ID del skill a confirmar (por defecto: `policy-s1`)
- `--json` - Imprimir respuesta JSON

**Ejemplo:**
```bash
skills-cli skills confirm --challenge abc123 --skill-id security-audit
```

---

### Ver Reglas de Skills

```bash
skills-cli skills rules
```

**Descripción:** Muestra las reglas de activación de skills actuales.

---

## 🔄 Comandos CLOOP

### Iniciar Fase CLOOP

```bash
skills-cli cloop start <phase> [opciones]
```

**Descripción:** Inicia una fase CLOOP creando `plan-start.md`.

**Parámetros:**
- `<phase>` - Identificador de fase (ej: F0, F1, F2)

**Opciones:**
- `-v, --verbose` - Salida detallada

**Ejemplo:**
```bash
skills-cli cloop start F1 -v
```

---

### Completar Fase CLOOP

```bash
skills-cli cloop complete <phase> [opciones]
```

**Descripción:** Completa una fase CLOOP creando `presprint.md`.

**Parámetros:**
- `<phase>` - Identificador de fase (ej: F0, F1)

**Opciones:**
- `-v, --verbose` - Salida detallada

**Ejemplo:**
```bash
skills-cli cloop complete F1 -v
```

---

## 📋 Gestión de Planes

### Crear Plan

```bash
skills-cli plan create <task> [opciones]
```

**Descripción:** Crea un nuevo plan desde la descripción de una tarea.

**Parámetros:**
- `<task>` - Descripción de la tarea

**Opciones:**
- `--output <dir>` - Directorio de salida para el plan (por defecto: `dev/plans`)
- `-v, --verbose` - Salida detallada
- `--v2` - Usar Prompt Builder v2 para generación inteligente de planes

**Ejemplo:**
```bash
skills-cli plan create "Implementar autenticación OAuth" --v2
```

---

### Guardar Plan

```bash
skills-cli plan save <plan-id> [opciones]
```

**Descripción:** Guarda el workflow del plan: genera tríada de dev-docs + snapshot MemTech L1.

**Parámetros:**
- `<plan-id>` - ID del plan a guardar

**Opciones:**
- `--plans-dir <dir>` - Directorio de planes (por defecto: `dev/plans`)
- `--task-name <name>` - Nombre de tarea (si difiere de plan.task)
- `--approve` - Aprobar plan automáticamente
- `-v, --verbose` - Salida detallada

**Ejemplo:**
```bash
skills-cli plan save plan-abc123 --approve
```

---

### Listar Planes

```bash
skills-cli plan list [opciones]
```

**Descripción:** Lista todos los planes.

**Opciones:**
- `--plans-dir <dir>` - Directorio de planes (por defecto: `dev/plans`)
- `--status <status>` - Filtrar por estado (DRAFT, APPROVED, etc.)
- `-v, --verbose` - Salida detallada

**Ejemplo:**
```bash
skills-cli plan list --status APPROVED
```

---

### Aprobar Plan

```bash
skills-cli plan approve <plan-id> [opciones]
```

**Descripción:** Aprueba un plan.

**Parámetros:**
- `<plan-id>` - ID del plan a aprobar

**Opciones:**
- `--plans-dir <dir>` - Directorio de planes
- `--by <name>` - Nombre del aprobador (por defecto: `user`)
- `-v, --verbose` - Salida detallada

**Ejemplo:**
```bash
skills-cli plan approve plan-abc123 --by admin
```

---

## 📝 Desarrollo y Documentación

### Crear Dev-Docs

```bash
skills-cli dev-docs create <task-name> [opciones]
```

**Descripción:** Crea documentación de desarrollo desde un plan aprobado.

**Parámetros:**
- `<task-name>` - Nombre de la tarea

**Opciones:**
- `--plan <file>` - Ruta al archivo de plan aprobado
- `-v, --verbose` - Salida detallada
- `--v2` - Usar Prompt Builder v2 para generación mejorada de documentación

**Ejemplo:**
```bash
skills-cli dev-docs create oauth-implementation --plan dev/plans/plan-abc123.json --v2
```

---

### Actualizar Dev-Docs

```bash
skills-cli dev-docs update [opciones]
```

**Descripción:** Actualiza dev-docs antes de compactación.

**Opciones:**
- `--task <name>` - Actualizar tarea específica solamente
- `-v, --verbose` - Salida detallada

**Ejemplo:**
```bash
skills-cli dev-docs update --task oauth-implementation
```

---

### Listar Dev-Docs

```bash
skills-cli dev-docs list [opciones]
```

**Descripción:** Lista todas las tareas de dev-docs activas.

**Opciones:**
- `-v, --verbose` - Salida detallada

---

## 🛡️ Calidad y Guardrails

### Verificar Guardrails

```bash
skills-cli guardrail <pattern> [opciones]
```

**Descripción:** Prueba guardrails contra patrones destructivos.

**Parámetros:**
- `<pattern>` - Patrón a probar (ej: "rm -rf /")

**Opciones:**
- `-v, --verbose` - Salida detallada
- `--file <path>` - Probar patrón contra contenido de archivo

**Ejemplos:**
```bash
# Probar patrón directo
skills-cli guardrail "rm -rf /"

# Probar archivo
skills-cli guardrail "deleteMany()" --file src/database.ts
```

**Patrones Detectados:**
- Operaciones destructivas del sistema de archivos (`rm -rf /`)
- Operaciones de base de datos sin WHERE (`deleteMany()`, `updateMany()`)
- Sentencias SQL peligrosas (`DROP TABLE`, `TRUNCATE TABLE`)
- Uso de `eval()` (riesgo de seguridad)
- Secretos hardcodeados (API_KEY, SECRET_KEY, etc.)

---

## 🏗️ Build y CI

### Verificar Builds

```bash
skills-cli build [opciones]
```

**Descripción:** Verifica builds y errores de TypeScript.

**Opciones:**
- `--fix` - Sugerir correcciones para errores
- `-v, --verbose` - Salida detallada
- `--all` - Verificar todos los repos, no solo los modificados

**Ejemplos:**
```bash
# Verificar solo repos modificados
skills-cli build

# Verificar todos los repos
skills-cli build --all

# Modo verbose
skills-cli build --all -v
```

---

### Ejecutar Gates de CI

```bash
skills-cli ci [opciones]
```

**Descripción:** Ejecuta gates de CI localmente.

**Opciones:**
- `--gate <name>` - Ejecutar gate específico solamente
- `-v, --verbose` - Salida detallada

**Ejemplos:**
```bash
# Ejecutar todos los gates
skills-cli ci

# Ejecutar gate específico
skills-cli ci --gate skills-lint

# Modo verbose
skills-cli ci --gate G1 -v
```

**Gates Disponibles (G1-G8):**
- **G1 (P0)**: Integridad de build, lint de skills, validación de esquema
- **G2 (P1)**: Tests de activación, validación de shell, notificaciones
- **G3 (P0)**: Aplicación de guardrails (patrones de BD, checks de seguridad)
- **G4-G8**: Checks adicionales de calidad y monitoreo

---

## 📊 Monitoreo y Métricas

### Dashboard de KPIs

```bash
skills-cli kpi [opciones]
```

**Descripción:** Muestra dashboard de KPIs y métricas.

**Opciones:**
- `--days <number>` - Número de días para agregar (por defecto: 7)
- `--output <path>` - Ruta de salida para dashboard (markdown, por defecto: `docs/kpi/DASHBOARD.md`)
- `--raw` - Incluir datos JSON raw en salida
- `--events-file <path>` - Ruta al archivo events.jsonl (por defecto: `obs/kpi/events.jsonl`)

**Ejemplos:**
```bash
# Ver KPIs de últimos 7 días
skills-cli kpi

# Ver KPIs de últimos 30 días y guardar
skills-cli kpi --days 30 --output docs/kpi/DASHBOARD.md

# Incluir datos raw
skills-cli kpi --days 7 --raw
```

**Métricas Mostradas:**
- **Velocidad**: Tasa de activación, tokens/op, latencia
- **Calidad**: Adherencia, zero errors rate, efectividad de guardrails
- **Top Skills**: Skills más activados
- **Estado Holístico**: Evaluación general del sistema

---

### Dashboard de Sistema

```bash
skills-cli dashboard <subcomando> [opciones]
```

**Descripción:** Interactúa con la API del Dashboard de Skills Fabric.

#### Health Check

```bash
skills-cli dashboard health [opciones]
```

**Opciones:**
- `--host <host>` - Host de API (por defecto: `127.0.0.1`)
- `--port <port>` - Puerto de API (por defecto: `7727`)
- `--json` - Salida en JSON

**Ejemplo:**
```bash
skills-cli dashboard health --json
```

#### Listar Skills

```bash
skills-cli dashboard skills [opciones]
```

**Opciones:**
- `--host <host>` - Host de API
- `--port <port>` - Puerto de API
- `--json` - Salida en JSON

#### Métricas en Tiempo Real

```bash
skills-cli dashboard metrics [opciones]
```

**Opciones:**
- `--host <host>` - Host de API
- `--port <port>` - Puerto de API
- `--format <format>` - Formato de salida (por defecto: `table`)

#### Reporte de Sistema Completo

```bash
skills-cli dashboard system [opciones]
```

**Opciones:**
- `--host <host>` - Host de API
- `--port <port>` - Puerto de API
- `--json` - Salida en JSON

**Ejemplo:**
```bash
skills-cli dashboard system
```

---

## 🚀 Servicios y Daemon

### Gestión del Daemon

```bash
skills-cli daemon <subcomando> [opciones]
```

#### Iniciar Daemon

```bash
skills-cli daemon start [opciones]
```

**Opciones:**
- `-e, --env <environment>` - Ambiente (development|production, por defecto: development)

**Ejemplo:**
```bash
skills-cli daemon start -e production
```

#### Detener Daemon

```bash
skills-cli daemon stop
```

#### Reiniciar Daemon

```bash
skills-cli daemon restart
```

#### Estado del Daemon

```bash
skills-cli daemon status
```

Muestra el estado de PM2 y health check del daemon.

#### Logs del Daemon

```bash
skills-cli daemon logs [opciones]
```

**Opciones:**
- `-n, --lines <number>` - Número de líneas a mostrar (por defecto: 100)
- `-f, --follow` - Seguir salida de logs

**Ejemplo:**
```bash
skills-cli daemon logs -n 200 --follow
```

#### Monitor del Daemon

```bash
skills-cli daemon monit
```

Abre el dashboard de monitoreo de PM2.

#### Iniciar Todos los Servicios

```bash
skills-cli daemon start-all [opciones]
```

**Opciones:**
- `-e, --env <environment>` - Ambiente (development|production)

Inicia todos los servicios (daemon, router, skills-cli).

#### Detener Todos los Servicios

```bash
skills-cli daemon stop-all
```

---

### Gestión PM2

```bash
skills-cli pm2:start [servicios...] [opciones]
```

**Descripción:** Inicia servicios backend con PM2.

**Parámetros:**
- `[servicios...]` - Servicios específicos a iniciar

**Opciones:**
- `-v, --verbose` - Salida detallada
- `--config <file>` - Ruta al archivo de configuración de PM2 ecosystem (por defecto: `scripts/pm2/ecosystem.config.cjs`)
- `--no-save` - No guardar lista de procesos de PM2

**Ejemplos:**
```bash
# Iniciar todos los servicios
skills-cli pm2:start

# Iniciar servicio específico
skills-cli pm2:start sf-daemon

# Modo verbose
skills-cli pm2:start -v
```

---

## 🧠 Sistemas Avanzados

### Sistema de Memoria (Mem)

```bash
skills-cli mem
```

**Descripción:** Dashboard interactivo de gestión del sistema de memoria (MemTech).

**Características:**
- Estado de backends (L0, L1, L2)
- Configuración de memoria
- Diagnósticos y mantenimiento
- Gestión de snapshots

---

### Sistema de Navegación (Nav)

```bash
skills-cli nav
```

**Descripción:** Dashboard interactivo de navegación del proyecto.

**Características:**
- Estado de salud del proyecto
- Navegación de componentes
- Monitoreo de actividad
- Herramientas de proyecto

---

## 🎯 Herramientas de Activación

### Test de Activación

```bash
skills-cli activation [opciones]
```

**Descripción:** Prueba decisión de activación de skill usando ActivationEngine.

**Opciones requeridas:**
- `-s, --skill <name>` - Nombre del skill (como en `configs/skill-rules.json`)
- `-p, --prompt <text>` - Prompt del usuario a evaluar

**Opciones opcionales:**
- `--threshold <num>` - Sobrescribir umbral (0..1)
- `--allow <pattern...>` - Agregar patrones regex a allowList
- `--deny <pattern...>` - Agregar patrones regex a denyList
- `--keywords <kw...>` - Keywords para keywordMatch signal (sobrescribir)
- `--explain` - Imprimir razonamiento y señales

**Ejemplo:**
```bash
skills-cli activation -s security-audit -p "verificar seguridad del código" --explain
```

---

### Prompt Builder

```bash
skills-cli prompt-builder <skill-id> <description> [opciones]
```

**Descripción:** Genera prompt optimizado para activar skills (v2 con mejoras).

**Parámetros:**
- `<skill-id>` - ID del skill a activar (o múltiples separados por coma)
- `<description>` - Descripción de la tarea

**Opciones:**
- `--include-files` - Incluir sugerencias de archivos reales detectados (por defecto: true)
- `--include-content` - Incluir snippets de contenido (por defecto: true)
- `--include-template` - Incluir estructura Template v1.1.0 (8/8 componentes, por defecto: false)
- `--include-tags` - Incluir sistema TAGs (coverage ≥60%, por defecto: false)
- `--include-plan-context` - Incluir contexto de plan activo si está aprobado (por defecto: false)
- `--multiple-skills` - Permitir múltiples skills separados por coma en skill-id (por defecto: false)
- `--show-score` - Mostrar score esperado y desglose detallado (por defecto: false)
- `--v2` - Usar versión v2 mejorada (por defecto: true)

**Ejemplos:**
```bash
# Generar prompt básico
skills-cli prompt-builder security-audit "verificar seguridad" --show-score

# Generar prompt completo con todas las características
skills-cli prompt-builder security-audit "verificar seguridad" \
  --include-template \
  --include-tags \
  --include-plan-context \
  --show-score

# Múltiples skills
skills-cli prompt-builder "security-audit,code-review" "verificar código" \
  --multiple-skills \
  --include-template \
  --include-tags
```

**Características del Prompt Builder v2:**
- **Template v1.1.0**: Estructura de 8 componentes (C1-C8)
- **Sistema TAGs**: Generación automática de tags contextuales [K], [C], [U], [EVIDENCIA], [PROPUESTA]
- **Integración CLOOP**: Prompts estructurados siguiendo Clarify → Layout → Operate → Observe → Reflect
- **Planning Mode**: Inyección de contexto de plan con gates y workflow de aprobación
- **Detección de Archivos**: Identificación automática de archivos relevantes
- **Análisis de Contenido**: Extracción de snippets relevantes del código

---

### Slash Commands

```bash
skills-cli / <command> [opciones]
```

**Descripción:** Ejecuta slash commands para contexto persistente y automatización.

**Parámetros:**
- `<command>` - Slash command a ejecutar (ej: dev-docs, build-and-fix)

**Opciones:**
- `-f, --format <format>` - Formato de salida (json, markdown, text, por defecto: text)
- `-v, --verbose` - Salida detallada
- `--dry-run` - Mostrar qué se ejecutaría sin correr

**Ejemplo:**
```bash
skills-cli / dev-docs --verbose
```

---

### Configurar Hooks

```bash
skills-cli hooks [opciones]
```

**Descripción:** Configura hooks para auto-activación de skills y verificaciones de build.

**Opciones:**
- `--hook-name <name>` - Configurar hook específico solamente
- `-v, --verbose` - Salida detallada

**Hooks Disponibles:**
- **userPromptSubmit**: Hook pre-invoke que activa skills basándose en el prompt del usuario
- **stop**: Hook post-response que ejecuta checks de guardrails, prettier, typecheck, y emite KPIs

**Ejemplo:**
```bash
# Configurar todos los hooks
skills-cli hooks

# Configurar hook específico
skills-cli hooks --hook-name userPromptSubmit
```

---

## 📚 Ejemplos de Uso Común

### Flujo Completo de Desarrollo

```bash
# 1. Verificar qué skills se activarían
skills-cli skills check "implementar autenticación OAuth" --v2

# 2. Crear plan
skills-cli plan create "Implementar autenticación OAuth" --v2

# 3. Aprobar plan
skills-cli plan approve plan-abc123

# 4. Guardar workflow (genera dev-docs)
skills-cli plan save plan-abc123

# 5. Iniciar fase CLOOP
skills-cli cloop start F1

# 6. Trabajar en la implementación...

# 7. Verificar builds
skills-cli build --all

# 8. Verificar guardrails
skills-cli guardrail "deleteMany()" --file src/users.ts

# 9. Completar fase CLOOP
skills-cli cloop complete F1

# 10. Ver KPIs
skills-cli kpi --days 7
```

### Workflow de Skills

```bash
# 1. Indexar skills
skills-cli skills index ./skills

# 2. Validar skills
skills-cli skills lint ./skills --strict

# 3. Empaquetar skill
skills-cli skills pack ./skills/guidelines/security-skill -o .registry

# 4. Verificar paquete
skills-cli skills verify .registry/security-skill-1.0.0.tgz

# 5. Instalar skill
skills-cli skills install file://.registry/security-skill-1.0.0.tgz
```

### Monitoreo y Salud

```bash
# Ver salud del sistema
skills-cli dashboard system

# Ver estado del daemon
skills-cli daemon status

# Ver logs en tiempo real
skills-cli daemon logs --follow

# Ver KPIs de último mes
skills-cli kpi --days 30 --output docs/kpi/DASHBOARD.md
```

---

## 🔍 Opciones Globales

Todos los comandos soportan las siguientes opciones globales:

- `-v, --verbose` - Salida detallada
- `--help` - Mostrar ayuda del comando
- `--version` - Mostrar versión del CLI

---

## 🚨 Solución de Problemas

### Error: "Registry not found"

```bash
skills-cli skills index ./skills
```

### Error: "Plan not found"

Verifica que el plan existe en `dev/plans/`:
```bash
ls dev/plans/
```

### Error: "Daemon not responding"

Verifica estado del daemon:
```bash
skills-cli daemon status
curl http://127.0.0.1:7727/health
```

Si no está corriendo:
```bash
skills-cli daemon start
```

### Error: "PM2 not installed"

```bash
npm install -g pm2
```

---

## 📖 Recursos Adicionales

- **Quick Start Guide**: `docs/cli/QUICK-START.md`
- **CLOOP Methodology**: Ver documentación en `docs/cloop/`
- **Architecture**: Ver `CLAUDE.md` para detalles de arquitectura
- **Quality Gates**: Ver `ci/GATES.yml` para configuración de gates

---

## 📝 Notas Importantes

1. **Variables de Entorno**: Asegúrate de configurar `.env` según `.env.example`
2. **Permisos**: Algunos comandos requieren permisos de escritura en directorios específicos
3. **Dependencias**: Algunos comandos requieren que los servicios (daemon, router) estén corriendo
4. **Formatos**: Los comandos de salida JSON pueden ser procesados con `jq` para mejor legibilidad

---

## 🎓 Mejores Prácticas

1. **Siempre valida antes de commit**: `skills-cli build --all && skills-cli guardrail`
2. **Usa `--verbose` para debugging**: Añade contexto útil para troubleshooting
3. **Monitora KPIs regularmente**: Ejecuta `skills-cli kpi` semanalmente
4. **Mantén skills indexados**: Ejecuta `skills-cli skills index` después de cambios
5. **Usa Prompt Builder v2**: Aprovecha `--v2` para prompts más efectivos

---

**¡Listo para comenzar!** 🚀

Para ayuda adicional, ejecuta cualquier comando con `--help`:
```bash
skills-cli <comando> --help
```

