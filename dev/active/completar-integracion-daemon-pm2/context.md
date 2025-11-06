# Context: Daemon y PM2 Integration - Skills Fabrik

## Estado Actual del Sistema

### 🔍 Análisis Completo

#### **Daemon Implementation** ✅ **Excelente**
- **Arquitectura**: Servidor HTTP Fastify robusto y production-ready
- **API Endpoints**: 6 endpoints completos (/health, /activate, /execute, /metrics, /list, /validate)
- **Seguridad**: Sistema de políticas multinivel (S0-S2, NET) con challenge tokens
- **Performance**: Caching in-memory (60s TTL), métricas Prometheus-style
- **Base de Datos**: Integración opcional PostgreSQL con persistencia completa
- **Sandboxing**: Aislamiento de escritura con validación de paths
- **Monitoring**: Health checks, latency tracking, KPI events logging

#### **PM2 Configuration** ❌ **Crítico**
- **Estado**: NO INSTALADO (global ni localmente)
- **Configuración**: ecosystem.config.cjs existe pero es básico
- **Servicios**: Solo 2 configurados (router, skills-cli) - falta daemon
- **Management**: Gestión manual de procesos sin PM2 integration

#### **Integración Actual** ⚠️ **Parcial**
- **CLI Commands**: Comandos daemon básicos (start, status, stop manual)
- **MCP Adapter**: Wrapper completo para PM2 operations
- **Workflow**: PM2 monitoring workflow con playbooks
- **Service Discovery**: No implementado

## Problemas Críticos Identificados

### 🔴 **Issues Blockers**

1. **PM2 No Disponible**
   ```bash
   pm2 list          # -> command not found
   npm list -g pm2   # -> empty
   ```

2. **Daemon No Gestionado por PM2**
   - Usa manual spawn + detached process
   - No hay PID file management
   - No auto-restart automático
   - No está en ecosystem.config.cjs

3. **Configuración PM2 Incompleta**
   - Solo 2 servicios básicos
   - Sin health checks
   - Sin dependency management
   - Sin clustering ni monitoring avanzado

### 🟡 **Issues Mejora**

1. **Service Discovery Limitado**
   - Hardcoded ports (7727, 3000)
   - No inter-service health validation
   - Sin startup ordering

2. **Monitoring Básico**
   - Logs simples sin rotation
   - Sin alerting automático
   - Métricas limitadas

3. **Environment Management**
   - Variables de entorno dispersas
   - Sin config validation
   - Sin environment-specific settings

## Componentes Técnicos

### **Daemon Architecture Details**

```typescript
// Current Implementation
Fastify Server (Port 7727)
├── Security Layer
│   ├── Policy Levels (S0-S2, NET)
│   ├── Challenge Token System
│   └── Schema Validation (AJV)
├── Business Logic
│   ├── Skill Activation Engine
│   ├── Execution Sandbox
│   └── Caching Layer (Map-based)
├── Data Layer
│   ├── PostgreSQL Pool (optional)
│   ├── File System Operations
│   └── Event Logging (JSONL)
└── Monitoring
    ├── Prometheus Metrics
    ├── Health Checks
    └── KPI Events
```

### **PM2 Configuration Actual**

```javascript
// Current ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'router-service',      // ✅ Configurado
      cwd: './packages/router',
      script: 'node dist/index.js',
      port: 3000,
      max_memory_restart: '500M'
    },
    {
      name: 'skills-cli-service',  // ❌ Solo wrapper
      cwd: './packages/skills-cli',
      script: 'node dist/index.js',
      max_memory_restart: '300M'
    }
    // ❌ Falta daemon-service
  ]
};
```

### **Integration Points**

1. **CLI ↔ Daemon**: HTTP requests a port 7727
2. **Router ↔ Daemon**: Skill activation y execution
3. **MCP Adapter ↔ PM2**: Wrapper para comandos PM2
4. **KPI System**: JSONL events + PostgreSQL logging

## Riesgos y Consideraciones

### 🔴 **Riesgos Críticos**

1. **Production Deployment**
   - Sin PM2 no hay process management robusto
   - Daemon puede morir sin recuperación automática
   - No hay clustering para alta disponibilidad

2. **Monitoring Gaps**
   - Sin visibilidad del daemon en producción
   - Logs no centralizados
   - Sin alerting de fallos

3. **Scalability Issues**
   - Daemon singleton limita escalabilidad
   - Sin load balancing
   - Cache local no se comparte entre instancias

### 🟡 **Riesgos Técnicos**

1. **Port Conflicts**
   - Hardcoded ports pueden causar conflictos
   - Sin service discovery dinámico
   - Multi-instance deployment complicado

2. **Memory Management**
   - In-memory cache puede causar memory leaks
   - Sin límites claros de memoria
   - Sin garbage collection monitoring

## Requisitos de Solución

### **🎯 Objetivos Principales**

1. **PM2 Integration Completa**
   - Instalar PM2 global y localmente
   - Configurar daemon como servicio PM2
   - Implementar proper PID management
   - Auto-restart y recovery

2. **Service Management Robusto**
   - Health checks para todos los servicios
   - Dependency management y startup ordering
   - Monitoring y alerting comprehensivo
   - Log management y rotation

3. **Production Readiness**
   - Environment configuration por stages
   - Service discovery dinámico
   - Performance monitoring
   - Security hardening

### **📋 Criterios de Éxito**

1. **Functional**
   - ✅ Todos los servicios gestionados por PM2
   - ✅ Auto-restart automático en fallos
   - ✅ Health checks funcionando
   - ✅ Inter-service communication estable

2. **Performance**
   - ✅ Startup time < 10s por servicio
   - ✅ Memory usage dentro de límites
   - ✅ Response latency < 100ms
   - ✅ No degradation tras restarts

3. **Operational**
   - ✅ Logs centralizados y estructurados
   - ✅ Monitoring dashboard funcional
   - ✅ Troubleshooting playbooks completos
   - ✅ Documentation actualizada

## Technical Constraints

### **Environment**
- Node.js >= 18
- pnpm como package manager
- ES modules architecture
- TypeScript con strict typing

### **Integration Requirements**
- Mantener compatibilidad con CLI existente
- Preservar daemon API contracts
- No breaking changes para router
- Backward compatibility con skills

### **Security Considerations**
- Mantener policy levels S0-S2
- Preservar challenge token system
- Sandbox isolation requirements
- Database security policies

## Stakeholders y Dependencies

### **Stakeholders**
- **Development Team**: Integración con workflow actual
- **DevOps**: Operations y monitoring
- **End Users**: CLI users y daemon consumers

### **Dependencies**
- **PM2**: Instalación global y configuración
- **PostgreSQL**: Opcional pero recomendado
- **Redis**: Para cache distribuida (futuro)
- **Monitoring Tools**: Prometheus/Grafana (opcional)

## Success Metrics

### **Technical Metrics**
- Service uptime > 99.9%
- Auto-restart success rate > 95%
- Memory usage < configured limits
- Response time < 100ms

### **Operational Metrics**
- Mean Time To Recovery (MTTR) < 30s
- Zero manual intervention required
- Complete observability coverage
- Documentation completeness 100%

Este contexto proporciona el análisis completo necesario para implementar la solución robusta de integración daemon-PM2.