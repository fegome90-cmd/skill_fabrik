# Checklist: Activación de Skills por Sprint

## 🎯 **Introducción**
Lista de verificación completa para activar skills de manera eficiente en cualquier sprint, asegurando calidad y productividad del equipo.

---

## 📋 **Pre-Sprint Setup** ⚙️

### **Preparación (Día 1 - Mañana)**

- [ ] **1.1. Identificar Tipo de Sprint**
  - [ ] Tipo confirmado (feature, bugfix, refactor, security, performance, testing, migration)
  - [ ] Duración definida (1-4 semanas)
  - [ ] Tamaño del equipo (1-5 desarrolladores)
  - [ ] Prioridades identificadas (backend, frontend, database, etc.)

- [ ] **1.2. Verificar Servicios**
  - [ ] `pm2 status` - Todos los servicios online
  - [ ] `curl http://127.0.0.1:7727/health` - Daemon OK
  - [ ] `curl http://127.0.0.1:3000/health` - Router OK
  - [ ] `curl http://127.0.0.1:8877/health` - Discovery OK

- [ ] **1.3. Cargar Perfil de Sprint**
  - [ ] Ejecutar: `node 08-scripts/activate-sprint.js --type <TIPO> --sprint <ID>`
  - [ ] Verificar salida: "Perfil cargado: X skills principales"
  - [ ] Confirmar skills principales activadas

- [ ] **1.4. Configurar Thresholds**
  - [ ] Thresholds aplicados por enforcement level
  - [ ] Archivo de configuración guardado: `.skills-config/thresholds-*.json`
  - [ ] Thresholds específicos por skill (si aplica)

- [ ] **1.5. Activar Skills Opcionales**
  - [ ] Performance optimization (si sprint largo)
  - [ ] Test automation (si sprint de testing)
  - [ ] Security testing (si sprint de seguridad)

- [ ] **1.6. Configurar Notificaciones**
  - [ ] Webhook configurado (Slack/Discord)
  - [ ] Eventos seleccionados:
    - [ ] skill_activated
    - [ ] guardrail_blocked
    - [ ] threshold_crossed
  - [ ] Test de notificación enviado

- [ ] **1.7. Iniciar Dashboard**
  - [ ] `pm2 start "skills-cli dashboard" --name skills-dashboard`
  - [ ] `curl http://localhost:8888/health` - Dashboard OK
  - [ ] URL de dashboard documentada

- [ ] **1.8. Test de Activación**
  - [ ] Ejecutar: `skills-cli skills check "crear API con auth" --v2`
  - [ ] Verificar: ≥ 3 skills relevantes activadas
  - [ ] Verificar: Guardrails funcionando (BLOCK)
  - [ ] No errores en logs

- [ ] **1.9. Documentar Configuración**
  - [ ] Crear archivo: `.skills-config/sprint-<ID>.json`
  - [ ] Registrar skills activadas
  - [ ] Registrar thresholds configurados
  - [ ] Compartir con el equipo

**✅ Criterio de Éxito Pre-Sprint**: Todos los checks 1.1-1.9 completados

---

## 🔄 **Durante Sprint - Rutina Diaria** 📅

### **Morning Check (9:00 AM)**

- [ ] **D1. Health Check**
  - [ ] `pm2 status` - Todos los servicios online
  - [ ] `pm2 monit` - Sin alertas críticas
  - [ ] Logs revisados (últimas 24h)

- [ ] **D2. Activaciones de Ayer**
  - [ ] Ejecutar: `node 08-scripts/monitor-activations.js --yesterday`
  - [ ] Revisar métricas:
    - [ ] Activaciones relevantes: ≥ 85%
    - [ ] False positives: ≤ 5%
    - [ ] False negatives: ≤ 5%

- [ ] **D3. Alertas**
  - [ ] Ejecutar: `node 08-scripts/check-alerts.js`
  - [ ] Revisar notificaciones en Slack/Discord
  - [ ] Resolver alertas críticas

- [ ] **D4. Métricas**
  - [ ] `pnpm kpi:show --days 1`
  - [ ] Número de activaciones (target: 20-50/día)
  - [ ] Skills más usados
  - [ ] Latencia promedio (target: < 200ms)

**✅ Criterio de Éxito Diario**: Checks D1-D4 sin issues críticos

### **Durante Desarrollo**

- [ ] **Dev1. Activación Manual** (Si es necesario)
  - [ ] `skills-cli skills activate <SKILL> --priority high`
  - [ ] Verificar activación exitosa
  - [ ] Documentar razón

- [ ] **Dev2. Verificar Activación** (Para tareas complejas)
  - [ ] `skills-cli skills check "<prompt>" --v2 --debug`
  - [ ] Revisar score y activación esperada
  - [ ] Ajustar si necesario

- [ ] **Dev3. Monitoreo en Tiempo Real** (Para debugging)
  - [ ] `node 08-scripts/monitor-activations.js --realtime`
  - [ ] Ver activaciones en vivo
  - [ ] Detectar anomalías

- [ ] **Dev4. Code Review Flow**
  - [ ] Pre-PR: `skills-cli skills check "validar PR" --active-files $(find . -name "*.ts" | head -5)`
  - [ ] Verificar guardrails no bloquean
  - [ ] Verificar skills relevantes activadas
  - [ ] Post-PR: Review con checklist activado

**✅ Criterio de Éxito Desarrollo**: Activaciones relevantes y guardrails funcionando

### **End of Day (6:00 PM)**

- [ ] **EOD1. Generar Reporte Diario**
  - [ ] `node 08-scripts/generate-daily-report.js --date $(date +%Y-%m-%d)`
  - [ ] Archivo generado: `reports/daily-<DATE>.md`
  - [ ] Métricas incluidas

- [ ] **EOD2. Guardar Métricas**
  - [ ] `node 08-scripts/save-metrics.js --sprint <ID> --date today`
  - [ ] Archivo JSON creado
  - [ ] Backup automático

- [ ] **EOD3. Backup Configuración**
  - [ ] `node 08-scripts/backup-config.js --backup-name "sprint-<ID>-day-<N>"`
  - [ ] Archivo .json de backup
  - [ ] Registrado en log

**✅ Criterio de Éxito EOD**: Reportes y backups generados

---

## 📊 **Monitoreo y Alertas** 🚨

### **Alertas Críticas (Resolver Inmediatamente)**

- [ ] **A1. Servicio Caído**
  - [ ] Router offline
  - [ ] Daemon offline
  - [ ] Action: `pm2 restart <service-name>`

- [ ] **A2. Guardrail No Bloquea**
  - [ ] Operación peligrosa no detectada
  - [ ] Action: `skills-cli skills update <SKILL> --fix-detection`

- [ ] **A3. False Positives Altos**
  - [ ] > 10% en últimas 24h
  - [ ] Action: `node 08-scripts/optimize-rules.js --fix-false-positives`

### **Alertas de Rendimiento**

- [ ] **R1. Latencia Alta**
  - [ ] > 500ms promedio
  - [ ] Action: Verificar cache, reiniciar servicios

- [ ] **R2. Activaciones Bajas**
  - [ ] < 10 activaciones en 24h
  - [ ] Action: Verificar prompts, ajustar thresholds

### **Alertas de Calidad**

- [ ] **Q1. Skills No Activados**
  - [ ] Skill esperado no se activa
  - [ ] Action: `skills-cli skills debug <SKILL>`

- [ ] **Q2. Content Patterns No Detectan**
  - [ ] Patrón específico no coincide
  - [ ] Action: `skills-cli skills update <SKILL> --add-pattern`

---

## 🔍 **Testing y Validación** 🧪

### **Testing Manual**

- [ ] **T1. Keyword Matching**
  - [ ] Test: `skills-cli skills check "crear API REST" --v2`
  - [ ] Esperado: backend-dev-guidelines + api-design activados
  - [ ] Resultado: ✓/✗

- [ ] **T2. Intent Patterns**
  - [ ] Test: `skills-cli skills check "refactorizar controladores" --v2`
  - [ ] Esperado: architecture-patterns activado
  - [ ] Resultado: ✓/✗

- [ ] **T3. Path Matching**
  - [ ] Test: Con archivos abiertos en `/frontend/src/components/`
  - [ ] Esperado: frontend-dev-guidelines activado
  - [ ] Resultado: ✓/✗

- [ ] **T4. Content Patterns**
  - [ ] Test: Código con `deleteMany()` sin WHERE
  - [ ] Esperado: database-verification en modo BLOCK
  - [ ] Resultado: ✓/✗

### **Testing Automatizado**

- [ ] **AUTO1. Unit Tests**
  - [ ] `pnpm test:keyword-matching` - PASS
  - [ ] `pnpm test:intent-patterns` - PASS
  - [ ] `pnpm test:path-patterns` - PASS
  - [ ] `pnpm test:content-patterns` - PASS

- [ ] **AUTO2. Integration Tests**
  - [ ] `pnpm test:activation-cases` - PASS
  - [ ] `pnpm test:daemon-smoke` - PASS

- [ ] **AUTO3. Performance Tests**
  - [ ] `pnpm test:latency` - < 200ms
  - [ ] `pnpm test:cache-hit` - > 85%
  - [ ] `pnpm test:throughput` - > 100 req/s

**✅ Criterio de Éxito Testing**: Todos los tests críticos PASS

---

## 🔐 **Quality Gates (G1-G8)** ✅

### **Gates Críticos (P0 - Bloquean Merge)**

- [ ] **G1. Build**
  - [ ] `pnpm -w build` - PASS
  - [ ] No errors ni warnings críticos

- [ ] **G2. Activation**
  - [ ] `pnpm test:activation-cases` - PASS
  - [ ] Skills se activan correctamente

- [ ] **G3. Guardrails**
  - [ ] `skills-cli guardrail check` - 0 violations
  - [ ] Todas las operaciones peligrosas bloqueadas

**✅ Gates P0**: Todos deben PASS para merge

### **Gates Importantes (P1 - Monitoreado)**

- [ ] **G4. Skills Lint**
  - [ ] `skills-cli skills lint ./skills --strict` - PASS
  - [ ] Skills con formato correcto

- [ ] **G5. Notifications**
  - [ ] Webhook activo y funcionando
  - [ ] Eventos recibidos en últimas 24h

- [ ] **G6. Content Health**
  - [ ] Todos SKILL.md ≤ 400 líneas
  - [ ] Scripts ejecutables

### **Gates Opcionales (P2 - Best Practice)**

- [ ] **G7. Metrics**
  - [ ] `pnpm kpi:show` - Datos actualizados
  - [ ] Métricas dentro de targets

- [ ] **G8. Documentation**
  - [ ] README actualizado
  - [ ] Documentación completa

**✅ Gates P1-P2**: Recomendados pero no bloquean

---

## 🐛 **Troubleshooting** 🔧

### **Problema: No se activan skills**

**Diagnóstico**:
- [ ] Servicios corriendo (pm2 status)
- [ ] Health endpoints respondiendo
- [ ] Reglas cargadas
- [ ] Cache limpio

**Solución**:
- [ ] `pm2 restart router-service`
- [ ] `skills-cli skills reload`
- [ ] `pm2 logs router-service --lines 100`

### **Problema: Falsos positivos**

**Diagnóstico**:
- [ ] Analizar: `node 08-scripts/analyze-false-positives.js --days 7`
- [ ] Identificar skills problemáticas
- [ ] Revisar keywords demasiado genéricos

**Solución**:
- [ ] `skills-cli skills update <SKILL> --remove-keywords <KEYWORD>`
- [ ] `skills-cli skills configure <SKILL> --threshold 0.7`
- [ ] Añadir negative patterns

### **Problema: Guardrail no bloquea**

**Diagnóstico**:
- [ ] `skills-cli guardrail explain --code "<CODIGO>"`
- [ ] Verificar content patterns
- [ ] Revisar enforcement level

**Solución**:
- [ ] `skills-cli skills update <SKILL> --content-pattern "<PATTERN>"`
- [ ] `skills-cli skills configure <SKILL> --enforcement block`

### **Problema: Latencia alta**

**Diagnóstico**:
- [ ] `skills-cli dashboard health --metrics`
- [ ] Verificar cache hit rate
- [ ] Revisar logs de performance

**Solución**:
- [ ] Limpiar cache: `skills-cli cache clean`
- [ ] Reiniciar servicios: `pm2 restart all`
- [ ] Verificar recursos del sistema

---

## 📈 **Métricas y Reportes** 📊

### **Métricas Diarias** (Recopilar cada día)

```
Fecha: ___________
Activaciones totales: _______
Activaciones relevantes: _______ (____%)
False positives: _______ (____%)
False negatives: _______ (____%)
Setup time promedio: _______ min
Dev satisfaction (1-5): _____
```

### **Métricas Semanales** (Reporte cada viernes)

- [ ] **W1. Reporte Automático**
  - [ ] `node 08-scripts/generate-weekly-report.js --sprint <ID>`
  - [ ] Archivo: `reports/weekly-<DATE>.md`
  - [ ] Enviar al equipo

- [ ] **W2. Análisis de Tendencias**
  - [ ] Skills más/menos usados
  - [ ] Evolución de false positives
  - [ ] Cambios en latencia

- [ ] **W3. Optimizaciones**
  - [ ] Reglas a ajustar
  - [ ] Thresholds a optimizar
  - [ ] Nuevas skills a añadir

### **Métricas de Sprint** (Reporte final)

- [ ] **S1. Resumen Ejecutivo**
  - [ ] Total activaciones
  - [ ] Tasa de éxito (≥ 90%)
  - [ ] Tiempo ahorrado (estimado)
  - [ ] Satisfacción del equipo

- [ ] **S2. Análisis Técnico**
  - [ ] Performance report
  - [ ] Quality metrics
  - [ ] Issues encontrados

- [ ] **S3. Recomendaciones**
  - [ ] Mejoras para próximo sprint
  - [ ] Optimizaciones sugeridas
  - [ ] Nuevas features

**✅ Criterio de Éxito Sprint**:
- Relevant activations: ≥ 90%
- False positives: ≤ 5%
- Dev satisfaction: ≥ 4/5
- Setup time: ≤ 5 min

---

## 🎯 **Cierre de Sprint** 🏁

### **Retrospective (Último día)**

- [ ] **R1. Feedback del Equipo**
  - [ ] Survey enviado
  - [ ] Respuestas recopiladas
  - [ ] Feedback analizado

- [ ] **R2. Análisis de Datos**
  - [ ] `node 08-scripts/generate-sprint-report.js --sprint <ID>`
  - [ ] Métricas vs targets
  - [ ] Gaps identificados

- [ ] **R3. Lessons Learned**
  - [ ] ¿Qué funcionó bien?
  - [ ] ¿Qué se puede mejorar?
  - [ ] ¿Qué hacer diferente?

- [ ] **R4. Optimizaciones**
  - [ ] `node 08-scripts/optimize-thresholds.js --sprint <ID>`
  - [ ] Ajustar reglas si necesario
  - [ ] Actualizar配置文件

- [ ] **R5. Preparar Próximo Sprint**
  - [ ] `node 08-scripts/prepare-next-sprint.js --sprint <NEXT_ID> --base-on <CURRENT_ID>`
  - [ ] Configuración base lista
  - [ ] Documentación actualizada

### **Documentación Final**

- [ ] **D1. Reporte Completo**
  - [ ] Archivo: `reports/sprint-<ID>-final.md`
  - [ ] Incluir:
    - [ ] Métricas completas
    - [ ] Feedback del equipo
    - [ ] Análisis técnico
    - [ ] Recomendaciones

- [ ] **D2. Knowledge Base**
  - [ ] Actualizar playbook si necesario
  - [ ] Añadir nuevos casos de uso
  - [ ] Compartir lecciones aprendidas

- [ ] **D3. Backup Final**
  - [ ] `node 08-scripts/backup-sprint.js --sprint <ID> --final`
  - [ ] Configuración completa
  - [ ] Logs y métricas
  - [ ] Reportes generados

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

**Versión**: 1.0
**Creado**: 2024-11-02
**Owner**: Engineering Team
**Última Actualización**: 2024-11-02
