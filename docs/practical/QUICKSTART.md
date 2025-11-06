# Skills Fabric - QUICKSTART Pragmático

**Tiempo total estimado: 15-30 minutos**

Una guía paso a paso para dominar Skills Fabric desde cero. Sigue cada sección exactamente como se describe.

---

## 📋 SECCIÓN 1: SETUP INICIAL

**⏱️ Tiempo estimado: 5-10 minutos**

### Paso 1.1: Verificar Prerrequisitos

Ejecuta estos comandos para verificar que tienes todo lo necesario:

```bash
# Verificar Node.js (debe ser ≥18)
node --version
# → Salida esperada: v20.x.x o superior

# Verificar pnpm (debe ser ≥8)
pnpm --version
# → Salida esperada: 9.x.x o superior

# Verificar Git
git --version
# → Salida esperada: git version 2.x.x
```

**Si alguno falla**: Instala la versión correcta antes de continuar.

### Paso 1.2: Configurar el Proyecto

```bash
# Ir al directorio del proyecto
cd /Users/felipe/Developer/skills-fabrik

# Instalar dependencias (esto puede tomar 2-5 minutos)
pnpm install

# Construir todos los paquetes
pnpm -w build
# → Salida esperada: Build completo sin errores

# Linkear CLI globalmente
pnpm --filter @skills-fabrik/skills-cli link --global
# → Salida esperada: Linked successfully
```

**Verificación**: Ejecuta `skills-cli --help`. Si ves la ayuda, el setup fue exitoso.

### Paso 1.3: Iniciar Servicios PM2

```bash
# Iniciar todos los servicios en modo desarrollo
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# Verificar que todos los servicios estén corriendo
pm2 status

# Salida esperada:
# ┌──────┬────────────────┬─────────┬─────────┬─────────┬──────────┐
# │ id   │ name           │ mode    │ ↺      │ status  │ cpu      │
# ├──────┼────────────────┼─────────┼─────────┼─────────┼──────────┤
# │ 0    │ sf-daemon      │ fork    │ 0       │ online  │ 0%       │
# │ 1    │ router-service │ fork    │ 0       │ online  │ 0%       │
# │ 2    │ service-discovery│ fork  │ 0       │ online  │ 0%       │
```

**Resultado esperado**: 3 servicios en estado `online`.

### Paso 1.4: Verificar Health de los Servicios

```bash
# Verificar health del daemon (puerto 7727)
curl http://127.0.0.1:7727/health
# → Salida esperada: {"status":"ok","uptime":...}

# Verificar health del router (puerto 3000)
curl http://127.0.0.1:3000/health
# → Salida esperada: {"status":"ok","uptime":...}

# Verificar health del service discovery (puerto 8877)
curl http://127.0.0.1:8877/health
# → Salida esperada: {"status":"ok","uptime":...}
```

**Todos deben retornar status "ok"**. Si alguno falla, reinicia con:
```bash
pm2 restart <nombre-servicio>
# ej: pm2 restart sf-daemon
```

### Paso 1.5: Primer Comando Exitoso

```bash
# Verificar health usando skills-cli
skills-cli dashboard health

# Salida esperada:
# 🏥 Dashboard API Health Check
# Status: healthy
# Uptime: 1751s
# 
# 📊 Services:
#   database: not_configured
#   cache: healthy
#   schemas: healthy
```

**¡Setup completado!** Si ves esta salida, todo está funcionando correctamente.

---

## 🤔 SECCIÓN 2: WORKFLOW DE DECISIÓN

**⏱️ Tiempo estimado: 3-5 minutos**

### Decision Tree: ¿Qué workflow usar?

```
START HERE
    │
    ├─ ¿Es una tarea simple y conocida?
    │  ├─ SÍ → Usar PROMPT BUILDER v2 (--v2)
    │  └─ NO → Continue
    │
    ├─ ¿Es una feature compleja que requiere planificación?
    │  ├─ SÍ → Usar PLAN MODE
    │  └─ NO → Continue
    │
    ├─ ¿Necesitas validation específica de skills?
    │  ├─ SÍ → Usar SKILLS CHECK antes de ejecutar
    │  └─ NO → Continue
    │
    └─ ¿Es una tarea urgente/rápida?
       ├─ SÍ → Usar CLI directo sin --v2
       └─ NO → Usar PROMPT BUILDER v2 (--v2)
```

### ¿Cuándo usar PLAN MODE?

**Usar cuando:**
- Feature nuevo complejo (ej: "crear sistema de autenticación completo")
- Múltiples componentes interdependientes
- Requiere aprobación de equipo
- Planning Mode está habilitado (`SKILLS_PLANNING_MODE=true`)

**Comando:**
```bash
skills-cli plan create "tu tarea compleja" --v2
```

### ¿Cuándo usar PROMPT BUILDER?

**Usar cuando:**
- Tareas conocidas con patrones establecidos
- Quieres máxima precisión en activación de skills
- Tareas de desarrollo estándar (endpoints, componentes, etc.)

**Comando:**
```bash
skills-cli skills check "implementar endpoint POST /api/users" --v2
```

### ¿Cuándo usar CLI directo?

**Usar cuando:**
- Tareas muy específicas y simples
- Ya sabes exactamente qué hacer
- Modo rápido/urgente

**Comando:**
```bash
skills-cli skills check "crear componente Button"
# Sin --v2 para respuesta más rápida
```

---

## 🚀 SECCIÓN 3: FLUJO COMPLETO PASO A PASO

**⏱️ Tiempo estimado: 10-15 minutos**

### Ejemplo Real: Crear Endpoint POST /api/users

**Contexto**: Necesitas crear un endpoint de usuarios en tu API REST.

#### Paso 3.1: Verificar Servicios (1 minuto)

```bash
# Siempre empezar verificando que todo esté corriendo
skills-cli dashboard health

# ✅ Si todo está "healthy", continuar
# ❌ Si hay errores, ejecutar:
pm2 restart all
```

#### Paso 3.2: Analizar Activación de Skills (2 minutos)

```bash
skills-cli skills check "crear endpoint POST /api/users con validacion y manejo de errores" --v2

# Salida esperada:
# 🔍 Enhanced analysis with Prompt Builder v2:
#   📊 Expected score: 0.75
#   🏷️  TAGs coverage: 85%
#   🔗 Template coverage: 100%
#   📋 Relevant tags: [K:BACKEND-ARCHITECTURE], [C:API-DEVELOPMENT], [U:VALIDATION]
#   ⚡ Skill activations: backend-dev-guidelines, api-design-and-testing, database-verification
```

**¿Qué significa?**
- `Expected score: 0.75` → Buena activación (threshold típico: 0.6)
- `Skill activations: backend-dev-guidelines` → Skills relevantes activados
- Tu prompt es claro y específico ✓

#### Paso 3.3: Decidir Workflow (30 segundos)

**¿Este endpoint es parte de un feature complejo?** 
- NO (es una tarea específica) → Continuar con prompt directo
- SÍ (ej: "crear sistema de autenticación completo") → Usar plan mode

Para nuestro ejemplo: **Usar prompt directo**

#### Paso 3.4: Ejecutar Tarea (2-3 minutos)

Ahora ejecuta tu tarea en Claude Code/Claude.ai:

**Prompt para Claude:**
```
Crear endpoint POST /api/users con:
- Validación de datos de entrada usando Zod
- Manejo de errores HTTP (400, 409, 500)
- Siguiendo patrones backend-dev-guidelines
- Incluir tests de integración básicos
- Documentación OpenAPI

Skills activados: backend-dev-guidelines, api-design-and-testing, database-verification
```

**Qué esperar**: Claude debería aplicar las mejores prácticas de los skills activados, incluyendo:
- Separación de capas (routes → controllers → services → repositories)
- Validación en controladores
- Manejo de errores consistente
- Tests básicos

#### Paso 3.5: Verificar Post-Hook/Stop Hook (1 minuto)

Después de que Claude termine, el sistema automáticamente ejecutará:

```bash
# Stop hooks se ejecutan automáticamente
# Verifica: build, lint, prettier, tests

# Si quieres verificar manualmente:
pnpm test:phase3-quick
# → Salida esperada: Todos los tests pasando
```

#### Paso 3.6: Confirmar NMLB (No Mess Left Behind) (30 segundos)

Verificar que todo está limpio:

```bash
# Verificar linting
pnpm lint
# → Salida esperada: No errors

# Verificar formato
pnpm format
# → Archivos formateados si es necesario

# Verificar que no hay archivos temporales
git status
# → Solo archivos de tu tarea, sin archivos extra
```

**¡Flujo completado exitosamente!** ✅

---

## 📚 SECCIÓN 4: EJEMPLOS PRÁCTICOS

### Ejemplo 1: FEATURE - Crear Sistema de Autenticación

**Contexto**: Feature complejo que requiere planificación.

#### Workflow:

```bash
# 1. Crear plan estructurado
skills-cli plan create "implementar sistema completo de autenticación con JWT" --v2

# 2. Verificar plan generado
ls -la dev/plans/
# → Archivo: plan-autenticacion-jwt-<timestamp>.md

# 3. Aprobar plan (si planning mode está habilitado)
skills-cli plan save <plan-id> --approve

# 4. Ejecutar según el plan
# Cada sección del plan puede ejecutarse como prompt separado
```

**Plan generado incluirá:**
- CLOOP phases (Clarify, Layout, Operate, Observe, Reflect)
- Tasks específicas con checkboxes
- Skills relevantes por tarea
- Success criteria

### Ejemplo 2: BUGFIX - Arreglar Query Ineficiente

**Contexto**: Bug en query SQL/Prisma.

#### Workflow:

```bash
# 1. Identificar el problema
skills-cli skills check "optimizar query prisma lenta con N+1 problem" --v2

# 2. Activar skills de performance y database
# Salida esperada:
# ⚡ Skill activations: performance-optimization, database-management, backend-dev-guidelines

# 3. Ejecutar fix en Claude:
# Prompt:
"""
Arreglar problema N+1 en este código:
- Identificar lazy loading innecesario
- Optimizar con eager loading o include
- Añadir índices si es necesario
- Mantener single responsibility principle

Skills: performance-optimization, database-management
```

### Ejemplo 3: REFACTOR - Optimizar Componente React

**Contexto**: Código funcionando pero necesita optimización.

#### Workflow:

```bash
# 1. Verificar skills de frontend/performance
skills-cli skills check "refactorizar componente React para mejorar performance con React.memo y hooks optimizados" --v2

# 2. Ejecutar refactor:
"""
Refactorizar componente UserProfile:
- Implementar React.memo donde sea apropiado
- Usar useMemo para cálculos pesados
- Optimizar re-renders innecesarios
- Mantener accesibilidad
- Añadir tests de performance

Skills: frontend-dev-guidelines, performance-optimization
"""

# 3. Verificar mejoras
skills-cli dashboard metrics
# → Ver latencia reducida
```

---

## ✅ SECCIÓN 5: VERIFICACIÓN Y TROUBLESHOOTING

**⏱️ Tiempo estimado: 5-10 minutos**

### Checklist Completo del Sistema

```bash
# 1. Verificar PM2 Services
pm2 status
# ✅ Esperado: 3 servicios online

# 2. Verificar Health Endpoints
curl http://127.0.0.1:7727/health  # Daemon
curl http://127.0.0.1:3000/health  # Router
curl http://127.0.0.1:8877/health # Discovery
# ✅ Esperado: Todos con status "ok"

# 3. Verificar Skills Registry
skills-cli skills index ./skills --out ./registry/index.json
# ✅ Esperado: Registry actualizado sin errores

# 4. Verificar Linting
skills-cli skills lint ./skills --strict
# ✅ Esperado: Todos los skills validados

# 5. Verificar Build
pnpm -w build
# ✅ Esperado: Build exitoso

# 6. Verificar Tests
pnpm test:phase3-quick
# ✅ Esperado: Tests pasando
```

**Resultado final**: Si todos los checks pasan, tu sistema está 100% funcional. ✅

### Comandos de Verificación Rápida

```bash
# Health check completo (30 segundos)
skills-cli dashboard health && echo "✅ Sistema saludable"

# Test rápido de activación (10 segundos)
skills-cli skills check "test endpoint" --v2 | grep -q "Skill activations" && echo "✅ Activación funcionando"

# Verificar logs (si algo falla)
pm2 logs <servicio> --lines 50
# ej: pm2 logs sf-daemon --lines 50
```

### Troubleshooting Común

#### ❌ Error: "skills-cli: command not found"

**Solución:**
```bash
# Re-linkear CLI
cd /Users/felipe/Developer/skills-fabrik
pnpm --filter @skills-fabrik/skills-cli link --global

# O usar alternativo
node packages/skills-cli/dist/index.js --help
```

#### ❌ Error: "sf-daemon port 7727 already in use"

**Solución:**
```bash
# Matar proceso en el puerto
lsof -ti:7727 | xargs kill -9

# O reiniciar PM2
pm2 delete all
pm2 start scripts/pm2/ecosystem.config.cjs --env development
```

#### ❌ Error: "Skills not activating"

**Solución:**
```bash
# Regenerar registry
skills-cli skills index ./skills --out ./registry/index.json

# Verificar threshold (bajar temporalmente)
skills-cli skills check "tu tarea" --threshold 0.3

# Verificar skills disponibles
jq '.skills[].id' registry/index.json | head -20
```

#### ❌ Error: "Performance slow"

**Solución:**
```bash
# Verificar métricas
skills-cli dashboard metrics

# Limpiar cache
rm -rf .sf/cache

# Reiniciar daemon
pm2 restart sf-daemon
```

#### ❌ Error: "Tests failing"

**Solución:**
```bash
# Verificar tests específicos
pnpm test:activation-cases

# O ejecutar suite completa
pnpm test:phase3-quick

# Si es lint/prettier:
pnpm lint:fix
pnpm format
```

#### ❌ Error: "Planning mode blocks execution"

**Solución:**
```bash
# Verificar si planning mode está habilitado
echo $SKILLS_PLANNING_MODE
# → true = habilitado, false = deshabilitado

# Deshabilitar temporalmente (si no necesitas plan)
export SKILLS_PLANNING_MODE=false

# O crear plan requerido
skills-cli plan create "tu tarea" --v2
skills-cli plan save <id> --approve
```

### Comandos de Diagnóstico Profundo

```bash
# Ver logs detallados
pm2 logs all --lines 100

# Verificar uso de memoria
pm2 monit

# Verificar conexiones de servicios
curl http://127.0.0.1:8877/services
# → Debe mostrar: sf-daemon, router-service, service-discovery

# Test de integración completo
pnpm test:integration

# Verificar skills coverage
jq '.skills | length' registry/index.json
# → Debe mostrar: 25+ skills indexados

# Verificar configuración de hooks
cat .cursor/hooks/hooks-config.json
# → Verificar thresholds y configuración
```

### Quick Fixes (60 segundos o menos)

```bash
# Fix 1: Reiniciar todo
pm2 restart all && sleep 2 && skills-cli dashboard health

# Fix 2: Re-index skills
skills-cli skills index ./skills --out ./registry/index.json && echo "✅ Registry updated"

# Fix 3: Clear cache + rebuild
rm -rf .sf/cache .sf/l0 && pnpm -w build && echo "✅ Cache cleared & rebuilt"

# Fix 4: Full reset (si nada funciona)
pm2 delete all && pnpm install && pnpm -w build && pm2 start ecosystem.config.cjs --env development
```

---

## 📊 Time Estimates por Sección

| Sección | Tiempo | Descripción |
|---------|--------|-------------|
| **Setup Inicial** | 5-10 min | Instalación y configuración |
| **Workflow Decisión** | 3-5 min | Entender cuándo usar cada modo |
| **Flujo Completo** | 10-15 min | Ejemplo real end-to-end |
| **Ejemplos Prácticos** | 5 min por ejemplo | 3 workflows diferentes |
| **Verificación** | 5-10 min | Troubleshooting y fix |

**Total**: 15-30 minutos para dominar Skills Fabric

---

## 🎯 Quick Reference Card

**Comandos Esenciales:**
```bash
# Health check
skills-cli dashboard health

# Skill activation test
skills-cli skills check "tu tarea" --v2

# Create plan
skills-cli plan create "feature compleja" --v2

# Verify system
pm2 status && pnpm test:phase3-quick

# Full restart
pm2 restart all && skills-cli dashboard health
```

**Workflow Decisión (30 segundos):**
```
¿Plan complejo? → plan create
¿Tarea conocida? → skills check --v2
¿Urgente? → skills check (sin --v2)
```

---

## 🚀 ¡Próximos Pasos!

1. **Practica los 3 ejemplos** de la Sección 4
2. **Explora skills disponibles**: `jq '.skills[].id' registry/index.json`
3. **Lee la guía completa**: `docs/practical/SKILLS-FABRIK-USAGE-GUIDE.md`
4. **Monitorea métricas**: `skills-cli dashboard system`
5. **Únete a la comunidad**: Comparte tus workflows optimizados

---

**¿Todo funcionando? ¡Perfecto!** 🎉 

Ahora tienes Skills Fabric corriendo y puedes empezar a usar el poder de los skills activados automáticamente para acelerar tu desarrollo.

**¿Algo no funciona?** Usa la Sección 5 para troubleshooting rápido.
