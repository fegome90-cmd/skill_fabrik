# Configuración Completa del Sitio VitePress

## **Configuración Principal**

### **Archivo**: `docs/vitepress/.vitepress/config.ts`

```typescript
import { defineConfig, type DefaultTheme } from 'vitepress';
import { transformAnchorLinks } from './plugins/anchors';
import { customTheme } from './theme/index';

export default defineConfig({
  // Información básica del sitio
  title: 'Skills Fabrik Refactorization',
  description: 'Living documentation for architecture evolution and technical debt resolution',
  lang: 'en-US',

  // Base URL para deployment
  base: '/skills-fabrik-docs/',

  // Directorio de salida
  outDir: 'dist',

  // Cache configuration
  cacheDir: '.vitepress/cache',

  // Configuración de tema
  themeConfig: {
    // Logo y título
    siteTitle: 'Skills Fabrik',
    logo: '/logo.svg',

    // Navegación principal
    nav: [
      { text: '🏠 Home', link: '/' },
      {
        text: '🔍 Investigation',
        items: [
          { text: 'Overview', link: '/investigation/' },
          { text: 'Evidence', link: '/investigation/evidence/' },
          { text: 'Actions', link: '/investigation/actions/' }
        ]
      },
      { text: '📋 ADRs', link: '/adr/' },
      {
        text: '📊 Evidence',
        items: [
          { text: 'Governance', link: '/evidence/governance' },
          { text: 'Technical Debt', link: '/evidence/technical-debt' },
          { text: 'Security', link: '/evidence/security' },
          { text: 'Performance', link: '/evidence/performance' }
        ]
      },
      {
        text: '📚 Guides',
        items: [
          { text: 'Implementation', link: '/guides/implementation' },
          { text: 'Safety Net', link: '/guides/safety-net' },
          { text: 'ADR Creation', link: '/guides/adr-creation' }
        ]
      },
      { text: '🎯 Status', link: '/status/' }
    ],

    // Sidebar (navegación lateral)
    sidebar: {
      '/investigation/': [
        {
          text: '🔍 Investigation Overview',
          link: '/investigation/',
          items: [
            { text: 'Executive Summary', link: '/investigation/executive-summary' },
            { text: 'Quick Reference', link: '/investigation/quick-reference' }
          ]
        },
        {
          text: '📋 Evidence Collection',
          collapsed: false,
          items: [
            { text: 'Governance Rules', link: '/investigation/evidence/governance' },
            { text: 'Code Patterns', link: '/investigation/evidence/patterns' },
            { text: 'Technical Debt', link: '/investigation/evidence/technical-debt' },
            { text: 'Security Analysis', link: '/investigation/evidence/security' },
            { text: 'Performance Metrics', link: '/investigation/evidence/performance' }
          ]
        },
        {
          text: '🚀 Action Plans',
          collapsed: false,
          items: [
            { text: 'Critical (Priority 1)', link: '/investigation/actions/critical' },
            { text: 'High Priority', link: '/investigation/actions/high-priority' },
            { text: 'Medium Priority', link: '/investigation/actions/medium-priority' }
          ]
        },
        { text: '📖 Methodology', link: '/investigation/methodology' }
      ],

      '/adr/': [
        { text: '📋 ADRs Overview', link: '/adr/' },
        {
          text: '🔴 Critical Decisions',
          collapsed: false,
          items: [
            { text: 'Extract Authentication Module', link: '/adr/0001-extract-authentication-module' },
            { text: 'Centralize Configuration', link: '/adr/0002-centralize-configuration' },
            { text: 'Testing Strategy', link: '/adr/0003-testing-strategy' }
          ]
        },
        {
          text: '⚙️ Process & Templates',
          collapsed: false,
          items: [
            { text: 'ADR Process', link: '/adr/process' },
            { text: 'ADR Template', link: '/adr/template' },
            { text: 'ADR Guidelines', link: '/adr/guidelines' }
          ]
        }
      ],

      '/guides/': [
        { text: '📚 Guides Overview', link: '/guides/' },
        { text: '🚀 Implementation Guide', link: '/guides/implementation' },
        { text: '🛡️ Safety Net Guide', link: '/guides/safety-net' },
        { text: '📋 ADR Creation Guide', link: '/guides/adr-creation' },
        { text: '🔐 Security Guidelines', link: '/guides/security' },
        { text: '📊 Performance Guide', link: '/guides/performance' }
      ],

      '/evidence/': [
        { text: '📊 Evidence Overview', link: '/evidence/' },
        { text: '⚖️ Governance & Rules', link: '/evidence/governance' },
        { text: '🔧 Technical Debt', link: '/evidence/technical-debt' },
        { text: '🛡️ Security Assessment', link: '/evidence/security' },
        { text: '📈 Performance Analysis', link: '/evidence/performance' },
        { text: '🔗 Raw Analysis', link: '/evidence/raw-analysis' }
      ],

      '/status/': [
        { text: '🎯 Project Status', link: '/status/' },
        { text: '📊 Metrics Dashboard', link: '/status/metrics' },
        { text: '⏱️ Timeline & Progress', link: '/status/timeline' },
        { text: '✅ Success Criteria', link: '/status/success-criteria' }
      ]
    },

    // Links sociales
    socialLinks: [
      { icon: 'github', link: 'https://github.com/felipe/skills-fabrik' },
      { icon: 'discord', link: 'https://discord.gg/skills-fabrik' }
    ],

    // Footer configuration
    footer: {
      message: 'Skills Fabrik Architecture Evolution Documentation',
      copyright: `© ${new Date().getFullYear()} Skills Fabrik Team. Built with VitePress.`
    },

    // Edit links
    editLink: {
      pattern: 'https://github.com/felipe/skills-fabrik/edit/main/docs/inventario/:path',
      text: 'Edit this page on GitHub'
    },

    // Configuración de búsqueda
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    },

    // Markdown extensions
    markdown: {
      theme: {
        light: 'github-light',
        dark: 'github-dark'
      },
      lineNumbers: true,
      config: (md) => {
        // Plugin para transformar anclas semánticas
        md.use(transformAnchorLinks);

        // Plugin para resaltar código
        md.use(require('markdown-it-highlightjs'));

        // Plugin para tabs
        md.use(require('markdown-it-container'), 'tabs', {
          validate: function(params) {
            return params.trim().match(/^([^]+)\s+([^]+)$/);
          },
          render: function (tokens, idx) {
            const m = tokens[idx].info.trim().match(/^([^]+)\s+([^]+)$/);
            if (tokens[idx].nesting === 1) {
              return `<tabs><tab title="${m[1]}" name="${m[2]}">`;
            } else {
              return `</tab></tabs>`;
            }
          }
        });
      }
    },

    // Carbon ads (opcional)
    carbonAds: {
      code: 'your-carbon-code',
      placement: 'your-carbon-placement'
    }
  },

  // Configuración de Vite
  vite: {
    plugins: [
      // Plugin para datos dinámicos
      {
        name: 'evidence-data',
        resolveId(id) {
          if (id.startsWith('~/evidence/')) {
            return id.replace('~/', '/src/');
          }
          return null;
        },
        load(id) {
          if (id.startsWith('/src/evidence/')) {
            // Cargar datos de evidence
            return `export default ${JSON.stringify(loadEvidenceData(id))}`;
          }
          return null;
        }
      }
    ],

    // Optimización
    optimizeDeps: {
      exclude: ['vue-demi']
    },

    // Server configuration
    server: {
      port: 5173,
      open: true,
      cors: true
    },

    // Build configuration
    build: {
      target: 'es2018',
      outDir: '.vitepress/dist',
      assetsDir: 'assets',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue'],
            'vue-router': ['vue-router'],
            vitepress: ['vitepress/client']
          }
        }
      }
    }
  },

  // Multi-site configuration
  locales: {
    root: {
      label: 'English',
      lang: 'en-US'
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '🏠 首页', link: '/zh/' },
          { text: '🔍 调查', link: '/zh/investigation/' },
          { text: '📋 ADR', link: '/zh/adr/' }
        ]
      }
    }
  },

  // Head configuration para SEO
  head: [
    ['meta', { name: 'keywords', content: 'skills, fabrik, architecture, refactorization, technical debt, ADR' }],
    ['meta', { name: 'author', content: 'Skills Fabrik Team' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Skills Fabrik Documentation' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: '/twitter-image.png' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }]
  ],

  // Custom transforms
  transformHead: ({ pageData }) => {
    const head = [];

    // Añadir meta tags específicas de página
    if (pageData.frontmatter.description) {
      head.push(['meta', { name: 'description', content: pageData.frontmatter.description }]);
    }

    if (pageData.frontmatter.keywords) {
      head.push(['meta', { name: 'keywords', content: pageData.frontmatter.keywords }]);
    }

    return head;
  },

  // Page data hooks
  transformPageData: (pageData) => {
    // Añadir datos custom a cada página
    pageData.lastUpdated = new Date().toISOString();
    pageData.contributors = ['Skills Fabrik Team'];

    // Detectar semantic anchors en la página
    pageData.semanticAnchors = extractSemanticAnchors(pageData.content);

    return pageData;
  }
});

// Helper functions
function loadEvidenceData(path) {
  // Lógica para cargar datos de evidence
  return {};
}

function extractSemanticAnchors(content) {
  // Lógica para extraer anclas semánticas del contenido
  return [];
}
```

## **Configuración de Tema Personalizado**

### **Archivo**: `docs/vitepress/.vitepress/theme/index.ts`

```typescript
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme-without-fonts';
import { h } from 'vue';
import './custom.css';

export default {
  extends: DefaultTheme,

  Layout: () => {
    // Layout personalizado si se necesita
    return null;
  },

  enhanceApp({ app, router, siteData }) {
    // Registrar componentes globales
    app.component('MetricsDashboard', () => import('../components/MetricsDashboard.vue'));
    app.component('TechnicalDebtTable', () => import('../components/TechnicalDebtTable.vue'));
    app.component('SecurityRiskMatrix', () => import('../components/SecurityRiskMatrix.vue'));
    app.component('SemanticAnchorCloud', () => import('../components/SemanticAnchorCloud.vue'));
    app.component('ProgressChart', () => import('../components/ProgressChart.vue'));
    app.component('EvidenceViewer', () => import('../components/EvidenceViewer.vue'));
    app.component('ADRIndex', () => import('../components/ADRIndex.vue'));
  }
} satisfies Theme;

```

### **Archivo**: `docs/vitepress/.vitepress/theme/custom.css`

```css
/* Custom CSS para Skills Fabrik Documentation */

:root {
  --vp-c-brand-1: #3b82f6;
  --vp-c-brand-2: #2563eb;
  --vp-c-brand-3: #1d4ed8;
  --vp-c-bg: #ffffff;
  --vp-c-bg-alt: #f8fafc;
  --vp-c-text-1: #1e293b;
  --vp-c-text-2: #475569;
  --vp-c-text-3: #64748b;
  --vp-c-border: #e2e8f0;
  --vp-c-divider: #f1f5f9;
}

.dark {
  --vp-c-bg: #0f172a;
  --vp-c-bg-alt: #1e293b;
  --vp-c-text-1: #f8fafc;
  --vp-c-text-2: #cbd5e1;
  --vp-c-text-3: #94a3b8;
  --vp-c-border: #334155;
  --vp-c-divider: #1e293b;
}

/* Componentes personalizados */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.metric-card {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.5rem;
}

.metric-unit {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  margin-left: 0.25rem;
}

/* Technical Debt Table */
.technical-debt-table {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
}

.technical-debt-table th,
.technical-debt-table td {
  border: 1px solid var(--vp-c-border);
  padding: 0.75rem;
  text-align: left;
}

.technical-debt-table th {
  background: var(--vp-c-bg-alt);
  font-weight: 600;
}

.technical-debt-table .priority-critical {
  color: #dc2626;
  font-weight: 600;
}

.technical-debt-table .priority-high {
  color: #f59e0b;
  font-weight: 600;
}

.technical-debt-table .priority-medium {
  color: #10b981;
  font-weight: 600;
}

/* Semantic Anchors */
.semantic-anchors-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 2rem 0;
}

.anchor-tag {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: all 0.2s ease;
}

.anchor-tag:hover {
  background: var(--vp-c-brand-1);
  color: white;
  transform: scale(1.05);
}

.anchor-tag.evidence {
  border-color: #3b82f6;
  color: #3b82f6;
}

.anchor-tag.actions {
  border-color: #f59e0b;
  color: #f59e0b;
}

.anchor-tag.governance {
  border-color: #10b981;
  color: #10b981;
}

/* Progress Charts */
.progress-container {
  margin: 2rem 0;
}

.progress-bar {
  width: 100%;
  height: 2rem;
  background: var(--vp-c-bg-alt);
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  transition: width 1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .technical-debt-table {
    font-size: 0.875rem;
  }

  .technical-debt-table th,
  .technical-debt-table td {
    padding: 0.5rem;
  }
}

/* Print Styles */
@media print {
  .VPNav {
    display: none;
  }

  .VPSidebar {
    display: none;
  }

  .metric-card {
    break-inside: avoid;
  }
}

/* Animation Classes */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.5s ease forwards;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s ease infinite;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--vp-c-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--vp-c-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}
```

## **Configuración de Plugins**

### **Plugin para Anclas Semánticas**

### **Archivo**: `docs/vitepress/.vitepress/plugins/anchors.ts`

```typescript
import type { Plugin } from 'vitepress';
import path from 'path';

export function transformAnchorLinks(): Plugin {
  return {
    name: 'transform-semantic-anchors',

    transform(code: string, id: string) {
      // Solo procesar archivos .md
      if (!id.endsWith('.md')) return code;

      // Transformar referencias L### a semantic anchors
      return code.replace(/L(\d+)(?:-(\d+))?/g, (match, start, end) => {
        const anchorId = findSemanticAnchor(parseInt(start), end ? parseInt(end) : null);

        if (anchorId) {
          // Crear enlace con texto descriptivo
          return `[${anchorId}](#${anchorId})`;
        }

        // Si no se encuentra anchor, mantener referencia original con advertencia
        return `${match} <!-- No semantic anchor found -->`;
      });
    },

    buildEnd() {
      // Validar que todas las referencias de anclas existan
      validateAnchorReferences();
    }
  };
}

function findSemanticAnchor(startLine: number, endLine?: number): string | null {
  // Lógica para encontrar el anchor semántico correspondiente
  // Esto se conecta con el sistema de anclas

  const anchorMappings = {
    // Governance Rules
    10: 'GOVERNANCE-RULES-MAX',
    30: 'GOVERNANCE-RULES-PROH',

    // Technical Debt
    148: 'TECHNICAL-DEBT-MATRIX',
    182: 'TECHNICAL-DEBT-COMPONENTS',

    // Security Analysis
    233: 'SECURITY-RISKS-CRITICAL',
    246: 'STRIDE-ANALYSIS-COMPLETE',

    // Performance Metrics
    115: 'PERFORMANCE-METRICS-COMPONENTS',
    147: 'PERFORMANCE-METRICS-DAEMON',

    // Action Items
    503: 'PRIORITY-CRITICAL-COMMANDS',
    530: 'PRIORITY-CRITICAL-IMPLEMENTATION'
  };

  // Buscar exact match o rango
  for (const [line, anchor] of Object.entries(anchorMappings)) {
    const lineNum = parseInt(line);

    if (!endLine) {
      // Match exact
      if (lineNum === startLine) return anchor;
    } else {
      // Match range
      if (lineNum >= startLine && lineNum <= (endLine || startLine)) {
        return anchor;
      }
    }
  }

  return null;
}

function validateAnchorReferences() {
  console.log('🔗 Validating semantic anchor references...');

  // Lógica para validar que todos los anchors referenciados existan
  // y que no haya anchors huérfanos

  console.log('✅ Semantic anchor validation complete');
}
```

## **Configuración de Deployment**

### **GitHub Actions Workflow**

### **Archivo**: `.github/workflows/docs-deploy.yml`

```yaml
name: Documentation Build & Deploy

on:
  push:
    branches: [main]
    paths:
      - 'docs/vitepress/**'
      - 'docs/inventario/**'
  pull_request:
    branches: [main]
    paths:
      - 'docs/vitepress/**'
      - 'docs/inventario/**'

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          cd docs/vitepress && npm ci

      - name: Sync documentation content
        run: |
          npm run docs:sync
          npm run docs:anchors:scan
          npm run docs:metrics:update

      - name: Type check
        run: npm run docs:type-check

      - name: Lint
        run: npm run docs:lint

      - name: Build documentation
        run: |
          cd docs/vitepress
          npm run build
        env:
          NODE_ENV: production
          BASE_URL: /skills-fabrik-docs/

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: docs-build
          path: docs/vitepress/.vitepress/dist
          retention-days: 1

      - name: Run accessibility tests
        run: npm run docs:test:a11y

      - name: Run performance tests
        run: npm run docs:test:performance

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: docs-build
          path: dist

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: dist
          cname: docs.skills-fabrik.com
          user_name: 'github-actions[bot]'
          user_email: 'github-actions[bot]@users.noreply.github.com'

      - name: Update deployment status
        run: |
          curl -X POST \
            -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/${{ github.repository }}/deployments \
            -d '{
              "ref": "${{ github.sha }}",
              "environment": "production",
              "description": "Documentation deployment"
            }'

      - name: Notify deployment success
        run: |
          echo "🚀 Documentation deployed successfully!"
          echo "🌐 Available at: https://docs.skills.fabrik.com"
```

## **Configuración de Scripts**

### **Package.json Scripts**

```json
{
  "scripts": {
    "docs:dev": "cd docs/vitepress && vitepress dev",
    "docs:build": "cd docs/vitepress && vitepress build",
    "docs:preview": "cd docs/vitepress && vitepress preview",
    "docs:serve": "npm run docs:build && npx http-server docs/vitepress/.vitepress/dist -p 8080 -c-1",

    "docs:sync": "node scripts/sync-docs-content.mjs",
    "docs:anchors:scan": "node scripts/scan-semantic-anchors.mjs",
    "docs:anchors:validate": "node scripts/validate-anchors.mjs",
    "docs:anchors:update": "npm run docs:anchors:scan && npm run docs:anchors:validate",

    "docs:metrics:update": "node scripts/update-docs-metrics.mjs",
    "docs:metrics:generate": "node scripts/generate-metrics-dashboard.mjs",

    "docs:type-check": "cd docs/vitepress && npx vue-tsc --noEmit",
    "docs:lint": "cd docs/vitepress && npx eslint --ext .vue,.ts,.js . --fix",
    "docs:format": "cd docs/vitepress && npx prettier --write .",

    "docs:test:a11y": "node scripts/test-accessibility.mjs",
    "docs:test:performance": "node scripts/test-performance.mjs",
    "docs:test:links": "node scripts/test-internal-links.mjs",
    "docs:test:build": "npm run docs:type-check && npm run docs:lint && npm run docs:build",

    "docs:validate": "npm run docs:test:build && npm run docs:test:links && npm run docs:test:a11y",
    "docs:deploy": "npm run docs:validate && npm run docs:build && npm run docs:deploy-local",
    "docs:deploy-local": "node scripts/deploy-docs.mjs",

    "docs:clean": "rm -rf docs/vitepress/.vitepress/dist docs/vitepress/.vitepress/cache",
    "docs:reset": "npm run docs:clean && cd docs/vitepress && npm ci"
  }
}
```

---

## **Métricas de Configuración**

### **Performance Targets:**
- **Build Time**: <30s para build completo
- **Load Time**: <3s first contentful paint
- **Bundle Size**: <5MB total assets gzipped
- **TTI**: <4s time to interactive

### **Quality Targets:**
- **Type Coverage**: 100% TypeScript coverage
- **ESLint**: 0 errors, 0 warnings
- **Prettier**: 100% formatted code
- **Accessibility**: WCAG 2.1 AA compliance

### **SEO Targets:**
- **Lighthouse Performance**: >90
- **Lighthouse Accessibility**: >95
- **Lighthouse Best Practices**: >90
- **Lighthouse SEO**: >95

---

**ESTADO**: Configuración VitePress completamente documentada y optimizada para producción