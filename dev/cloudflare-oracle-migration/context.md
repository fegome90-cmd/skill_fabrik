# Context - Cloudflare + Oracle Migration
## Skills Fabrik Remote Architecture Deployment

> **Phase**: Pre-Deployment Preparation + Remote Migration
> **Duration**: Phase 0 (1 day) + Phases 1-5 (8.5 days) = ~10 days total
> **Status**: 🔴 Phase 0 - Critical Fixes Required
> **Created**: 2025-11-06T15:40:00Z
> **Last Updated**: 2025-11-06T15:40:00Z

---

## 🎯 **MISSION STATEMENT**

Migrate Skills Fabrik from local-only architecture to remote-accessible system using:
- **Oracle Cloud** (Always Free Tier) - Backend hosting
- **Cloudflare** (Free Plan) - DNS, SSL, CDN, DDoS protection
- **PM2** - Process management
- **Nginx** - Reverse proxy with rate limiting

**Goal**: Enable CLI access from any machine via `https://api.fabriksystem.com` without losing current functionality or significantly increasing latency.

---

## 📊 **CURRENT STATE ANALYSIS**

### System Status: 🔴 NOT READY (Score: 68/100)

**Pre-Deployment Report**: `docs/analysis/PRE-DEPLOYMENT-READINESS-REPORT.md`

#### Critical Blockers (P0)
1. **Security Vulnerabilities**
   - Critical: `form-data@2.3.3` (unsafe random function)
   - High: `d3-color@1.4.1` (ReDoS vulnerability)
   - Source: `clinic@13.0.0` dependency in router package

2. **Services Not Running**
   - Expected: 3 PM2 services (daemon, router, discovery)
   - Actual: 0 services running
   - Impact: System non-functional

#### High Priority Issues (P1)
3. **Performance**: 5708ms pre-invoke latency (target: <2000ms)
4. **Code Quality**: 1 syntax error + 47 lint warnings
5. **Dependencies**: `@fastify/cors` compatibility with Fastify version

### Current Architecture (Local)

```
┌─────────────────────────────────────────┐
│   Localhost (127.0.0.1)                 │
│                                         │
│   User → CLI → Router → Daemon          │
│         (N/A)  (3000)    (7727)         │
│                                         │
│   Service Discovery: 8877               │
│   Dashboard (optional): 8888            │
│                                         │
│   Storage:                              │
│   - L0: .sf/ (local files)              │
│   - L1: .sf/cache/                      │
│   - L2: PostgreSQL (optional)           │
│   - L3: Redis/ChromaDB (optional)       │
└─────────────────────────────────────────┘

Limitations:
❌ Only accessible from local machine
❌ No authentication (trusts localhost)
❌ Difficult multi-developer collaboration
❌ Cannot run in CI/CD
```

### Components Inventory

| Component | Port | Status | Package | Health Check |
|-----------|------|--------|---------|--------------|
| CLI | N/A | ✅ Built | `@skills-fabrik/skills-cli` | N/A |
| Router | 3000 | ❌ Not Running | `@skills-fabrik/router` | `/health` |
| Daemon | 7727 | ❌ Not Running | `@skills-fabrik/daemon` | `/health` |
| Discovery | 8877 | ❌ Not Running | `@skills-fabrik/shared` | `/health` |
| Dashboard | 8888 | ⚠️ Optional | `@skills-fabrik/skills-cli` | `/health` |

### Skills System
- **Total Skills**: 33 indexed
- **Validated (strict)**: 28 (84.8%)
- **Categories**: guidelines, guardrails, workflows, generators, test, quality, security, performance, data
- **Configuration**: `configs/skill-rules.json`
- **Registry**: `registry/index.json`

### Test Coverage
- **Phase 3 Tests**: 19/20 passing (95%)
- **Failing**: T-015 (Performance - 5708ms > 2000ms target)
- **Total Tests**: 20 comprehensive tests
- **Success Rate**: 95%

---

## 🎯 **TARGET ARCHITECTURE (Remote)**

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENTS (Anywhere)                         │
│                                                               │
│  Dev Machine 1    Dev Machine 2    CI/CD Server             │
│  CLI               CLI               CLI                      │
│  │                 │                 │                        │
│  └─────────────────┴─────────────────┘                       │
│                     │                                         │
│                     ▼                                         │
│          https://api.fabriksystem.com                        │
│          (X-SF-API-Key: secret-key)                          │
└──────────────────────────────────────────────────────────────┘
                      │
                      │ HTTPS (TLS 1.2+)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (Global CDN)                    │
│                                                               │
│  ✓ DNS: api.fabriksystem.com → Oracle IP                    │
│  ✓ SSL/TLS: Full (strict) mode                              │
│  ✓ Always Use HTTPS                                          │
│  ✓ DDoS Protection                                            │
│  ✓ Rate Limiting (optional, additional layer)               │
│  ✓ Caching: 4 hours browser cache                           │
└──────────────────────────────────────────────────────────────┘
                      │
                      │ HTTPS (Cloudflare Origin Cert)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│          ORACLE CLOUD VM (Always Free Tier)                   │
│          IP: 140.xxx.xxx.xxx (public)                        │
│          OS: Ubuntu 22.04 LTS                                │
│          Specs: 1 OCPU, 1GB RAM, 50GB Storage                │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   NGINX (Port 80/443)                                  │  │
│  │   - Reverse proxy                                      │  │
│  │   - Rate limiting (10 req/s API, 100 req/s health)    │  │
│  │   - SSL termination                                    │  │
│  │   - Security headers                                   │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                          │
│  ┌─────────────────▼──────────────────────────────────────┐  │
│  │   PM2 Process Manager                                  │  │
│  │                                                         │  │
│  │   ┌──────────────────────────────────────────────┐    │  │
│  │   │ Router Service (localhost:3000)              │    │  │
│  │   │ - Pre/post invoke hooks                      │    │  │
│  │   │ - PBv2 activation engine                     │    │  │
│  │   │ - Quality gates integration                  │    │  │
│  │   └──────────────┬───────────────────────────────┘    │  │
│  │                  │                                     │  │
│  │   ┌──────────────▼───────────────────────────────┐    │  │
│  │   │ Daemon Service (localhost:7727)              │    │  │
│  │   │ - REST API (Fastify 4.x)                     │    │  │
│  │   │ - API Key authentication                     │    │  │
│  │   │ - Skill execution                            │    │  │
│  │   │ - Event store                                │    │  │
│  │   │ - Rate limiting (100 req/min)                │    │  │
│  │   └──────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  │   ┌──────────────────────────────────────────────┐    │  │
│  │   │ Service Discovery (localhost:8877)           │    │  │
│  │   │ - Health check aggregation                   │    │  │
│  │   │ - Service registry                           │    │  │
│  │   └──────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Storage (Internal):                                          │
│  - L0: /home/ubuntu/skills-fabrik/.sf/                       │
│  - L1: /home/ubuntu/skills-fabrik/.sf/cache/                │
│  - L2: PostgreSQL (localhost:5432) - optional                │
│  - L3: Redis (localhost:6379) - optional                     │
└──────────────────────────────────────────────────────────────┘
```

### Key Changes

| Aspect | Before (Local) | After (Remote) | Benefit |
|--------|---------------|----------------|---------|
| **Access** | `http://localhost:3000` | `https://api.fabriksystem.com` | Global access |
| **Auth** | None (trusts localhost) | API Key (X-SF-API-Key header) | Security |
| **SSL** | None | Cloudflare + Origin Cert | Encrypted traffic |
| **DNS** | N/A | Cloudflare DNS + CDN | Pretty URL, DDoS protection |
| **Cost** | $0 | $0 (Free tiers) | No cost increase |
| **Latency** | ~466ms local | Target: <500ms remote | Acceptable overhead |
| **Availability** | Single machine | PM2 auto-restart + monitoring | High availability |

---

## 🔧 **TECHNICAL REQUIREMENTS**

### Infrastructure

#### Oracle Cloud (Always Free Tier)
- **Instance**: VM.Standard.E2.1.Micro
- **vCPU**: 1 OCPU (Always Free eligible)
- **RAM**: 1GB
- **Storage**: 50GB Boot Volume
- **Bandwidth**: 10TB/month outbound
- **OS**: Ubuntu 22.04 LTS (64-bit)
- **Region**: Ashburn (US-EAST-1) or São Paulo (SA-SAOPAULO-1)

#### Cloudflare (Free Plan)
- **DNS**: Unlimited DNS queries
- **SSL**: Universal SSL (automatic)
- **DDoS**: Unmetered mitigation
- **CDN**: Global network
- **Origin Certificates**: 15-year validity
- **Page Rules**: 3 free rules
- **Rate Limiting**: Manual configuration

### Software Stack

#### VM Dependencies
```yaml
runtime:
  nodejs: ">=20.0.0"
  npm: ">=10.0.0"
  pnpm: ">=8.0.0"
  pm2: ">=5.0.0"
  git: "latest"

web_server:
  nginx: ">=1.18.0"
  
database_optional:
  postgresql: ">=14.0"
  redis: ">=6.0"

monitoring:
  pm2-logrotate: "latest"
```

#### Application Stack
```yaml
packages:
  skills-cli:
    package: "@skills-fabrik/skills-cli"
    version: "1.0.0"
    runtime: "Node.js client-side"
    
  router:
    package: "@skills-fabrik/router"
    port: 3000
    process_manager: "PM2"
    dependencies: ["daemon"]
    
  daemon:
    package: "@skills-fabrik/daemon"
    port: 7727
    process_manager: "PM2"
    dependencies: ["postgresql (optional)"]
    
  discovery:
    package: "@skills-fabrik/shared"
    port: 8877
    process_manager: "PM2"
    dependencies: []
```

### Security Configuration

#### Authentication
```yaml
authentication:
  method: "API Key"
  header: "X-SF-API-Key"
  storage: "~/.fabriksystem/config.json (client)"
  validation: "Environment variable SF_API_KEY (server)"
  generation: "openssl rand -hex 32"
  rotation: "Manual, every 90 days recommended"
```

#### Rate Limiting (Multi-Layer)
```yaml
nginx_layer:
  api_endpoints:
    rate: "10 requests/second"
    burst: 20
    action: "reject"
  
  health_checks:
    rate: "100 requests/second"
    burst: 200
    action: "reject"

daemon_layer:
  global:
    max: 100
    window: "1 minute"
    allowlist: ["127.0.0.1", "::1"]
```

#### SSL/TLS Configuration
```yaml
cloudflare:
  mode: "Full (strict)"
  min_tls_version: "1.2"
  always_https: true
  automatic_https_rewrites: true
  
nginx:
  certificate: "/etc/nginx/ssl/origin.pem"
  certificate_key: "/etc/nginx/ssl/origin.key"
  protocols: ["TLSv1.2", "TLSv1.3"]
  ciphers: "HIGH:!aNULL:!MD5"
  prefer_server_ciphers: true
```

---

## 📋 **MIGRATION PHASES**

### Phase 0: Pre-Deployment Fixes (1 day) - CRITICAL
**Status**: 🔴 REQUIRED BEFORE PROCEEDING

**Objective**: Resolve critical blockers identified in pre-deployment analysis

**Tasks**:
1. Fix security vulnerabilities (P0-1)
2. Start PM2 services (P0-2)
3. Optimize performance - implement cache (P1-1)
4. Fix lint errors (P1-2)

**Success Criteria**:
- Security audit: 0 critical/high vulnerabilities
- PM2 status: 3/3 services online
- Tests: 20/20 passing
- Pre-deployment score: ≥80/100

**Validation**: `./scripts/pre-deployment-check.sh`

---

### Phase 1: Preparación Local (2 días)
**Status**: ⏸️ WAITING (Phase 0 must complete first)

**Objective**: Adapt code to support remote configuration without breaking local functionality

**Deliverables**:
- `packages/skills-cli/src/config/remote-config.ts`
- `packages/skills-cli/src/lib/api-client.ts`
- `packages/skills-cli/src/commands/config.ts` (init, test commands)
- `packages/daemon/src/middleware/auth.ts`
- `.env.production.example`

**New Capabilities**:
- CLI detects remote vs local configuration
- API client with timeout and auth
- Interactive remote setup: `skills-cli config init --remote`
- Test connectivity: `skills-cli config test`

---

### Phase 2: Setup Oracle VM (3 días)
**Status**: ⏸️ WAITING

**Objective**: Provision and configure Oracle Cloud infrastructure

**Deliverables**:
- Oracle VM created and accessible
- Node.js + pnpm + PM2 installed
- Repository cloned and built
- PM2 services running
- PostgreSQL configured (optional)

**Key Files**:
- `/home/ubuntu/skills-fabrik/.env.production`
- PM2 ecosystem running all services

---

### Phase 3: Nginx Reverse Proxy (1 día)
**Status**: ⏸️ WAITING

**Objective**: Configure Nginx as reverse proxy with SSL

**Deliverables**:
- Nginx installed and configured
- SSL certificates from Cloudflare installed
- Rate limiting active
- Health checks accessible via public IP

**Key Files**:
- `/etc/nginx/sites-available/api.fabriksystem.com`
- `/etc/nginx/ssl/origin.{pem,key}`

---

### Phase 4: Cloudflare DNS + SSL (30 min)
**Status**: ⏸️ WAITING

**Objective**: Connect domain to Oracle VM with SSL

**Deliverables**:
- DNS A record: api.fabriksystem.com → Oracle IP
- SSL/TLS mode: Full (strict)
- Always Use HTTPS: enabled
- E2E connectivity validated

---

### Phase 5: Actualizar CLI (2 días)
**Status**: ⏸️ WAITING

**Objective**: Integrate remote functionality into CLI

**Deliverables**:
- API client integrated in all commands
- Remote E2E tests passing
- Documentation updated
- Release: v2.0.0-remote

---

## 🔍 **MONITORING & VALIDATION**

### Health Checks

```yaml
endpoints:
  router:
    url: "https://api.fabriksystem.com/health"
    expected: 200
    timeout: 5s
    frequency: "Every 5 minutes"
    
  daemon:
    url: "http://localhost:7727/health" (internal only)
    expected: 200
    timeout: 3s
    frequency: "Every 5 seconds (PM2)"
    
  discovery:
    url: "http://localhost:8877/health" (internal only)
    expected: 200
    timeout: 3s
    frequency: "Every 10 seconds"
```

### Performance Metrics

```yaml
targets:
  latency_remote: "<500ms"
  latency_p95: "<1000ms"
  latency_p99: "<2000ms"
  uptime: ">99.0%"
  error_rate: "<1%"
  
measurement:
  tool: "skills-cli bench:activate --remote"
  frequency: "Daily"
  storage: "obs/kpi/performance.jsonl"
```

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs <service-name> --lines 200

# View resource usage
pm2 monit

# View dashboard
pm2 web  # http://localhost:9615
```

---

## 🚨 **RISK ANALYSIS**

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Latency exceeds 500ms | Medium | High | Implement aggressive caching, optimize regex |
| Oracle suspends Free Tier | Low | Critical | Monitor usage, stay within limits, have migration plan |
| API key exposed | Medium | Critical | Store in ~/.fabriksystem/, rotate regularly, rate limit |
| Single VM failure | High | High | PM2 auto-restart, health monitoring, backup strategy |
| WebSocket issues (dashboard) | High | Low | Use SSE or HTTP polling instead |
| Breaking changes in deps | Low | Medium | Test thoroughly before updating major versions |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Team doesn't adopt | Medium | High | Training, clear docs, maintain local option |
| Performance worse than local | High | Medium | Set expectations, optimize continuously |
| Debugging complexity | Medium | Medium | Centralized logs, SSH access documented |

---

## 📞 **CONTACTS & OWNERSHIP**

### Project Team

| Role | Responsibility | Phase Focus |
|------|---------------|-------------|
| **Project Lead** | Overall coordination, stakeholder communication | All phases |
| **DevOps** | Oracle VM, Nginx, Cloudflare, security | Phase 0, 2, 3, 4 |
| **Backend Team** | API client, auth middleware, performance | Phase 0, 1, 5 |
| **QA** | E2E tests, validation scripts | Phase 1, 5 |
| **Tech Writer** | Documentation updates | Phase 5 |

### Escalation

1. **Level 1**: Self-service (use this document + plan.md + tasks.md)
2. **Level 2**: Team Lead review (for decisions)
3. **Level 3**: Architecture review (for breaking changes)

---

## 📚 **REFERENCE DOCUMENTS**

### In This Directory
- **`plan.md`**: Detailed 5-phase migration plan + Phase 0
- **`tasks.md`**: Granular task tracking with status updates
- **`README.md`**: Quick start guide for this migration

### Related Documentation
- **`docs/analysis/PRE-DEPLOYMENT-READINESS-REPORT.md`**: Full pre-deployment analysis
- **`docs/analysis/PRE-DEPLOYMENT-EXECUTIVE-SUMMARY.md`**: Executive summary
- **`docs/dev-docs/context.md`**: Original project context
- **`docs/dev-docs/plan.md`**: Original migration plan (source)
- **`docs/dev-docs/tasks.md`**: Original task list (source)
- **`scripts/pre-deployment-check.sh`**: Automated validation

### External References
- Oracle Cloud Free Tier: https://www.oracle.com/cloud/free/
- Cloudflare Free Plan: https://www.cloudflare.com/plans/free/
- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- Nginx Documentation: https://nginx.org/en/docs/

---

## 🎯 **SUCCESS CRITERIA**

### Must Have (Blocking)
- [ ] Phase 0 complete: Score ≥80/100
- [ ] All services accessible remotely via HTTPS
- [ ] API key authentication working
- [ ] Latency <500ms average
- [ ] All 20 tests passing in remote environment
- [ ] Zero downtime during deployment
- [ ] Documentation complete and accurate

### Nice to Have (Non-blocking)
- [ ] Performance optimization (P1-1 resolved)
- [ ] Dashboard functional remotely
- [ ] Automated deployment script
- [ ] CI/CD pipeline setup

---

**Document Version**: 1.0.0  
**Last Validation**: 2025-11-06T15:40:00Z  
**Next Review**: After Phase 0 completion  
**Status**: 🔴 Phase 0 Required