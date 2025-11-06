# DevDocs: Checklist de Activación de Skills

---

## 📋 **Información del Documento**

| Campo | Valor |
|-------|-------|
| **Archivo** | `07-checklist/sprint-activation-checklist.md` |
| **Versión** | 2.0 |
| **Creado** | 2024-11-02 |
| **Última Actualización** | 2025-11-02 |
| **Owner** | Engineering Team |
| **Propósito** | Lista de verificación completa para activar skills de manera eficiente |
| **Cambios v2.0** | Optimizaciones CLOOP: threshold 0.45, fuzzy matching, contextual boost |

---

## 🎯 **Objetivos del Checklist**

### **Objetivo Principal**
Proporcionar una lista de verificación completa, verificable y accionable para:
- ✅ Activar skills de manera eficiente en cualquier sprint
- ✅ Garantizar calidad y productividad del equipo
- ✅ Reducir errores y tiempo de setup
- ✅ Estandarizar el proceso para todo el equipo

### **Objetivos Específicos**
1. **Pre-Sprint**: Setup completo en < 30 minutos
2. **Durante Sprint**: Rutina diaria estructurada
3. **Monitoreo**: Detección temprana de problemas
4. **Quality Gates**: Validación automática G1-G8
5. **Troubleshooting**: Solución rápida de issues

---

## 🚀 **Optimizaciones CLOOP v2.0** ✨

### **Nuevas Características Implementadas (2025-11-02)**

#### **1. Threshold Optimizado**
- **Antes**: 0.60
- **Ahora**: **0.45** (reducción del 25%)
- **Impacto**: Mejora activación de skills relevantes

#### **2. Capacidades Aumentadas**
- **Max Skills**: 5 → **7** (+40%)
- **Más skills activadas por prompt**

#### **3. Fuzzy Matching** 🆕
- **Descripción**: Coincidencia aproximada de keywords
- **Threshold**: 0.7 (70% similitud)
- **Beneficio**: Detecta variaciones y typos
- **Activado**: Sí

#### **4. Contextual Boost** 🆕
- **Descripción**: Boost dinámico basado en contexto
- **Factores activos**:
  - File Context: +15%
  - Recent Activation: +10%
  - Keyword Density: +5%
  - Intent Match: +12%
- **Beneficio**: Mayor precisión contextual

#### **5. History Reuse** 🆕
- **Descripción**: Aprende de activaciones históricas
- **Tamaño**: 50 entradas
- **Beneficio**: Optimiza activaciones repetitivas

#### **6. Enhanced Hooks**
- **Pre-invoke**: Detección mejorada con fuzzy matching
- **Stop Hook**: + Linting, + KPI threshold 0.8

### **Métricas Objetivo Actualizadas**

| Métrica | v1.0 | v2.0 | Mejora |
|---------|------|------|--------|
| Activaciones relevantes | 91% | 95% | +4% |
| Falsos positivos | 4.3% | 3% | -30% |
| Falsos negativos | 5.2% | 3% | -42% |
| Threshold | 0.60 | 0.45 | -25% |
| Max Skills | 5 | 7 | +40% |

---

## 📋 **Pre-Sprint Setup** ⚙️

### **Preparación (Día 1 - Mañana)**

#### **1.1. Identificar Tipo de Sprint** ✓
- [ ] Tipo confirmado (feature, bugfix, refactor, security, performance, testing, migration)
- [ ] Duración definida (1-4 semanas)
- [ ] Tamaño del equipo (1-5 desarrolladores)
- [ ] Prioridades identificadas (backend, frontend, database, etc.)

**Comando de verificación**:
```bash
get-sprint-type
# Debe retornar: feature | bugfix | refactor | security | performance | testing | migration
```

#### **1.2. Verificar Servicios** ✓
- [ ] `pm2 status` - Todos los servicios online
- [ ] `curl http://127.0.0.1:7727/health` - Daemon OK
- [ ] `curl http://127.0.0.1:3000/health` - Router OK
- [ ] `curl http://127.0.0.1:8877/health` - Discovery OK

**Comandos**:
```bash
pm2 status
# Esperado:
# ✓ sf-daemon: online
# ✓ router-service: online
# ✓ service-discovery: online

curl http://127.0.0.1:7727/health && echo " ✓ Daemon OK"
curl http://127.0.0.1:3000/health && echo " ✓ Router OK"
curl http://127.0.0.1:8877/health && echo " ✓ Discovery OK"
```

**❌ Si falla**: `pm2 start scripts/pm2/ecosystem.config.cjs --env development`

#### **1.3. Cargar Perfil de Sprint** ✓
- [ ] Ejecutar: `node 08-scripts/activate-sprint.js --type <TIPO> --sprint <ID>`
- [ ] Verificar salida: "Perfil cargado: X skills principales"
- [ ] Confirmar skills principales activadas

**Comando**:
```bash
node 08-scripts/activate-sprint.js --type feature --sprint S15 --priority backend,api,database

# Esperado:
# ✅ Perfil cargado: 6 skills principales
# ✅ 3 skills opcionales activadas
```

**❌ Si falla**: Verificar logs con `pm2 logs router-service --lines 100`

#### **1.4. Configurar Thresholds** ✓
- [ ] Thresholds aplicados por enforcement level
- [ ] Archivo de configuración guardado: `.skills-config/thresholds-*.json`
- [ ] Thresholds específicos por skill (si aplica)

**Comando**:
```bash
ls -la .skills-config/thresholds-*.json
# Debe mostrar archivo de configuración

# Aplicar thresholds (si es necesario)
node 08-scripts/configure-thresholds.js --config .skills-config/thresholds-feature.json
```

#### **1.5. Activar Skills Opcionales** ✓
- [ ] Performance optimization (si sprint largo)
- [ ] Test automation (si sprint de testing)
- [ ] Security testing (si sprint de seguridad)

**Comandos**:
```bash
skills-cli skills activate performance-optimization --enforcement warn
skills-cli skills activate test-automation --enforcement suggest
```

#### **1.6. Configurar Notificaciones** ✓
- [ ] Webhook configurado (Slack/Discord)
- [ ] Eventos seleccionados:
  - [ ] skill_activated
  - [ ] guardrail_blocked
  - [ ] threshold_crossed
- [ ] Test de notificación enviado

**Configuración**:
```bash
# Archivo: .skills-config/notify.json
{
  "webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK",
  "events": ["skill_activated", "guardrail_blocked", "threshold_crossed"]
}

# Aplicar
node 08-scripts/configure-notifications.js --config .skills-config/notify.json
```

#### **1.7. Iniciar Dashboard** ✓
- [ ] `pm2 start "skills-cli dashboard" --name skills-dashboard`
- [ ] `curl http://localhost:8888/health` - Dashboard OK
- [ ] URL de dashboard documentada

**Comandos**:
```bash
pm2 start "skills-cli dashboard" --name skills-dashboard
pm2 save

curl http://localhost:8888/health
# Esperado: {"status": "ok"}
```

#### **1.8. Test de Activación** ✓
- [ ] Ejecutar: `skills-cli skills check "crear API con auth" --v2`
- [ ] Verificar: ≥ 3 skills relevantes activadas (ahora más fácil con threshold 0.45)
- [ ] Verificar: Guardrails funcionando (BLOCK)
- [ ] No errores en logs

**Comando**:
```bash
skills-cli skills check "crear API REST con autenticación JWT" --v2

# Esperado v2.0 (con threshold 0.45):
# ✅ backend-dev-guidelines (score: 0.80) - MEJORADO
# ✅ api-design-and-testing (score: 0.82)
# ✅ database-management (score: 0.75)
# ✅ security-testing-guide (score: 0.70) - NUEVO
# 🚫 database-verification (score: 0.45) - BLOCK
# ⚠️ 5/6 skills activadas (más que v1.0)
```

**Nuevas verificaciones v2.0**:
```bash
# Verificar fuzzy matching
skills-cli skills check "creat endpoint" --v2  # typo detectado
# Debe activar: backend-dev-guidelines, api-design-and-testing

# Verificar contextual boost
skills-cli skills check "optimizar rendimiento" --v2
# Debe activar: performance-optimization (+boost)
```

**❌ Si falla**: < 3 skills → revisar thresholds y keywords

#### **1.9. Documentar Configuración** ✓
- [ ] Crear archivo: `.skills-config/sprint-<ID>.json`
- [ ] Registrar skills activadas
- [ ] Registrar thresholds configurados
- [ ] Compartir con el equipo

**Comando**:
```bash
cat > .skills-config/sprint-S15.json << 'EOF'
{
  "sprintId": "S15",
  "type": "feature",
  "skills": ["backend-dev-guidelines", "api-design-and-testing", "..."],
  "thresholds": { "suggest": 0.6, "block": 0.2 },
  "date": "2024-11-02"
}
EOF
```

**✅ Criterio de Éxito Pre-Sprint**: Todos los checks 1.1-1.9 completados

---

## 🔄 **Durante Sprint - Rutina Diaria** 📅

### **Morning Check (9:00 AM)**

#### **D1. Health Check** ✓
- [ ] `pm2 status` - Todos los servicios online
- [ ] `pm2 monit` - Sin alertas críticas
- [ ] Logs revisados (últimas 24h)

**Comandos**:
```bash
pm2 status
# Esperado: Todos online

pm2 monit
# Verificar: Sin alertas rojas

pm2 logs router-service --lines 50 --nostream
# Buscar: ERROR o WARN
```

**❌ Si falla**: Servicios offline → `pm2 restart <service-name>`

#### **D2. Activaciones de Ayer** ✓
- [ ] Ejecutar: `node 08-scripts/monitor-activations.js --yesterday`
- [ ] Revisar métricas:
  - [ ] Activaciones relevantes: ≥ 85%
  - [ ] False positives: ≤ 5%
  - [ ] False negatives: ≤ 5%

**Comando**:
```bash
node 08-scripts/monitor-activations.js --yesterday

# Esperado:
# Activaciones: 45
# Relevantes: 41 (91%)
# False positives: 2 (4.4%)
# False negatives: 3 (6.7%)
```

**❌ Si falla**: FP > 5% → ajustar keywords, FN > 5% → revisar thresholds

#### **D3. Alertas** ✓
- [ ] Ejecutar: `node 08-scripts/check-alerts.js`
- [ ] Revisar notificaciones en Slack/Discord
- [ ] Resolver alertas críticas

**Comando**:
```bash
node 08-scripts/check-alerts.js

# Esperado: "No alerts" o lista de alertas con prioridad
```

**❌ Si hay alertas críticas**:
- Service down → `pm2 restart <service>`
- Guardrail not blocking → `skills-cli skills update <SKILL>`
- High latency → verificar cache y reiniciar servicios

#### **D4. Métricas** ✓
- [ ] `pnpm kpi:show --days 1`
- [ ] Número de activaciones (target: 20-50/día)
- [ ] Skills más usados
- [ ] Latencia promedio (target: < 200ms)

**Comando**:
```bash
pnpm kpi:show --days 1

# Esperado:
# Total activations: 42
# Top skills: backend-dev-guidelines (15), api-design (12)
# Avg latency: 145ms
```

**✅ Criterio de Éxito Diario**: Checks D1-D4 sin issues críticos

### **Durante Desarrollo**

#### **Dev1. Activación Manual** (Si es necesario) ✓
- [ ] `skills-cli skills activate <SKILL> --priority high`
- [ ] Verificar activación exitosa
- [ ] Documentar razón

**Comando**:
```bash
skills-cli skills activate security-testing-guide --priority high

# Verificar
skills-cli skills list --active | grep security-testing
# Debe mostrar: ✓ security-testing-guide
```

#### **Dev2. Verificar Activación** (Para tareas complejas) ✓
- [ ] `skills-cli skills check "<prompt>" --v2 --debug`
- [ ] Revisar score y activación esperada
- [ ] Ajustar si necesario

**Comando**:
```bash
skills-cli skills check "implementar autenticación JWT con refresh tokens" --v2 --debug

# Verificar scores y activaciones
```

#### **Dev3. Monitoreo en Tiempo Real** (Para debugging) ✓
- [ ] `node 08-scripts/monitor-activations.js --realtime`
- [ ] Ver activaciones en vivo
- [ ] Detectar anomalías

**Comando**:
```bash
node 08-scripts/monitor-activations.js --realtime
# Ctrl+C para salir
```

#### **Dev4. Code Review Flow** ✓
- [ ] Pre-PR: `skills-cli skills check "validar PR" --active-files $(find . -name "*.ts" | head -5)`
- [ ] Verificar guardrails no bloquean
- [ ] Verificar skills relevantes activadas
- [ ] Post-PR: Review con checklist activado

**Comando**:
```bash
# Pre-PR
skills-cli skills check "validar PR" --active-files $(find . -name "*.ts" | head -5)

# Guardrails check
skills-cli guardrail check --branch feature/user-api
```

**✅ Criterio de Éxito Desarrollo**: Activaciones relevantes y guardrails funcionando

### **End of Day (6:00 PM)**

#### **EOD1. Generar Reporte Diario** ✓
- [ ] `node 08-scripts/generate-daily-report.js --date $(date +%Y-%m-%d)`
- [ ] Archivo generado: `reports/daily-<DATE>.md`
- [ ] Métricas incluidas

**Comando**:
```bash
node 08-scripts/generate-daily-report.js --date 2024-11-02

# Verificar
ls -la reports/daily-2024-11-02.md
```

#### **EOD2. Guardar Métricas** ✓
- [ ] `node 08-scripts/save-metrics.js --sprint <ID> --date today`
- [ ] Archivo JSON creado
- [ ] Backup automático

**Comando**:
```bash
node 08-scripts/save-metrics.js --sprint S15 --date today

# Verificar
ls -la .skills-logs/metrics-sprint-S15-2024-11-02.json
```

#### **EOD3. Backup Configuración** ✓
- [ ] `node 08-scripts/backup-config.js --backup-name "sprint-<ID>-day-<N>"`
- [ ] Archivo .json de backup
- [ ] Registrado en log

**Comando**:
```bash
node 08-scripts/backup-config.js --backup-name "sprint-S15-day-1"

# Verificar
ls -la .skills-config/backups/sprint-S15-day-1.json
```

**✅ Criterio de Éxito EOD**: Reportes y backups generados

---

## 📊 **Monitoreo y Alertas** 🚨

### **Alertas Críticas (Resolver Inmediatamente)**

#### **A1. Servicio Caído** 🚫
- [ ] Router offline
- [ ] Daemon offline
- **Action**: `pm2 restart <service-name>`

**Diagnóstico**:
```bash
pm2 status | grep -E "(router|daemon).*stopped"

# Verificar logs
pm2 logs <service-name> --lines 100 --nostream
```

**Solución**:
```bash
pm2 restart router-service
pm2 restart sf-daemon

# Verificar recovery
curl http://127.0.0.1:3000/health
```

#### **A2. Guardrail No Bloquea** ⚠️
- [ ] Operación peligrosa no detectada
- **Action**: `skills-cli skills update <SKILL> --fix-detection`

**Diagnóstico**:
```bash
# Test manual
skills-cli guardrail explain --code "await prisma.user.deleteMany();"

# Verificar patrones
grep -A 5 "deleteMany" configs/skill-rules.json
```

**Solución**:
```bash
skills-cli skills update database-verification --add-pattern "deleteMany\\([^)]*\\)(?!.*where)"

# Re-test
skills-cli guardrail check --code "await prisma.user.deleteMany();"
# Debe mostrar: BLOCK
```

#### **A3. False Positives Altos** 📊
- [ ] > 10% en últimas 24h
- **Action**: `node 08-scripts/optimize-rules.js --fix-false-positives`

**Diagnóstico**:
```bash
node 08-scripts/analyze-false-positives.js --days 1

# Esperado: < 5%
# Si > 10%: revisar keywords demasiado genéricos
```

**Solución**:
```bash
# Identificar skills problemáticas
node 08-scripts/analyze-false-positives.js --days 7 --detailed

# Ajustar keywords
skills-cli skills update backend-dev-guidelines --remove-keywords generic,simple

# Aumentar threshold
skills-cli skills configure backend-dev-guidelines --threshold 0.7
```

### **Alertas de Rendimiento**

#### **R1. Latencia Alta** ⏱️
- [ ] > 500ms promedio
- **Action**: Verificar cache, reiniciar servicios

**Diagnóstico**:
```bash
skills-cli dashboard health --metrics | jq '.latency'

# Verificar cache hit rate
curl http://127.0.0.1:3000/health | jq '.cache.hitRate'
```

**Solución**:
```bash
# Limpiar cache
skills-cli cache clean

# Reiniciar servicios
pm2 restart router-service
pm2 restart sf-daemon

# Verificar recursos
top -p $(pgrep -f "router|daemon")
```

#### **R2. Activaciones Bajas** 📉
- [ ] < 10 activaciones en 24h
- **Action**: Verificar prompts, ajustar thresholds

**Diagnóstico**:
```bash
node 08-scripts/monitor-activations.js --yesterday | grep "Total activations"

# Target: 20-50 por día
```

**Solución**:
```bash
# Verificar prompts del equipo
# Ajustar thresholds si necesario
skills-cli skills configure backend-dev-guidelines --threshold 0.5

# Re-test
skills-cli skills check "crear API" --v2
```

### **Alertas de Calidad**

#### **Q1. Skills No Activados** ❌
- [ ] Skill esperado no se activa
- **Action**: `skills-cli skills debug <SKILL>`

**Diagnóstico**:
```bash
skills-cli skills debug database-management --prompt "crear tabla usuarios"
```

**Solución**:
```bash
# Añadir keywords si faltan
skills-cli skills update database-management --add-keywords table,schema

# Verificar enforcement
skills-cli skills configure database-management --enforcement require
```

#### **Q2. Content Patterns No Detectan** 🔍
- [ ] Patrón específico no coincide
- **Action**: `skills-cli skills update <SKILL> --add-pattern`

**Diagnóstico**:
```bash
skills-cli skills test-pattern database-verification --code "deleteMany()"
```

**Solución**:
```bash
# Añadir pattern
skills-cli skills update database-verification --content-pattern "deleteMany\\([^)]*\\)"

# Verificar
skills-cli skills test-pattern database-verification --code "deleteMany()"
# Debe mostrar: MATCH
```

---

## 🔍 **Testing y Validación** 🧪

### **Testing Manual**

#### **T1. Keyword Matching** ✓
- [ ] Test: `skills-cli skills check "crear API REST" --v2`
- [ ] Esperado: backend-dev-guidelines + api-design activados
- [ ] Resultado: ✓/✗

**Comando**:
```bash
skills-cli skills check "crear API REST con endpoints CRUD" --v2 | grep -E "(backend-dev-guidelines|api-design-and-testing)"
# Debe mostrar: ✅ para ambos
```

#### **T2. Intent Patterns** ✓
- [ ] Test: `skills-cli skills check "refactorizar controladores" --v2`
- [ ] Esperado: architecture-patterns activado
- [ ] Resultado: ✓/✗

**Comando**:
```bash
skills-cli skills check "refactorizar controladores para clean architecture" --v2 | grep architecture
# Debe mostrar: ✅ backend-architecture-patterns
```

#### **T3. Path Matching** ✓
- [ ] Test: Con archivos abiertos en `/frontend/src/components/`
- [ ] Esperado: frontend-dev-guidelines activado
- [ ] Resultado: ✓/✗

**Comando**:
```bash
skills-cli skills check "crear componente" --open-files "frontend/src/components/Button.tsx" | grep frontend
# Debe mostrar: ✅ frontend-dev-guidelines
```

#### **T4. Content Patterns** ✓
- [ ] Test: Código con `deleteMany()` sin WHERE
- [ ] Esperado: database-verification en modo BLOCK
- [ ] Resultado: ✓/✗

**Comando**:
```bash
skills-cli guardrail check --code "await prisma.user.deleteMany();"
# Debe mostrar: 🚫 BLOCK
```

### **Testing Automatizado**

#### **AUTO1. Unit Tests** ✓
- [ ] `pnpm test:keyword-matching` - PASS
- [ ] `pnpm test:intent-patterns` - PASS
- [ ] `pnpm test:path-patterns` - PASS
- [ ] `pnpm test:content-patterns` - PASS

**Comando**:
```bash
pnpm test:keyword-matching
pnpm test:intent-patterns
pnpm test:path-patterns
pnpm test:content-patterns

# Todos deben retornar: PASS
```

#### **AUTO2. Integration Tests** ✓
- [ ] `pnpm test:activation-cases` - PASS
- [ ] `pnpm test:daemon-smoke` - PASS

**Comando**:
```bash
pnpm test:activation-cases
pnpm test:daemon-smoke

# Esperado: Tests passed
```

#### **AUTO3. Performance Tests** ✓
- [ ] `pnpm test:latency` - < 200ms
- [ ] `pnpm test:cache-hit` - > 85%
- [ ] `pnpm test:throughput` - > 100 req/s

**Comando**:
```bash
pnpm test:latency | grep "avg:"
# Debe mostrar: < 200ms

pnpm test:cache-hit | grep "hit rate:"
# Debe mostrar: > 85%
```

**✅ Criterio de Éxito Testing**: Todos los tests críticos PASS

---

## 🔐 **Quality Gates (G1-G8)** ✅

### **Gates Críticos (P0 - Bloquean Merge)**

#### **G1. Build** ✓
- [ ] `pnpm -w build` - PASS
- [ ] No errors ni warnings críticos

**Comando**:
```bash
pnpm -w build

# Esperado: Build completed successfully
```

#### **G2. Activation** ✓
- [ ] `pnpm test:activation-cases` - PASS
- [ ] Skills se activan correctamente

**Comando**:
```bash
pnpm test:activation-cases

# Esperado: All activation cases passed
```

#### **G3. Guardrails** ✓
- [ ] `skills-cli guardrail check` - 0 violations
- [ ] Todas las operaciones peligrosas bloqueadas

**Comando**:
```bash
skills-cli guardrail check

# Esperado: 0 violations
```

**✅ Gates P0**: Todos deben PASS para merge

### **Gates Importantes (P1 - Monitoreado)**

#### **G4. Skills Lint** ✓
- [ ] `skills-cli skills lint ./skills --strict` - PASS
- [ ] Skills con formato correcto

**Comando**:
```bash
skills-cli skills lint ./skills --strict

# Esperado: All skills valid
```

#### **G5. Notifications** ✓
- [ ] Webhook activo y funcionando
- [ ] Eventos recibidos en últimas 24h

**Comando**:
```bash
# Verificar en logs
grep "notification sent" .skills-logs/*.log | tail -5

# Verificar webhook
curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' $WEBHOOK_URL
```

#### **G6. Content Health** ✓
- [ ] Todos SKILL.md ≤ 400 líneas
- [ ] Scripts ejecutables

**Comando**:
```bash
# Verificar longitud
find skills -name "SKILL.md" -exec sh -c 'lines=$(wc -l < "$1"); [ $lines -le 400 ]' _ {} \;

# Verificar scripts
find skills -name "*.sh" -type f ! -executable -exec chmod +x {} \;
```

### **Gates Opcionales (P2 - Best Practice)**

#### **G7. Metrics** ✓
- [ ] `pnpm kpi:show` - Datos actualizados
- [ ] Métricas dentro de targets

**Comando**:
```bash
pnpm kpi:show

# Verificar: Datos del día actual
```

#### **G8. Documentation** ✓
- [ ] README actualizado
- [ ] Documentación completa

**Comando**:
```bash
# Verificar archivos clave
test -f README.md
test -f docs/cli/README.md
test -f CLAUDE.md
```

**✅ Gates P1-P2**: Recomendados pero no bloquean

---

## 🎯 **Cierre de Sprint** 🏁

### **Retrospective (Último día)**

#### **R1. Feedback del Equipo** ✓
- [ ] Survey enviado
- [ ] Respuestas recopiladas
- [ ] Feedback analizado

**Proceso**:
```bash
# Enviar survey (ejemplo)
echo "📝 FEEDBACK DEL EQUIPO - Sprint S15"
echo "1. ¿Las activaciones fueron relevantes? (1-5)"
echo "2. ¿Se configuró fácil? (1-5)"
echo "3. ¿Qué mejorarías?"
echo "4. ¿Qué funcionó bien?"

# Recopilar respuestas en archivo
cat > reports/feedback-sprint-S15.txt << 'EOF'
[Respuestas del equipo]
EOF
```

#### **R2. Análisis de Datos** ✓
- [ ] `node 08-scripts/generate-sprint-report.js --sprint <ID>`
- [ ] Métricas vs targets
- [ ] Gaps identificados

**Comando**:
```bash
node 08-scripts/generate-sprint-report.js --sprint S15

# Verificar
ls -la reports/sprint-S15-final.md
```

#### **R3. Lessons Learned** ✓
- [ ] ¿Qué funcionó bien?
- [ ] ¿Qué se puede mejorar?
- [ ] ¿Qué hacer diferente?

**Documentar**:
```bash
cat > reports/lessons-learned-sprint-S15.md << 'EOF'
# Lessons Learned - Sprint S15

## ✅ What Worked Well
- Activación automática muy rápida
- Guardrails impidieron 3 operaciones peligrosas
- Dashboard útil para monitoreo

## ⚠️ What Can Be Improved
- Algunos false positives en frontend-dev-guidelines
- Setup inicial tomó más tiempo del esperado

## 🔄 What to Do Different
- Añadir keywords más específicos
- Crear script de setup más simple
EOF
```

#### **R4. Optimizaciones** ✓
- [ ] `node 08-scripts/optimize-thresholds.js --sprint <ID>`
- [ ] Ajustar reglas si necesario
- [ ] Actualizar configuración

**Comando**:
```bash
node 08-scripts/optimize-thresholds.js --sprint S15 --output .skills-config/optimized-feature.json

# Aplicar optimizaciones
if [ $(node -p "data.falsePositives > 5") = "true" ]; then
  echo "🔧 Actualizando reglas por falsos positivos..."
  node 08-scripts/update-rules.js --fix-false-positives
fi
```

#### **R5. Preparar Próximo Sprint** ✓
- [ ] `node 08-scripts/prepare-next-sprint.js --sprint <NEXT_ID> --base-on <CURRENT_ID>`
- [ ] Configuración base lista
- [ ] Documentación actualizada

**Comando**:
```bash
node 08-scripts/prepare-next-sprint.js --sprint S16 --base-on S15

# Verificar
ls -la .skills-config/sprint-S16-template.json
```

**✅ Criterio de Éxito Cierre**: Reporte final generado + feedback analizado

---

## 📚 **Referencias Rápidas** 🔗

### **Comandos Esenciales**

```bash
# Setup
pm2 start scripts/pm2/ecosystem.config.cjs --env development
node 08-scripts/activate-sprint.js --type feature --sprint S15

# Verificación
skills-cli skills check "test" --v2
pm2 status
pnpm kpi:show

# Monitoreo
node 08-scripts/monitor-activations.js --realtime
skills-cli dashboard health

# Troubleshooting
pm2 restart router-service
skills-cli skills reload
pm2 logs router-service --lines 100
```

### **URLs Importantes**

- **Router Health**: http://127.0.0.1:3000/health
- **Daemon Health**: http://127.0.0.1:7727/health
- **Discovery Health**: http://127.0.0.1:8877/health
- **Dashboard**: http://localhost:8888

### **Archivos Clave**

- **Configuración**: `.skills-config/`
- **Logs**: `.skills-logs/`
- **Reportes**: `reports/`
- **Skills**: `./skills/`

---

## ✅ **Success Criteria**

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

## 📊 **Métricas del Checklist**

| Categoría | Checks | Tiempo | Prioridad |
|-----------|--------|---------|-----------|
| Pre-Sprint | 9 | 30 min | Crítica |
| Durante Sprint (Diario) | 4+4+3 | 15 min/día | Alta |
| Monitoreo | 6 categorías | N/A | Alta |
| Testing | 4+3 | 20 min | Media |
| Quality Gates | 3+3+2 | 10 min | Crítica |
| Cierre Sprint | 5 | 45 min | Alta |

**Total**: 35+ checks verificables

---

**Versión**: 1.0
**Creado**: 2024-11-02
**Última Actualización**: 2024-11-02
**Owner**: Engineering Team
**Status**: ✅ Activo
