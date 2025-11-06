# Router Package

Router de activación de skills con hooks pre-invoke y stop.

## Hooks

### Pre-invoke Hook (`userPromptSubmitHook`)

Analiza prompt, archivos abiertos y contenido para detectar y activar skills relevantes.

**Input:**

- `prompt`: Prompt del usuario
- `openFiles`: Lista de archivos abiertos
- `activeFileContent`: Snapshot del archivo activo (≤2KB)
- `cwd`: Directorio de trabajo actual

**Output:**

- `injectedNote`: Nota a inyectar en contexto si hay activaciones
- `activated`: Array de skill IDs activados
- `metadata`: Scores y razones de activación

### Stop Hook (`stopHook`)

Pipeline de calidad post-respuesta:

1. Prettier → formatea archivos editados
2. TypeCheck → verifica tipos por repo
3. Error hints → sugiere correcciones si hay 1-4 errores
4. Auto-resolver → (futuro) resuelve automáticamente si ≥5 errores
5. Emit KPIs → registra evento en `obs/kpi/events.jsonl`

**Input:**

- `editLog`: Historial de archivos editados
- `reposChanged`: Set de repos modificados
- `cwd`: Directorio de trabajo actual

**Output:**

- `formatted`: Archivos formateados
- `typecheck`: Resultados de verificación de tipos
- `hints`: Sugerencias de errores (si aplica)
- `autoResolved`: Flag si se auto-resolvió
- `kpiEvent`: Evento KPI registrado

## Uso

```typescript
import { userPromptSubmitHook, stopHook } from '@skills-fabrik/router';

// Pre-invoke
const preResult = await userPromptSubmitHook({
  prompt: 'crear un endpoint nuevo',
  openFiles: ['backend/src/routes/users.ts'],
  activeFileContent: 'export router...',
  cwd: process.cwd(),
});

// Stop
const stopResult = await stopHook({
  editLog: [{ file: 'backend/src/routes/users.ts', repo: 'backend', ts: Date.now() }],
  reposChanged: new Set(['backend']),
  cwd: process.cwd(),
});
```

## Servidor HTTP

El router puede ejecutarse como servidor HTTP independiente.

### Iniciar servidor

```bash
# Desde el directorio del proyecto
node packages/router/dist/cli/start-router-server.js

# O via PM2
pm2 start scripts/pm2/ecosystem.config.cjs --only router-service --env development
```

### Endpoints disponibles

- `GET /health` - Health check con estado de dependencias
- `POST /pre-invoke` - Hook pre-invocación
- `POST /stop` - Hook post-respuesta
- `GET /rules` - Obtener reglas de activación
- `POST /match-rules` - Matching de reglas
- `POST /guardrails` - Verificación de guardrails

### Configuración

Variables de entorno:

- `PORT`: Puerto del servidor (default: 3000)
- `HOST`: Host del servidor (default: 127.0.0.1)
- `DAEMON_URL`: URL del daemon (default: http://127.0.0.1:7727)

### Integración con PM2

El servidor envía `process.send('ready')` cuando está listo, compatible con `wait_ready: true` en PM2.
