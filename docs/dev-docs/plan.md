# Plan Estratégico - Skills Fabrik Remote Architecture Migration

> **Sprint/Phase**: Remote Deployment Architecture
> **Period**: 2025-11-06 → 2025-12-06
> **Duration**: 30 días (5 fases)
> **Complexity**: enterprise
> **Target Coverage**: 100% (producción en Oracle Cloud + Cloudflare)
> **Quality Gates**: ACTIVE
> **Filosofía**: "Menos (y Mejor) es Más" + CLOOP Methodology

---

## 🎯 **METADATA DEL PLAN**

```yaml
meta:
  id: "sf-remote-deployment-2025-q4"
  version: "1.0.0"
  created_at: "2025-11-06T15:05:37Z"
  updated_at: "2025-11-06T15:05:37Z"
  base: "Skills Fabrik Multi-Service Architecture"
  mode: "infrastructure|deployment"
  anti_drift: true
  complexity: "enterprise"
  estimated_duration: "30 days"
  target_coverage: 100
  quality_gates: "ACTIVE"
  documentation_complete: TRUE
  philosophy: "Menos (y Mejor) es Más + CLOOP"
```

---

## 🚗 **FILOSOFÍA TOYOTA - "MENOS (Y MEJOR) ES MÁS"**

### **Principios Fundamentales**
1. **Eliminación de Desperdicio** - Solo infraestructura esencial (Oracle Free Tier + Cloudflare Free)
2. **Calidad Intrínseca** - Seguridad, health checks y monitoreo desde día 1
3. **Mejora Continua** - Iteración basada en métricas reales (latencia, uptime, adherencia)
4. **Respeto por las Personas** - Sistema self-hosted, sin vendor lock-in
5. **Pensamiento a Largo Plazo** - Arquitectura escalable sin costos ocultos

### **Aplicación en este Proyecto**
- **Infraestructura Esencial**: 1 VM Oracle (Always Free) vs múltiples servicios cloud
- **Proceso Simplificado**: 5 fases claras vs migración compleja
- **Calidad Automatizada**: PM2 auto-restart + health checks continuos
- **Feedback Rápido**: Deployment en < 1 hora, rollback instantáneo

---

## 🎯 **OBJETIVOS ESTRATÉGICOS**

### **Objetivo Principal**
Migrar Skills Fabrik de arquitectura local a remota usando Oracle Cloud Always Free + Cloudflare, permitiendo acceso centralizado desde cualquier máquina vía CLI remoto con autenticación, sin perder funcionalidades actuales ni aumentar latencia significativamente.

### **Success Criteria (SMART)**
```yaml
success_criteria:
  specific:
    - "CLI puede conectarse a https://api.fabriksystem.com desde cualquier máquina"
    - "Todos los servicios (daemon, router, discovery) corriendo en Oracle VM con PM2"
    - "HTTPS configurado vía Cloudflare con certificado SSL válido"
    - "Autenticación API Key implementada para acceso remoto"
    - "Health checks operacionales con uptime > 99%"
  
  measurable:
    - "Latencia remota < 500ms (vs 466ms local actual)"
    - "20/20 tests pasando en ambiente remoto"
    - "Tiempo de deployment completo < 30 minutos"
    - "Zero downtime durante deployment (usando PM2 reload)"
  
  achievable:
    - "Usa Oracle Always Free Tier (sin costo)"
    - "Cloudflare Free Plan (sin costo)"
    - "No requiere cambios arquitecturales mayores (solo configuración)"
  
  relevant:
    - "Permite colaboración multi-máquina"
    - "Facilita CI/CD futuro"
    - "Habilita monitoreo centralizado"
  
  time_bound:
    - "Fase 1 (Preparación local): 2 días"
    - "Fase 2 (Setup Oracle): 3 días"
    - "Fase 3 (Nginx config): 1 día"
    - "Fase 4 (Cloudflare DNS): 30 min"
    - "Fase 5 (CLI update): 2 días"
    - "Total: 8.5 días laborables (~2 semanas con buffer)"
```

---

## 🏗️ **ARQUITECTURA OBJETIVO**

### **Estado Actual (Local)**
```
┌──────────────────────────────────────┐
│   Localhost (127.0.0.1)              │
│                                      │
│   CLI → Router → Daemon → Storage    │
│   (3000)  (7727)   (L0/L1/L2/L3)    │
│                                      │
│   Service Discovery (8877)           │
└──────────────────────────────────────┘

Limitaciones:
- Solo accesible desde la máquina local
- No hay autenticación (confía en localhost)
- Difícil colaboración multi-desarrollador
```

### **Estado Objetivo (Remoto)**
```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE (Global CDN)                  │
│   api.fabriksystem.com (SSL/TLS, DDoS protection, cache)   │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────────────────────┐
│           ORACLE CLOUD VM (Always Free Tier)                │
│                  IP Pública: 140.xxx.xxx.xxx                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   NGINX (Port 80/443)                                │  │
│  │   - Reverse proxy                                    │  │
│  │   - Rate limiting                                    │  │
│  │   - SSL termination (Cloudflare Origin Cert)        │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │   PM2 Managed Services                               │  │
│  │                                                       │  │
│  │   ┌─────────────────────────────────────────────┐   │  │
│  │   │ Router (localhost:3000)                     │   │  │
│  │   │ - Pre/post hooks                            │   │  │
│  │   │ - Quality gates                             │   │  │
│  │   └─────────────┬───────────────────────────────┘   │  │
│  │                 │                                     │  │
│  │   ┌─────────────▼───────────────────────────────┐   │  │
│  │   │ Daemon (localhost:7727)                     │   │  │
│  │   │ - API Key auth                              │   │  │
│  │   │ - Skill activation                          │   │  │
│  │   │ - Event store                               │   │  │
│  │   └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │   ┌─────────────────────────────────────────────┐   │  │
│  │   │ Service Discovery (localhost:8877)          │   │  │
│  │   │ - Health checks                             │   │  │
│  │   └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Storage:                                                    │
│  - L0: .sf/ (local files)                                   │
│  - L1: .sf/cache/                                           │
│  - L2: PostgreSQL (localhost:5432)                          │
│  - L3: Redis (optional, localhost:6379)                     │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│        CLIENTES (Cualquier máquina con CLI)                  │
│                                                              │
│  Mac Developer     Laptop Universidad     CI/CD Server      │
│  CLI → https://api.fabriksystem.com                         │
│  (API Key en ~/.fabriksystem/config.json)                   │
└──────────────────────────────────────────────────────────────┘

Ventajas:
✅ Acceso centralizado desde cualquier máquina
✅ Autenticación con API Key
✅ SSL/TLS automático (Cloudflare)
✅ Alta disponibilidad (PM2 auto-restart)
✅ Costo $0 (Oracle + Cloudflare Free)
```

---

## 📋 **FASES DEL PLAN**

### **FASE 1: Preparación Local (2 días)**

**Objetivo**: Adaptar el código para soportar configuración remota sin romper funcionalidad local.

**Tareas**:
```yaml
fase_1:
  preparacion_local:
    - task: "Crear módulo de configuración remota"
      file: "packages/skills-cli/src/config/remote-config.ts"
      implementacion:
        - "loadRemoteConfig() - Lee ~/.fabriksystem/config.json o env vars"
        - "Interface RemoteConfig { api_base_url, api_key, timeout_ms }"
        - "Fallback a localhost si no hay config remota"
      tests:
        - "Unit test: config desde archivo JSON"
        - "Unit test: config desde env vars"
        - "Unit test: fallback a localhost"
    
    - task: "Crear API client abstraction"
      file: "packages/skills-cli/src/lib/api-client.ts"
      implementacion:
        - "class SkillsFabrikAPIClient"
        - "Methods: activateSkill(), healthCheck(), listSkills()"
        - "Headers: X-SF-API-Key si está configurado"
        - "Timeout configurable con AbortSignal"
      tests:
        - "Mock test: request con API key"
        - "Mock test: timeout handling"
        - "Mock test: error handling (401, 500)"
    
    - task: "Agregar comando 'config init'"
      file: "packages/skills-cli/src/commands/config.ts"
      implementacion:
        - "skills-cli config init --remote"
        - "Prompt interactivo para URL + API key"
        - "Guarda en ~/.fabriksystem/config.json"
        - "Valida conectividad con /health endpoint"
      tests:
        - "E2E test: configuración completa"
        - "E2E test: validación de URL inválida"
    
    - task: "Agregar variables de entorno"
      file: ".env.production.example"
      variables:
        - "SF_REMOTE_API_URL=https://api.fabriksystem.com"
        - "SF_API_KEY=<generate-secure-key>"
        - "SF_ALLOWED_ORIGINS=https://api.fabriksystem.com"
        - "SF_RATE_LIMIT_MAX=100"
        - "SF_RATE_LIMIT_WINDOW=1 minute"
    
    - task: "Implementar autenticación en daemon"
      file: "packages/daemon/src/middleware/auth.ts"
      implementacion:
        - "Fastify preHandler hook"
        - "Verifica X-SF-API-Key header"
        - "Compara con process.env.SF_API_KEY"
        - "Excepciones: /health endpoint (sin auth)"
      tests:
        - "Integration test: request con API key válida"
        - "Integration test: request sin API key (401)"
        - "Integration test: /health sin auth (200)"

  validacion_fase_1:
    - "Todos los tests unitarios pasando"
    - "CLI funciona localmente sin config remota"
    - "CLI funciona localmente CON config remota (apuntando a localhost)"
    - "Daemon acepta requests con API key"
    - "Daemon rechaza requests sin API key"
```

**Entregables**:
- [ ] Código en rama `feature/remote-api`
- [ ] Tests nuevos: +15 tests unitarios, +5 integration tests
- [ ] Documentación: `docs/deployment/remote-config.md`

---

### **FASE 2: Setup Oracle VM (3 días)**

**Objetivo**: Provisionar y configurar VM en Oracle Cloud con todos los servicios.

**Tareas**:
```yaml
fase_2:
  oracle_vm_setup:
    - task: "Crear VM Always Free"
      steps:
        - "Login a Oracle Cloud Console"
        - "Crear VM: Ubuntu 22.04 LTS, 1 OCPU, 1GB RAM (Always Free)"
        - "Región: Ashburn (US-EAST-1) o São Paulo (SA-SAOPAULO-1)"
        - "Descargar SSH key: sf-oracle-vm.pem"
        - "Anotar IP pública: 140.xxx.xxx.xxx"
      validacion:
        - "ssh -i sf-oracle-vm.pem ubuntu@<IP> conecta"
    
    - task: "Configurar Security List"
      steps:
        - "VCN → Security Lists → Add Ingress Rule"
        - "Source CIDR: 0.0.0.0/0"
        - "Protocol: TCP"
        - "Ports: 80, 443"
        - "Description: HTTP/HTTPS for Skills Fabrik API"
      validacion:
        - "telnet <IP> 80 conecta (después de Nginx)"
    
    - task: "Instalar dependencias base"
      script: |
        #!/bin/bash
        # Actualizar sistema
        sudo apt update && sudo apt upgrade -y
        
        # Instalar Node.js 20
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
        
        # Instalar herramientas
        sudo apt install -y git nginx certbot python3-certbot-nginx
        
        # Instalar pnpm y PM2 globalmente
        npm install -g pnpm pm2
        
        # Verificar versiones
        node --version    # v20.x
        pnpm --version    # 8.x
        pm2 --version     # 5.x
      validacion:
        - "node --version >= 20"
        - "pnpm --version >= 8"
        - "pm2 --version >= 5"
    
    - task: "Clonar y build proyecto"
      script: |
        #!/bin/bash
        cd /home/ubuntu
        git clone https://github.com/TU-USUARIO/skills-fabrik.git
        cd skills-fabrik
        
        # Checkout a rama con cambios remotos
        git checkout feature/remote-api
        
        # Instalar y build
        pnpm install
        pnpm -w build
        
        # Crear estructura de logs
        mkdir -p packages/{daemon,router,shared}/logs
      validacion:
        - "ls -la packages/daemon/dist/index.js existe"
        - "ls -la packages/router/dist/cli/start-router-server.js existe"
    
    - task: "Configurar variables de entorno"
      file: "/home/ubuntu/skills-fabrik/.env.production"
      contenido: |
        NODE_ENV=production
        
        # Service Ports
        SF_PORT=7727
        SF_HOST=0.0.0.0
        ROUTER_PORT=3000
        DISCOVERY_PORT=8877
        
        # Security
        SF_API_KEY=<GENERAR_SECRETO_FUERTE_64_CHARS>
        SF_ALLOWED_ORIGINS=https://api.fabriksystem.com
        SF_RATE_LIMIT_MAX=100
        SF_RATE_LIMIT_WINDOW=1 minute
        
        # Database (opcional)
        # DATABASE_URL=postgresql://skillsfabrik:PASSWORD@localhost:5432/skills_fabrik
        
        # Redis (opcional)
        # REDIS_URL=redis://localhost:6379
        
        # Dashboard (opcional, deshabilitado en producción)
        SF_DASHBOARD_ENABLED=false
      steps:
        - "Generar API key: openssl rand -hex 32"
        - "cp .env.example .env.production"
        - "nano .env.production (editar con valores reales)"
      validacion:
        - "cat .env.production | grep SF_API_KEY contiene hash largo"
    
    - task: "Configurar PostgreSQL (opcional)"
      script: |
        #!/bin/bash
        sudo apt install -y postgresql postgresql-contrib
        
        # Crear database y usuario
        sudo -u postgres psql << EOF
        CREATE DATABASE skills_fabrik;
        CREATE USER skillsfabrik WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';
        GRANT ALL PRIVILEGES ON DATABASE skills_fabrik TO skillsfabrik;
        EOF
        
        # Actualizar .env.production con DATABASE_URL
      validacion:
        - "psql -U skillsfabrik -d skills_fabrik -c '\\dt' conecta"
    
    - task: "Levantar servicios con PM2"
      script: |
        #!/bin/bash
        cd /home/ubuntu/skills-fabrik
        
        # Cargar env vars
        export $(cat .env.production | xargs)
        
        # Start PM2 ecosystem
        pm2 start scripts/pm2/ecosystem.config.cjs --env production
        
        # Save PM2 config
        pm2 save
        
        # Setup startup script
        pm2 startup systemd -u ubuntu --hp /home/ubuntu
      validacion:
        - "pm2 status muestra 4 servicios online"
        - "curl http://localhost:7727/health retorna 200"
        - "curl http://localhost:3000/health retorna 200"
        - "curl http://localhost:8877/health retorna 200"

  validacion_fase_2:
    - "VM accessible via SSH"
    - "Puertos 80/443 abiertos en Security List"
    - "Servicios corriendo: pm2 status muestra 4 online"
    - "Health checks locales: curl localhost:{7727,3000,8877}/health OK"
    - "PM2 configurado para auto-start al boot"
```

**Entregables**:
- [ ] VM Oracle provisionada y configurada
- [ ] Servicios corriendo con PM2
- [ ] Logs: `tail -f /home/ubuntu/skills-fabrik/packages/*/logs/*.log` sin errores
- [ ] Documentación: `docs/deployment/oracle-setup.md`

---

### **FASE 3: Configurar Nginx Reverse Proxy (1 día)**

**Objetivo**: Exponer servicios internos vía Nginx en puerto 80/443.

**Tareas**:
```yaml
fase_3:
  nginx_setup:
    - task: "Configurar Nginx site"
      file: "/etc/nginx/sites-available/api.fabriksystem.com"
      contenido: |
        # Rate limiting zones
        limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
        limit_req_zone $binary_remote_addr zone=health_limit:10m rate=100r/s;
        
        # Upstream definitions
        upstream sf_router {
            server 127.0.0.1:3000;
            keepalive 32;
        }
        
        upstream sf_daemon {
            server 127.0.0.1:7727;
            keepalive 32;
        }
        
        server {
            listen 80;
            server_name api.fabriksystem.com;
            
            # Security headers
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header Referrer-Policy "strict-origin-when-cross-origin" always;
            
            # Health check endpoint (sin rate limit, para Cloudflare)
            location /health {
                limit_req zone=health_limit burst=200 nodelay;
                proxy_pass http://sf_router/health;
                proxy_http_version 1.1;
                proxy_set_header Connection "";
                proxy_cache_bypass $http_upgrade;
                access_log off;  # No logs para health checks
            }
            
            # Router API (requiere autenticación en daemon)
            location /api/ {
                limit_req zone=api_limit burst=20 nodelay;
                
                proxy_pass http://sf_router/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
                
                # Timeouts para operaciones largas
                proxy_connect_timeout 60s;
                proxy_send_timeout 60s;
                proxy_read_timeout 60s;
            }
            
            # Daemon directo (opcional, para debugging)
            # location /daemon/ {
            #     limit_req zone=api_limit burst=20 nodelay;
            #     proxy_pass http://sf_daemon/;
            # }
            
            # Default: redirigir a router
            location / {
                limit_req zone=api_limit burst=20 nodelay;
                proxy_pass http://sf_router/;
                proxy_http_version 1.1;
                proxy_set_header Connection "";
            }
        }
      steps:
        - "sudo nano /etc/nginx/sites-available/api.fabriksystem.com"
        - "sudo ln -s /etc/nginx/sites-available/api.fabriksystem.com /etc/nginx/sites-enabled/"
        - "sudo nginx -t"
        - "sudo systemctl reload nginx"
      validacion:
        - "sudo nginx -t retorna OK"
        - "curl http://localhost/health retorna 200"
    
    - task: "Configurar SSL con Cloudflare Origin Certificate"
      steps:
        - "Login a Cloudflare Dashboard"
        - "SSL/TLS → Origin Server → Create Certificate"
        - "Validity: 15 years"
        - "Descargar: origin.pem (certificate) + origin.key (private key)"
        - "Copiar a VM:"
          - "sudo mkdir -p /etc/nginx/ssl"
          - "sudo nano /etc/nginx/ssl/origin.pem (pegar certificate)"
          - "sudo nano /etc/nginx/ssl/origin.key (pegar private key)"
          - "sudo chmod 600 /etc/nginx/ssl/origin.key"
      validacion:
        - "ls -la /etc/nginx/ssl/origin.* existen"
    
    - task: "Actualizar Nginx para HTTPS"
      file: "/etc/nginx/sites-available/api.fabriksystem.com"
      agregar: |
        server {
            listen 443 ssl http2;
            server_name api.fabriksystem.com;
            
            # SSL Configuration
            ssl_certificate /etc/nginx/ssl/origin.pem;
            ssl_certificate_key /etc/nginx/ssl/origin.key;
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_ciphers HIGH:!aNULL:!MD5;
            ssl_prefer_server_ciphers on;
            ssl_session_cache shared:SSL:10m;
            ssl_session_timeout 10m;
            
            # ... resto de config (igual que server 80)
        }
        
        # Redirigir HTTP a HTTPS (opcional, Cloudflare lo hace)
        server {
            listen 80;
            server_name api.fabriksystem.com;
            return 301 https://$server_name$request_uri;
        }
      steps:
        - "sudo nginx -t"
        - "sudo systemctl reload nginx"
      validacion:
        - "curl -k https://localhost/health retorna 200"

  validacion_fase_3:
    - "sudo nginx -t sin errores"
    - "curl http://<IP_PUBLICA>/health retorna 200"
    - "curl -k https://<IP_PUBLICA>/health retorna 200"
    - "curl -H 'X-SF-API-Key: INVALID' http://<IP_PUBLICA>/api/skills retorna 401"
```

**Entregables**:
- [ ] Nginx configurado y corriendo
- [ ] SSL certificates instalados
- [ ] Rate limiting activo
- [ ] Logs Nginx: `tail -f /var/log/nginx/access.log` muestra requests

---

### **FASE 4: Configurar Cloudflare DNS + SSL (30 min)**

**Objetivo**: Conectar dominio api.fabriksystem.com a VM Oracle con SSL.

**Tareas**:
```yaml
fase_4:
  cloudflare_setup:
    - task: "Crear DNS record"
      steps:
        - "Login a Cloudflare Dashboard"
        - "Seleccionar dominio: fabriksystem.com"
        - "DNS → Add record"
        - "Type: A"
        - "Name: api"
        - "Content: <IP_PUBLICA_ORACLE>"
        - "Proxy status: Proxied (nube naranja)"
        - "TTL: Auto"
        - "Save"
      validacion:
        - "dig api.fabriksystem.com retorna IP de Cloudflare (no Oracle directamente)"
        - "ping api.fabriksystem.com alcanza Cloudflare CDN"
    
    - task: "Configurar SSL/TLS mode"
      steps:
        - "SSL/TLS → Overview"
        - "Encryption mode: Full (strict)"
        - "Explanation: Cloudflare ↔ Origin con certificado válido"
      validacion:
        - "SSL/TLS mode muestra 'Full (strict)'"
    
    - task: "Habilitar Always Use HTTPS"
      steps:
        - "SSL/TLS → Edge Certificates"
        - "Always Use HTTPS: ON"
        - "Minimum TLS Version: 1.2"
        - "Automatic HTTPS Rewrites: ON"
      validacion:
        - "curl -I http://api.fabriksystem.com retorna 301 → https"
    
    - task: "Configurar Caching (opcional)"
      steps:
        - "Caching → Configuration"
        - "Browser Cache TTL: 4 hours"
        - "Crawler Hints: ON"
      notas:
        - "Health checks NO deben cachearse (access_log off + cache_bypass)"
    
    - task: "Configurar Rate Limiting adicional (opcional)"
      steps:
        - "Security → WAF"
        - "Rate Limiting Rules"
        - "Create rule: 100 req/min por IP"
        - "Action: Challenge (CAPTCHA)"
      notas:
        - "Nginx ya tiene rate limiting, esto es capa adicional"

  validacion_fase_4:
    - "curl -I https://api.fabriksystem.com/health retorna 200"
    - "SSL Labs test: A o superior"
    - "Cloudflare Analytics muestra tráfico"
    - "Tiempo de respuesta < 500ms desde cliente externo"
```

**Entregables**:
- [ ] DNS apuntando correctamente
- [ ] HTTPS funcional
- [ ] Cloudflare Analytics activo
- [ ] Screenshot de SSL Labs test

---

### **FASE 5: Actualizar CLI para Remoto (2 días)**

**Objetivo**: Integrar soporte remoto en CLI y validar end-to-end.

**Tareas**:
```yaml
fase_5:
  cli_integration:
    - task: "Integrar API client en comandos existentes"
      files:
        - "packages/skills-cli/src/commands/skills.ts"
        - "packages/skills-cli/src/commands/dashboard.ts"
        - "packages/skills-cli/src/commands/kpi.ts"
      cambios:
        - "Importar SkillsFabrikAPIClient"
        - "Detectar si hay config remota (loadRemoteConfig())"
        - "Si remoto: usar apiClient.method(), sino: lógica local actual"
      ejemplo: |
        // Antes
        const result = await activateSkillLocally(skillId);
        
        // Después
        const config = loadRemoteConfig();
        const result = config.api_base_url !== 'http://127.0.0.1:3000'
          ? await apiClient.activateSkill(skillId, context)
          : await activateSkillLocally(skillId);
      validacion:
        - "skills-cli skills check 'test' funciona local y remoto"
    
    - task: "Agregar comando 'config test'"
      file: "packages/skills-cli/src/commands/config.ts"
      implementacion: |
        async function testRemoteConnection() {
          const config = loadRemoteConfig();
          const client = new SkillsFabrikAPIClient();
          
          console.log(`Testing connection to ${config.api_base_url}...`);
          
          try {
            const start = Date.now();
            const health = await client.healthCheck();
            const latency = Date.now() - start;
            
            console.log(`✅ Connection successful!`);
            console.log(`   Status: ${health.status}`);
            console.log(`   Latency: ${latency}ms`);
            return true;
          } catch (error) {
            console.error(`❌ Connection failed: ${error.message}`);
            return false;
          }
        }
      validacion:
        - "skills-cli config test retorna éxito con latencia < 500ms"
    
    - task: "Actualizar documentación"
      files:
        - "README.md - Agregar sección 'Remote Usage'"
        - "CLAUDE.md - Actualizar con comandos remotos"
        - "docs/deployment/remote-usage.md - Guía completa"
      contenido: |
        ## Remote Usage
        
        ### Initial Setup
        ```bash
        # Configure remote API
        skills-cli config init --remote
        # Enter URL: https://api.fabriksystem.com
        # Enter API Key: <your-key-here>
        
        # Test connection
        skills-cli config test
        ```
        
        ### Usage
        All commands work the same locally and remotely:
        ```bash
        skills-cli skills check "implement auth"
        skills-cli dashboard health
        skills-cli kpi show
        ```
        
        ### Switching Between Local/Remote
        ```bash
        # Use remote
        export SF_REMOTE_API_URL=https://api.fabriksystem.com
        
        # Use local
        unset SF_REMOTE_API_URL
        ```
      validacion:
        - "Documentación clara y con ejemplos