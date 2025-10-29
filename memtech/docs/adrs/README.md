# ADRs de MemTech - Índice

**Migrados desde:** startkit-main  
**Fecha:** 2025-10-28  
**Total:** 5 ADRs

---

## 📋 ADRs Disponibles

### Core System

- **ADR-001**: [Memory System Recovery](001-memory-system-recovery.md)
  - Estado: Implementado
  - Decisión: Estrategia de recuperación de memoria L0-L3 tras reinicio
- **ADR-007**: [Long Memory Persistence and TTL](007-long-memory-persistence-and-ttl.md)
  - Estado: Implementado
  - Decisión: Políticas de persistencia y Time-To-Live para L3

- **ADR-011**: [Sistema de Blindaje MemTech](011-sistema-blindaje-memtech.md)
  - Estado: Implementado
  - Decisión: Servicios automatizados, health checks, backups y runbooks

### Agent

- **ADR-AGENT-001**: [MemTech Agent Sovereignty](ADR-AGENT-001-SOVEREIGNTY.md)
  - Estado: Implementado
  - Decisión: Autonomía y gobernanza del agente MemTech

### Monitoring

- **ADR-033**: [MemTech Monitoring System Architecture](ADR-033-memtech-monitoring-system-architecture.md)
  - Estado: Implementado
  - Decisión: Arquitectura de observabilidad con Grafana + VictoriaMetrics

---

## 🔗 Referencias

- **Especificación MemTech**: `../memtech-agent.md`
- **Guía de Uso**: `../../README.md`
- **Configuración**: `../../../config/memtech.yaml`

---

## 📖 Cómo Usar

Cada ADR sigue el formato:

```
# Título

**Status**: Implementado/Propuesto/Obsoleto
**Date**: YYYY-MM-DD
**Deciders**: Equipo MemTech

## Contexto
## Decisión
## Consecuencias
## Alternativas Consideradas
```

---

**Última actualización**: 2025-10-28  
**Mantenedor**: MemTech Team
