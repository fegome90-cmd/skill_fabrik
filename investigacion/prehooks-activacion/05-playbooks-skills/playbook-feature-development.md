# Playbook: Feature Development Sprint

## 🎯 **Objetivo**
Activación eficiente de skills para desarrollo de nuevas funcionalidades, garantizando calidad del código y adherencia a mejores prácticas desde el primer día.

---

## 📋 **Información del Sprint**

| Campo | Valor |
|-------|-------|
| **Tipo** | Feature Development |
| **Duración** | 2-3 semanas |
| **Equipo** | 3-5 desarrolladores |
| **Prioridad** | Alta |
| **Skills Principales** | 5-7 |
| **Configuración** | suggest + block |

---

## 📚 **Referencias de DevDocs**

Este playbook está complementado por los siguientes DevDocs:

- 📄 **[DevDocs Overview](../dev-docs/README.md)** - Índice completo de documentación
- 📄 **[Checklist de Activación](../dev-docs/checklist-activacion.md)** - Verificación paso a paso
- 📄 **[Matriz de Activación](../dev-docs/matriz-activacion.md)** - Decisión por tipo de sprint
- 📄 **[Script activate-sprint.js](../dev-docs/script-activate-sprint.md)** - Automatización
- 📄 **[Contexto del Sistema](../dev-docs/context.md)** - Arquitectura técnica

---

## ⚡ **Activación Rápida**

### **One-Liner**
```bash
node 08-scripts/activate-sprint.js --type feature --sprint S15 --priority backend,api,database
```

**🔗 DevDocs Relacionados:**
- Script automation: [DevDocs: activate-sprint.js](../dev-docs/script-activate-sprint.md)
- Matriz de decisión: [DevDocs: matriz-activacion.md](../dev-docs/matriz-activacion.md)

### **Verificación**
```bash
skills-cli skills check "validar activación" --v2
pm2 status
curl http://127.0.0.1:3000/health
```

**📖 Ver también:** [Checklist Pre-Sprint 1.2-1.8](../dev-docs/checklist-activacion.md#pre-sprint-setup)

---

## 🎮 **Workflow Completo**

### **Fase 1: Setup Inicial (Día 1)**

**🔗 DevDocs Relacionados:**
- [Contexto del Sprint](../dev-docs/context.md#tipos-de-sprint)
- [Matriz de Activación](../dev-docs/matriz-activacion.md#feature-development)
- [Checklist Pre-Sprint 1.1](../dev-docs/checklist-activacion.md#11-identificar-tipo-de-sprint)

#### **Paso 1.1: Identificar Tipo de Sprint**
```bash
# Verificar en Jira/Project
SPRINT_TYPE=$(get-sprint-type)
echo "Tipo de sprint: $SPRINT_TYPE"

# Debe retornar: "feature"
```

**✅ Validación:**
- [ ] Tipo confirmado (feature, bugfix, refactor, security, performance, testing, migration)
- [ ] Duración definida (1-4 semanas)
- [ ] Tamaño del equipo (1-5 desarrolladores)
- [ ] Prioridades identificadas (backend, frontend, database, etc.)

**📖 Ver más:** [Tipos de Sprint Soportados](../dev-docs/matriz-activacion.md#tipos-de-sprint-soportados)

#### **Paso 1.2: Cargar Perfil**

**🔗 DevDocs Relacionados:**
- [Script activate-sprint.js](../dev-docs/script-activate-sprint.md#uso-del-script)
- [Matriz de Perfiles](../dev-docs/matriz-activacion.md#configuracion-por-archivo)

```bash
# Cargar configuración automática
node 08-scripts/activate-sprint.js --type feature --sprint S15 --priority backend,api,database

# Salida esperada:
# ✅ Perfil "feature" cargado
# ✅ 6 skills configuradas
# ✅ Thresholds ajustados
# ✅ Configuración especial aplicada
```

**⚙️ Configuración Aplicada:**
```json
{
  "profile": "feature",
  "skills": ["backend-dev-guidelines", "api-design-and-testing", "database-management"],
  "optional": ["performance-optimization", "test-automation"],
  "thresholds": { "suggest": 0.6, "require": 0.4, "block": 0.2 }
}
```

**📖 Ver más:** [Perfiles de Sprint](../dev-docs/script-activate-sprint.md#configuracion-de-perfiles)

#### **Paso 1.3: Activar Skills Base**

**🔗 DevDocs Relacionados:**
- [Skills por Tipo de Sprint](../dev-docs/matriz-activacion.md#feature-development)

```bash
# Skills automáticos (automáticamente activados por el script)
# backend-dev-guidelines (suggest) - 5 guías
# api-design-and-testing (suggest) - 4 guías
# database-management (require) - 3 guías
# database-verification (block) - 2 guías - SIEMPRE ACTIVO
# code-review-checklist (require) - 1 checklist

# Verificar activación
skills-cli skills list --active
```

**✅ Skills Principales:**

| Skill | Enforcement | Threshold | Recursos | Propósito |
|-------|-------------|-----------|----------|-----------|
| backend-dev-guidelines | suggest | 0.6 | 5 guías | Mejores prácticas backend |
| api-design-and-testing | suggest | 0.6 | 4 guías | Diseño de APIs |
| database-management | require | 0.4 | 3 guías | Gestión de datos |
| database-verification | block | 0.2 | 2 guías | **SIEMPRE ACTIVO** |
| code-review-checklist | require | 0.4 | 1 checklist | Review obligatorio |

**📖 Ver más:** [Tabla Detallada de Skills](../dev-docs/matriz-activacion.md#skills-y-justificacion)

#### **Paso 1.4: Verificar Health**

**🔗 DevDocs Relacionados:**
- [Checklist Pre-Sprint 1.2](../dev-docs/checklist-activacion.md#12-verificar-servicios)
- [Troubleshooting de Servicios](../dev-docs/checklist-activacion.md#a1-servicio-caído)

```bash
# Check servicios
pm2 status
# Esperado:
# ✓ sf-daemon: online
# ✓ router-service: online
# ✓ service-discovery: online

# Health endpoints
curl http://127.0.0.1:7727/health && echo " ✓ Daemon OK"
curl http://127.0.0.1:3000/health && echo " ✓ Router OK"
curl http://127.0.0.1:8877/health && echo " ✓ Discovery OK"
```

**🛠️ Troubleshooting:**
```bash
# Si algún servicio está offline
pm2 restart <service-name>

# Ver logs
pm2 logs router-service --lines 100

# Iniciar todos los servicios
pm2 start scripts/pm2/ecosystem.config.cjs --env development
```

**📖 Ver más:** [Health Endpoints](../dev-docs/checklist-activacion.md#urls-importantes)

#### **Paso 1.5: Test de Activación**

**🔗 DevDocs Relacionados:**
- [Checklist Pre-Sprint 1.8](../dev-docs/checklist-activacion.md#18-test-de-activación)

```bash
# Prompt de prueba
skills-cli skills check "crear API REST con autenticación JWT y validación de datos" --v2

# Esperado:
# ✅ backend-dev-guidelines (score: 0.87)
# ✅ api-design-and-testing (score: 0.82)
# ✅ database-management (score: 0.75)
# ✅ database-verification (score: 0.45) - BLOCK
# ⚠️ 4/5 skills activadas
```

**✅ Criterio de Éxito**: ≥ 3 skills relevantes activadas

**🔍 Debugging:**
```bash
# Si < 3 skills activadas
skills-cli skills check "test" --v2 --debug

# Verificar thresholds
skills-cli skills list --active | grep "threshold"

# Verificar keywords
grep "backend-dev-guidelines" configs/skill-rules.json | jq '.promptTriggers.keywords'
```

**📖 Ver más:** [Testing Manual](../dev-docs/checklist-activacion.md#testing-manual)

---

### **Fase 2: Configuración Avanzada (Día 1-2)**

**🔗 DevDocs Relacionados:**
- [Checklist Pre-Sprint 1.4](../dev-docs/checklist-activacion.md#14-configurar-thresholds)
- [Script activate-sprint.js](../dev-docs/script-activate-sprint.md#configurethresholds)

#### **Paso 2.1: Configurar Thresholds Dinámicos**

**Archivo**: `.skills-config/feature-thresholds.json`
```json
{
  "profile": "feature-development",
  "enforcement": {
    "block": 0.2,
    "require": 0.4,
    "warn": 0.5,
    "suggest": 0.6
  },
  "adjustments": {
    "backend-dev-guidelines": 0.55,  // Más sensible
    "api-design-and-testing": 0.55,
    "performance-optimization": 0.45 // Menos sensible
  }
}
```

**Aplicar**:
```bash
node 08-scripts/configure-thresholds.js --config .skills-config/feature-thresholds.json

# Verificar aplicación
skills-cli skills list --active | grep -E "(threshold|score)"
```

**🎯 Thresholds por Enforcement:**

| Enforcement | Threshold | Descripción | Ejemplo |
|-------------|-----------|-------------|---------|
| **BLOCK** | 0.2 | Ultra sensible - crítico | database-verification |
| **REQUIRE** | 0.4 | Muy sensible - obligatorio | code-review-checklist |
| **WARN** | 0.5 | Sensibilidad media | performance-optimization |
| **SUGGEST** | 0.6 | Estándar - sugerencia | backend-dev-guidelines |

**📖 Ver más:** [Threshold Dinámico](../dev-docs/script-activate-sprint.md#configuracion-de-perfiles)

#### **Paso 2.2: Activar Skills Opcionales**

**🔗 DevDocs Relacionados:**
- [Checklist Pre-Sprint 1.5](../dev-docs/checklist-activacion.md#15-activar-skills-opcionales)
- [Skills Opcionales por Sprint](../dev-docs/matriz-activacion.md#feature-development)

```bash
# Performance (WARN) - Optimización temprana
skills-cli skills activate performance-optimization --enforcement warn

# Test Automation (SUGGEST) - Automatización de pruebas
skills-cli skills activate test-automation --enforcement suggest

# Code Quality (REQUIRE) - Revisión de calidad
skills-cli skills activate code-quality-guidelines --enforcement require
```

**✅ Skills Opcionales:**

| Skill | Enforcement | Threshold | Cuándo Activar |
|-------|-------------|-----------|----------------|
| performance-optimization | warn | 0.5 | Sprints > 2 semanas |
| test-automation | suggest | 0.6 | Sprints con testing intenso |
| code-quality-guidelines | require | 0.4 | Proyectos críticos |

**💡 Tip:** Activar skills opcionales basado en las necesidades específicas del sprint.

**📖 Ver más:** [Skills Opcionales](../dev-docs/matriz-activacion.md#skill-opcionales)

#### **Paso 2.3: Configurar Notificaciones**

**🔗 DevDocs Relacionados:**
- [Checklist Pre-Sprint 1.6](../dev-docs/checklist-activacion.md#16-configurar-notificaciones)
- [Monitoreo y Alertas](../dev-docs/checklist-activacion.md#monitoreo-y-alertas)

```bash
# Crear webhook para Slack/Discord
cat > .skills-config/notify.json << 'EOF'
{
  "webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK",
  "events": [
    "skill_activated",
    "guardrail_blocked",
    "threshold_crossed"
  ]
}
EOF

# Aplicar configuración
node 08-scripts/configure-notifications.js --config .skills-config/notify.json

# Test de notificación
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🎯 Test de activación de skills"}' \
  $WEBHOOK_URL
```

**📢 Eventos Configurados:**

| Evento | Descripción | Ejemplo |
|--------|-------------|---------|
| skill_activated | Nueva skill activada | "backend-dev-guidelines activada" |
| guardrail_blocked | Operación peligrosa bloqueada | "deleteMany() sin WHERE bloqueado" |
| threshold_crossed | Threshold superado | "Score: 0.85 > threshold: 0.6" |

**📖 Ver más:** [Configuración de Alertas](../dev-docs/checklist-activacion.md#alertas-criticas)

#### **Paso 2.4: Iniciar Dashboard**

**🔗 DevDocs Relacionados:**
- [Checklist Pre-Sprint 1.7](../dev-docs/checklist-activacion.md#17-iniciar-dashboard)
- [Métricas y Monitoreo](../dev-docs/playbook-feature-development.md#fase-6-métricas-y-monitoreo)

```bash
# Dashboard en background
pm2 start "skills-cli dashboard" --name skills-dashboard
pm2 save

# Verificar
curl http://localhost:8888/health
```

**📊 Dashboard URL**: http://localhost:8888

**Métricas Disponibles:**
- Activaciones en tiempo real
- Skills más usados
- False positives/negatives
- Latencia promedio
- Adherence rate

**✅ Criterio de Éxito**: Dashboard respondiendo + notificaciones configuradas

**🛠️ Troubleshooting Dashboard:**
```bash
# Si no responde
pm2 restart skills-dashboard

# Ver logs
pm2 logs skills-dashboard --lines 50

# Reconstruir si es necesario
pnpm --filter @skills-fabrik/skills-cli build
pm2 restart skills-dashboard --update-env
```

**📖 Ver más:** [Monitoreo en Tiempo Real](../dev-docs/checklist-activacion.md#rutina-diaria)

---

### **Fase 3: Desarrollo Iterativo (Días 3-14)**

**🔗 DevDocs Relacionados:**
- [Rutina Diaria](../dev-docs/checklist-activacion.md#durante-sprint---rutina-diaria)
- [Monitoreo y Alertas](../dev-docs/checklist-activacion.md#monitoreo-y-alertas)

#### **Rutina Diaria**

##### **Morning Check (9:00 AM)**

**🔗 DevDocs Relacionados:**
- [Checklist Daily D1-D4](../dev-docs/checklist-activacion.md#morning-check-900-am)

```bash
# 1. Verificar health de servicios
pm2 status && pm2 monit

# 2. Check activaciones de ayer
node 08-scripts/monitor-activations.js --yesterday

# 3. Review alertas (si las hay)
node 08-scripts/check-alerts.js

# 4. Reporte de métricas
pnpm kpi:show --days 1
```

**✅ Métricas de Éxito:**
- Activaciones relevantes: ≥ 85%
- False positives: ≤ 5%
- False negatives: ≤ 5%
- Latencia promedio: < 200ms

**📊 Reporte Matutino:**
```
SPRINT S15 - MORNING REPORT
============================
Services: ✓ All online
Yesterday's Activations: 45
Relevant: 41 (91%)
False Positives: 2 (4.4%)
Latency: 145ms
Top Skills: backend-dev-guidelines (15), api-design (12)
```

**🛠️ Troubleshooting Matutino:**
```bash
# Si servicios offline
pm2 restart router-service sf-daemon

# Si many false positives
node 08-scripts/optimize-rules.js --fix-false-positives

# Si latencia alta
skills-cli cache clean && pm2 restart router-service
```

**📖 Ver más:** [Daily Check](../dev-docs/checklist-activacion.md#rutina-diaria)

##### **Durante el Desarrollo**

**🔗 DevDocs Relacionados:**
- [Checklist Dev1-Dev4](../dev-docs/checklist-activacion.md#durante-desarrollo)

```bash
# Activar skill manualmente si es necesario
skills-cli skills activate security-testing-guide --priority high

# Ver qué se activó para una tarea
skills-cli skills check "tarea actual" --v2 --debug

# Monitorear en tiempo real
node 08-scripts/monitor-activations.js --realtime
```

**💡 Tips de Activación:**

| Escenario | Comando | DevDocs |
|-----------|---------|---------|
| Skill no se activa | `skills-cli skills check "prompt" --v2 --debug` | [Debugging](../dev-docs/checklist-activacion.md#troubleshooting) |
| Activar manualmente | `skills-cli skills activate <skill> --priority high` | [Manual Activation](../dev-docs/checklist-activacion.md#dev1-activación-manual) |
| Ver activaciones | `skills-cli skills check "tarea" --v2` | [Verification](../dev-docs/checklist-activacion.md#dev2-verificar-activación) |
| Monitoreo en vivo | `node 08-scripts/monitor-activations.js --realtime` | [Monitoring](../dev-docs/checklist-activacion.md#dev3-monitoreo-en-tiempo-real) |

**🔍 Casos Comunes:**

**1. Skill esperado no se activa:**
```bash
# Debug
skills-cli skills debug <skill-name> --prompt "tu prompt aquí"

# Verificar keywords
grep "<skill-name>" configs/skill-rules.json | jq '.promptTriggers'
```

**2. Falsos positivos frecuentes:**
```bash
# Analizar
node 08-scripts/analyze-false-positives.js --days 3

# Ajustar
skills-cli skills update <skill> --remove-keywords generic,simple
```

**📖 Ver más:** [Development Workflow](../dev-docs/checklist-activacion.md#durante-desarrollo)

##### **Code Review Flow**

**🔗 DevDocs Relacionados:**
- [Checklist Dev4](../dev-docs/checklist-activacion.md#dev4-code-review-flow)
- [Quality Gates G1-G3](../dev-docs/checklist-activacion.md#quality-gates-g1-g8)

```bash
# Antes de crear PR
skills-cli skills check "validar código antes de PR" --active-file $(pwd)/src/api/user.ts

# Ejemplo de salida:
# ✅ database-verification (BLOCK)
#   → Detecta: deleteMany() sin WHERE
#   → Acción: REQUERIDA revisión antes de merge
# ✅ code-review-checklist (REQUIRE)
#   → Activado: checklist obligatorio
#   → Archivo: src/api/user.ts
```

**🔐 Quality Gates (G1-G3):**

| Gate | Comando | Expected | Acción |
|------|---------|----------|--------|
| G1 - Build | `pnpm -w build` | ✓ PASS | Corregir errores |
| G2 - Activation | `pnpm test:activation-cases` | ✓ PASS | Revisar matching |
| G3 - Guardrails | `skills-cli guardrail check` | 0 violations | Corregir código |

**✅ Pre-PR Checklist:**
- [ ] G1-G3 PASS
- [ ] No guardrails bloqueando
- [ ] Skills relevantes activadas
- [ ] Tests pasando

**📖 Ver más:** [Code Review](../dev-docs/checklist-activacion.md#code-review-flow)

##### **End-of-Day (6:00 PM)**

**🔗 DevDocs Relacionados:**
- [Checklist EOD1-EOD3](../dev-docs/checklist-activacion.md#end-of-day-600-pm)

```bash
# Generar reporte diario
node 08-scripts/generate-daily-report.js --date $(date +%Y-%m-%d)

# Guardar métricas
node 08-scripts/save-metrics.js --sprint S15 --date today

# Backup de configuración
node 08-scripts/backup-config.js --backup-name "feature-day-$(date +%Y%m%d)"
```

**📊 Reporte EOD:**
```
DAILY REPORT - Sprint S15 - Day 5
================================
Activations: 23
Relevant: 21 (91%)
False Positives: 1 (4.3%)
Skills Used: backend-dev-guidelines (8), api-design (6)
Latency: 152ms avg

Files:
- reports/daily-2024-11-07.md ✓
- .skills-logs/metrics-sprint-S15-2024-11-07.json ✓
- .skills-config/backups/feature-day-20241107.json ✓
```

**📁 Archivos Generados:**
- `reports/daily-<DATE>.md` - Reporte del día
- `.skills-logs/metrics-sprint-<ID>-<DATE>.json` - Métricas
- `.skills-config/backups/sprint-<ID>-day-<N>.json` - Backup

**📖 Ver más:** [End of Day](../dev-docs/checklist-activacion.md#end-of-day-600-pm)

---

### **Fase 4: Casos de Uso Específicos**

#### **Caso 1: Crear Nuevo Endpoint**

**Prompt Típico**: `"Crear endpoint POST /api/users para crear usuarios con validación"`

**Activación Esperada**:
```
✅ backend-dev-guidelines (score: 0.89)
   → Keywords: endpoint, create
   → Path: controllers/ ✓

✅ api-design-and-testing (score: 0.91)
   → Keywords: endpoint, POST, API
   → Intent: "crear" + "endpoint" ✓

✅ database-management (score: 0.76)
   → Keywords: users, crear
   → Content: database operations ✓

🚫 database-verification (score: 0.52)
   → **BLOQUEADO**: Operación de BD detectada
   → Acción: Revisar código antes de merge

💡 No activadas:
○ performance-optimization (score: 0.31)
○ test-automation (score: 0.28)

📊 Total: 3/5 activadas
⚠️  1 BLOCK activo
```

**🔗 DevDocs Relacionados:**
- [Casos de Uso Feature](../dev-docs/matriz-activacion.md#caso-1-crear-nuevo-endpoint)
- [Guardrails BD](../dev-docs/checklist-activacion.md#a2-guardrail-no-bloquea)

**Acciones Requeridas**:
1. ✅ Revisar código del endpoint
2. ✅ Validar operaciones de BD
3. ✅ Ejecutar tests unitarios
4. ✅ Crear tests de integración
5. ✅ Documentar API (OpenAPI)

**📋 Checklist de Endpoint:**
```bash
# 1. Validar estructura
skills-cli guardrail check --file src/controllers/userController.ts

# 2. Verificar tests
find . -name "*.test.ts" | grep -i user | wc -l
# Esperado: ≥ 2 tests

# 3. Documentar API
cat > docs/api/users.yml << 'EOF'
post:
  /api/users:
    summary: Crear usuario
    requestBody:
      type: object
      required: [name, email]
    responses:
      201:
        description: Usuario creado
EOF
```

**🛠️ Troubleshooting Endpoint:**
```bash
# Si database-verification bloquea
skills-cli guardrail explain --code "await prisma.user.create()"

# Si no se activa api-design
skills-cli skills check "crear endpoint" --v2 --debug
# Verificar keywords: api, rest, endpoint
```

**📖 Ver más:** [Endpoint Creation](../dev-docs/matriz-activacion.md#ejemplo-1-api-rest-completa)

#### **Caso 2: Agregar Autenticación**

**Prompt Típico**: `"Implementar autenticación JWT en el API con middleware de validación"`

**Activación Esperada**:
```
✅ security-testing-guide (score: 0.84)
   → Keywords: auth, JWT, security
   → Intent: "implementar" + "auth" ✓

✅ backend-dev-guidelines (score: 0.78)
   → Keywords: auth, middleware
   → Path: middleware/ ✓

✅ secrets-and-config (score: 0.71)
   → **BLOCK**: JWT secret detectado
   → Acción: Verificar que no esté hardcodeado

✅ api-design-and-testing (score: 0.69)
   → Keywords: API, auth
   → Intent: "implementar" + "API" ✓

💡 No activadas:
○ performance-optimization (score: 0.42)
○ test-automation (score: 0.38)

📊 Total: 4/5 activadas
⚠️  1 BLOCK activo (security)
```

**🔗 DevDocs Relacionados:**
- [Security Audit](../dev-docs/matriz-activacion.md#security-audit)
- [Secrets Configuration](../dev-docs/checklist-activacion.md#a2-guardrail-no-bloquea)

**Acciones Requeridas**:
1. ✅ Verificar JWT secret en variables de entorno
2. ✅ Validar implementación de middleware
3. ✅ Crear tests de seguridad
4. ✅ Documentar flow de autenticación
5. ✅ Review de seguridad

**🔐 Security Checklist:**
```bash
# 1. Verificar secrets no hardcodeados
grep -r "JWT_SECRET\|API_KEY" src/ || echo "✓ No secrets hardcodeados"

# 2. Validar middleware
skills-cli skills check "validar middleware auth" --v2

# 3. Test de seguridad
npm test -- --testPathPattern=auth.test.ts
# Esperado: 5+ tests de seguridad

# 4. Verificar HTTPS
curl -I https://api.ejemplo.com/auth/login
# Esperado: Strict-Transport-Security header
```

**🛡️ Validaciones de Seguridad:**
- [ ] JWT secret en env var (no hardcodeado)
- [ ] Middleware de validación funcionando
- [ ] Tokens con expiración
- [ ] Rate limiting en auth endpoints
- [ ] CORS configurado correctamente

**📖 Ver más:** [Security Sprint](../dev-docs/matriz-activacion.md#ejemplo-3-auditoría-de-seguridad)

#### **Caso 3: Optimización de Performance**

**Prompt Típico**: `"Optimizar query de usuarios que está tardando 2 segundos"`

**Activación Esperada**:
```
✅ performance-optimization (score: 0.92)
   → Keywords: optimizar, query, performance
   → Intent: "optimizar" + "query" ✓

✅ backend-architecture-patterns (score: 0.68)
   → Keywords: query, database
   → Path: repositories/ ✓

✅ database-management (score: 0.65)
   → Keywords: query, usuarios
   → Content: Prisma/TypeORM operations ✓

💡 No activadas:
○ api-design-and-testing (score: 0.31)
○ code-review-checklist (score: 0.29)

📊 Total: 3/5 activadas
```

**🔗 DevDocs Relacionados:**
- [Performance Sprint](../dev-docs/matriz-activacion.md#performance-optimization)
- [Optimización de Queries](../dev-docs/checklist-activacion.md#r1-latencia-alta)

**Acciones Requeridas**:
1. ✅ Analizar query actual
2. ✅ Identificar bottleneck
3. ✅ Aplicar optimización (index, cache, etc.)
4. ✅ Benchmark antes/después
5. ✅ Documentar mejora

**📊 Performance Checklist:**
```bash
# 1. Analizar query actual
EXPLAIN ANALYZE SELECT * FROM users WHERE active = true;
# Tiempo: 2000ms ❌

# 2. Verificar índices
\d+ users
# Esperado: Índice en (active, created_at)

# 3. Aplicar optimización
CREATE INDEX idx_users_active_created ON users(active, created_at);

# 4. Benchmark después
EXPLAIN ANALYZE SELECT * FROM users WHERE active = true;
# Tiempo: 45ms ✓ (97% mejora)

# 5. Documentar
cat > docs/performance/query-optimization.md << 'EOF'
# Query Optimization - User List

## Before
- Time: 2000ms
- Rows: 10000
- Issue: Full table scan

## After
- Time: 45ms
- Rows: 10000
- Solution: Added index on (active, created_at)

## Impact
- 97% latency reduction
- 99.8% faster
EOF
```

**📈 Métricas de Performance:**
- Query time: 2000ms → 45ms (↓ 97%)
- Index size: 2.3MB
- CPU usage: 80% → 15%
- Cache hit rate: 60% → 95%

**🔍 Monitoring:**
```bash
# Activar monitoring
skills-cli skills activate monitoring-setup --enforcement require

# Verificar en dashboard
open http://localhost:8888/metrics
# Buscar: query_duration, cache_hit_rate
```

**📖 Ver más:** [Performance Sprint](../dev-docs/matriz-activacion.md#ejemplo-2-debug-complejo)

---

### **Fase 5: Code Review y Quality Gates**

**🔗 DevDocs Relacionados:**
- [Quality Gates G1-G8](../dev-docs/checklist-activacion.md#quality-gates-g1-g8)
- [Code Review Checklist](../dev-docs/checklist-activacion.md#dev4-code-review-flow)

#### **Pre-merge Checklist**

**🔗 DevDocs Relacionados:**
- [Checklist Pre-Merge](../dev-docs/checklist-activacion.md#pre-merge-checklist)

```bash
# 1. Verificar que no hay guardrails bloqueando
skills-cli guardrail check --branch feature/user-api
# Esperado: "0 violations" o lista de issues

# 2. Validar activación de skills
skills-cli skills check "validar PR" --active-files $(find . -name "*.ts" | head -5)
# Esperado: skills activadas correctamente

# 3. Run quality gates
pnpm gates
# Esperado: G1-G3 PASS (críticos)
```

**✅ Pre-Merge Validations:**
- [ ] G1-G3 PASS (críticos)
- [ ] No guardrails bloqueando
- [ ] Skills relevantes activadas
- [ ] Tests pasando
- [ ] Documentación actualizada

**🔍 Debugging Pre-Merge:**
```bash
# Si G1 falla (Build)
pnpm -w build 2>&1 | tee build.log
# Revisar: errores de compilación

# Si G2 falla (Activation)
pnpm test:activation-cases --verbose
# Revisar: casos de activación

# Si G3 falla (Guardrails)
skills-cli guardrail explain --branch feature/user-api
# Revisar: operaciones peligrosas
```

**📖 Ver más:** [Quality Gates](../dev-docs/checklist-activacion.md#gates-críticos-p0---bloquean-merge)

#### **Quality Gates (G1-G8)**

**🔗 DevDocs Relacionados:**
- [Gates Detallados](../dev-docs/checklist-activacion.md#gates-críticos-p0---bloquean-merge)

| Gate | Comando | Expected Result | Priority | Acción si Falla |
|------|---------|-----------------|----------|-----------------|
| **G1 - Build** | `pnpm -w build` | ✓ PASS | P0 | Corregir errores de compilación |
| **G2 - Activation** | `pnpm test:activation-cases` | ✓ PASS | P0 | Revisar matching rules |
| **G3 - Guardrails** | `skills-cli guardrail check` | 0 violations | P0 | Corregir código peligroso |
| **G4 - Skills Lint** | `skills-cli skills lint ./skills --strict` | ✓ PASS | P1 | Ajustar formato de skills |
| **G5 - Notifications** | Verificar webhook Slack | ✓ Active | P1 | Configurar notificaciones |
| **G6 - Content Health** | Validar SKILL.md | ✓ PASS | P1 | Revisar longitud y contenido |
| **G7 - Metrics** | `pnpm kpi:show` | ✓ Active | P2 | Verificar métricas |
| **G8 - Documentation** | README actualizado | ✓ P2 | Actualizar docs |

**⚠️ Priority Levels:**
- **P0 (Crítico)**: Bloquea merge - **DEBE PASS**
- **P1 (Alto)**: Monitoreado - Recomendado PASS
- **P2 (Medio)**: Best practice - Opcional PASS

**✅ Criterio de Éxito**: Todos los G1-G3 PASS (críticos)

**📊 Status Dashboard:**
```bash
# Ver status de todos los gates
skills-cli dashboard gates --sprint S15

# Output esperado:
# G1-Build:           ✓ PASS
# G2-Activation:       ✓ PASS
# G3-Guardrails:       ✓ PASS
# G4-Skills-Lint:      ✓ PASS
# G5-Notifications:    ⚠️ WARN (webhook slow)
# G6-Content-Health:   ✓ PASS
# G7-Metrics:          ✓ PASS
# G8-Documentation:    ✓ PASS

# Overall: 7/8 PASS (87.5%)
```

**📖 Ver más:** [Quality Gates Detallados](../dev-docs/checklist-activacion.md#quality-gates-g1-g8)

---

### **Fase 6: Métricas y Monitoreo**

**🔗 DevDocs Relacionados:**
- [Métricas Diarias](../dev-docs/checklist-activacion.md#d4-métricas)
- [KPIs y Monitoreo](../dev-docs/playbook-feature-development.md#fase-6-métricas-y-monitoreo)

#### **KPIs Diarios**

**🔗 DevDocs Relacionados:**
- [Métricas Diarias](../dev-docs/checklist-activacion.md#métricas-diarias-recopilar-cada-día)

```bash
# Script de métricas diarias
#!/bin/bash
DATE=$(date +%Y-%m-%d)

echo "📊 MÉTRICAS DÍA: $DATE"
echo "================================"

# 1. Activaciones totales
ACTIVATIONS=$(node -p "
  const data = require('./obs/kpi/events.jsonl');
  const today = data.filter(e => e.timestamp.startsWith('$DATE'));
  const feature = today.filter(e => e.sprintType === 'feature');
  feature.length;
")

echo "• Activaciones hoy: $ACTIVATIONS"

# 2. Skills más activados
echo "• Top skills:"
node -p "
  const data = require('./obs/kpi/events.jsonl');
  const today = data.filter(e => e.timestamp.startsWith('$DATE'));
  const counts = {};
  today.forEach(e => counts[e.skill] = (counts[e.skill] || 0) + 1);
  Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,3)
    .forEach(([skill, count]) => console.log('  - $skill: $count'));
"

# 3. False positives
echo "• False positives:"
node -p "
  const data = require('./obs/kpi/events.jsonl');
  const today = data.filter(e => e.timestamp.startsWith('$DATE'));
  const falsePos = today.filter(e => e.falsePositive === true);
  const rate = today.length > 0 ? (falsePos.length / today.length * 100).toFixed(1) : 0;
  rate;
"

echo "• Target: < 5%"
```

**📊 Dashboard de Métricas:**

| Métrica | Actual | Target | Status |
|---------|--------|---------|--------|
| Activaciones relevantes | 91% | ≥ 90% | ✅ |
| False positives | 4.3% | ≤ 5% | ✅ |
| False negatives | 5.2% | ≤ 5% | ⚠️ |
| Latencia promedio | 145ms | < 200ms | ✅ |
| Adherence rate | 93.5% | ≥ 90% | ✅ |

**🔍 Análisis de Tendencias:**
```bash
# Tendencia de activaciones (últimos 7 días)
node -p "
  const data = require('./obs/kpi/events.jsonl');
  const last7days = data.filter(e => {
    const date = new Date(e.timestamp);
    return (Date.now() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });
  const daily = {};
  last7days.forEach(e => {
    const day = e.timestamp.split('T')[0];
    daily[day] = (daily[day] || 0) + 1;
  });
  console.log('Tendencia (7 días):');
  Object.entries(daily).forEach(([day, count]) =>
    console.log(\`  \${day}: \${count} activaciones\`)
  );
"

# Output esperado:
# Tendencia (7 días):
# 2024-11-01: 42 activaciones
# 2024-11-02: 45 activaciones
# 2024-11-03: 51 activaciones
# 2024-11-04: 48 activaciones
# 2024-11-05: 47 activaciones
# 2024-11-06: 43 activaciones
# 2024-11-07: 46 activaciones
```

**📖 Ver más:** [KPIs Diarios](../dev-docs/checklist-activacion.md#métricas-diarias)

#### **Reporte Semanal**

**🔗 DevDocs Relacionados:**
- [Reporte Semanal](../dev-docs/checklist-activacion.md#métricas-semanales)

```bash
# Generar reporte completo
node 08-scripts/generate-weekly-report.js --sprint S15

# Salida esperada:
# ✅ REPORTE SEMANAL - Sprint S15
# ======================================
# 📅 Período: 2024-11-02 a 2024-11-08
# 👥 Equipo: 4 desarrolladores
#
# 📊 MÉTRICAS PRINCIPALES
# • Total activaciones: 487
# • Activaciones relevantes: 441 (90.5%)
```

**📄 Estructura de Reporte:**

```
WEEKLY REPORT - Sprint S15
==========================

SUMMARY
--------
Period: 2024-11-02 to 2024-11-08
Team: 4 developers
Duration: 5 days

METRICS
-------
Total Activations: 487
Relevant: 441 (90.5%)
False Positives: 19 (3.9%)
False Negatives: 27 (5.5%)
Setup Time Avg: 3.2 min
Dev Satisfaction: 4.2/5

TOP SKILLS
----------
1. backend-dev-guidelines: 145 (29.8%)
2. api-design-and-testing: 132 (27.1%)
3. database-management: 98 (20.1%)

TRENDS
-------
↑ Performance optimization: +15%
↓ False positives: -2.1% vs last week
→ Setup time: stable (3.2 min avg)

RECOMMENDATIONS
---------------
• Consider activating performance-optimization by default
• Review database-verification keywords
• Maintain current configuration

ISSUES
-------
• 2 services offline (Tue 14:30-15:45)
• 1 false positive in frontend-dev-guidelines
• Cache hit rate: 87% (target: >85%)

FILES GENERATED
---------------
• reports/weekly-2024-11-08.md
• .skills-logs/sprint-S15-2024-11-08.json
• charts/activation-trends.png
```

**📈 Métricas de Sprint:**

| Sprint | Activaciones | Relevantes | FP Rate | FN Rate | Setup | Sat |
|--------|--------------|------------|---------|---------|--------|-------|
| S13 | 412 | 89% | 6.1% | 7.2% | 4.5min | 3.8/5 |
| S14 | 456 | 90% | 5.2% | 6.1% | 3.8min | 4.0/5 |
| S15 | 487 | 90.5% | 3.9% | 5.5% | 3.2min | 4.2/5 |

**📖 Ver más:** [Reporte Semanal](../dev-docs/checklist-activacion.md#métricas-semanales-reporte-cada-viernes)
# • False positives: 19 (3.9%)
# • False negatives: 27 (5.5%)
# • Setup time promedio: 3.2 min
#
# 🎯 SKILLS MÁS USADOS
# 1. backend-dev-guidelines: 145 (29.8%)
# 2. api-design-and-testing: 132 (27.1%)
# 3. database-management: 98 (20.1%)
#
# 📈 TENDENCIAS
# ↑ Uso de performance-optimization (+15%)
# ↓ False positives (-2.1% vs semana anterior)
# → Setup time estable (3.2 min avg)
#
# 💡 RECOMENDACIONES
# • Considerar activar performance-optimization por defecto
# • Revisar keywords de database-verification
# • Mantener configuración actual
```

---

### **Fase 7: Cierre de Sprint (Día 15)**

#### **Retrospective Activities**

```bash
# 1. Recopilar feedback del equipo
echo "📝 FEEDBACK DEL EQUIPO"
echo "1. ¿Las activaciones fueron relevantes? (1-5)"
echo "2. ¿Se configuró fácil? (1-5)"
echo "3. ¿Salvó tiempo? (1-5)"
echo "4. ¿Qué mejorarías?"

# 2. Generar métricas finales
node 08-scripts/generate-sprint-report.js --sprint S15

# 3. Analizar mejoras
node 08-scripts/analyze-improvements.js --sprint S15

# 4. Backup final
node 08-scripts/backup-sprint.js --sprint S15 --final
```

#### **Optimization Actions**

```bash
# Ajustar thresholds basado en datos
node 08-scripts/optimize-thresholds.js --sprint S15 --output .skills-config/optimized-feature.json

# Actualizar reglas si es necesario
if [ $(node -p "data.falsePositives > 5") = "true" ]; then
  echo "🔧 Actualizando reglas por falsos positivos..."
  node 08-scripts/update-rules.js --fix-false-positives
fi

# Preparar para próximo sprint
node 08-scripts/prepare-next-sprint.js --sprint S16 --base-on S15
```

---

## 📚 **Skills Reference**

### **Skills Principales**

#### **1. backend-dev-guidelines**
- **Enforcement**: suggest (0.6)
- **Activación**: Keywords "backend", "api", "controller"
- **Recursos**: 5 guías + ejemplos
- **Uso**: Diseño y arquitectura backend

#### **2. api-design-and-testing**
- **Enforcement**: suggest (0.6)
- **Activación**: Keywords "API", "REST", "endpoint"
- **Recursos**: 4 guías + OpenAPI templates
- **Uso**: Diseño de APIs RESTful

#### **3. database-management**
- **Enforcement**: require (0.4)
- **Activación**: Keywords "database", "query", "CRUD"
- **Recursos**: 3 guías + migration patterns
- **Uso**: Gestión de datos y migraciones

#### **4. database-verification**
- **Enforcement**: block (0.2) - ALWAYS ON
- **Activación**: Content "deleteMany()", "updateMany()"
- **Recursos**: 2 checklists + safety rules
- **Uso**: Prevenir operaciones peligrosas

#### **5. code-review-checklist**
- **Enforcement**: require (0.4)
- **Activación**: Siempre en code reviews
- **Recursos**: 1 checklist completo
- **Uso**: Estandarizar code reviews

### **Skills Opcionales**

#### **6. performance-optimization**
- **Enforcement**: warn (0.5)
- **Activación**: Keywords "optimizar", "performance"
- **Recursos**: 3 guías + profiling tools
- **Uso**: Optimización temprana

#### **7. test-automation**
- **Enforcement**: suggest (0.6)
- **Activación**: Keywords "test", "testing", "automate"
- **Recursos**: 4 frameworks + setup guides
- **Uso**: Automatización de pruebas

---

## ⚠️ **Troubleshooting**

### **Problema: No se activan skills**

**Diagnóstico**:
```bash
# 1. Verificar servicios
pm2 status | grep -E "(router|daemon).*online"

# 2. Test de conectividad
curl http://127.0.0.1:3000/health

# 3. Verificar reglas cargadas
curl http://127.0.0.1:3000/rules | jq '.skills | length'

# 4. Test manual
skills-cli skills check "test prompt" --v2 --debug
```

**Soluciones**:
```bash
# Reiniciar servicios
pm2 restart router-service
pm2 restart sf-daemon

# Recargar reglas
skills-cli skills reload

# Verificar logs
pm2 logs router-service --lines 100
```

### **Problema: Falsos positivos frecuentes**

**Diagnóstico**:
```bash
# Analizar últimas activaciones
node 08-scripts/analyze-false-positives.js --days 7
```

**Soluciones**:
```bash
# Ajustar keywords
skills-cli skills update backend-dev-guidelines --remove-keywords generic,code

# Aumentar threshold
skills-cli skills configure backend-dev-guidelines --threshold 0.7

# Añadir negative patterns
skills-cli skills configure backend-dev-guidelines --exclude-patterns simple,básico
```

### **Problema: Guardrail bloquea incorrectamente**

**Diagnóstico**:
```bash
# Ver qué detectó
skills-cli guardrail explain --code "await prisma.user.findMany()"
```

**Soluciones**:
```bash
# Desactivar temporalmente (NO recomendado en producción)
skills-cli skills deactivate database-verification

# O mejor: ajustar patrón
skills-cli skills update database-verification --content-pattern "deleteMany\\([^)]*\\)(?!.*where).*production"
```

---

## ✅ **Checklist de Sprint**

### **Pre-Sprint (Día 1)**
- [ ] Identificar tipo: feature ✓
- [ ] Cargar perfil ✓
- [ ] Activar skills principales ✓
- [ ] Configurar thresholds ✓
- [ ] Verificar health ✓
- [ ] Test de activación ✓
- [ ] Configurar notificaciones ✓
- [ ] Iniciar dashboard ✓

### **Durante Sprint (Diario)**
- [ ] Morning check (health + métricas)
- [ ] Monitorear activaciones
- [ ] Resolver falsos positivos
- [ ] Code review con skills
- [ ] End-of-day metrics

### **Post-Sprint (Día 15)**
- [ ] Recopilar feedback equipo
- [ ] Generar reporte final
- [ ] Analizar mejoras
- [ ] Backup configuración
- [ ] Optimizar para próximo sprint
- [ ] Documentar lecciones aprendidas

---

## 🎯 **Success Criteria**

### **Técnicos**
- ✅ Activaciones relevantes: ≥ 90%
- ✅ False positives: ≤ 5%
- ✅ Setup time: ≤ 5 min
- ✅ Health de servicios: 100%
- ✅ Quality gates: G1-G3 PASS

### **Negocio**
- ✅ Developer satisfaction: ≥ 4/5
- ✅ Time saved: ≥ 15% vs manual
- ✅ Code quality: +15% vs baseline
- ✅ Bug rate: -20% vs baseline
- ✅ Team adoption: ≥ 80%

---

**Versión**: 1.0
**Creado**: 2024-11-02
**Owner**: Engineering Team
**Última Actualización**: 2024-11-02
