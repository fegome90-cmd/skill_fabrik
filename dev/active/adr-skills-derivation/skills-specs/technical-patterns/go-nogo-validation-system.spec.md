# Skill Specification: Go/No-Go Validation System

## YAML Frontmatter

```yaml
---
id: go-nogo-validation-system
version: 0.1.0
type: workflow
summary: Sistema de validación con gates incrementales (G0-G5) con modo flexible y estricto, integración CI/CD y scripts wrapper
audience: engineers, devops, architects
when_to_use: Para validar sistemas complejos antes de deployment, testing end-to-end, validación de integraciones, gates CI/CD. Usa cuando necesitas validación sistemática de múltiples componentes.
provides: 6 gates de validación, modo flexible/estricto, CI/CD integration, troubleshooting logs, port validation
resources:
  - resources/gate-implementation.mjs
  - resources/ci-integration.md
  - resources/troubleshooting.md
scripts:
  - name: go-nogo-validate
    run: node scripts/go-nogo.mjs
    note: Ejecuta validación en modo flexible
  - name: go-nogo-strict
    run: node scripts/go-nogo.mjs --strict-port
    note: Ejecuta validación en modo estricto
limits: Requiere configuración específica del sistema. Modo estricto puede fallar si puertos están ocupados. No valida lógica de negocio.
---
```

## Objective

**Cuándo usar**: Validar sistemas antes de deployment, testing E2E, validación de integraciones completas, gates en CI/CD.

**Cuándo NO usar**: Para tests unitarios simples, validación de código individual, o cuando no hay dependencias entre componentes.

**Qué problema resuelve**: Sistemas que fallan en producción por configuración incorrecta, validación manual propensa a errores, falta de verificaciones sistemáticas.

## Problem Statement

**Evidencia del problema** (ADR-024):
- No había forma de verificar que el sistema funcionara correctamente
- Tests manuales propensos a errores
- No había validación de puertos específica
- Falta de integración con CI/CD
- No había tests de handshake end-to-end

**Resultado con Go/No-Go**:
- 6 gates de validación sistemática
- 100% detección de problemas antes de deployment
- Integración CI/CD operacional
- Modo estricto para validar configuraciones específicas

## Source ADRs

- **ADR-024**: Sistema Go/No-Go de Validación para MCP Hub
- Related: ADR-020 (Kit GO/NO-GO Validación), ADR-030 (Verificación GO Bundle)

## Procedimiento

### 1. Gate G0: Verificar Entorno

**Objetivo**: Validar que el entorno esté listo

```javascript
async function gateG0() {
  // Verificar Node.js
  const nodeVersion = process.version;
  if (!nodeVersion.startsWith('v20')) {
    throw new Error(`Node.js v20 requerido, encontrado: ${nodeVersion}`);
  }
  
  // Verificar archivos de configuración
  const configPath = path.join(process.cwd(), 'config/agent-control.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Archivo de configuración no encontrado');
  }
  
  // Verificar dependencias
  await validateDependencies();
  
  console.log('✅ G0: Entorno verificado');
}
```

### 2. Gate G1: Manager Sin Servidor

**Objetivo**: Probar componente core sin dependencias externas

```javascript
async function gateG1() {
  const { AgentManager } = await import('./src/core/AgentManager.js');
  const manager = new AgentManager();
  await manager.loadAgents();
  
  const agentCount = manager.getAgentCount();
  if (agentCount !== 10) {
    throw new Error(`Esperado 10 agentes, encontrado: ${agentCount}`);
  }
  
  console.log('✅ G1: Manager verificado');
}
```

### 3. Gate G2: Arrancar Servidor

**Objetivo**: Iniciar servidor y verificar que responda

```javascript
async function gateG2() {
  const port = await findAvailablePort();
  if (!port) {
    throw new Error('No hay puerto disponible');
  }
  
  const server = await startServer(port);
  
  // Verificar que responde
  const response = await fetch(`http://localhost:${port}/health`);
  if (!response.ok) {
    throw new Error('Servidor no responde correctamente');
  }
  
  console.log('✅ G2: Servidor arrancado correctamente');
  return port;
}
```

### 4. Gate G3: REST Coherente con Manager

**Objetivo**: Validar consistencia entre API y datos internos

```javascript
async function gateG3() {
  const managerAgents = manager.getAllAgents();
  const apiAgents = await fetch('/agents').then(r => r.json());
  
  if (managerAgents.length !== apiAgents.length) {
    throw new Error(`Inconsistencia: manager tiene ${managerAgents.length}, API devuelve ${apiAgents.length}`);
  }
  
  // Verificar que agentes coinciden
  for (const agent of managerAgents) {
    const apiAgent = apiAgents.find(a => a.id === agent.id);
    if (!apiAgent || apiAgent.status !== agent.status) {
      throw new Error(`Inconsistencia en agente ${agent.id}`);
    }
  }
  
  console.log('✅ G3: REST coherente con Manager');
}
```

### 5. Gate G4: Handshake + Tools

**Objetivo**: Probar handshake criptográfico y tools críticos

```javascript
async function gateG4() {
  const { newChallenge, useChallenge } = await import('./src/store/challenge.js');
  
  const challenge = newChallenge('test task');
  const isValid = useChallenge(challenge.taskId, challenge.nonce);
  
  if (!isValid) {
    throw new Error('Handshake falló - challenge inválido');
  }
  
  // Probar tools ADR
  const adrTools = ['adr.create', 'adr.update', 'adr.reflect'];
  for (const tool of adrTools) {
    const toolExists = await verifyToolExists(tool);
    if (!toolExists) {
      throw new Error(`Tool ${tool} no disponible`);
    }
  }
  
  console.log('✅ G4: Handshake y Tools verificados');
}
```

### 6. Gate G5: Health Checks

**Objetivo**: Verificar endpoint de salud y métricas

```javascript
async function gateG5() {
  const health = await fetch('/health').then(r => r.json());
  
  if (health.status !== 'healthy') {
    throw new Error(`Status: ${health.status}, esperado: healthy`);
  }
  
  // Verificar métricas
  const metrics = await fetch('/metrics').then(r => r.json());
  const requiredMetrics = ['cpu', 'memory', 'agents'];
  
  for (const metric of requiredMetrics) {
    if (!metrics[metric]) {
      throw new Error(`Métrica ${metric} no disponible`);
    }
  }
  
  console.log('✅ G5: Health checks pasaron');
}
```

### 7. Modo Estricto de Puerto

```javascript
class GoNoGoValidator {
  constructor(strictPort = false) {
    this.strictPort = strictPort;
  }
  
  async validate() {
    if (this.strictPort) {
      // Verificar que puerto 3200 esté disponible
      const port3200Available = await isPortAvailable(3200);
      if (!port3200Available) {
        throw new Error('CRITICAL: Puerto 3200 ocupado y modo estricto activado');
      }
    }
    
    // Continuar con gates...
  }
}
```

## Checklist

- [ ] Gate G0: Entorno verificado (Node.js, config, deps)
- [ ] Gate G1: Manager funciona sin servidor
- [ ] Gate G2: Servidor arranca correctamente
- [ ] Gate G3: REST coherente con Manager
- [ ] Gate G4: Handshake funciona, tools disponibles
- [ ] Gate G5: Health checks pasan
- [ ] Modo estricto valida puertos específicos (si aplica)
- [ ] Logs detallados generados
- [ ] CI/CD integration configurada

## Scripts Reales

### Go/No-Go Script

**Ubicación**: `scripts/go-nogo.mjs`

```javascript
#!/usr/bin/env node
class GoNoGoValidator {
  constructor(strictPort = false) {
    this.strictPort = strictPort;
    this.results = [];
  }
  
  async gateG0() { /* ... */ }
  async gateG1() { /* ... */ }
  async gateG2() { /* ... */ }
  async gateG3() { /* ... */ }
  async gateG4() { /* ... */ }
  async gateG5() { /* ... */ }
  
  async validate() {
    try {
      await this.gateG0();
      await this.gateG1();
      const port = await this.gateG2();
      await this.gateG3();
      await this.gateG4();
      await this.gateG5();
      
      console.log('\n✅ ALL GATES PASSED - GO');
      return true;
    } catch (error) {
      console.error(`\n❌ GATE FAILED - NO-GO: ${error.message}`);
      return false;
    }
  }
}

const strictPort = process.argv.includes('--strict-port');
const validator = new GoNoGoValidator(strictPort);
const success = await validator.validate();
process.exit(success ? 0 : 1);
```

## Examples

### ✅ Correcto

```bash
$ node scripts/go-nogo.mjs

✅ G0: Entorno verificado
✅ G1: Manager verificado (10 agentes)
✅ G2: Servidor arrancado (port 3200)
✅ G3: REST coherente con Manager
✅ G4: Handshake y Tools verificados
✅ G5: Health checks pasaron

✅ ALL GATES PASSED - GO
```

### ❌ Incorrecto

```bash
$ node scripts/go-nogo.mjs --strict-port

✅ G0: Entorno verificado
✅ G1: Manager verificado
❌ G2: Puerto 3200 ocupado

❌ GATE FAILED - NO-GO: CRITICAL: Puerto 3200 ocupado y modo estricto activado
```

## Trigger Rules

### Keywords
```json
"keywords": [
  "validation", "validate", "gate", "go-nogo",
  "testing", "integration", "e2e"
]
```

### Intent Patterns
```json
"intentPatterns": [
  "(validate|test).*?system",
  "(go|no-go).*?validation",
  "gate.*?testing"
]
```

### File Triggers
```json
"pathPatterns": [
  "scripts/go-nogo*.{mjs,js}",
  ".github/workflows/*validation*.yml"
]
```

### Content Patterns
```json
"contentPatterns": [
  "gateG\\d\\s*\\(\\s*\\)",  # Gate functions
  "validation.*gate",  # Gate validation
  "GO.*NO-GO"  # Result messages
]
```

## Resources to Create

1. **gate-implementation.mjs**: Implementación completa de todos los gates
2. **ci-integration.md**: Guía de integración con CI/CD
3. **troubleshooting.md**: Guía de troubleshooting por gate

---

**Last Updated**: 2025-10-29  
**Spec Version**: 0.1.0

