# Plan de Evolución a "Documento Vivo" con VitePress

## **Objetivo Estratégico**

Transformar el monolítico `contenido-util-para-refactorizacion.txt` (1,500+ líneas) en un sitio de documentación estático, navegable, versionable y enlazable, eliminando el problema del archivo único y frágil de referencias por número de línea.

## **Selección y Justificación de VitePress**

### **¿Por qué VitePress?**

**Ventajas Técnicas:**
- **Performance**: Basado en Vite - builds ultra rápidos (<3s load time)
- **Vue 3 + Composition API**: Componentes reactivos y modernos
- **Markdown Enhancement**: Soporte nativo para Vue components en Markdown
- **SEO Optimized**: Meta tags, sitemap generation
- **TypeScript Support**: Full type safety en configuración
- **Plugin Ecosystem**: Extensible con custom plugins

**Ventajas para Skills Fabrik:**
- **Development Experience**: HMR instantáneo para documentación
- **Static Generation**: Sitio 100% estático, CDN-friendly
- **Git Integration**: Perfect integration con branching/PRs
- **Search**: Búsqueda integrada sin external dependencies
- **Theme Flexibility**: Custom themes con Vue components

**Alternativas Consideradas:**
- **Docusaurus**: React-based, más complejo, más lento
- **ViteBook**: Más para librerías, menos para proyectos enterprise
- **GitBook**: External dependency, menos control

**Conclusión**: VitePress ofrece el mejor balance de performance, Developer Experience, y flexibilidad para el caso de Skills Fabrik.

## **Setup de Herramientas**

### **Dependencias Requeridas:**
```json
{
  "devDependencies": {
    "vitepress": "^1.0.0-rc.31",
    "@vueuse/core": "^10.5.0",
    "vue": "^3.3.4",
    "@types/node": "^20.8.0"
  }
}
```

### **Estructura de Instalación:**
```bash
# 1. Inicializar VitePress
npm install -D vitepress @vueuse/core

# 2. Crear estructura básica
mkdir -p docs/vitepress
mkdir -p docs/vitepress/.vitepress
mkdir -p docs/vitepress/content
mkdir -p docs/vitepress/public
mkdir -p docs/vitepress/components

# 3. Inicializar configuración
npm run vitepress init docs/vitepress
```

### **Configuración Inicial:**
```typescript
// docs/vitepress/.vitepress/config.ts
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Skills Fabrik Refactorization',
  description: 'Living documentation for architecture evolution and technical debt resolution',

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Investigation', link: '/investigation/' },
      { text: 'ADRs', link: '/adr/' },
      { text: 'Evidence', link: '/evidence/' },
      { text: 'Guides', link: '/guides/' }
    ],

    sidebar: {
      '/investigation/': [
        { text: 'Overview', link: '/investigation/overview' },
        {
          text: 'Evidence Collection',
          items: [
            { text: 'Governance Rules', link: '/investigation/evidence/governance' },
            { text: 'Code Patterns', link: '/investigation/evidence/patterns' },
            { text: 'Technical Debt', link: '/investigation/evidence/technical-debt' },
            { text: 'Security Analysis', link: '/investigation/evidence/security' }
          ]
        },
        {
          text: 'Action Plans',
          items: [
            { text: 'Critical Actions', link: '/investigation/actions/critical' },
            { text: 'High Priority', link: '/investigation/actions/high-priority' },
            { text: 'Medium Priority', link: '/investigation/actions/medium-priority' }
          ]
        },
        { text: 'Methodology', link: '/investigation/methodology' }
      ],

      '/adr/': [
        { text: 'ADRs Overview', link: '/adr/' },
        { text: 'Critical Decisions',
          items: [
            { text: 'Extract Authentication Module', link: '/adr/0001-extract-authentication-module' },
            { text: 'Centralize Configuration', link: '/adr/0002-centralize-configuration' },
            { text: 'Testing Strategy', link: '/adr/0003-testing-strategy' }
          ]
        },
        { text: 'Process & Templates', link: '/adr/process' }
      ],

      '/guides/': [
        { text: 'Implementation Guide', link: '/guides/implementation' },
        { text: 'Safety Net Guide', link: '/guides/safety-net' },
        { text: 'ADR Creation Guide', link: '/guides/adr-creation' }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/felipe/skills-fabrik' }
    ],

    footer: {
      message: 'Skills Fabrik Architecture Evolution Documentation',
      copyright: `© ${new Date().getFullYear()} Skills Fabrik Team`
    }
  },

  vite: {
    optimizeDeps: {
      exclude: ['vue-demi']
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
});
```

## **Migración de Contenido Detallada**

### **Fase 1: Mapping de Contenido**

**Contenido Origen (`contenido-util-para-refactorizacion.txt`):**
```
L1-30   → Governance Rules (MAX-001 to MAX-015, PROH-001 to PROH-016)
L31-65   → Refactoring Rules (REF-001 to REF-012)
L66-150  → Code Patterns Analysis
L151-250  → Technical Debt Detailed Analysis
L251-350  → Security Risk Assessment
L351-450  → Component Metrics & Performance
L451-550  → Implementation Timeline
L551-650  → Quality Gates & Automation
L651-750  → Evidence & Verification
L751-850  → Action Plans & Commands
L851-950  → Monitoring & KPIs
L951-1050 → Testing Strategies
L1051-1150 → Architecture Decisions
L1151-1250 → Dependencies Analysis
L1251-1350 → Migration Plans
L1351-1450 → Success Criteria
L1451-1500 → Appendices & References
```

**Destino (VitePress Structure):**
```
docs/vitepress/content/
├── index.md                          # Página principal
├── investigation/
│   ├── overview.md                    # Resumen ejecutivo
│   ├── evidence/
│   │   ├── governance.md             # MAX/PROH rules
│   │   ├── patterns.md              # Code patterns analysis
│   │   ├── technical-debt.md        # Technical debt matrix
│   │   ├── security.md             # STRIDE analysis
│   │   └── performance.md          # Component metrics
│   ├── actions/
│   │   ├── critical.md             # Priority 1 actions
│   │   ├── high-priority.md       # Priority 2 actions
│   │   └── medium-priority.md     # Priority 3 actions
│   └── methodology.md               # Forensic analysis methodology
├── adr/
│   ├── index.md                     # ADRs overview
│   ├── 0001-extract-authentication-module.md
│   ├── 0002-centralize-configuration.md
│   ├── 0003-testing-strategy.md
│   ├── process.md                   # ADR creation process
│   └── template.md                 # ADR template
├── guides/
│   ├── implementation.md            # Implementation guides
│   ├── safety-net.md             # Characterization testing
│   ├── adr-creation.md           # How to create ADRs
│   └── security.md              # Security guidelines
├── evidence/
│   ├── raw-analysis.md            # Full original content (reference)
│   ├── extracted-data.json        # Structured evidence data
│   └── metrics-dashboard.md      # Interactive metrics
└── api/                          # Data para componentes Vue
    ├── evidence.json              # Evidencia estructurada
    ├── metrics.json               # Métricas dinámicas
    └── status.json               # Status actual del proyecto
```

### **Fase 2: Transformación de Contenido**

#### **Migración de Governance Rules** (`/investigation/evidence/governance.md`)
```markdown
# Governance Rules - MAX (Maximum Authority) & PROH (Prohibitions)

## 📜 MAX Rules (Máxima Autoridad)

### MAX-001: INTEGRIDAD
- **Description**: NO MODIFICAR NADA del repo original, solo observar y describir
- **Evidence**: contenido-util-para-refactorizacion.txt:L14
- **Implementation**: Read-only analysis approach
- **Verification**: All analysis tools respect this rule

### MAX-002: CALIDAD
- **Description**: CADA fase debe pasar quality gates (lint + tests + formato)
- **Evidence**: contenido-util-para-refactorizacion.txt:L15
- **Implementation**: Automated quality checks
- **Verification**: All phases validated before progression

<!-- ... (continuar con todas las MAX rules) -->

## 🚫 PROH Rules (Prohibiciones Críticas)

### PROH-001: NO EJECUTAR CÓDIGO ORIGINAL
- **Description**: Prohibida ejecución de código del repo durante análisis
- **Evidence**: contenido-util-para-refactorizacion.txt:L31
- **Risk Assessment**: Environment contamination
- **Verification**: All tools operate in read-only mode

<!-- ... (continuar con todas las PROH rules) -->

## 🎯 Compliance Verification

<Component name="GovernanceCompliance" />

**Current Compliance Status**: 95% (19/20 rules verified)
**Last Verification**: 2025-11-15
**Next Review**: 2025-11-22
```

#### **Migración de Technical Debt** (`/investigation/evidence/technical-debt.md`)
```markdown
# Technical Debt Analysis

## 📊 Overview Matrix

<DataTable
  :data="technicalDebtData"
  :columns="['ID', 'Component', 'Type', 'Impact', 'Effort', 'Priority']"
  :sortable="true"
/>

## 🚨 Critical Items (Priority 1)

### F-001: Authentication Bypass in Daemon
- **Component**: Daemon
- **Type**: HACK
- **Impact**: Critical Security Vulnerability
- **Location**: app.ts lines 19, 27, 31
- **Effort**: 2 weeks
- **Risk Level**: 🔴 Critical
- **Evidence**: [Security Analysis](/investigation/evidence/security#authentication-flaws)

<Component name="TechnicalDebtCard" :debt-id="'F-001'" />

### F-002: Database Connection Failures
<!-- ... detailed analysis ... -->

## 📈 Debt Reduction Progress

<ProgressChart
  :current="37"
  :target="18"
  :deadline="'2025-12-15'"
  :categories="['Critical', 'High', 'Medium']"
/>

## 🔧 Resolution Strategies

<StrategyList :strategies="debtResolutionStrategies" />
```

#### **Migración de Security Analysis** (`/investigation/evidence/security.md`)
```markdown
# Security Risk Assessment - STRIDE Analysis

## 🛡️ Threat Model Overview

<STRIDEModel :data="strideAnalysisData" />

## 🔴 Critical Vulnerabilities

### Authentication System
**Threats**: Spoofing, Tampering
- **Location**: Daemon app.ts
- **Evidence**: Hardcoded user approvals
- **Impact**: Authentication bypass possible
- **Mitigation**: [ADR-0001](/adr/0001-extract-authentication-module)

<SecurityCard
  :threat="'Authentication Bypass'"
  :severity="'critical'"
  :components="['Daemon']"
  :mitigations="['Extract auth module', 'Environment variables']"
/>

### Configuration Management
**Threats**: Disclosure
- **Location**: Multiple config files
- **Evidence**: 10+ hardcoded configurations
- **Impact**: Secret exposure
- **Mitigation**: [ADR-0002](/adr/0002-centralize-configuration)

## 📋 Risk Mitigation Matrix

<RiskMatrix :risks="securityRisks" />
```

### **Fase 3: Componentes Vue Interactivos**

#### **Componente de Métricas Dinámicas**
```vue
<!-- docs/vitepress/components/MetricsDashboard.vue -->
<template>
  <div class="metrics-dashboard">
    <div class="metric-cards">
      <MetricCard
        v-for="metric in metrics"
        :key="metric.id"
        :title="metric.title"
        :value="metric.value"
        :unit="metric.unit"
        :trend="metric.trend"
        :target="metric.target"
      />
    </div>

    <div class="progress-section">
      <h3>📊 Refactorization Progress</h3>
      <ProgressBar
        :current="progress.current"
        :target="progress.target"
        :categories="progress.categories"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { loadMetrics } from '../api/metrics.json'

const metrics = ref([])
const progress = ref({})

onMounted(async () => {
  const data = await loadMetrics()
  metrics.value = data.metrics
  progress.value = data.progress
})
</script>
```

#### **Componente de Evidencia Interactiva**
```vue
<!-- docs/vitepress/components/EvidenceViewer.vue -->
<template>
  <div class="evidence-viewer">
    <div class="search-section">
      <SearchBox
        v-model="searchQuery"
        placeholder="Search evidence by keyword..."
        :suggestions="suggestions"
      />
    </div>

    <div class="evidence-grid">
      <EvidenceCard
        v-for="item in filteredEvidence"
        :key="item.id"
        :evidence="item"
        @click="navigateToEvidence(item.id)"
      />
    </div>

    <div class="semantic-anchors">
      <h3>🔗 Semantic Anchors</h3>
      <AnchorCloud :anchors="semanticAnchors" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { loadEvidence, loadAnchors } from '../api/evidence.json'

const searchQuery = ref('')
const evidence = ref([])
const semanticAnchors = ref([])

onMounted(async () => {
  evidence.value = await loadEvidence()
  semanticAnchors.value = await loadAnchors()
})

const filteredEvidence = computed(() => {
  if (!searchQuery.value) return evidence.value

  return evidence.value.filter(item =>
    item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
</script>
```

## **Configuración del Sitio VitePress**

### **Configuración Avanzada**
```typescript
// docs/vitepress/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { transformAnchorLinks } from './plugins/anchors'

export default defineConfig({
  title: 'Skills Fabrik Refactorization',
  description: 'Living documentation for architecture evolution',

  // Base configuration
  base: '/skills-fabrik-docs/',
  lang: 'en-US',

  // Theme customization
  themeConfig: {
    nav: [
      { text: '🏠 Home', link: '/' },
      { text: '🔍 Investigation', link: '/investigation/' },
      { text: '📋 ADRs', link: '/adr/' },
      { text: '📊 Evidence', link: '/evidence/' },
      { text: '📚 Guides', link: '/guides/' },
      { text: '🎯 Status', link: '/status/' }
    ],

    // Search configuration
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: { translations: { button: { buttonText: '搜索' } } }
        }
      }
    },

    // Edit link configuration
    editLink: {
      pattern: 'https://github.com/felipe/skills-fabrik/edit/main/docs/inventario/:path'
    },

    // Footer customization
    footer: {
      message: 'Documentation for Skills Fabrik Architecture Evolution',
      copyright: `© ${new Date().getFullYear()} Skills Fabrik Team`
    }
  },

  // Markdown configuration
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    config: (md) => {
      // Custom plugin for semantic anchors
      md.use(transformAnchorLinks)
    }
  },

  // Vite configuration
  vite: {
    plugins: [
      // Custom plugins for special features
    ],
    optimizeDeps: {
      exclude: ['vue-demi']
    },
    server: {
      port: 5173,
      open: true
    },
    build: {
      target: 'es2018',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true
    }
  },

  // Multi-site configuration
  locales: {
    root: { label: 'English', lang: 'en-US' },
    zh: { label: '简体中文', lang: 'zh-CN' }
  }
});
```

### **Plugin Personalizado para Anclas Semánticas**
```typescript
// docs/vitepress/.vitepress/plugins/anchors.ts
import type { Plugin } from 'vitepress'

export function transformAnchorLinks(): Plugin {
  return {
    name: 'transform-anchors',
    transform(code, id) {
      // Solo procesar archivos .md
      if (!id.endsWith('.md')) return code

      // Transformar referencias L### a semantic anchors
      return code.replace(
        /L(\d+)(?:-(\d+))?/g,
        (match, start, end) => {
          const anchorId = findSemanticAnchor(parseInt(start), end ? parseInt(end) : null)
          return anchorId ? `[${anchorId}](#${anchorId})` : match
        }
      )
    }
  }
}

function findSemanticAnchor(startLine: number, endLine?: number): string | null {
  // Lógica para encontrar el anchor semántico correspondiente
  // usando el índice de anclas
  return null // Implementar
}
```

## **Commands de Automatización**

### **Package.json Scripts**
```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs/vitepress --port 5173",
    "docs:build": "vitepress build docs/vitepress",
    "docs:preview": "vitepress preview docs/vitepress --port 4173",
    "docs:serve": "npm run docs:build && npx http-server docs/vitepress/.vitepress/dist -p 8080",

    "docs:generate": "node scripts/generate-docs-content.mjs",
    "docs:sync": "node scripts/sync-docs-from-source.mjs",
    "docs:validate": "vitepress build docs/vitepress --mode production",
    "docs:deploy": "npm run docs:build && node scripts/deploy-docs.mjs",

    "docs:anchors:scan": "node scripts/scan-semantic-anchors.mjs",
    "docs:anchors:update": "node scripts/update-anchor-index.mjs",
    "docs:metrics:update": "node scripts/update-docs-metrics.mjs"
  }
}
```

### **Scripts de Generación**

#### **Script de Sincronización de Contenido**
```javascript
// scripts/sync-docs-from-source.mjs
import fs from 'fs/promises'
import path from 'path'

const syncDocumentation = async () => {
  console.log('🔄 Syncing documentation from source...')

  // 1. Leer contenido original
  const sourceContent = await fs.readFile(
    'contenido-util-para-refactorizacion.txt',
    'utf8'
  )

  // 2. Parsear y estructurar contenido
  const structuredContent = await parseSourceContent(sourceContent)

  // 3. Generar archivos Markdown para VitePress
  await generateMarkdownFiles(structuredContent)

  // 4. Generar datos para componentes Vue
  await generateComponentData(structuredContent)

  // 5. Actualizar timestamp
  await updateSyncTimestamp()

  console.log('✅ Documentation sync complete!')
}

const parseSourceContent = async (content) => {
  // Implementar parsing del archivo masivo
  // y extracción por secciones
  return {
    governance: extractGovernanceRules(content),
    technicalDebt: extractTechnicalDebt(content),
    security: extractSecurityAnalysis(content),
    patterns: extractCodePatterns(content),
    actions: extractActionPlans(content)
  }
}

// Ejecución
syncDocumentation().catch(console.error)
```

## **Integration con CI/CD**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/docs.yml
name: Documentation Build & Deploy

on:
  push:
    branches: [main, develop]
    paths: ['docs/vitepress/**', 'docs/inventario/**']
  pull_request:
    branches: [main]
    paths: ['docs/vitepress/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Sync Documentation
        run: npm run docs:sync

      - name: Build Documentation
        run: npm run docs:build

      - name: Upload Build
        uses: actions/upload-artifact@v3
        with:
          name: documentation
          path: docs/vitepress/.vitepress/dist

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download Build
        uses: actions/download-artifact@v3
        with:
          name: documentation
          path: dist

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: dist
```

---

## **Métricas de Éxito para VitePress**

### **Performance Metrics:**
- **Build Time**: <30s para build completo
- **Load Time**: <3s first contentful paint
- **Bundle Size**: <5MB total assets
- **Search Response**: <200ms para search results
- **Navigation**: Instant page switching (SPA)

### **User Experience Metrics:**
- **Mobile Responsiveness**: 100% mobile-friendly
- **Accessibility**: WCAG 2.1 AA compliance
- **Browser Support**: Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- **Search Accuracy**: 95% relevant results

### **Content Metrics:**
- **Coverage**: 100% del contenido original migrado
- **Semantic Integrity**: 100% de cross-references funcionales
- **Update Latency**: <5min desde cambio hasta deploy
- **Broken Links**: 0 broken internal links

---

**Estado**: Plan de VitePress completamente documentado y listo para implementación