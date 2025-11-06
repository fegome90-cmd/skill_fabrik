# KPIs y Dashboard - Skills Fabric

## 📊 Dashboard

El dashboard muestra métricas en **pares** (velocidad + calidad) para una interpretación holística del sistema.

**Generar dashboard:**
```bash
# Ver en consola
pnpm kpi:show

# Generar markdown
pnpm kpi:gen
```

El dashboard se genera en `docs/kpi/DASHBOARD.md`.

---

## 📈 Métricas en Pares

### ⚡ Velocidad
- **Tasa de Activación**: Skills activados por operación
- **Tokens por Operación**: Eficiencia de tokens
- **Latencia Promedio**: Tiempo de respuesta
- **Divulgación Progresiva**: Recursos cargados on-demand

### 🎯 Calidad
- **Tasa de Adherencia**: % respuestas que cumplen guías activas
- **Zero Errors Rate**: % PRs sin errores residuales
- **Latencia de Corrección**: Tiempo promedio de fix
- **Efectividad de Guardrails**: % errores preventivos

---

## 🔍 Interpretación Holística

El dashboard calcula un **estado holístico** basado en todas las métricas:

- 🟢 **EXCELLENT**: Todas las métricas dentro de objetivos
- 🟡 **GOOD**: Mayoría de métricas OK, algunas mejoras
- 🟠 **WARNING**: Desequilibrios detectados, requiere atención
- 🔴 **CRITICAL**: Sistema no cumple objetivos críticos

**Pregunta clave**: "¿Vamos más rápido Y con mejor calidad?"

---

## 📋 Cuándo Revisar

- **Diario**: Dashboard matutino para verificar estado
- **Semanal**: Análisis profundo de tendencias
- **Por Fase**: Antes de gate review
- **Post-Sprint**: Evaluación de mejora continua

---

## 📚 Ver También

- [Guía de Comandos](./COMMANDS-GUIDE.md) - Cuándo usar cada comando
- `obs/kpi/events.jsonl` - Eventos raw (JSONL)
- `configs/skill-rules.json` - Reglas de activación

