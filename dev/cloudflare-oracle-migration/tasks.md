# Tasks - Skills Fabrik Remote Architecture Migration

> **Project**: Skills Fabrik - CLOOP Development Automation System
> **Sprint/Phase**: Remote Deployment Architecture
> **Period**: 2025-11-06 → 2025-12-06
> **Duration**: 30 días (5 fases)
> **Last Updated**: 2025-11-06T15:20:00Z
> **Philosophy**: "Menos (y Mejor) es Más" + CLOOP Methodology

---

## 🎯 **SPRINT GOAL**

Migrar Skills Fabrik de arquitectura local a remota usando Oracle Cloud Always Free + Cloudflare, permitiendo acceso centralizado desde cualquier máquina vía CLI remoto con autenticación, sin perder funcionalidades actuales ni aumentar latencia significativamente.

**Success Criteria**:
- ✅ Latencia remota < 500ms (vs 466ms local)
- ✅ 20/20 tests pasando en ambiente remoto
- ✅ HTTPS funcional con certificado válido
- ✅ 3+ team members usando CLI remoto

---

## 📋 **FASE 1: PREPARACIÓN LOCAL** (2 días - Días 1-2)

### **Epic 1.1: Configuración Remota**
**Priority**: P0 (Critical) | **Points**: 5 | **Owner**: Backend Team

#### ✅ Task 1.1.1: Crear módulo remote-config.ts
**Status**: 🔴 TODO | **Estimate**: 2h | **Assignee**: Developer 1

**Description**:
Implementar módulo de configuración que lea settings desde archivo o env vars.

**Acceptance Criteria**:
- [ ] Archivo creado: `packages/skills-cli/src/config/remote-config.ts`
- [ ] Interface `RemoteConfig` definida con `api_base_url`, `api_key`, `timeout_ms`
- [ ] Función `loadRemoteConfig()` lee `~/.fabriksystem/config.json`
- [ ] Fallback a env vars si archivo no existe
- [ ] Fallback a localhost si no hay config remota

**Implementation**:
```typescript
export interface RemoteConfig {
  api_base_url: string;
  api_key?: string;
  timeout_ms: number;
}

export function loadRemoteConfig(): RemoteConfig {
  // 1. Try file: ~/.fabriksystem/config.json
  // 2. Fallback to env: SF_REMOTE_API_URL, SF_API_KEY
  // 3. Fallback to localhost
}
```

**Tests**:
- [ ] Unit test: config desde archivo JSON
- [ ] Unit test: config desde env vars
- [ ] Unit test: fallback a localhost
- [ ] Unit test: validación de URL inválida

**Dependencies**: None

---

#### ✅ Task 1.1.2: Crear API client abstraction
**Status**: 🔴 TODO | **Estimate**: 3h | **Assignee**: Developer 1

**Description**:
Implementar cliente HTTP para comunicación con API remota.

**Acceptance Criteria**:
- [ ] Archivo creado: `packages/skills-cli/src/lib/api-client.ts`
- [ ] Class `SkillsFabrikAPIClient` implementada
- [ ] Methods: `activateSkill()`, `healthCheck()`, `listSkills()`
- [ ] Header `X-SF-API-Key` incluido si está configurado
- [ ] Timeout configurable con `AbortSignal`
- [ ] Error handling para 401, 403, 500, network errors

**Implementation**:
```typescript
export class SkillsFabrikAPIClient {
  private baseURL: string;
  private apiKey?: string;
  private timeout: number;

  async activateSkill(skillId: string, context: any): Promise<any>
  async healthCheck(): Promise<{ status: string }>
  async listSkills(): Promise<Skill[]>
}
```

**Tests**:
- [ ] Mock test: request con API key válida
- [ ] Mock test: request sin API key
- [ ] Mock test: timeout handling
- [ ] Mock test: error handling (401, 500)
- [ ] Mock test: network error

**Dependencies**: Task 1.1.1 (remote-config.ts)

---

#### ✅ Task 1.1.3: Implementar comando 'config init'
**Status**: 🔴 TODO | **Estimate**: 2h | **Assignee**: Developer 2

**Description**:
Crear comando interactivo para configurar CLI remoto.

**Acceptance Criteria**:
- [ ] Archivo creado: `packages/skills-cli/src/commands/config.ts`
- [ ] Comando `skills-cli config init --remote` funcional
- [ ] Prompt interactivo para URL + API key
- [ ] Guarda config en `~/.fabriksystem/config.json`
- [ ] Valida conectividad con `/health` endpoint
- [ ] Mensaje de éxito/error claro

**Implementation**:
```typescript
async function initRemoteConfig() {
  const url = await prompt('Remote API URL:');
  const apiKey = await prompt('API Key:', { type: 'password' });
  
  // Validate connection
  const client = new SkillsFabrikAPIClient({ api_base_url: url, api_key: apiKey });
  const health = await client.healthCheck();
  
  // Save config
  saveConfig({ api_base_url: url, api_key: apiKey });
}
```

**Tests**:
- [ ] E2E test: configuración completa exitosa
- [ ] E2E test: validación de URL inválida
- [ ] E2E test: validación de API key inválida
- [ ] E2E test: archivo config creado correctamente

**Dependencies**: Task 1.1.1, 1.1.2

---

### **Epic 1.2: Autenticación en Daemon**
**Priority**: P0 (Critical) | **Points**: 3 | **Owner**: Backend Team

#### ✅ Task 1.2.1: Implementar middleware de autenticación
**Status**: 🔴 TODO | **Estimate**: 2h | **Assignee**: Developer 3

**Description**:
Agregar autenticación API Key en daemon para requests remotos.

**Acceptance Criteria**:
- [ ] Archivo creado: `packages/daemon/src/middleware/auth.ts`
- [ ] Fastify `preHandler` hook implementado
- [ ] Verifica header `X-SF-API-Key`
- [ ] Compara con `process.env.SF_API_KEY`
- [ ] Excepción: `/health` endpoint sin auth
- [ ] Retorna 401 si API key inválida o faltante

**Implementation**:
```typescript
export function authMiddleware(request, reply, done) {
  if (request.url === '/health') {
    return done();
  }
  
  const apiKey = request.headers['x-sf-api-key'];
  if (!apiKey || apiKey !== process.env.SF_API_KEY) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  done();
}
```

**Tests**:
- [ ] Integration test: request con API key válida (200)
- [ ] Integration test: request sin API key (401)
- [ ] Integration test: request con API key inválida (401)
- [ ] Integration test: `/health` sin auth (200)

**Dependencies**: None

---

#### ✅ Task 1.2.2: Agregar variables de entorno
**Status**: 🔴 TODO | **Estimate**: 30min | **Assignee**: DevOps

**Description**:
Crear archivo `.env.production.example` con variables necesarias.

**Acceptance Criteria**:
- [ ] Archivo creado: `.env.production.example`
- [ ] Variables definidas: `SF_REMOTE_API_URL`, `SF_API_KEY`, `SF_ALLOWED_ORIGINS`
- [ ] Documentación inline para cada variable
- [ ] Valores de ejemplo (no reales)

**File Content**:
```bash
# Remote API Configuration
SF_REMOTE_API_URL=https://api.fabriksystem.com
SF_API_KEY=<generate-with-openssl-rand-hex-32>
SF_ALLOWED_ORIGINS=https://api.fabriksystem.com

# Rate Limiting
SF_RATE_LIMIT_MAX=100
SF_RATE_LIMIT_WINDOW=1 minute

# Services
SF_PORT=7727
SF_HOST=0.0.0.0
ROUTER_PORT=3000
DISCOVERY_PORT=8877
```

**Dependencies**: None

---

### **FASE 1 - Definition of Done**
- [ ] `feature/remote-api` branch created
- [ ] All unit tests passing (15+ new tests)
- [ ] CLI funciona localmente sin config remota
- [ ] CLI funciona localmente CON config remota (apuntando a localhost)
- [ ] Daemon acepta requests con API key
- [ ] Daemon rechaza requests sin API key
- [ ] PR created and reviewed
- [ ] Documentation: `docs/deployment/remote-config.md` created

---

## 📋 **FASE 2: SETUP ORACLE VM** (3 días - Días 3-5)

### **Epic 2.1: Provisionar Infraestructura**
**Priority**: P0 (Critical) | **Points**: 5 | **Owner**: DevOps Team

#### ✅ Task 2.1.1: Crear VM Always Free en Oracle Cloud
**Status**: 🔴 TODO | **Estimate**: 1h | **Assignee**: DevOps

**Description**:
Provisionar VM en Oracle Cloud usando Always Free Tier.

**Acceptance Criteria**:
- [ ] VM creada: Ubuntu 22.04 LTS, 1 OCPU, 1GB RAM
- [ ] Región: Ashburn (US-EAST-1) o São Paulo (SA-SAOPAULO-1)
- [ ] SSH key descargada: `sf-oracle-vm.pem`
- [ ] IP pública anotada y guardada en docs
- [ ] SSH connection funcional: `ssh -i sf-oracle-vm.pem ubuntu@<IP>`

**Steps**:
1. Login a Oracle Cloud Console
2. Compute → Instances → Create Instance
3. Select Shape: Always Free Eligible (VM.Standard.E2.1.Micro)
4. Select Image: Ubuntu 22.04 LTS
5. Download SSH key
6. Note public IP

**Documentation**: IP y SSH key en `docs/deployment/oracle-credentials.md` (gitignored)

**Dependencies**: Oracle Cloud account

---

#### ✅ Task 2.1.2: Configurar Security List
**Status**: 🔴 TODO | **Estimate**: 30min | **Assignee**: DevOps

**Description**:
Abrir puertos 80/443 en Oracle Cloud Security List.

**Acceptance Criteria**:
- [ ] VCN → Security Lists → Ingress Rules creadas
- [ ] Port 80: Source CIDR `0.0.0.0/0`, Protocol TCP
- [ ] Port 443: Source CIDR `0.0.0.0/0`, Protocol TCP
- [ ] Description: "HTTP/HTTPS for Skills Fabrik API"
- [ ] Validado: `telnet <IP> 80` conecta (después de Nginx)

**Dependencies**: Task 2.1.1

---

### **Epic 2.2: Instalar Dependencias**
**Priority**: P0 (Critical) | **Points**: 3 | **Owner**: DevOps Team

#### ✅ Task 2.2.1: Instalar Node.js, pnpm, PM2
**Status**: 🔴 TODO | **Estimate**: 1h | **Assignee**: DevOps

**Description**:
Instalar runtime y herramientas necesarias en VM.

**Acceptance Criteria**:
- [ ] Node.js 20.x instalado
- [ ] pnpm 8.x instalado
- [ ] PM2 5.x instalado globalmente
- [ ] git instalado
- [ ] nginx instalado
- [ ] Versiones validadas con `--version`

**Script**:
```bash
#!/bin/bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
npm install -g pnpm pm2
```

**Validation**:
- [ ] `node --version` >= v20.0.0
- [ ] `pnpm --version` >= 8.0.0
- [ ] `pm2 --version` >= 5.0.0

**Dependencies**: Task 2.1.1

---

#### ✅ Task 2.2.2: Clonar y build proyecto
**Status**: 🔴 TODO | **Estimate**: 2h | **Assignee**: DevOps

**Description**:
Clonar repositorio y compilar proyecto en VM.

**Acceptance Criteria**:
- [ ] Repositorio clonado en `/home/ubuntu/skills-fabrik`
- [ ] Branch `feature/remote-api` checked out
- [ ] `pnpm install` exitoso
- [ ] `pnpm -w build` exitoso
- [ ] Directorios de logs creados: `packages/{daemon,router,shared}/logs`

**Script**:
```bash
cd /home/ubuntu
git clone https://github.com/TU-USUARIO/skills-fabrik.git
cd skills-fabrik
git checkout feature/remote-api
pnpm install
pnpm -w build
mkdir -p packages/{daemon,router,shared}/logs
```

**Validation**:
- [ ] `ls -la packages/daemon/dist/index.js` existe
- [ ] `ls -la packages/router/dist/cli/start-router-server.js` existe
- [ ] No build errors

**Dependencies**: Task 2.2.1

---

### **Epic 2.3: Configurar y Levantar Servicios**
**Priority**: P0 (Critical) | **Points**: 5 | **Owner**: DevOps Team

#### ✅ Task 2.3.1: Configurar variables de producción
**Status**: 🔴 TODO | **Estimate**: 1h | **Assignee**: DevOps

**Description**:
Crear archivo `.env.production` con valores reales.

**Acceptance Criteria**:
- [ ] Archivo creado: `/home/ubuntu/skills-fabrik/.env.production`
- [ ] API key generada con `openssl rand -hex 32`
- [ ] Todas las variables configuradas
- [ ] Archivo con permisos `600` (solo owner read/write)

**Variables críticas**:
```bash
NODE_ENV=production
SF_PORT=7727
SF_HOST=0.0.0.0
SF_API_KEY=<64-char-hex>
SF_ALLOWED_ORIGINS=https://api.fabriksystem.com
```

**Validation**:
- [ ] `cat .env.production | grep SF_API_KEY` contiene hash largo
- [ ] No valores de ejemplo o placeholders

**Dependencies**: Task 2.2.2

---

#### ✅ Task 2.3.2: Levantar servicios con PM2
**Status**: 🔴 TODO | **Estimate**: 2h | **Assignee**: DevOps

**Description**:
Iniciar todos los servicios usando PM2 ecosystem.

**Acceptance Criteria**:
- [ ] `pm2 start scripts/pm2/ecosystem.config.cjs --env production` exitoso
- [ ] `pm2 status` muestra 4 servicios online
- [ ] `pm2 save` ejecutado
- [ ] `pm2 startup systemd` configurado
- [ ] Health checks locales: `curl localhost:{7727,3000,8877}/health` retornan 200

**Script**:
```bash
cd /home/ubuntu/skills-fabrik
export $(cat .env.production | xargs)
pm2 start scripts/pm2/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

**Validation**:
- [ ] `pm2 status` → 4 services online, 0 errored
- [ ] `curl http://localhost:7727/health` → 200 OK
- [ ] `curl http://localhost:3000/health` → 200 OK
- [ ] `curl http://localhost:8877/health` → 200 OK

**Dependencies**: Task 2.3.1

---

### **FASE 2 - Definition of Done**
- [ ] VM Oracle provisionada y accesible via SSH
- [ ] Puertos 80/443 abiertos en Security List
- [ ] Node.js + pnpm + PM2 instalados
- [ ] Proyecto clonado y compilado
- [ ] `.env.production` configurado con API key real
- [ ] PM2 services: 4/4 online
- [ ] Health checks locales: all passing
- [ ] PM2 configurado para auto-start al boot
- [ ] Documentation: `docs/deployment/oracle-setup.md` created

---

## 📋 **FASE 3: NGINX REVERSE PROXY** (1 día - Día 6)

### **Epic 3.1: Configurar Nginx**
**Priority**: P0 (Critical) | **Points**: 5 | **Owner**: DevOps Team

#### ✅ Task 3.1.1: Crear configuración de Nginx
**Status**: 🔴 TODO | **Estimate**: 2h | **Assignee**: DevOps

**Description**:
Configurar Nginx como reverse proxy para servicios internos.

**Acceptance Criteria**:
- [ ] Archivo creado: `/etc/nginx/sites-available/api.fabriksystem.com`
- [ ] Symlink creado en `/etc/nginx/sites-enabled/`
- [ ] Rate limiting zones definidas
- [ ] Upstreams para router/daemon definidos
- [ ] Location blocks: `/health`, `/api/`, `/`
- [ ] Security headers configurados
- [ ] `sudo nginx -t` sin errores

**Config**:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=health_limit:10m rate=100r/s;

upstream sf_router {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.fabriksystem.com;
    
    location /health {
        limit_req zone=health_limit burst=200 nodelay;
        proxy_pass http://sf_router/health;
        access_log off;
    }
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://sf_router/;
        # ... headers
    }
}
```

**Validation**:
- [ ] `sudo nginx -t` → OK
- [ ] `curl http://localhost/health` → 200

**Dependencies**: Task 2.3.2 (services running)

---

#### ✅ Task 3.1.2: Configurar SSL con Cloudflare Origin Certificate
**Status**: 🔴 TODO | **Estimate**: 1h | **Assignee**: DevOps

**Description**:
Instalar certificado SSL de Cloudflare Origin.

**Acceptance Criteria**:
- [ ] Cloudflare Origin Certificate generado
- [ ] Archivos copiados a `/etc/nginx/ssl/origin.{pem,key}`
- [ ] Permisos: `chmod 600 /etc/nginx/ssl/origin.key`
- [ ] Server block HTTPS (443) configurado
- [ ] SSL protocols: TLSv1.2, TLSv1.3
- [ ] `curl -k https://localhost/health` → 200

**Steps**:
1. Login to Cloudflare Dashboard
2. SSL/TLS → Origin Server → Create Certificate
3. Validity: 15 years
4. Download certificate + private key
5. Copy to VM:
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   sudo nano /etc/nginx/ssl/origin.pem  # paste certificate
   sudo nano /etc/nginx/ssl/origin.key  # paste private key
   sudo chmod 600 /etc/nginx/ssl/origin.key
   ```
6. Update Nginx config with HTTPS server block
7. `sudo nginx -t && sudo systemctl reload nginx`

**Validation**:
- [ ] `ls -la /etc/nginx/ssl/origin.*` → files exist
- [ ] `curl -k https://localhost/health` → 200 OK

**Dependencies**: Task 3.1.1

---

### **FASE 3 - Definition of Done**
- [ ] Nginx instalado y configurado
- [ ] Site config en `/etc/nginx/sites-available/api.fabriksystem.com`
- [ ] SSL certificates instalados en `/etc/nginx/ssl/`
- [ ] Rate limiting activo (10 req/s API, 100 req/s health)
- [ ] Proxy pass a router funcionando
- [ ] `sudo nginx -t` → OK
- [ ] `curl http://<IP_PUBLICA>/health` → 200
- [ ] `curl -k https://<IP_PUBLICA>/health` → 200
- [ ] Logs: `tail -f /var/log/nginx/access.log` muestra requests
- [ ] Documentation: `docs/deployment/nginx-config.md` created

---

## 📋 **FASE 4: CLOUDFLARE DNS + SSL** (30 min - Día 6.5)

### **Epic 4.1: Configurar Cloudflare**
**Priority**: P0 (Critical) | **Points**: 2 | **Owner**: DevOps Team

#### ✅ Task 4.1.1: Crear DNS A record
**Status**: 🔴 TODO | **Estimate**: 10min | **Assignee**: DevOps

**Description**:
Apuntar subdominio api.fabriksystem.com a VM Oracle.

**Acceptance Criteria**:
- [ ] DNS record creado en Cloudflare
- [ ] Type: A
- [ ] Name: api
- [ ] Content: <IP_PUBLICA_ORACLE>
- [ ] Proxy status: Proxied (nube naranja)
- [ ] TTL: Auto

**Validation**:
- [ ] `dig api.fabriksystem.com` retorna IP de Cloudflare
- [ ] `ping api.fabriksystem.com` alcanza Cloudflare CDN

**Dependencies**: Task 3.1.2 (SSL configured)

---

#### ✅ Task 4.1.2: Configurar SSL/TLS settings
**Status**: 🔴 TODO | **Estimate**: 10min | **Assignee**: DevOps

**Description**:
Configurar modo SSL y opciones de seguridad.

**Acceptance Criteria**:
- [ ] SSL/TLS mode: Full (strict)
- [ ] Always Use HTTPS: ON
- [ ] Minimum TLS Version: 1.2
- [ ] Automatic HTTPS Rewrites: ON

**Validation**:
- [ ] `curl -I http://api.fabriksystem.com` → 301 redirect to HTTPS
- [ ] `curl -I https://api.fabriksystem.com/health` → 200 OK

**Dependencies**: Task 4.1.1

---

#### ✅ Task 4.1.3: Test completo desde cliente externo
**Status**: 🔴 TODO | **Estimate**: 10min | **Assignee**: DevOps

**Description**:
Validar conectividad completa desde máquina externa.

**Acceptance Criteria**:
- [ ] `curl https://api.fabriksystem.com/health` → 200 desde laptop
- [ ] Latencia < 500ms
- [ ] SSL certificate válido (no warnings)
- [ ] Request sin API key a `/api/skills` → 401

**Test Script**:
```bash
#!/bin/bash
echo "Testing health endpoint..."
time curl https://api.fabriksystem.com/health

echo "Testing auth (should fail)..."
curl -I https://api.fabriksystem.com/api/skills

echo "Testing SSL certificate..."
curl -vI https://api.fabriksystem.com 2>&1 | grep "SSL certificate"
```

**Dependencies**: Task 4.1.2

---

### **FASE 4 - Definition of Done**
- [ ] DNS A record creado y proxied via Cloudflare
- [ ] SSL/TLS mode: Full (strict)
- [ ] Always Use HTTPS: ON
- [ ] `curl https://api.fabriksystem.com/health` → 200 desde cliente externo
- [ ] Latencia < 500ms medida
- [ ] SSL Labs test: A o superior
- [ ] Cloudflare Analytics muestra tráfico
- [ ] Screenshot de SSL Labs guardado en docs

---

## 📋 **FASE 5: ACTUALIZAR CLI PARA REMOTO** (2 días - Días 7-8)

### **Epic 5.1: Integrar API Client**
**Priority**: P0 (Critical) | **Points**: 5 | **Owner**: Backend Team

#### ✅ Task 5.1.1: Integrar API client en comandos existentes
**Status**: 🔴 TODO | **Estimate**: 3h | **Assignee**: Developer 1

**Description**:
Modificar comandos CLI para usar API client cuando hay config remota.

**Acceptance Criteria**:
- [ ] `packages/skills-cli/src/commands/skills.ts` actualizado
- [ ] `packages/skills-cli/src/commands/dashboard.ts` actualizado
- [ ] `packages/skills-cli/src/commands/kpi.ts` actualizado
- [ ] Detección automática de config remota
- [ ] Fallback a lógica local si no hay config remota
- [ ] Error handling para requests remotos

**Implementation Pattern**:
```typescript
const config = loadRemoteConfig();
const isRemote = config.api_base_url !== 'http://127.0.0.1:3000';

if (isRemote) {
  const client = new SkillsFabrikAPIClient();
  const result = await client.activateSkill(skillId, context);
} else {
  const result = await activateSkillLocally(skillId);
}
```

**Validation**:
- [ ] `skills-cli skills check "test"` funciona localmente
- [ ] `SF_REMOTE_API_URL=https://api.fabriksystem.com skills-cli skills check "test"` funciona remotamente

**Dependencies**: Epic 1.1, 1.2 (API client + auth)

---

#### ✅ Task 5.1.2: Implementar comando 'config test'
**Status**: 🔴 TODO | **Estimate**: 1h | **Assignee**: Developer 2

**Description**:
Crear comando para validar conectividad remota.

**Acceptance Criteria**:
- [ ] Comando `skills-cli config test` funcional
- [ ] Valida conexión a API remota
- [ ] Muestra latencia en ms
- [ ] Muestra status del servicio
- [ ] Error claro si falla

**Implementation**:
```typescript
async function testRemoteConnection() {
  const config = loadRemoteConfig();
  const client = new SkillsFabrikAPIClient();
  
  console.log(`Testing connection to ${config.api_base_url}...`);
  
  const start = Date.now();
  const health = await client.healthCheck();
  const latency = Date.now() - start;
  
  console.log(`✅ Connection successful!`);
  console.log(`   Status: ${health.status}`);
  console.log(`   Latency: ${latency}ms`);
}
```

**Validation**:
- [ ] `skills-cli config test` → success con latency < 500ms
- [ ] `skills-cli config test` con URL inválida → error claro

**Dependencies**: Task 1.1.2 (API client)

---

### **Epic 5.2: Testing y Documentación**
**Priority**: P0 (Critical) | **Points**: 3 | **Owner**: QA + Tech Writer

#### ✅ Task 5.2.1: E2E tests remotos
**Status**: 🔴 TODO | **Estimate**: 3h | **Assignee**: QA Engineer

**Description**:
Crear suite de tests E2E para validar CLI remoto.

**Acceptance Criteria**:
- [ ] Test: `config init` → `test` → `skills check` (remote)
- [ ] Test: CLI desde otra máquina conecta a Oracle
- [ ] Test: Performance (latencia < 500ms)
- [ ] Test: Security (request sin API key → 401)
- [ ] Test: Load (10 requests concurrentes)

**Test Script**:
```bash
#!/bin/bash
export SF_REMOTE_API_URL=https://api.fabriksystem.com
export SF_API_KEY=<API_KEY>

# Test connection
skills-cli config test || exit 1

# Test commands
skills-cli skills check "test query" --v2 || exit 1
skills-cli dashboard health || exit 1
skills-cli kpi show || exit 1

echo "✅ All E2E tests passed!"
```

**Validation**:
- [ ] Script retorna 0 (éxito)
- [ ] Latencia promedio < 500ms
- [ ] Todos los comandos funcionan remotamente

**Dependencies**: Task 5.1.1, 5.1.2

---

#### ✅ Task 5.2.2: Actualizar documentación
**Status**: 🔴 TODO | **Estimate**: 2h | **Assignee**: Tech Writer

**Description**:
Documentar uso remoto en README y CLAUDE.md.

**Acceptance Criteria**:
- [ ] `README.md` actualizado con sección "Remote Usage"
- [ ] `CLAUDE.md` actualizado con comandos remotos
- [ ] `docs/deployment/remote-usage.md` creado
- [ ] Ejemplos claros y completos
- [ ] Troubleshooting common issues

**Content**:
```markdown
## Remote Usage

### Initial Setup
```bash
skills-cli config init --remote
# Enter URL: https://api.fabriksystem.com
# Enter API Key: <your-key>

skills-cli config test
```

### Usage
All commands work the same:
```bash
skills-cli skills check "implement auth"
skills-cli dashboard health
```

### Troubleshooting
- **401 Unauthorized**: Check API key in ~/.fabriksystem/config.json
- **Timeout**: Check network connectivity
- **High latency**: Consider local fallback
```

**Validation**:
- [ ] Documentación clara y con ejemplos
- [ ] Links funcionan
- [ ] No typos

**Dependencies**: Task 5.1.1, 5.1.2, 5.2.1

---

### **FASE 5 - Definition of Done**
- [ ] API client integrado en todos los comandos
- [ ] `config init/test` comandos funcionando
- [ ] CLI funciona remotamente desde máquina externa
- [ ] E2E tests: 100% passing remotamente
- [ ] Documentation actualizada (README, CLAUDE.md, remote-usage.md)
- [ ] `feature/remote-api` merged to `main`
- [ ] Tagged release: `v2.0.0-remote`
- [ ] Video tutorial: 5 min (opcional)

---

## 📊 **MÉTRICAS DE PROGRESO**

### **Velocity Tracking**

| Sprint | Story Points Planned | Story Points Completed | Velocity |
|--------|---------------------|------------------------|----------|
| Fase 1 | 8 | TBD | TBD |
| Fase 2 | 13 | TBD | TBD |
| Fase 3 | 5 | TBD | TBD |
| Fase 4 | 2 | TBD | TBD |
| Fase 5 | 8 | TBD | TBD