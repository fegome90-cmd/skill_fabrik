# DevDocs: Script activate-sprint.js

---

## 📋 **Información del Documento**

| Campo | Valor |
|-------|-------|
| **Archivo** | `08-scripts/activate-sprint.js` |
| **Versión** | 2.0 |
| **Creado** | 2024-11-02 |
| **Última Actualización** | 2025-11-02 |
| **Owner** | Engineering Team |
| **Propósito** | Script de automatización para activación de skills por tipo de sprint |
| **Cambios v2.0** | Threshold optimizado 0.45, fuzzy matching habilitado |

---

## 🎯 **Objetivos del Script**

### **Objetivo Principal**
Automatizar la activación de skills de manera consistente y rápida basado en:
- ✅ Tipo de sprint (7 tipos soportados)
- ✅ ID del sprint
- ✅ Prioridades específicas del equipo
- ✅ Modo de configuración (normal/estricto)

### **Objetivos Específicos**
1. **Activación automática**: Skills configuradas en < 2 minutos
2. **Configuración inteligente**: Thresholds dinámicos por enforcement
3. **Verificación integrada**: Health checks automáticos
4. **Monitoreo iniciado**: Dashboard y logs activos
5. **Feedback inmediato**: Resumen claro y accionable

---

## 📊 **Configuración de Perfiles**

### **SPRINT_PROFILES Object**

```javascript
const SPRINT_PROFILES = {
  feature: {
    skills: [
      'backend-dev-guidelines',
      'api-design-and-testing',
      'database-management',
      'database-verification',
      'code-review-checklist'
    ],
    optional: [
      'performance-optimization',
      'test-automation',
      'code-quality-guidelines'
    ],
    thresholds: {
      block: 0.2,
      require: 0.55,      // v2.0: 0.4 → 0.55
      warn: 0.55,         // v2.0: 0.5 → 0.55
      suggest: 0.55       // v2.0: 0.6 → 0.55
    },
    specialConfig: {
      'database-verification': 'ALWAYS_ON',
      'code-review-checklist': 'MANDATORY'
    }
  },
  bugfix: {
    skills: [
      'root-cause-tracing',
      'systematic-debugging',
      'error-pattern-standardization'
    ],
    optional: [
      'test-driven-debugging',
      'logging-best-practices'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'deep-analysis': 'ENABLED',
      'trace-logging': 'ENHANCED'
    }
  },
  refactor: {
    skills: [
      'backend-architecture-patterns',
      'error-pattern-standardization',
      'code-review-checklist'
    ],
    optional: [
      'performance-optimization',
      'test-coverage-guidelines'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    }
  },
  security: {
    skills: [
      'security-testing-guide',
      'secrets-and-config',
      'database-verification',
      'compliance-checklist'
    ],
    optional: [
      'vulnerability-scanning'
    ],
    thresholds: {
      block: 0.1,
      require: 0.3,
      warn: 0.4,
      suggest: 0.5
    },
    specialConfig: {
      'strict-mode': 'ENFORCED',
      'all-block': true
    }
  },
  performance: {
    skills: [
      'performance-optimization',
      'backend-architecture-patterns',
      'caching-strategies'
    ],
    optional: [
      'monitoring-setup',
      'database-performance'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'profiling': 'ENABLED',
      'metrics-collection': 'AGGRESSIVE'
    }
  },
  testing: {
    skills: [
      'visual-regression-testing',
      'webapp-testing-guide',
      'api-testing-best-practices'
    ],
    optional: [
      'test-automation',
      'test-coverage-guidelines'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'auto-coverage': 'ON'
    }
  },
  migration: {
    skills: [
      'database-migration',
      'data-safety',
      'rollback-strategies'
    ],
    optional: [
      'backup-strategies',
      'migration-testing'
    ],
    thresholds: {
      block: 0.1,
      require: 0.3,
      warn: 0.4,
      suggest: 0.5
    },
    specialConfig: {
      'dry-run': 'MANDATORY',
      'backup-before': 'MANDATORY'
    }
  }
};
```

---

## 🔧 **Funciones Principales**

### **1. parseArgs()**

**Propósito**: Parsear argumentos de línea de comandos

**Parámetros**:
- `argv`: Array de argumentos

**Retorna**: Objeto con argumentos parseados

**Ejemplo de uso**:
```javascript
const args = parseArgs(['--type', 'feature', '--sprint', 'S15', '--priority', 'backend,api']);

console.log(args);
// {
//   type: 'feature',
//   sprint: 'S15',
//   priority: 'backend,api'
// }
```

### **2. verifyServices()**

**Propósito**: Verificar que todos los servicios estén online

**Servicios verificados**:
- sf-daemon (puerto 7727)
- router-service (puerto 3000)
- service-discovery (puerto 8877)

**Comando ejecutado**:
```bash
pm2 jlist | jq '.[] | select(.name=="<service>") | .pm2_env.status'
```

**Lógica**:
1. Para cada service, ejecutar comando PM2
2. Verificar status === 'online'
3. Si algún servicio está offline, throw error
4. Si todos están online, print ✅ y continuar

**Manejo de errores**:
```javascript
catch (error) {
  console.log(chalk.red(`  ✗ ${service}: offline`));
  throw new Error(`Service ${service} is not running. Run: pm2 start scripts/pm2/ecosystem.config.cjs --env development`);
}
```

### **3. loadProfile()**

**Propósito**: Cargar configuración del perfil basado en tipo de sprint

**Parámetros**:
- `type`: Tipo de sprint
- `priorities`: Array de prioridades
- `strictMode`: Boolean

**Lógica**:
1. Obtener profile de SPRINT_PROFILES[type]
2. Filtrar skills por prioridades (si se especifican)
3. Si strictMode: filtrar solo skills críticas
4. Retornar objeto con skills, optional, thresholds, specialConfig

**Ejemplo**:
```javascript
const config = loadProfile('feature', ['backend', 'api'], false);

// config:
// {
//   skills: ['backend-dev-guidelines', 'api-design-and-testing', ...],
//   optional: ['performance-optimization', ...],
//   thresholds: { block: 0.2, require: 0.4, ... },
//   specialConfig: { ... }
// }
```

### **4. activateSkills()**

**Propósito**: Activar skills específicas con enforcement apropiado

**Parámetros**:
- `skills`: Array de nombres de skills
- `thresholds`: Objeto con thresholds por enforcement
- `specialConfig`: Configuración especial (opcional)

**Lógica**:
1. Para cada skill:
   - Determinar enforcement con getEnforcement()
   - Verificar specialConfig
   - Ejecutar: `skills-cli skills activate <skill> --enforcement <enforcement>`
   - Print resultado (✓ o ✗)

**Determinación de enforcement**:
```javascript
function getEnforcement(skill, thresholds) {
  if (skill.includes('verification') || skill.includes('security')) {
    return thresholds.block < 0.25 ? 'block' : 'require';
  }
  if (skill.includes('review') || skill.includes('checklist')) {
    return 'require';
  }
  if (skill.includes('error') || skill.includes('debug') || skill.includes('performance')) {
    return 'warn';
  }
  return 'suggest';
}
```

### **5. configureThresholds()**

**Propósito**: Aplicar thresholds dinámicos por enforcement level

**Parámetros**:
- `thresholds`: Objeto {block, require, warn, suggest}

**Lógica**:
1. Crear directorio .skills-config si no existe
2. Guardar thresholds en archivo JSON con timestamp
3. Intentar aplicar thresholds con skills-cli
4. Si falla, warning (no bloquea)

**Archivo generado**:
```json
{
  "block": 0.2,
  "require": 0.4,
  "warn": 0.5,
  "suggest": 0.6
}
```

### **6. applySpecialConfig()**

**Propósito**: Aplicar configuraciones especiales para skills específicas

**Parámetros**:
- `config`: Objeto con skill -> specialConfig mapping

**Ejemplos de specialConfig**:
```json
{
  'database-verification': 'ALWAYS_ON',
  'code-review-checklist': 'MANDATORY',
  'strict-mode': 'ENFORCED'
}
```

**Lógica**:
1. Para cada [skill, specialConfig]:
   - Ejecutar: `skills-cli skills configure <skill> --special "<specialConfig>"`
   - Print resultado

### **7. verifyActivation()**

**Propósito**: Verificar que las skills se activaron correctamente

**Lógica**:
1. Ejecutar: `skills-cli skills list --active`
2. Contar skills activas (regex /✓/g)
3. Retornar objeto {activated, total}

**Ejemplo de salida**:
```
skills-cli skills list --active
# Output:
# ✓ backend-dev-guidelines (suggest)
# ✓ api-design-and-testing (suggest)
# ✓ database-management (require)
```

### **8. startMonitoring()**

**Propósito**: Iniciar monitoreo en background para el sprint

**Parámetros**:
- `sprintId`: ID del sprint
- `sprintType`: Tipo de sprint

**Lógica**:
1. Crear directorio .skills-logs si no existe
2. Definir logFile: `.skills-logs/sprint-<sprintId>.jsonl`
3. Ejecutar: `pm2 start "node 08-scripts/monitor-activations.js --sprint <sprintId> --output <logFile>" --name "monitor-<sprintId>"`
4. Print resultado

---

## 🚀 **Flujo de Ejecución**

### **main() Function**

```javascript
async function main() {
  console.log(chalk.blue.bold('\n🚀 SPRINT ACTIVATION - Skills Fabric\n'));

  // 1. Validar argumentos
  if (!args.type) {
    console.error(chalk.red('❌ Error: --type es requerido'));
    process.exit(1);
  }

  const sprintType = args.type;
  const sprintId = args.sprint || 'UNKNOWN';
  const priorities = args.priority ? args.priority.split(',') : [];
  const strictMode = args['strict-mode'] === 'true';

  // 2. Verificar tipo válido
  if (!SPRINT_PROFILES[sprintType]) {
    console.error(chalk.red(`❌ Error: Tipo de sprint "${sprintType}" no válido`));
    process.exit(1);
  }

  const profile = SPRINT_PROFILES[sprintType];

  try {
    // 3. Verificar servicios
    console.log(chalk.blue('1️⃣ Verificando servicios...'));
    await verifyServices();

    // 4. Cargar perfil
    console.log(chalk.blue(`\n2️⃣ Cargando perfil "${sprintType}"...`));
    const config = loadProfile(sprintType, priorities, strictMode);
    console.log(chalk.green(`✅ Perfil cargado: ${config.skills.length} skills principales`));

    // 5. Activar skills principales
    console.log(chalk.blue('\n3️⃣ Activando skills...'));
    await activateSkills(config.skills, profile.thresholds, profile.specialConfig);

    // 6. Activar skills opcionales
    if (config.optional.length > 0) {
      console.log(chalk.blue('\n4️⃣ Activando skills opcionales...'));
      await activateSkills(config.optional, profile.thresholds);
      console.log(chalk.green(`✅ ${config.optional.length} skills opcionales activadas`));
    }

    // 7. Configurar thresholds
    console.log(chalk.blue('\n5️⃣ Configurando thresholds...'));
    configureThresholds(profile.thresholds);

    // 8. Aplicar configuración especial
    if (Object.keys(profile.specialConfig).length > 0) {
      console.log(chalk.blue('\n6️⃣ Aplicando configuración especial...'));
      applySpecialConfig(profile.specialConfig);
    }

    // 9. Verificar activación
    console.log(chalk.blue('\n7️⃣ Verificando activación...'));
    const verification = await verifyActivation();
    console.log(chalk.green(`✅ ${verification.activated} skills activas de ${verification.total}`));

    // 10. Iniciar monitoreo
    console.log(chalk.blue('\n8️⃣ Iniciando monitoreo...'));
    startMonitoring(sprintId, sprintType);

    // 11. Mostrar resumen
    printSummary(sprintId, sprintType, config);

    console.log(chalk.green.bold('\n✅ SPRINT ACTIVATION COMPLETADO\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error durante activación:'), error.message);
    if (args.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
```

---

## 💻 **Uso del Script**

### **Sintaxis**

```bash
node 08-scripts/activate-sprint.js --type <TIPO> --sprint <ID> [OPCIONES]
```

### **Parámetros**

| Parámetro | Requerido | Descripción | Ejemplo |
|-----------|-----------|-------------|---------|
| `--type` | ✅ Sí | Tipo de sprint (7 tipos) | `feature`, `bugfix`, `security` |
| `--sprint` | ❌ No | ID del sprint | `S15`, `SPRINT-001` |
| `--priority` | ❌ No | Prioridades (comma-separated) | `backend,api,database` |
| `--strict-mode` | ❌ No | Modo estricto (true/false) | `true` (para security) |
| `--debug` | ❌ No | Mostrar stack trace | `--debug` |

### **Ejemplos de Uso**

#### **Ejemplo 1: Feature Development**
```bash
node 08-scripts/activate-sprint.js \
  --type feature \
  --sprint S15 \
  --priority backend,api,database

# Salida esperada:
# ✅ sf-daemon: online
# ✅ router-service: online
# ✅ service-discovery: online
# ✅ Perfil cargado: 5 skills principales
# ✅ backend-dev-guidelines (suggest)
# ✅ api-design-and-testing (suggest)
# ✅ database-management (require)
# ✅ database-verification (block)
# ✅ code-review-checklist (require)
# ✅ 3 skills opcionales activadas
# ✅ Thresholds configurados
# ✅ 5 skills activas de 5
# ✅ Monitoreo iniciado
```

#### **Ejemplo 2: Bug Fixing**
```bash
node 08-scripts/activate-sprint.js \
  --type bugfix \
  --sprint S15 \
  --priority debugging,root-cause

# Activa: root-cause-tracing, systematic-debugging, error-pattern-standardization
```

#### **Ejemplo 3: Security Audit**
```bash
node 08-scripts/activate-sprint.js \
  --type security \
  --sprint S15 \
  --strict-mode ENFORCED

# Activa con thresholds más bajos:
# block: 0.1, require: 0.3, warn: 0.4, suggest: 0.5
```

#### **Ejemplo 4: Solo Backend**
```bash
node 08-scripts/activate-sprint.js \
  --type feature \
  --sprint S15 \
  --priority backend

# Solo skills que contienen 'backend' en el nombre
```

---

## 📊 **Salida del Script**

### **Print Summary**

```javascript
function printSummary(sprintId, sprintType, config) {
  console.log(chalk.blue.bold('\n📊 RESUMEN DE ACTIVACIÓN\n'));
  console.log(chalk.gray(`Sprint ID: ${sprintId}`));
  console.log(chalk.gray(`Tipo: ${sprintType}`));
  console.log(chalk.gray(`Fecha: ${new Date().toISOString()}\n`));

  console.log(chalk.blue('Skills Principales:'));
  config.skills.forEach(skill => console.log(chalk.white(`  • ${skill}`)));

  if (config.optional.length > 0) {
    console.log(chalk.blue('\nSkills Opcionales:'));
    config.optional.forEach(skill => console.log(chalk.gray(`  • ${skill}`)));
  }

  console.log(chalk.blue('\nThresholds:'));
  Object.entries(config.thresholds).forEach(([level, value]) => {
    console.log(chalk.white(`  • ${level}: ${value}`));
  });

  console.log(chalk.blue('\nRecursos:'));
  console.log(chalk.cyan(`  Dashboard: http://localhost:8888`));
  console.log(chalk.cyan(`  Logs: .skills-logs/sprint-${sprintId}.jsonl`));
  console.log(chalk.cyan(`  Config: .skills-config/`));

  console.log(chalk.blue('\nComandos Útiles:'));
  console.log(chalk.cyan(`  Ver activaciones: skills-cli skills check "test" --v2`));
  console.log(chalk.cyan(`  Métricas: pnpm kpi:show`));
  console.log(chalk.cyan(`  Health: skills-cli dashboard health`));
}
```

**Ejemplo de salida completa**:
```
🚀 SPRINT ACTIVATION - Skills Fabric

1️⃣ Verificando servicios...
  ✓ sf-daemon: online
  ✓ router-service: online
  ✓ service-discovery: online

2️⃣ Cargando perfil "feature"...
✅ Perfil cargado: 5 skills principales

3️⃣ Activando skills...
  ✓ backend-dev-guidelines (suggest)
  ✓ api-design-and-testing (suggest)
  ✓ database-management (require)
  ✓ database-verification (block)
  ✓ code-review-checklist (require)

4️⃣ Activando skills opcionales...
  ✓ performance-optimization (warn)
  ✓ test-automation (suggest)
  ✓ code-quality-guidelines (require)
✅ 3 skills opcionales activadas

5️⃣ Configurando thresholds...
  ✓ Thresholds guardados en .skills-config/thresholds-1699000000000.json

6️⃣ Aplicando configuración especial...
  ✓ database-verification: ALWAYS_ON
  ✓ code-review-checklist: MANDATORY

7️⃣ Verificando activación...
✅ 8 skills activas de 8

8️⃣ Iniciando monitoreo...
  ✓ Monitoreo iniciado: .skills-logs/sprint-S15.jsonl

📊 RESUMEN DE ACTIVACIÓN

Sprint ID: S15
Tipo: feature
Fecha: 2024-11-02T15:30:00.000Z

Skills Principales:
  • backend-dev-guidelines
  • api-design-and-testing
  • database-management
  • database-verification
  • code-review-checklist

Skills Opcionales:
  • performance-optimization
  • test-automation
  • code-quality-guidelines

Thresholds:
  • block: 0.2
  • require: 0.4
  • warn: 0.5
  • suggest: 0.6

Recursos:
  Dashboard: http://localhost:8888
  Logs: .skills-logs/sprint-S15.jsonl
  Config: .skills-config/

Comandos Útiles:
  Ver activaciones: skills-cli skills check "test" --v2
  Métricas: pnpm kpi:show
  Health: skills-cli dashboard health

✅ SPRINT ACTIVATION COMPLETADO
```

---

## ⚠️ **Manejo de Errores**

### **Validación de Argumentos**

```javascript
if (!args.type) {
  console.error(chalk.red('❌ Error: --type es requerido'));
  console.log(chalk.yellow('Tipos disponibles: feature, bugfix, refactor, security, performance, testing, migration'));
  process.exit(1);
}

if (!SPRINT_PROFILES[sprintType]) {
  console.error(chalk.red(`❌ Error: Tipo de sprint "${sprintType}" no válido`));
  console.log(chalk.yellow('Tipos disponibles:'), Object.keys(SPRINT_PROFILES).join(', '));
  process.exit(1);
}
```

### **Error en verifyServices()**

```javascript
catch (error) {
  console.log(chalk.red(`  ✗ ${service}: offline`));
  throw new Error(`Service ${service} is not running. Run: pm2 start scripts/pm2/ecosystem.config.cjs --env development`);
}
```

### **Error en main()**

```javascript
} catch (error) {
  console.error(chalk.red('\n❌ Error durante activación:'), error.message);
  if (args.debug) {
    console.error(error.stack);
  }
  process.exit(1);
}
```

---

## 📝 **Logs y Archivos Generados**

### **Archivos Creados**

1. **Thresholds Config**
   - Ruta: `.skills-config/thresholds-<timestamp>.json`
   - Contenido: Thresholds por enforcement level

2. **Monitoring Log**
   - Ruta: `.skills-logs/sprint-<ID>.jsonl`
   - Formato: JSON Lines (un JSON por línea)
   - Contenido: Eventos de activación en tiempo real

### **PM2 Process**

```bash
# Proceso iniciado
pm2 start "node 08-scripts/monitor-activations.js --sprint S15 --output .skills-logs/sprint-S15.jsonl" \
  --name "monitor-S15"

# Listar procesos
pm2 list | grep monitor

# Ver logs
pm2 logs monitor-S15

# Detener
pm2 stop monitor-S15
pm2 delete monitor-S15
```

---

## 🧪 **Testing del Script**

### **Test Manual**

#### **Test 1: Feature Development**
```bash
node 08-scripts/activate-sprint.js --type feature --sprint TEST-1
# Verificar: Skills activadas, thresholds configurados, monitoreo iniciado
```

#### **Test 2: Bug Fixing**
```bash
node 08-scripts/activate-sprint.js --type bugfix --sprint TEST-2
# Verificar: Debug skills activadas
```

#### **Test 3: Security**
```bash
node 08-scripts/activate-sprint.js --type security --sprint TEST-3 --strict-mode ENFORCED
# Verificar: Thresholds más bajos, configuración estricta
```

### **Test de Verificación**

```bash
# Verificar skills activas
skills-cli skills list --active | grep -E "(backend-dev|api-design|database)"

# Verificar thresholds
cat .skills-config/thresholds-*.json | head -5

# Verificar monitoreo
pm2 list | grep monitor-TEST
```

---

## 🔍 **Troubleshooting**

### **Problema: "Error: --type es requerido"**

**Causa**: No se especificó parámetro --type

**Solución**:
```bash
node 08-scripts/activate-sprint.js --type feature --sprint S15
```

### **Problema: "Tipo de sprint no válido"**

**Causa**: Tipo de sprint no existe en SPRINT_PROFILES

**Solución**:
```bash
# Verificar tipos disponibles
node 08-scripts/activate-sprint.js --type help

# Usar tipo válido
node 08-scripts/activate-sprint.js --type feature --sprint S15
```

### **Problema: Servicio offline**

**Causa**: Router o Daemon no está corriendo

**Solución**:
```bash
# Verificar status
pm2 status

# Iniciar servicios
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# Re-ejecutar script
node 08-scripts/activate-sprint.js --type feature --sprint S15
```

### **Problema: "No se pudieron activar skills"**

**Causa**: skills-cli no encontrado o skills no existen

**Solución**:
```bash
# Verificar skills-cli
which skills-cli
# o
node packages/skills-cli/dist/index.js --version

# Build skills-cli si es necesario
pnpm --filter @skills-fabrik/skills-cli build

# Re-ejecutar script
node 08-scripts/activate-sprint.js --type feature --sprint S15
```

---

## 📚 **Dependencias**

### **Dependencias de Node.js**
```javascript
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
```

### **Comandos Externos**
- `pm2` - Gestión de procesos
- `skills-cli` - CLI de Skills Fabric
- `jq` - Procesamiento JSON

### **Servicios Requeridos**
- sf-daemon (puerto 7727)
- router-service (puerto 3000)
- service-discovery (puerto 8877)

---

## 📊 **Estadísticas**

| Métrica | Valor |
|---------|-------|
| **Líneas de código** | ~400 |
| **Funciones** | 10 |
| **Tipos de sprint** | 7 |
| **Perfiles configurados** | 7 |
| **Tiempo de ejecución** | 10-30 segundos |
| **Skills por perfil** | 5-7 principales, 2-3 opcionales |

---

## 🚀 **Optimizaciones CLOOP v2.0** ✨

### **Nuevas Características Implementadas**

#### **1. Threshold Optimizado**
- **Antes**: { block: 0.2, require: 0.4, warn: 0.5, suggest: 0.6 }
- **Ahora**: { block: 0.2, require: 0.55, warn: 0.55, suggest: 0.55 }
- **Impacto**: Mejor activación de skills relevantes

#### **2. Fuzzy Matching**
- **Activado**: Sí
- **Threshold**: 0.7
- **Beneficio**: Detecta variaciones y typos en keywords

#### **3. Contextual Boost**
- **Activado**: Sí
- **Factores**: fileContext (0.15), recentActivation (0.10), keywordDensity (0.05), intentMatch (0.12)
- **Beneficio**: Mayor precisión contextual

#### **4. History Reuse**
- **Activado**: Sí
- **Tamaño**: 50 entradas
- **Beneficio**: Optimiza activaciones repetitivas

#### **5. Max Skills Aumentado**
- **Antes**: 5
- **Ahora**: 7
- **Beneficio**: Más skills activadas por prompt

### **Configuración Hooks v2.0**
```json
{
  "userPromptSubmit": {
    "threshold": 0.45,
    "maxSkills": 7,
    "fuzzyMatch": true,
    "contextualBoost": true,
    "historyReuse": true
  }
}
```

### **Métricas Objetivo v2.0**
| Métrica | v1.0 | v2.0 | Mejora |
|---------|------|------|--------|
| Activaciones relevantes | 91% | 95% | +4% |
| Falsos positivos | 4.3% | 3% | -30% |
| Falsos negativos | 5.2% | 3% | -42% |
| Tiempo activación | 3.2min | 2min | -37% |

---

### **Añadir Nuevo Tipo de Sprint**

```javascript
// En SPRINT_PROFILES
const SPRINT_PROFILES = {
  // ... tipos existentes

  'nuevo-tipo': {
    skills: [
      'skill-1',
      'skill-2',
      'skill-3'
    ],
    optional: [
      'skill-4',
      'skill-5'
    ],
    thresholds: {
      block: 0.2,
      require: 0.4,
      warn: 0.5,
      suggest: 0.6
    },
    specialConfig: {
      'skill-1': 'SPECIAL_VALUE'
    }
  }
};
```

**Uso**:
```bash
node 08-scripts/activate-sprint.js --type nuevo-tipo --sprint S99
```

### **Personalizar Enforcement por Skill**

```javascript
// En getEnforcement()
function getEnforcement(skill, thresholds) {
  // Lógica existente...

  // Añadir casos específicos
  if (skill.includes('mi-skill-personalizada')) {
    return 'require'; // Siempre require
  }

  return 'suggest'; // Default
}
```

---

## ✅ **Checklist de Validación**

### **Antes del Deploy**
- [ ] Script probado con 7 tipos de sprint
- [ ] Verificar todas las funciones
- [ ] Test de error handling
- [ ] Documentación actualizada

### **Después del Deploy**
- [ ] Test con sprint real
- [ ] Verificar logs generados
- [ ] Confirmar monitoreo activo
- [ ] Feedback del equipo

---

## 🎓 **Guía para Desarrolladores**

### **Para Modificar el Script**
1. Editar `08-scripts/activate-sprint.js`
2. Probar con `--type feature --sprint TEST-<N>`
3. Verificar funciones individuales
4. Documentar cambios

### **Para Depurar**
```bash
# Ejecutar con debug
node 08-scripts/activate-sprint.js --type feature --sprint S15 --debug

# Ver logs en tiempo real
pm2 logs router-service --lines 100 --nostream

# Test individual de funciones
node -e "const {loadProfile} = require('./08-scripts/activate-sprint.js'); console.log(loadProfile('feature', [], false));"
```

---

**Versión**: 2.0
**Creado**: 2024-11-02
**Última Actualización**: 2025-11-02
**Owner**: Engineering Team
**Status**: ✅ Activo (v2.0 Optimizado)
