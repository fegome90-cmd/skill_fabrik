# 📁 Investigación: Prehooks y Activación de Skills

## 🎯 **Objetivo**

Esta carpeta contiene la investigación completa sobre el sistema de prehooks y activación de skills, proporcionando estrategias, herramientas y documentación para maximizar la productividad del equipo durante los sprints.

---

## 📋 **Índice de Contenidos**

### **1. Documentación Técnica** (`01-analisis-tecnico/`)
Análisis profundo del sistema de prehooks y matching multi-señal.

- **`01-sistema-prehooks.md`** - Análisis técnico completo del sistema
  - Arquitectura de 3 fases (Slash Commands → Planning Mode → Skill Activation)
  - Configuración de hooks
  - Performance y optimización
  - Troubleshooting

- **`02-matching-multi-senal.md`** - Algoritmo de matching detallado
  - 4 señales: Keywords (20%), Intent (30%), Path (30%), Content (20%)
  - Thresholds dinámicos por enforcement
  - Ejemplos prácticos de cada señal
  - Optimización de performance

---

### **2. Guía Práctica de Reglas** (`02-guia-reglas/`)
Manual para crear, modificar y optimizar reglas de skills.

- **`01-estructura-reglas.md`** - Estructura completa de reglas
  - Anatomía de una regla (type, enforcement, priority, triggers)
  - Enforcement levels: BLOCK, REQUIRE, WARN, SUGGEST
  - Mejores prácticas para keywords, intent patterns, path patterns
  - Testing y optimización

---

### **3. Prompt Builder v2** (`../../dev/prompt-builder/v2-complete/`)
Documentación completa de Prompt Builder v2.2.0 con optimización Phase 1 y 2.

- **Véase**: `/dev/prompt-builder/v2-complete/` para implementación completa
- **Features**: Optimización 99.9%, documentación completa, API reference
- **Status**: ✅ Production Ready

---

### **4. Workflows de Sprint** (`04-workflow-sprints/`)
*(Pendiente de desarrollo)*

---

### **5. Playbooks de Skills** (`05-playbooks-skills/`)
Guías paso a paso para diferentes tipos de sprint.

- **`playbook-feature-development.md`** - Playbook completo para Feature Development
  - Activación automática de 6-8 skills principales
  - Workflow de 6 fases (Setup → Configuración → Desarrollo → Code Review → Métricas → Cierre)
  - Casos de uso específicos (endpoints, auth, optimización)
  - Troubleshooting detallado

---

### **6. Matriz de Activación** (`06-matriz-activacion/`)
Matriz de decisión para activar skills según el tipo de tarea.

- **`matriz-completa.md`** - Matriz principal de activación
  - Tabla por tipo de sprint (Feature, Bugfix, Refactor, Security, Performance, Testing, Migration)
  - Skills recomendados por tipo
  - Thresholds específicos
  - Configuración especial
  - Casos de uso y ejemplos

---

### **7. Checklist** (`07-checklist/`)
Listas de verificación para activación eficiente.

- **`sprint-activation-checklist.md`** - Checklist completo
  - Pre-Sprint Setup (9 checks)
  - Rutina diaria (morning check, desarrollo, end-of-day)
  - Monitoreo y alertas
  - Quality Gates (G1-G8)
  - Troubleshooting
  - Métricas y reportes

---

### **8. Scripts de Automatización** (`08-scripts/`)
Scripts para automatizar la activación y monitoreo.

- **`activate-sprint.js`** - Script principal de activación
  - Activación automática por tipo de sprint
  - Configuración de thresholds
  - Verificación de health
  - Inicio de monitoreo
  - Soporte para 7 tipos de sprint

---

### **9. Métricas** (`09-metricas/`)
*(Pendiente de desarrollo)*

---

### **10. Optimización** (`10-optimizacion/`)
*(Pendiente de desarrollo)*

---

### **DevDocs** (`dev-docs/`)
Documentación estructurada siguiendo metodología CLOOP.

- **`task.md`** - Definición de tarea y objetivos
  - Problema actual
  - Objetivos específicos (configuración automática, monitoreo, mejora continua)
  - Metodología en 5 fases
  - Entregables y métricas de éxito
  - Riesgos y mitigaciones

- **`context.md`** - Contexto completo del sistema
  - Arquitectura multi-servicio
  - Sistema de prehooks
  - Matching multi-señal
  - Base de conocimiento (skills)
  - Performance y métricas
  - Learning path

- **`plan.md`** - Plan de optimización detallado
  - Estrategia 3-pillar (Automatización, Visibilidad, Mejora continua)
  - Roadmap de 3 semanas
  - Componentes técnicos (scripts, dashboard, matriz)
  - Perfiles de sprint (Feature, Bugfix, Security)
  - Workflows automatizados
  - Plan de testing
  - Métricas de éxito

---

## 🚀 **Inicio Rápido**

### **1. Activación Básica**
```bash
# Activar sprint de feature development
node investigacion/prehooks-activacion/08-scripts/activate-sprint.js \
  --type feature \
  --sprint S15 \
  --priority backend,api,database

# Verificar activación
skills-cli skills check "crear API con autenticación" --v2
```

### **2. Verificar Health**
```bash
pm2 status
curl http://127.0.0.1:3000/health  # Router
curl http://127.0.0.1:7727/health  # Daemon
curl http://127.0.0.1:8877/health  # Discovery
```

### **3. Monitorear**
```bash
# Dashboard
open http://localhost:8888

# Métricas
pnpm kpi:show
```

---

## 📊 **Métricas de Éxito**

### **Targets**
- **Activaciones relevantes**: ≥ 90%
- **False positives**: ≤ 5%
- **False negatives**: ≤ 5%
- **Setup time**: ≤ 5 minutos
- **Dev satisfaction**: ≥ 4/5

### **Monitoreo**
```bash
# Verificar métricas diariamente
node 08-scripts/monitor-activations.js --yesterday

# Generar reporte semanal
node 08-scripts/generate-weekly-report.js --sprint S15
```

---

## 🛠️ **Herramientas**

### **Scripts Principales**

| Script | Uso | Ejemplo |
|--------|-----|---------|
| `activate-sprint.js` | Activar skills por tipo de sprint | `--type feature --sprint S15` |
| `monitor-activations.js` | Monitorear activaciones en tiempo real | `--realtime --sprint S15` |
| `configure-thresholds.js` | Configurar thresholds dinámicos | `--profile feature` |

### **CLI Commands**

| Comando | Descripción |
|---------|-------------|
| `skills-cli skills check "prompt" --v2` | Verificar activación de skill |
| `skills-cli skills activate <skill>` | Activar skill manualmente |
| `skills-cli guardrail check` | Verificar guardrails |
| `skills-cli dashboard health` | Health check del sistema |
| `pnpm kpi:show` | Ver métricas |

---

## 🎮 **Tipos de Sprint Soportados**

### **1. Feature Development**
- **Duración**: 2-3 semanas
- **Skills**: backend-dev, api-design, database-manage
- **Enforcement**: suggest + block

### **2. Bug Fixing**
- **Duración**: 1-2 semanas
- **Skills**: root-cause, systematic-debug
- **Enforcement**: warn

### **3. Refactoring**
- **Duración**: 2-4 semanas
- **Skills**: architecture-patterns, error-patterns
- **Enforcement**: suggest

### **4. Security Audit**
- **Duración**: 1-2 semanas
- **Skills**: security-testing, secrets-config
- **Enforcement**: block + require

### **5. Performance Optimization**
- **Duración**: 2-3 semanas
- **Skills**: performance-optimization, caching
- **Enforcement**: warn

### **6. Testing Sprint**
- **Duración**: 2-3 semanas
- **Skills**: visual-regression, webapp-testing
- **Enforcement**: require

### **7. Migration**
- **Duración**: 3-4 semanas
- **Skills**: database-migration, data-safety
- **Enforcement**: block

---

## 📚 **Documentación Relacionada**

- **README Principal**: `/README.md`
- **CLAUDE.md**: `/CLAUDE.md`
- **Skill Rules**: `/configs/skill-rules.json`
- **Architecture**: `/docs/architecture/activation-core.md`
- **PM2 Config**: `/scripts/pm2/ecosystem.config.cjs`

---

## 🔍 **Casos de Uso Principales**

### **Caso 1: Nueva Feature**
```bash
# 1. Activar perfil feature
node 08-scripts/activate-sprint.js --type feature --sprint S15

# 2. Durante desarrollo
skills-cli skills check "crear endpoint POST /api/users" --v2

# 3. Code review
skills-cli guardrail check --branch feature/users-api
```

### **Caso 2: Bug Fix**
```bash
# 1. Activar perfil bugfix
node 08-scripts/activate-sprint.js --type bugfix --sprint S15

# 2. Debug
skills-cli skills check "error 500 en login stack trace null pointer" --v2

# 3. Root cause analysis
# Skill root-cause-tracing se activa automáticamente
```

### **Caso 3: Security Audit**
```bash
# 1. Activar perfil security
node 08-scripts/activate-sprint.js --type security --sprint S15 --strict-mode ENFORCED

# 2. Verificar secrets
skills-cli skills check "auditoría credenciales y auth" --v2

# 3. Guardrails en modo estricto
# skills secrets-and-config + database-verification en BLOCK
```

---

## ⚠️ **Troubleshooting**

### **Problema: No se activan skills**
```bash
# Verificar servicios
pm2 status

# Reiniciar
pm2 restart router-service

# Verificar logs
pm2 logs router-service --lines 100

# Test manual
skills-cli skills check "test" --v2 --debug
```

### **Problema: Falsos positivos**
```bash
# Analizar
node 08-scripts/analyze-false-positives.js --days 7

# Ajustar keywords
skills-cli skills update backend-dev-guidelines --remove-keywords generic

# Aumentar threshold
skills-cli skills configure backend-dev-guidelines --threshold 0.7
```

### **Problema: Latencia alta**
```bash
# Verificar métricas
skills-cli dashboard health --metrics

# Limpiar cache
skills-cli cache clean

# Reiniciar servicios
pm2 restart all
```

---

## 📈 **Roadmap de Mejoras**

### **Fase 1** (Completada ✅)
- ✅ Análisis técnico profundo
- ✅ Documentación completa
- ✅ Scripts de automatización básicos
- ✅ Playbook feature development
- ✅ Checklist de activación

### **Fase 2** (Próxima)
- [ ] Prompt Builder v2 documentación
- [ ] Workflows adicionales (bugfix, security, etc.)
- [ ] Dashboard de métricas interactivo
- [ ] Optimización automática basada en ML

### **Fase 3** (Futura)
- [ ] Integración con Jira/Project Management
- [ ] Notificaciones avanzadas
- [ ] Análisis predictivo
- [ ] Multi-team support

---

## 👥 **Equipo y Contacto**

- **Owner**: Engineering Team
- **Tech Lead**: [Asignar]
- **Documentación**: Esta carpeta
- **Issues**: [GitHub Issues]

---

## 📜 **Changelog**

### **v1.0** (2024-11-02)
- ✅ Análisis técnico completo
- ✅ Sistema de matching multi-señal documentado
- ✅ Matriz de activación por tipo de sprint
- ✅ Playbook feature development
- ✅ Scripts de automatización
- ✅ Checklist completo
- ✅ DevDocs (task, context, plan)

---

## 🎓 **Recursos de Aprendizaje**

### **Para Nuevos Desarrolladores**
1. Leer `dev-docs/context.md` (contexto completo)
2. Seguir `07-checklist/sprint-activation-checklist.md` (primera activación)
3. Revisar `05-playbooks-skills/playbook-feature-development.md`
4. Practicar con `08-scripts/activate-sprint.js`

### **Para Senior Developers**
1. Analizar `01-analisis-tecnico/01-sistema-prehooks.md`
2. Estudiar `02-guia-reglas/01-estructura-reglas.md`
3. Optimizar reglas en `06-matriz-activacion/matriz-completa.md`
4. Crear nuevos playbooks

### **Para DevOps**
1. Configurar PM2 services
2. Monitorear `08-scripts/monitor-activations.js`
3. Mantener `scripts/pm2/ecosystem.config.cjs`
4. Optimizar performance

---

## ✅ **Quick Start Checklist**

- [ ] Leer `dev-docs/task.md` (objetivos)
- [ ] Leer `dev-docs/context.md` (contexto)
- [ ] Verificar servicios: `pm2 status`
- [ ] Ejecutar: `node 08-scripts/activate-sprint.js --type feature --sprint S15`
- [ ] Test: `skills-cli skills check "crear API" --v2`
- [ ] Ver dashboard: http://localhost:8888
- [ ] Leer `07-checklist/sprint-activation-checklist.md`
- [ ] Seguir checklist durante sprint

---

**Versión**: 1.0
**Creado**: 2024-11-02
**Última Actualización**: 2024-11-02
**Status**: ✅ Activo

---

**¡Bienvenido a la investigación de Prehooks y Activación de Skills!** 🚀

Esta carpeta contiene todo lo necesario para activar skills de manera eficiente y maximizar la productividad del equipo durante los sprints.
