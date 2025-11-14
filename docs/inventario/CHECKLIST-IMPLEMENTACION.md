# ✅ Checklist de Implementación - Mejoras de Antifragilidad
## Skills Fabrik

**Versión**: 1.0  
**Fecha Inicio**: 2025-01-13  
**Responsable**: Engineering Team  
**Documento Base**: [informe-mejoras-antifragilidad.md](./informe-mejoras-antifragilidad.md)

---

## 📋 Pre-Requisitos Generales

### Setup Inicial
- [ ] Crear branch `feature/antifragility-phase-1`
- [ ] Configurar feature flags en `configs/feature-flags.yaml`
- [ ] Setup baseline metrics collection
  ```bash
  node scripts/collect-baseline-metrics.mjs --duration 7d --output obs/kpi/baseline-2025-01.json
  ```
- [ ] Crear dashboard de monitoreo en Grafana/similar
- [ ] Documentar arquitectura actual con diagramas
- [ ] Review de informe completo con todo el equipo (1-2 horas)

### Configuración de Ambiente
- [ ] Ambiente de staging funcionando al 100%
- [ ] Tests de carga configurados (k6 o similar)
- [ ] Chaos testing environment preparado
- [ ] Logs centralizados configurados
- [ ] Alerting básico configurado

---

## 🚀 FASE 1: Fundamentos (Semanas 1-4)

### Sprint 1 (Semana 1-2)

---

#### **M2.1: Fallback Skill Chain** ⭐ QUICK WIN

**Esfuerzo**: 3-4 días | **Prioridad**: P0 | **Riesgo**: Bajo

##### Diseño
- [ ] Revisar todas las skills existentes (33 skills indexadas)
- [ ] Definir cadenas de fallback para top 10 skills más usadas
- [ ] Crear matriz de compatibilidad skill → fallbacks
- [ ] Diseñar estructura de configuración (JSON/YAML)
- [ ] Review de diseño con tech lead (30 min)

##### Implementación
- [ ] Crear `packages/daemon/src/fallback-chain.ts`
  - [ ] Interface `SkillFallback`
  - [ ] Class `FallbackChainExecutor`
  - [ ] Método `executeWithFallback()`
- [ ] Crear configuración `configs/skill-fallbacks.json`
  ```json
  {
    "backend-dev-guidelines": {
      "fallbacks": ["general-dev-guidelines", "basic-coding-rules"],
      "degradationLevel": "partial"
    }
  }
  ```
- [ ] Integrar con skill executor existente
- [ ] Agregar logging estructurado de fallbacks
- [ ] Feature flag: `ENABLE_SKILL_FALLBACKS=false`

##### Testing
- [ ] Tests unitarios (>80% coverage)
  - [ ] Fallback exitoso cuando primary falla
  - [ ] Todos los fallbacks fallan → error apropiado
  - [ ] Metadata de degradación en respuesta
  - [ ] Logging correcto de cadena de fallback
- [ ] Tests de integración
  - [ ] Simulación de fallo de skill primary
  - [ ] Verificación de respuesta degradada
  - [ ] Tiempo de respuesta aceptable (<200ms overhead)
- [ ] Tests de carga
  - [ ] 100 req/s con 20% de fallos primary
  - [ ] Verificar que fallbacks no degradan performance general

##### Validación
- [ ] Habilitar feature flag en staging al 10%
- [ ] Monitorear métricas por 24 horas:
  - [ ] `fallback_activations_total` counter
  - [ ] `fallback_success_rate` gauge
  - [ ] `primary_vs_fallback_latency` histogram
- [ ] Incrementar a 50% si métricas estables
- [ ] Rollout 100% staging
- [ ] Validar con 3 días de tráfico real
- [ ] Preparar rollout a producción

##### Documentación
- [ ] Actualizar `docs/skills/fallback-chains.md`
- [ ] Agregar ejemplos de configuración
- [ ] Runbook: "Qué hacer cuando fallbacks se agotan"
- [ ] Actualizar `CLAUDE.md` con nueva funcionalidad

##### Criterios de Éxito
- [ ] ✅ Tasa de respuestas exitosas +25% en skills con fallbacks
- [ ] ✅ Zero errores no manejados por cadena agotada
- [ ] ✅ Overhead de latencia <100ms
- [ ] ✅ Logs muestran claramente cadena de fallback usada

---

#### **M2.2: Partial Response Mode**

**Esfuerzo**: 2-3 días | **Prioridad**: P1 | **Riesgo**: Bajo

##### Diseño
- [ ] Identificar skills que dependen de múltiples recursos
- [ ] Definir umbral mínimo de completitud (60%?)
- [ ] Diseñar estructura de respuesta parcial
- [ ] Review con product owner sobre UX

##### Implementación
- [ ] Crear `packages/daemon/src/partial-response.ts`
  - [ ] Class `PartialResponseBuilder`
  - [ ] Método `buildResponse()` con Promise.allSettled
  - [ ] Cálculo de completeness score
- [ ] Modificar skill executor para usar partial responses
- [ ] Feature flag: `ENABLE_PARTIAL_RESPONSES=false`

##### Testing
- [ ] Tests unitarios
  - [ ] 100% de requisitos cumplidos → complete
  - [ ] 60-99% cumplidos → partial
  - [ ] <60% cumplidos → error con mensaje claro
  - [ ] Metadata de missing requirements correcta
- [ ] Tests de integración
  - [ ] Simular fallo de 2/5 recursos
  - [ ] Verificar respuesta parcial usable
  - [ ] Verificar warning messages

##### Validación
- [ ] Activar en staging al 25%
- [ ] Monitorear por 48 horas:
  - [ ] `partial_responses_total` counter
  - [ ] `completeness_score` histogram
  - [ ] Feedback de usuarios (si disponible)
- [ ] Rollout gradual 50% → 100%

##### Documentación
- [ ] Guía de API: cómo interpretar respuestas parciales
- [ ] Ejemplos de manejo en cliente

##### Criterios de Éxito
- [ ] ✅ Respuestas útiles con hasta 40% de fallos parciales
- [ ] ✅ Mejora disponibilidad percibida +20%
- [ ] ✅ Documentación clara sobre limitaciones

---

#### **M1.1: Adaptive Circuit Breaker**

**Esfuerzo**: 3-4 días | **Prioridad**: P0 | **Riesgo**: Bajo

##### Diseño
- [ ] Analizar patrones históricos de fallos por hora/día
- [ ] Definir ventana de tiempo para patrones (últimos 30 días?)
- [ ] Diseñar almacenamiento en MemTech L1
- [ ] Calcular tamaño de storage necesario

##### Implementación
- [ ] Crear `packages/router/src/resilience/adaptive-circuit-breaker.ts`
  - [ ] Interface `HistoricalPattern`
  - [ ] Class `AdaptiveCircuitBreaker`
  - [ ] Método `getThreshold()` contextual
  - [ ] Método `recordFailure()` con learning
- [ ] Integrar con circuit breaker existente
- [ ] Agregar persistencia en MemTech L1 (`.sf/cache/cb-patterns.json`)
- [ ] Feature flag: `ENABLE_ADAPTIVE_CB=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Umbral ajustado por hora del día
  - [ ] Umbral ajustado por volumen de tráfico
  - [ ] Aprendizaje después de N eventos
  - [ ] Fallback a umbral estático si datos insuficientes
- [ ] Tests de integración
  - [ ] Simular patrones de tráfico (bajo/alto)
  - [ ] Verificar ajuste de umbrales
  - [ ] Verificar persistencia y recuperación

##### Validación
- [ ] Recolectar baseline de falsos positivos (7 días)
- [ ] Activar adaptive CB en staging al 10%
- [ ] Monitorear por 7 días:
  - [ ] `circuit_breaker_false_positives` counter
  - [ ] `circuit_breaker_threshold_adjustments` histogram
  - [ ] `circuit_breaker_availability_improvement` gauge
- [ ] Comparar falsos positivos antes/después
- [ ] Target: -40% falsos positivos

##### Documentación
- [ ] Explicar algoritmo de ajuste de umbrales
- [ ] Runbook: "Circuit breaker comportándose anormalmente"
- [ ] Comandos para inspeccionar patrones históricos

##### Criterios de Éxito
- [ ] ✅ Reducción 40% en falsos positivos
- [ ] ✅ Mejora 15-20% en disponibilidad
- [ ] ✅ Auto-ajuste sin intervención manual

---

### Sprint 2 (Semana 3-4)

---

#### **M3.2: Anomaly Detection con Baselines**

**Esfuerzo**: 4-5 días | **Prioridad**: P1 | **Riesgo**: Bajo

##### Diseño
- [ ] Seleccionar métricas clave para detección (top 10)
- [ ] Definir método estadístico (IQR, Z-score, o ambos)
- [ ] Diseñar sistema de severidad (low/medium/high/critical)
- [ ] Definir acciones por nivel de severidad

##### Implementación
- [ ] Crear `packages/shared/src/anomaly-detector.ts`
  - [ ] Class `Baseline` con cálculo de percentiles
  - [ ] Class `AnomalyDetector`
  - [ ] Método `analyzeMetric()` con IQR
  - [ ] Método `getRecommendation()` basado en patrones
- [ ] Integrar con KPI system existente
- [ ] Configurar alertas automáticas
- [ ] Feature flag: `ENABLE_ANOMALY_DETECTION=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Detección de valores fuera de IQR
  - [ ] Cálculo correcto de severidad
  - [ ] Recomendaciones apropiadas por métrica
  - [ ] Baseline se actualiza correctamente
- [ ] Tests con datos sintéticos
  - [ ] Dataset normal → no anomalías
  - [ ] Dataset con spikes → detecta anomalías
  - [ ] Dataset con drift gradual → detecta cambio

##### Validación
- [ ] Activar en staging con alerting a canal de prueba
- [ ] Monitorear por 7 días:
  - [ ] `anomalies_detected_total` counter
  - [ ] `anomaly_false_positives` counter (manual validation)
  - [ ] `anomaly_detection_latency` histogram
- [ ] Ajustar sensibilidad si es necesario
- [ ] Target: <10% falsos positivos

##### Documentación
- [ ] Guía de interpretación de anomalías
- [ ] Playbook de respuesta por tipo de anomalía
- [ ] Ejemplos de alertas comunes

##### Criterios de Éxito
- [ ] ✅ Detección de 80% de problemas reales
- [ ] ✅ <10% falsos positivos
- [ ] ✅ Recomendaciones accionables

---

#### **M2.3: Read-Only Mode Automático**

**Esfuerzo**: 3-4 días | **Prioridad**: P1 | **Riesgo**: Medio

##### Diseño
- [ ] Identificar operaciones que pueden servirse desde cache
- [ ] Definir threshold de fallos de escritura (5 consecutivos?)
- [ ] Diseñar protocolo de notificación a servicios dependientes
- [ ] Planear estrategia de recuperación automática

##### Implementación
- [ ] Crear `packages/daemon/src/readonly-mode.ts`
  - [ ] Class `ReadOnlyModeManager`
  - [ ] Método `executeQuery()` con detección de fallos
  - [ ] Método `enterReadOnlyMode()`
  - [ ] Método `scheduleRecoveryAttempt()`
- [ ] Agregar endpoint `/status` con modo actual
- [ ] Integrar con todas las operaciones de escritura
- [ ] Feature flag: `ENABLE_READONLY_MODE=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Entrada a read-only después de N fallos
  - [ ] Queries de lectura funcionan en modo read-only
  - [ ] Queries de escritura rechazadas apropiadamente
  - [ ] Recuperación automática exitosa
  - [ ] Re-entrada a read-only si recuperación falla
- [ ] Tests de integración
  - [ ] Simular fallo de PostgreSQL
  - [ ] Verificar entrada a read-only
  - [ ] Verificar datos servidos desde cache
  - [ ] Verificar recuperación cuando DB vuelve

##### Validación
- [ ] **⚠️ CRÍTICO**: Solo testing en staging
- [ ] Game day: simular outage de DB por 5 minutos
  - [ ] Verificar sistema entra en read-only <30s
  - [ ] Verificar lecturas funcionan
  - [ ] Verificar escrituras rechazadas con mensaje claro
  - [ ] Verificar recuperación automática
- [ ] Documentar comportamiento observado
- [ ] Ajustar timings si es necesario

##### Documentación
- [ ] Runbook: "Sistema en modo read-only"
- [ ] Guía de troubleshooting
- [ ] Comandos para forzar entrada/salida de modo (manual override)

##### Criterios de Éxito
- [ ] ✅ Sistema usable durante DB outage (lecturas)
- [ ] ✅ Entrada a read-only en <30 segundos
- [ ] ✅ Recuperación automática exitosa
- [ ] ✅ Zero data corruption

---

## 🎯 Checkpoint Fase 1

**Antes de continuar a Fase 2, validar**:

### Métricas Fase 1
- [ ] ✅ Auto-recovery rate mejoró de 20% → 45%
- [ ] ✅ TTR promedio bajó de 5min → 2min
- [ ] ✅ Degradación elegante funcionando en 50%+ casos
- [ ] ✅ Detección de anomalías activa con <10% FP

### Calidad de Código
- [ ] ✅ Tests coverage >80% en todos los componentes nuevos
- [ ] ✅ Zero regressions en performance
- [ ] ✅ Documentación completa y actualizada
- [ ] ✅ Feature flags funcionando correctamente

### Proceso
- [ ] ✅ Retrospectiva de Fase 1 completada
- [ ] ✅ Learnings documentados
- [ ] ✅ Roadmap de Fase 2 ajustado si es necesario
- [ ] ✅ Aprobación de stakeholders para continuar

---

## 🧠 FASE 2: Inteligencia (Semanas 5-8)

### Sprint 3 (Semana 5-6)

---

#### **M1.2: Auto-Recovery con Root Cause Learning**

**Esfuerzo**: 5-6 días | **Prioridad**: P0 | **Riesgo**: Medio

##### Diseño
- [ ] Analizar top 10 causas de crashes en últimos 6 meses
- [ ] Definir estrategias de recuperación por causa
- [ ] Diseñar estructura de failure database
- [ ] Planear integración con PM2 lifecycle hooks

##### Implementación
- [ ] Crear `scripts/pm2/intelligent-recovery.mjs`
  - [ ] Class `IntelligentRecoveryManager`
  - [ ] Método `analyzeAndRecover()`
  - [ ] Método `extractRootCause()` con regex patterns
  - [ ] Método `selectRecoveryStrategy()`
- [ ] Configurar PM2 hooks para capturar crashes
- [ ] Crear failure database (SQLite o JSON)
- [ ] Implementar recovery strategies:
  - [ ] CLEAR_CACHE
  - [ ] INCREASE_MEMORY
  - [ ] RESET_CONNECTIONS
  - [ ] SAFE_MODE
- [ ] Feature flag: `ENABLE_INTELLIGENT_RECOVERY=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Extracción correcta de root cause
  - [ ] Selección apropiada de strategy
  - [ ] Registro en failure database
  - [ ] Aplicación de recovery actions
- [ ] Tests de integración
  - [ ] Simular crash por OOM → increase memory
  - [ ] Simular crash por timeout → reset connections
  - [ ] Verificar no crear loop de crashes

##### Validación
- [ ] Activar en staging en modo logging-only
- [ ] Observar por 7 días qué strategies se recomendarían
- [ ] Revisar recomendaciones con equipo
- [ ] Activar modo automático en staging
- [ ] Monitorear por 14 días:
  - [ ] `auto_recovery_attempts` counter
  - [ ] `auto_recovery_success_rate` gauge
  - [ ] `time_to_recovery` histogram
- [ ] Target: 60% de recoveries exitosos sin intervención

##### Documentación
- [ ] Catálogo de root causes conocidas
- [ ] Matriz de causa → strategy
- [ ] Runbook: "Recovery automático falló"
- [ ] Comandos para ver failure history

##### Criterios de Éxito
- [ ] ✅ 60% de crashes se auto-recuperan
- [ ] ✅ TTR reducido 70% en casos auto-recovered
- [ ] ✅ Aprendizaje de patrones funciona correctamente

---

#### **M3.1: Self-Tuning Metrics Dashboard**

**Esfuerzo**: 5-6 días | **Prioridad**: P0 | **Riesgo**: Medio

##### Diseño
- [ ] Seleccionar métricas críticas para auto-tuning (10-15)
- [ ] Definir acciones automáticas por métrica
- [ ] Diseñar sistema de adaptive thresholds
- [ ] Planear integración con alerting existente

##### Implementación
- [ ] Crear `packages/kpi/src/self-tuning-dashboard.ts`
  - [ ] Interface `MetricThreshold`
  - [ ] Class `SelfTuningDashboard`
  - [ ] Método `updateMetric()` con threshold check
  - [ ] Método `adjustThreshold()` con statistics
  - [ ] Método `executeAutoAction()`
- [ ] Crear configuración `configs/auto-metrics.yaml`
- [ ] Implementar acciones:
  - [ ] SCALE_SERVICE
  - [ ] CLEAR_CACHE
  - [ ] RESTART_SERVICE
  - [ ] ENABLE_RATE_LIMIT
  - [ ] ALERT_TEAM
- [ ] Feature flag: `ENABLE_AUTO_ACTIONS=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Ajuste correcto de thresholds adaptativos
  - [ ] Detección de cruce de threshold
  - [ ] Ejecución de acciones apropiadas
  - [ ] No ejecutar acción múltiples veces en corto tiempo
- [ ] Tests de integración
  - [ ] Simular spike de latencia → scale service
  - [ ] Simular error rate alto → restart service
  - [ ] Verificar acciones se ejecutan correctamente

##### Validación
- [ ] **⚠️ CRÍTICO**: Empezar en modo dry-run (log only)
- [ ] Observar por 14 días qué acciones se dispararían
- [ ] Revisar con equipo ops
- [ ] Activar auto-actions en staging (acciones no-destructivas primero)
- [ ] Gradualmente habilitar acciones más agresivas
- [ ] Monitorear por 21 días:
  - [ ] `auto_actions_executed` counter
  - [ ] `auto_action_success_rate` gauge
  - [ ] `mttr_with_auto_actions` vs `mttr_manual`

##### Documentación
- [ ] Catálogo completo de métricas y acciones
- [ ] Guía de configuración de nuevas métricas
- [ ] Runbook: "Auto-action causó problema"
- [ ] Manual override commands

##### Criterios de Éxito
- [ ] ✅ Respuesta automática en <30 segundos
- [ ] ✅ 80% de auto-actions exitosas
- [ ] ✅ MTTR reducido 50% vs manual

---

### Sprint 4 (Semana 7-8)

---

#### **M1.3: Skill Activation Learning Loop**

**Esfuerzo**: 4-5 días | **Prioridad**: P1 | **Riesgo**: Bajo

##### Diseño
- [ ] Definir qué constituye "activación exitosa"
- [ ] Diseñar sistema de feedback (implícito y explícito)
- [ ] Planear almacenamiento de outcomes (MemTech L1/L2)
- [ ] Calcular ventana de historia relevante (últimos 1000 eventos?)

##### Implementación
- [ ] Crear `packages/router/src/activation/learning-engine.ts`
  - [ ] Interface `ActivationOutcome`
  - [ ] Class `SkillActivationLearner`
  - [ ] Método `adjustScore()` basado en historia
  - [ ] Método `recordOutcome()`
- [ ] Integrar con activation engine existente
- [ ] Agregar persistencia en MemTech
- [ ] Feature flag: `ENABLE_ACTIVATION_LEARNING=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Ajuste de score basado en success rate
  - [ ] Ajuste basado en user feedback
  - [ ] Penalización por latencia
  - [ ] No ajustar con datos insuficientes (<10 eventos)
- [ ] Tests de integración
  - [ ] Simular 100 activaciones con outcomes variados
  - [ ] Verificar scores se ajustan apropiadamente
  - [ ] Verificar persistencia y recuperación

##### Validación
- [ ] Activar en staging al 25%
- [ ] Monitorear por 14 días:
  - [ ] `skill_activation_accuracy` gauge
  - [ ] `incorrect_activations` counter
  - [ ] `learning_adjustments` histogram
- [ ] Comparar accuracy antes/después
- [ ] Target: +12% mejora en accuracy

##### Documentación
- [ ] Explicar algoritmo de aprendizaje
- [ ] Guía para interpretar ajustes de scores
- [ ] Comandos para inspeccionar learning data

##### Criterios de Éxito
- [ ] ✅ Mejora 12-18% en precisión
- [ ] ✅ Reducción activaciones incorrectas
- [ ] ✅ Auto-optimización sin intervención

---

#### **M4.1: Bulkhead Pattern para Skills**

**Esfuerzo**: 4-5 días | **Prioridad**: P1 | **Riesgo**: Medio

##### Diseño
- [ ] Clasificar skills por criticidad (critical/standard/background)
- [ ] Definir limits por pool de recursos
- [ ] Diseñar mecanismo de adquisición de slots
- [ ] Planear comportamiento cuando pool lleno

##### Implementación
- [ ] Crear `packages/daemon/src/bulkhead.ts`
  - [ ] Class `ResourcePool` con semaphore
  - [ ] Class `SkillBulkhead`
  - [ ] Método `executeSkill()` con pool management
- [ ] Actualizar SKILL.md frontmatter con priority field
- [ ] Integrar con skill executor
- [ ] Feature flag: `ENABLE_BULKHEAD=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Adquisición de slot exitosa
  - [ ] Rechazo cuando pool lleno
  - [ ] Release de slot después de ejecución
  - [ ] Separación entre pools
- [ ] Tests de carga
  - [ ] Saturar pool background → skills critical no afectadas
  - [ ] Verificar fairness en pool
  - [ ] Verificar no deadlocks

##### Validación
- [ ] Activar en staging
- [ ] Simular carga pesada en skills background
- [ ] Verificar skills critical mantienen performance
- [ ] Monitorear por 7 días:
  - [ ] `bulkhead_rejections` counter por pool
  - [ ] `bulkhead_utilization` gauge por pool
  - [ ] Latency p95 de skills critical

##### Documentación
- [ ] Guía de clasificación de skills
- [ ] Configuración de pools
- [ ] Runbook: "Bulkhead rejections altas"

##### Criterios de Éxito
- [ ] ✅ Skills críticas aisladas de fallos
- [ ] ✅ Prevención de cascada de fallos
- [ ] ✅ Fairness entre skills de mismo pool

---

## 🎯 Checkpoint Fase 2

### Métricas Fase 2
- [ ] ✅ Auto-recovery rate mejoró de 45% → 65%
- [ ] ✅ TTR promedio bajó de 2min → 30s
- [ ] ✅ Learning effectiveness: -15% fallos recurrentes/mes
- [ ] ✅ Prediction accuracy: 30% de fallos detectados antes

### Sistema de Aprendizaje
- [ ] ✅ Patterns históricos registrados correctamente
- [ ] ✅ Ajustes automáticos funcionando
- [ ] ✅ Recovery strategies aplicándose automáticamente

---

## 💪 FASE 3: Robustez (Semanas 9-12)

### Sprint 5 (Semana 9-10)

---

#### **M4.2: Smart DLQ Processor**

**Esfuerzo**: 5-6 días | **Prioridad**: P1 | **Riesgo**: Medio

##### Diseño
- [ ] Analizar mensajes actuales en DLQ (si existen)
- [ ] Clasificar tipos de errores
- [ ] Definir estrategias por categoría (TRANSIENT/FIXABLE/PERMANENT)
- [ ] Diseñar sistema de retry inteligente

##### Implementación
- [ ] Crear `packages/daemon/src/dlq-processor.ts`
  - [ ] Class `SmartDLQProcessor`
  - [ ] Método `processDLQ()`
  - [ ] Método `analyzeFailure()` con patterns
  - [ ] Método `applyFix()` con transformaciones
  - [ ] Scheduled job para procesamiento periódico
- [ ] Configurar cron para procesamiento (cada hora?)
- [ ] Feature flag: `ENABLE_SMART_DLQ=false`

##### Testing
- [ ] Tests unitarios
  - [ ] Clasificación correcta por categoría
  - [ ] Aplicación de fixes apropiados
  - [ ] Scheduling de retries con backoff
  - [ ] Movimiento a archive para PERMANENT
- [ ] Tests de integración
  - [ ] Poblar DLQ con mensajes de prueba
  - [ ] Verificar procesamiento automático
  - [ ] Verificar re-encolamiento exitoso

##### Validación
- [ ] Activar en staging en modo dry-run
- [ ] Observar clasificaciones por 7 días
- [ ] Validar accuracy de clasificación con equipo
- [ ] Activar modo automático
- [ ] Monitorear por 14 días:
  - [ ] `dlq_messages_recovered` counter
  - [ ] `dlq_auto_fix_success_rate` gauge
  - [ ] `dlq_size_trend` over time
- [ ] Target: 70% de mensajes recuperados

##### Documentación
- [ ] Catálogo de error patterns
- [ ] Guía de añadir nuevos fixes
- [ ] Runbook: "DLQ creciendo indefinidamente"

##### Criterios de Éxito
- [ ] ✅ 70-80% de errores transitorios auto-recuperados
- [ ] ✅ Clasificación automática precisa
- [ ] ✅ DLQ size estable o decreciente

---

#### **M5.1: Chaos Monkey Integrado**

**Esfuerzo**: 4-5 días | **Prioridad**: P2 | **Riesgo**: Bajo

##### Diseño
- [ ] Seleccionar operaciones para inyección de caos
- [ ] Definir tipos de experimentos (latency/error/timeout/etc)
- [ ] Configurar probabilidades por ambiente
- [ ] Diseñar sistema de safety (no en prod sin config explícita)

##### Implementación
- [ ] Crear `packages/shared/src/chaos-monkey.ts`
  - [ ] Class `ChaosMonkey`
  - [ ] Método `maybeInjectChaos()`
  - [ ] Método `selectExperiment()` weighted
  - [ ] Safety checks por ambiente
- [ ] Crear configuración `configs/chaos-config.yaml`
- [ ] Integrar en puntos críticos:
  - [ ] Skill activation
  - [ ] Daemon requests
  - [ ] Database queries
- [ ] Feature flag: `ENABLE_CHAOS=false` (default)

##### Testing
- [ ] Tests unitarios
  - [ ] Probabilidades funcionan correctamente
  - [ ] Disabled en producción por defecto
  - [ ] Experimentos se ejecutan apropiadamente
- [ ] Tests de integración
  - [ ] Sistema se recupera de chaos inyectado
  - [ ] Métricas registran chaos events

##### Validación
- [ ] **⚠️ SOLO DEV/STAGING**
- [ ] Activar con 5% probability en staging
- [ ] Ejecutar por 7 días
- [ ] Verificar sistema es resiliente
- [ ] Identificar fallos descubiertos
- [ ] Documentar y corregir issues encontrados

##### Documentación
- [ ] Guía de uso de Chaos Monkey
- [ ] Configuración de experimentos
- [ ] Interpretación de resultados

##### Criterios de Éxito
- [ ] ✅ Descubre 5+ fallos no conocidos
- [ ] ✅ Sistema mantiene funcionalidad durante chaos
- [ ] ✅ Mejoras implementadas basadas en findings

---

### Sprint 6 (Semana 11-12)

---

#### **M5.2: Game Days Automatizados**

**Esfuerzo**: 6-7 días | **Prioridad**: P2 | **Riesgo**: Bajo

##### Diseño
- [ ] Definir 5-10 escenarios críticos
  - [ ] Database outage
  - [ ] High load spike
  - [ ] Cascading failure
  
