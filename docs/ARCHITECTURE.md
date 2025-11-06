# Skills Fabric - System Architecture

## Overview

Skills Fabric is a distributed microservices architecture for skill management, development automation, and workflow orchestration using the CLOOP methodology. The system provides editor-agnostic capabilities for skill activation, quality enforcement, and performance monitoring.

## Core Architecture

### Multi-Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   skills-cli    │    │     router      │    │     daemon      │
│   (CLI Tool)    │───▶│  (Activation)   │───▶│ (Execution)     │
│                 │    │   Port 3000     │    │   Port 7727     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MCP Adapters   │    │ Service Discovery│    │   PostgreSQL    │
│ (External Svc)  │    │   Port 8877     │    │   (L2 Storage)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │     KPI         │
│   (Optional)    │    │  (Metrics)      │
└─────────────────┘    └─────────────────┘
```

## Core Services

### 1. @skills-fabrik/skills-cli (CLI Tool)

**Purpose**: Universal CLI interface for skill management and development automation

**Key Responsibilities**:
- Skill activation and management
- CLOOP methodology implementation
- Prompt Builder v2 system
- Quality gates and guardrails
- KPI monitoring and dashboard generation
- Slash commands system

**Entry Points**:
- Global: `skills-cli` or `sf` commands
- Local: `node packages/skills-cli/dist/index.js <command>`

### 2. @skills-fabrik/router (Activation Router)

**Purpose**: Router service with pre-invoke and stop hooks for skill activation

**Port**: 3000

**Key Responsibilities**:
- User prompt submit hook for skill matching
- Stop hook for build checks, formatting, KPI emission
- Skill activation engine using `registry/index.json`
- Fastify-based HTTP server with CORS support
- Editor-agnostic webhook integration

**Key Endpoints**:
- `POST /hooks/user-prompt-submit` - Pre-invoke skill activation
- `POST /hooks/stop` - Post-response quality checks
- `GET /health` - Service health check

### 3. @skills-fabrik/daemon (Background Services)

**Purpose**: Background services with REST API for skill execution and monitoring

**Port**: 7727

**Key Responsibilities**:
- Skill execution engine
- REST API endpoints for external integration
- PostgreSQL persistence (L2 storage)
- WebSocket support for real-time communication
- Security validation and policy enforcement
- Performance metrics collection

**Key Endpoints**:
- `POST /activate` - Activate skills based on content
- `POST /execute` - Execute skill with confirmation
- `GET /health` - Service health check
- `GET /metrics` - Performance metrics
- `POST /snapshot` - Create system snapshots

### 4. @skills-fabrik/shared (Service Management)

**Purpose**: Shared utilities and service management infrastructure

**Port**: 8877 (Service Discovery)

**Key Responsibilities**:
- Service discovery and registry
- Health checking across all services
- Dependency management
- Circuit breaker pattern implementation
- Distributed state management

### 5. @skills-fabrik/mcp-adapters (External Service Integration)

**Purpose**: MCP (Model Context Protocol) adapters for external services

**Key Responsibilities**:
- File system adapter for local operations
- Git adapter for version control integration
- PM2 adapter for process management
- Metrics adapter for performance monitoring
- MemTech adapter for multi-tier storage

### 6. @skills-fabrik/kpi (Performance Monitoring)

**Purpose**: Event aggregation and dashboard generation

**Key Responsibilities**:
- JSONL event processing (`obs/kpi/events.jsonl`)
- KPI dashboard generation
- Performance metrics tracking
- Trend analysis and reporting
- Real-time monitoring capabilities

### 7. @skills-fabrik/slash-commands (Automation)

**Purpose**: Slash commands system with persistent context

**Key Responsibilities**:
- Persistent context management
- Workflow automation
- Dev-docs integration
- Command parsing and execution
- State persistence

## Data Flow Architecture

### 1. Skill Activation Flow

```
User Input → CLI → Router → Registry → Skill Match → Daemon → Execution → Response
    │         │       │          │           │          │          │
    │         │       │          │           │          │          ▼
    │         │       │          │           │          │    Quality Hooks
    │         │       │          │           │          │          │
    │         │       │          │           │          ▼          ▼
    │         │       │          │           │    Policy Check   KPI Emit
    │         │       │          │           │          │          │
    │         │       │          │           ▼          ▼          ▼
    │         │       │          │    Guardrail Validation  Storage
    │         │       │          │           │          │          │
    ▼         ▼       ▼          ▼           ▼          ▼          ▼
Prompt Builder v2  CLOOP     Context    Security   Performance  Monitoring
   Analysis         Planning   Awareness  Checks     Metrics      Dashboard
```

### 2. Quality Enforcement Pipeline

```
Pre-invoke Hook → Skill Matching → Activation → Execution → Post-response Hook
       │                │             │           │              │
       ▼                ▼             ▼           ▼              ▼
Context Analysis   Registry       Guardrails   Build Checks    KPI Emission
Intent Detection   Indexing       Security     Formatting      Bash Validation
TAG Generation     Scoring        Policies     Linting         Security Scan
```

### 3. Multi-Tier Storage (MemTech Universal Memory System)

Skills Fabric uses **MemTech**, a universal memory system with multi-tiered storage for optimal performance and data safety.

#### Architecture Overview

```
┌─────────────────┐
│     L0          │ ← Local Storage (.sf directory)
│   Local         │   Immediate access (< 1ms)
│   Storage       │   Session data (ephemeral)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│     L1          │ ← Cache Layer (.sf/cache)
│    Cache        │   Performance optimization (1-10ms)
│    Layer        │   Frequently accessed data (TTL-based)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│     L2          │ ← PostgreSQL (Primary)
│  PostgreSQL     │   **PERMANENT STORAGE** (10-50ms)
│  (Primary)      │   Historical data (FOREVER)
│  (Single Source │
│   of Truth)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Optional      │ ← Redis/ChromaDB (Enhanced)
│  Extensions     │   Advanced features
│                 │   (disabled by default)
└─────────────────┘
```

#### Key Principles

✅ **PostgreSQL as Single Source of Truth**
- All persistent data stored in PostgreSQL (L2)
- No TTL in L2 - data persists **FOREVER**
- Guaranteed recovery from PostgreSQL
- ACID compliance ensures data integrity

✅ **L0/L1 as Performance Cache Only**
- L0: Immediate access (< 1ms), ephemeral
- L1: Fast access (1-10ms), TTL-based
- Data loss on restart is **expected**
- Always recover from PostgreSQL (L2)

#### Detailed Documentation

📄 **Full MemTech Documentation:** [`docs/architecture/memtech-universal-memory-system.md`](../architecture/memtech-universal-memory-system.md)

This comprehensive guide covers:
- Complete architecture with corrected design
- PostgreSQL schema with constraints and indices
- Scoring algorithms for L0/L1/L2
- Data flow and indexing strategies
- Performance optimization
- Backup and disaster recovery procedures
- Configuration and best practices
- Troubleshooting guide
- Comparison with StartKit implementation

#### Use Cases

- **Dev-Docs Storage:** All documentation indexed to PostgreSQL with fast L0/L1 access
- **Skills Metadata:** Skill information persisted with cache layers for quick retrieval
- **KPI Events:** Event history stored permanently in PostgreSQL
- **Activation History:** Skill activation logs with guaranteed persistence
- **Query Caching:** Frequently accessed queries cached in L0/L1 for performance

#### Benefits

✅ **Zero Data Loss:** PostgreSQL guarantees persistence
✅ **High Performance:** Multi-tier caching provides < 1ms access to hot data
✅ **Scalability:** PostgreSQL ecosystem (read replicas, sharding)
✅ **Recovery:** Guaranteed recovery from PostgreSQL backups
✅ **Data Integrity:** UNIQUE constraints, foreign keys, validation

## Service Communication Patterns

### 1. Synchronous Communication

- **CLI → Router**: HTTP requests for skill activation
- **Router → Daemon**: HTTP requests for skill execution
- **Service Discovery**: HTTP health checks and registration

### 2. Asynchronous Communication

- **KPI Events**: JSONL event logging
- **WebSocket**: Real-time updates and notifications
- **PM2 Events**: Process management events

### 3. Circuit Breaker Pattern

```
Service Request → Circuit Breaker → Service Response
       │                │                │
       ▼                ▼                ▼
   Health Check    Failure Rate    Response Time
       │                │                │
       ▼                ▼                ▼
   Service State  Threshold Check  Timeout Check
       │                │                │
       ▼                ▼                ▼
   OPEN/CLOSED   Circuit State   Fallback Action
```

## Security Architecture

### 1. Multi-Level Guardrails

```
SUGGEST → WARN → BLOCK → REQUIRE
   │         │        │         │
   ▼         ▼        ▼         ▼
Best      High     Critical   Mandatory
Practices  Risk     Patterns   Checks
```

### 2. Policy Enforcement

- **S1 Policies**: Security-critical patterns
- **S2 Policies**: Operational safety patterns
- **NET Policies**: Network security patterns
- **Confirmation Mechanisms**: Challenge-response validation

### 3. Security Validation

- **Bash Command Validation**: `scripts/hooks/bash-validator.py`
- **API Schema Validation**: JSON schemas in `schemas/` directory
- **Authentication**: API key and JWT support
- **Authorization**: Role-based access control

## Quality Gates Architecture

### G1-G8 Quality Gates (CI/CD Pipeline)

```
G1 (P0): Build Integrity     ──┐
G2 (P0): Activation Tests   ──┤
G3 (P0): Guardrail Checks  ──┤── CI Pipeline
G4 (P1): Additional Checks ──┤
G5 (P1): Notifications      ──┤
G6 (P1): Content Health     ──┤
G7 (P2): Extended Tests    ──┤
G8 (P2): Documentation      ──┘
```

### Test Coverage

- **T001-T020**: Comprehensive test suite
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service interaction testing
- **E2E Tests**: End-to-end workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability and penetration testing

## CLOOP Methodology Integration

### CLOOP Phases in Architecture

```
Clarify → Layout → Operate → Observe → Reflect
   │        │        │         │        │
   ▼        ▼        ▼         ▼        ▼
Planning  Design  Execution  Metrics  Learning
Context   Structure  Code    Events   Analysis
Objectives Components  Testing  KPIs    Improvements
```

### Implementation Patterns

1. **Planning Mode**: Changes require approved plans
2. **Zero Errors Left**: Post-response quality enforcement
3. **Progressive Disclosure**: Lightweight skills with on-demand resources
4. **Multi-level Enforcement**: Educational guardrails
5. **Scientific Validation**: Evidence-based improvements

## Performance Architecture

### 1. Caching Strategy

- **L0 Cache**: Immediate access (`.sf` directory)
- **L1 Cache**: Performance optimization (`.sf/cache`)
- **Redis Cache**: Optional enhanced caching
- **Application Cache**: In-memory caching

### 2. Performance Monitoring

```
Events Collection → Processing → Aggregation → Dashboard
       │               │            │             │
       ▼               ▼            ▼             ▼
   JSONL Logs      KPI Engine   Metrics     Visualization
  (events.jsonl)   (Rollup)    (Analysis)   (Dashboard)
```

### 3. Performance Metrics

- **Response Time**: Service response latency
- **Throughput**: Requests per second
- **Error Rate**: Failure percentage
- **Adherence Rate**: CLOOP methodology compliance
- **Guardrail Effectiveness**: Security enforcement success

## Deployment Architecture

### 1. PM2 Process Management

```
ecosystem.config.cjs
├── sf-daemon (Port 7727)
├── router-service (Port 3000)
├── service-discovery (Port 8877)
└── skills-cli-service
```

### 2. Environment Configuration

- **Development**: Local development setup
- **Staging**: Pre-production testing
- **Production**: Live deployment
- **Safe Mode**: Component failure protection

### 3. Service Dependencies

```
PostgreSQL (Primary) ← Daemon ← Router ← CLI
     │                   │        │       │
     ▼                   ▼        ▼       ▼
   Storage           Execution  Activation  Interface
   Persistence        Engine    Engine     Management
```

## Integration Architecture

### 1. Editor Integration

- **Cursor IDE**: Webhook-based integration
- **VS Code**: Extension support (future)
- **Vim/Neovim": Plugin support (future)
- **JetBrains IDEs**: Plugin support (future)

### 2. External Service Integration

- **Git**: Version control integration
- **PM2**: Process management integration
- **Docker**: Containerization support
- **Kubernetes**: Orchestration support (future)

### 3. API Integration

- **REST APIs**: Standard HTTP interfaces
- **WebSockets**: Real-time communication
- **Webhooks**: Event-driven integration
- **GraphQL**: Query interface (future)

## Scalability Architecture

### 1. Horizontal Scaling

- **Service Instances**: Multiple service replicas
- **Load Balancing**: Request distribution
- **Database Sharding**: Data partitioning
- **Cache Clustering**: Distributed caching

### 2. Vertical Scaling

- **Resource Allocation**: CPU/memory optimization
- **Performance Tuning**: Configuration optimization
- **Monitoring**: Resource utilization tracking
- **Auto-scaling**: Dynamic resource adjustment

## Monitoring and Observability

### 1. Health Monitoring

```
Health Checks → Service Discovery → Alerting → Remediation
       │                │                │            │
       ▼                ▼                ▼            ▼
   HTTP Endpoints   Registry Registry   Notifications  Auto-recovery
   (Health Status)  (Service Status)  (Alert Rules)  (PM2 Actions)
```

### 2. Log Management

- **Structured Logging**: JSON format logs
- **Log Aggregation**: Centralized log collection
- **Log Analysis**: Pattern detection and analysis
- **Log Retention**: Configurable retention policies

### 3. Metrics Collection

- **System Metrics**: CPU, memory, disk, network
- **Application Metrics**: Response times, error rates
- **Business Metrics**: Skill activation rates, user engagement
- **Custom Metrics**: Project-specific KPIs

## Development Architecture

### 1. Package Structure

```
packages/
├── skills-cli/          # Main CLI tool
├── router/              # Activation router
├── daemon/              # Background services
├── mcp-adapters/        # External service adapters
├── kpi/                 # Performance monitoring
├── shared/              # Shared utilities
├── slash-commands/      # Command automation
├── experimentation/     # Experimental features
└── performance/         # Performance tools
```

### 2. Skill Architecture

```
skills/
├── guidelines/          # Development best practices
├── guardrails/          # Security and safety checks
├── workflows/           # CLOOP methodology workflows
├── generators/          # Code generation tools
└── test/               # Testing infrastructure
```

### 3. Configuration Architecture

- **Environment Variables**: `.env` configuration
- **JSON Configuration**: Structured configuration files
- **Schema Validation**: Configuration validation
- **Hot Reload**: Dynamic configuration updates

## Future Architecture Roadmap

### Phase 1: Enhanced Integration (Q1 2025)
- Multi-editor IDE support
- Advanced authentication mechanisms
- Enhanced security policies

### Phase 2: AI/ML Integration (Q2 2025)
- Machine learning for skill recommendations
- Intelligent task automation
- Predictive performance analytics

### Phase 3: Enterprise Features (Q3 2025)
- Multi-tenant support
- Advanced role-based access control
- Enterprise-grade monitoring

### Phase 4: Cloud Native (Q4 2025)
- Kubernetes deployment
- Cloud service integration
- Advanced scalability features

---

This architecture document provides a comprehensive overview of the Skills Fabric system, serving as the definitive reference for understanding the system's design, implementation, and evolution.