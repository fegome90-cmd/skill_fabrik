#!/usr/bin/env node
/**
 * MemTech Memory Structure Improver
 * 
 * Script para mejorar la estructura de memoria del sistema MemTech
 * - Reindexación jerárquica
 * - Tagging automático
 * - Precache inteligente
 * - Optimización de almacenamiento
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Logger simple y consistente ---
const tag = (t) => `[${t}]`;
const logger = {
  info: (msg, data) => console.log(`${tag('INFO')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
  warn: (msg, data) => console.warn(`${tag('WARN')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
  error: (msg, data) => console.error(`${tag('ERROR')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
  debug: (msg, data) => process.env.DEBUG && console.log(`${tag('DEBUG')} ${msg}${data ? ' ' + safeJSON(data) : ''}`),
};

const safeJSON = (v) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

// --- Utilidades ---
const ensureDir = async (p) => fs.mkdir(p, { recursive: true });
const exists = async (p) => !!(await fs.stat(p).catch(() => null));

// --- Clase de Mejora de Estructura de Memoria ---
class MemoryStructureImprover {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../../..');
    this.memtechDir = path.resolve(this.rootDir, 'packages/memtech-mcp');
    this.memoryDir = path.resolve(this.memtechDir, '.memtech');
    this.memoryIndexPath = path.resolve(this.memoryDir, 'memory');
    this.checkpointsDir = path.resolve(this.memtechDir, '.checkpoints');
    this.reportsDir = path.resolve(this.memtechDir, 'reports');
    
    this.stats = {
      startTime: new Date().toISOString(),
      actions: [],
      errors: [],
      warnings: [],
      itemsProcessed: 0,
      tagsCreated: 0,
      optimizedSize: 0
    };
    
    // Taxonomía de tags predefinida
    this.tagTaxonomy = {
      priority: ['critical', 'high', 'medium', 'low'],
      type: ['config', 'checkpoint', 'report', 'script', 'documentation', 'metric', 'backup'],
      status: ['active', 'archived', 'draft', 'deprecated'],
      component: ['security', 'memory', 'backup', 'grafana', 'victoria', 'system', 'audit'],
      layer: ['L0', 'L1', 'L2', 'L3'],
      temporal: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    };
  }

  async initialize() {
    await ensureDir(this.memoryIndexPath);
    await ensureDir(this.reportsDir);
    logger.info('Memory Structure Improver inicializado', { 
      memoryDir: this.memoryDir,
      memoryIndexPath: this.memoryIndexPath
    });
  }

  // 1. Reindexación jerárquica
  async hierarchicalReindex() {
    const action = 'hierarchicalReindex';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando reindexación jerárquica...');
      
      // Crear estructura jerárquica
      const hierarchy = {
        L0: {
          description: 'Hot memory - acceso frecuente',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
          maxSize: 100 * 1024 * 1024, // 100MB
          items: []
        },
        L1: {
          description: 'Warm memory - acceso moderado',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
          maxSize: 500 * 1024 * 1024, // 500MB
          items: []
        },
        L2: {
          description: 'Cold memory - acceso infrecuente',
          maxAge: 90 * 24 * 60 * 60 * 1000, // 90 días
          maxSize: 1024 * 1024 * 1024, // 1GB
          items: []
        },
        L3: {
          description: 'Frozen memory - archivo',
          maxAge: Infinity,
          maxSize: Infinity,
          items: []
        }
      };
      
      // Escanear archivos existentes
      const files = await this.scanMemoryFiles();
      
      // Clasificar archivos por capa
      for (const file of files) {
        const layer = this.classifyFileByLayer(file);
        hierarchy[layer].items.push(file);
        this.stats.itemsProcessed++;
      }
      
      // Crear índices jerárquicos
      for (const [layer, data] of Object.entries(hierarchy)) {
        const layerIndex = {
          metadata: {
            layer,
            description: data.description,
            created: new Date().toISOString(),
            itemCount: data.items.length,
            totalSize: data.items.reduce((sum, item) => sum + (item.size || 0), 0)
          },
          items: data.items.map(item => ({
            ...item,
            layer,
            indexed: new Date().toISOString()
          }))
        };
        
        const layerIndexPath = path.join(this.memoryIndexPath, `layer-${layer}-index.json`);
        await fs.writeFile(layerIndexPath, JSON.stringify(layerIndex, null, 2));
        
        logger.debug(`Índice de capa ${layer} creado`, { 
          itemCount: layerIndex.metadata.itemCount,
          totalSize: layerIndex.metadata.totalSize
        });
      }
      
      // Crear índice maestro
      const masterIndex = {
        metadata: {
          created: new Date().toISOString(),
          totalItems: this.stats.itemsProcessed,
          layers: Object.keys(hierarchy),
          taxonomy: this.tagTaxonomy
        },
        hierarchy: Object.keys(hierarchy).reduce((acc, layer) => {
          acc[layer] = {
            description: hierarchy[layer].description,
            itemCount: hierarchy[layer].items.length
          };
          return acc;
        }, {})
      };
      
      const masterIndexPath = path.join(this.memoryIndexPath, 'master-index.json');
      await fs.writeFile(masterIndexPath, JSON.stringify(masterIndex, null, 2));
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', itemsProcessed: this.stats.itemsProcessed });
      logger.info('Reindexación jerárquica completada', { 
        itemsProcessed: this.stats.itemsProcessed,
        duration: `${duration}ms`
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en reindexación jerárquica', { error: error.message });
    }
  }

  async scanMemoryFiles() {
    const files = [];
    
    // Escanear .memtech
    if (await exists(this.memoryDir)) {
      const memtechFiles = await this.scanDirectory(this.memoryDir, '.memtech');
      files.push(...memtechFiles);
    }
    
    // Escanear .checkpoints
    if (await exists(this.checkpointsDir)) {
      const checkpointFiles = await this.scanDirectory(this.checkpointsDir, '.checkpoints');
      files.push(...checkpointFiles);
    }
    
    // Escanear reports
    if (await exists(this.reportsDir)) {
      const reportFiles = await this.scanDirectory(this.reportsDir, 'reports');
      files.push(...reportFiles);
    }
    
    return files;
  }

  async scanDirectory(dir, prefix) {
    const files = [];
    
    async function walk(d, relativePath = '') {
      const entries = await fs.readdir(d, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(d, entry.name);
        const relative = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath, relative);
        } else {
          try {
            const stats = await fs.stat(fullPath);
            files.push({
              path: fullPath,
              relativePath: relative,
              prefix,
              size: stats.size,
              modified: stats.mtime,
              created: stats.birthtime,
              accessed: stats.atime,
              extension: path.extname(entry.name).toLowerCase(),
              name: entry.name
            });
          } catch (error) {
            logger.warn('Error leyendo archivo', { file: fullPath, error: error.message });
          }
        }
      }
    }
    
    await walk(dir);
    return files;
  }

  classifyFileByLayer(file) {
    const now = new Date();
    const fileAge = now - file.modified;
    const isRecent = fileAge < (7 * 24 * 60 * 60 * 1000); // 7 días
    const isFrequentlyAccessed = (now - file.accessed) < (24 * 60 * 60 * 1000); // 1 día
    const isCritical = file.prefix === '.checkpoints' || file.name.includes('critical');
    
    if ((isRecent && isFrequentlyAccessed) || isCritical) {
      return 'L0';
    } else if (fileAge < (30 * 24 * 60 * 60 * 1000)) {
      return 'L1';
    } else if (fileAge < (90 * 24 * 60 * 60 * 1000)) {
      return 'L2';
    } else {
      return 'L3';
    }
  }

  // 2. Tagging automático
  async automaticTagging() {
    const action = 'automaticTagging';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando tagging automático...');
      
      const files = await this.scanMemoryFiles();
      const tagIndex = {
        metadata: {
          created: new Date().toISOString(),
          totalFiles: files.length,
          taxonomy: this.tagTaxonomy
        },
        tags: {}
      };
      
      for (const file of files) {
        const tags = this.generateTagsForFile(file);
        
        for (const tag of tags) {
          if (!tagIndex.tags[tag]) {
            tagIndex.tags[tag] = [];
          }
          tagIndex.tags[tag].push({
            path: file.relativePath,
            prefix: file.prefix,
            tagged: new Date().toISOString()
          });
        }
        
        this.stats.tagsCreated += tags.length;
      }
      
      // Guardar índice de tags
      const tagIndexPath = path.join(this.memoryIndexPath, 'tags-index.json');
      await fs.writeFile(tagIndexPath, JSON.stringify(tagIndex, null, 2));
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', tagsCreated: this.stats.tagsCreated });
      logger.info('Tagging automático completado', { 
        tagsCreated: this.stats.tagsCreated,
        duration: `${duration}ms`
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en tagging automático', { error: error.message });
    }
  }

  generateTagsForFile(file) {
    const tags = new Set();
    
    // Tags basados en el nombre y ruta
    const name = file.name.toLowerCase();
    const path = file.relativePath.toLowerCase();
    
    // Tags de prioridad
    if (name.includes('critical') || path.includes('critical')) tags.add('priority:critical');
    else if (name.includes('high') || path.includes('high')) tags.add('priority:high');
    else if (name.includes('medium') || path.includes('medium')) tags.add('priority:medium');
    else tags.add('priority:low');
    
    // Tags de tipo
    if (name.includes('config') || path.includes('config')) tags.add('type:config');
    else if (name.includes('checkpoint') || path.includes('checkpoint')) tags.add('type:checkpoint');
    else if (name.includes('report') || path.includes('report')) tags.add('type:report');
    else if (name.includes('script') || path.includes('script')) tags.add('type:script');
    else if (name.includes('doc') || path.includes('doc')) tags.add('type:documentation');
    else if (name.includes('metric') || path.includes('metric')) tags.add('type:metric');
    else if (name.includes('backup') || path.includes('backup')) tags.add('type:backup');
    
    // Tags de estado
    if (name.includes('archive') || path.includes('archive')) tags.add('status:archived');
    else if (name.includes('draft') || path.includes('draft')) tags.add('status:draft');
    else if (name.includes('deprecated') || path.includes('deprecated')) tags.add('status:deprecated');
    else tags.add('status:active');
    
    // Tags de componente
    if (name.includes('security') || path.includes('security')) tags.add('component:security');
    else if (name.includes('memory') || path.includes('memory')) tags.add('component:memory');
    else if (name.includes('backup') || path.includes('backup')) tags.add('component:backup');
    else if (name.includes('grafana') || path.includes('grafana')) tags.add('component:grafana');
    else if (name.includes('victoria') || path.includes('victoria')) tags.add('component:victoria');
    else if (name.includes('system') || path.includes('system')) tags.add('component:system');
    else if (name.includes('audit') || path.includes('audit')) tags.add('component:audit');
    
    // Tags de capa
    const layer = this.classifyFileByLayer(file);
    tags.add(`layer:${layer}`);
    
    // Tags temporales
    if (name.includes('daily')) tags.add('temporal:daily');
    else if (name.includes('weekly')) tags.add('temporal:weekly');
    else if (name.includes('monthly')) tags.add('temporal:monthly');
    else if (name.includes('quarterly')) tags.add('temporal:quarterly');
    else if (name.includes('yearly')) tags.add('temporal:yearly');
    
    return Array.from(tags);
  }

  // 3. Precache inteligente
  async intelligentPrecache() {
    const action = 'intelligentPrecache';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando precache inteligente...');
      
      // Identificar archivos críticos para precache
      const criticalFiles = await this.identifyCriticalFiles();
      
      // Crear cache de acceso rápido
      const cacheDir = path.join(this.memoryIndexPath, 'cache');
      await ensureDir(cacheDir);
      
      const precacheIndex = {
        metadata: {
          created: new Date().toISOString(),
          criticalFiles: criticalFiles.length,
          cacheSize: 0
        },
        files: []
      };
      
      for (const file of criticalFiles) {
        try {
          // Leer contenido del archivo
          const content = await fs.readFile(file.path, 'utf8');
          
          // Crear entrada de cache
          const cacheEntry = {
            originalPath: file.relativePath,
            prefix: file.prefix,
            cached: new Date().toISOString(),
            size: content.length,
            content: content.length > 10000 ? content.slice(0, 10000) + '...[truncated]' : content,
            tags: this.generateTagsForFile(file)
          };
          
          // Guardar en cache
          const cacheFileName = `${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.cache.json`;
          const cacheFilePath = path.join(cacheDir, cacheFileName);
          await fs.writeFile(cacheFilePath, JSON.stringify(cacheEntry, null, 2));
          
          precacheIndex.files.push({
            originalPath: file.relativePath,
            cacheFile: cacheFileName,
            size: cacheEntry.size,
            cached: cacheEntry.cached
          });
          
          this.stats.optimizedSize += file.size;
          
        } catch (error) {
          logger.warn('Error cacheando archivo', { file: file.path, error: error.message });
          this.stats.warnings.push({ action, file: file.path, error: error.message });
        }
      }
      
      // Guardar índice de cache
      const cacheIndexPath = path.join(cacheDir, 'precache-index.json');
      await fs.writeFile(cacheIndexPath, JSON.stringify(precacheIndex, null, 2));
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', cachedFiles: criticalFiles.length });
      logger.info('Precache inteligente completado', { 
        cachedFiles: criticalFiles.length,
        optimizedSize: this.stats.optimizedSize,
        duration: `${duration}ms`
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en precache inteligente', { error: error.message });
    }
  }

  async identifyCriticalFiles() {
    const files = await this.scanMemoryFiles();
    
    // Filtrar archivos críticos
    return files.filter(file => {
      const name = file.name.toLowerCase();
      const path = file.relativePath.toLowerCase();
      
      // Archivos recientes y frecuentemente accedidos
      const isRecent = (new Date() - file.modified) < (24 * 60 * 60 * 1000); // 1 día
      const isFrequentlyAccessed = (new Date() - file.accessed) < (12 * 60 * 60 * 1000); // 12 horas
      
      // Archivos de configuración o checkpoints
      const isConfig = name.includes('config') || path.includes('config');
      const isCheckpoint = name.includes('checkpoint') || path.includes('checkpoint');
      const isIndex = name.includes('index') || path.includes('index');
      
      // Archivos pequeños (menos de 1MB)
      const isSmall = file.size < 1024 * 1024;
      
      return (isRecent && isFrequentlyAccessed) || isConfig || isCheckpoint || isIndex || isSmall;
    }).slice(0, 100); // Limitar a 100 archivos más críticos
  }

  // 4. Optimización de almacenamiento
  async optimizeStorage() {
    const action = 'optimizeStorage';
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando optimización de almacenamiento...');
      
      // Identificar archivos duplicados o similares
      const duplicates = await this.findDuplicates();
      
      // Identificar archivos obsoletos
      const obsolete = await this.findObsoleteFiles();
      
      // Generar reporte de optimización
      const optimizationReport = {
        metadata: {
          created: new Date().toISOString(),
          totalFiles: this.stats.itemsProcessed,
          duplicatesFound: duplicates.length,
          obsoleteFound: obsolete.length,
          potentialSavings: duplicates.reduce((sum, d) => sum + d.size, 0) + 
                           obsolete.reduce((sum, o) => sum + o.size, 0)
        },
        duplicates,
        obsolete,
        recommendations: this.generateOptimizationRecommendations(duplicates, obsolete)
      };
      
      // Guardar reporte
      const reportPath = path.join(this.reportsDir, `memory-optimization-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
      await fs.writeFile(reportPath, JSON.stringify(optimizationReport, null, 2));
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', reportPath });
      logger.info('Optimización de almacenamiento completada', { 
        duplicatesFound: duplicates.length,
        obsoleteFound: obsolete.length,
        potentialSavings: optimizationReport.metadata.potentialSavings,
        duration: `${duration}ms`
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error en optimización de almacenamiento', { error: error.message });
    }
  }

  async findDuplicates() {
    const files = await this.scanMemoryFiles();
    const duplicates = [];
    const hashMap = new Map();
    
    // Para simplificar, usaremos tamaño y nombre como heurística
    // En una implementación real, se usaría hash criptográfico
    for (const file of files) {
      const key = `${file.size}-${file.name}`;
      
      if (hashMap.has(key)) {
        duplicates.push({
          original: hashMap.get(key),
          duplicate: file,
          size: file.size
        });
      } else {
        hashMap.set(key, file);
      }
    }
    
    return duplicates;
  }

  async findObsoleteFiles() {
    const files = await this.scanMemoryFiles();
    const now = new Date();
    
    return files.filter(file => {
      const age = now - file.modified;
      const isVeryOld = age > (180 * 24 * 60 * 60 * 1000); // 6 meses
      const isNeverAccessed = (now - file.accessed) > (90 * 24 * 60 * 60 * 1000); // 3 meses sin acceso
      const isLarge = file.size > (10 * 1024 * 1024); // Más de 10MB
      const isNotCritical = !file.name.includes('critical') && !file.relativePath.includes('critical');
      
      return (isVeryOld || (isNeverAccessed && isLarge)) && isNotCritical;
    });
  }

  generateOptimizationRecommendations(duplicates, obsolete) {
    const recommendations = [];
    
    if (duplicates.length > 0) {
      recommendations.push({
        type: 'duplicates',
        priority: 'medium',
        description: `Se encontraron ${duplicates.length} archivos duplicados`,
        action: 'Eliminar duplicados y consolidar',
        savings: duplicates.reduce((sum, d) => sum + d.size, 0)
      });
    }
    
    if (obsolete.length > 0) {
      recommendations.push({
        type: 'obsolete',
        priority: 'low',
        description: `Se encontraron ${obsolete.length} archivos obsoletos`,
        action: 'Archivar o eliminar archivos obsoletos',
        savings: obsolete.reduce((sum, o) => sum + o.size, 0)
      });
    }
    
    // Recomendación general
    recommendations.push({
      type: 'maintenance',
      priority: 'high',
      description: 'Ejecutar mantenimiento regularmente',
      action: 'Configurar automatización de limpieza',
      savings: 'Variable'
    });
    
    return recommendations;
  }

  // 5. Generar reporte final
  async generateReport() {
    const action = 'generateReport';
    const startTime = Date.now();
    
    try {
      const report = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - new Date(this.stats.startTime).getTime(),
        stats: this.stats,
        summary: {
          totalActions: this.stats.actions.length,
          errors: this.stats.errors.length,
          warnings: this.stats.warnings.length,
          itemsProcessed: this.stats.itemsProcessed,
          tagsCreated: this.stats.tagsCreated,
          optimizedSize: this.stats.optimizedSize
        }
      };
      
      const reportFile = path.join(this.reportsDir, `memory-structure-improvement-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      const duration = Date.now() - startTime;
      this.stats.actions.push({ action, duration, status: 'completed', reportFile });
      logger.info('Reporte de mejora de estructura generado', { reportFile, duration: `${duration}ms` });
      
      return reportFile;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors.push({ action, error: error.message, duration });
      logger.error('Error generando reporte', { error: error.message });
      return null;
    }
  }

  // Ejecutar toda la mejora de estructura
  async runFullImprovement() {
    logger.info('Iniciando mejora completa de estructura de memoria...');
    
    await this.hierarchicalReindex();
    await this.automaticTagging();
    await this.intelligentPrecache();
    await this.optimizeStorage();
    const reportFile = await this.generateReport();
    
    const totalDuration = Date.now() - new Date(this.stats.startTime).getTime();
    const summary = {
      totalDuration,
      actionsCompleted: this.stats.actions.length,
      errors: this.stats.errors.length,
      warnings: this.stats.warnings.length,
      itemsProcessed: this.stats.itemsProcessed,
      tagsCreated: this.stats.tagsCreated,
      optimizedSize: this.stats.optimizedSize,
      reportFile
    };
    
    logger.info('Mejora de estructura completada', summary);
    
    if (this.stats.errors.length > 0) {
      logger.error('Errores detectados durante la mejora', { errors: this.stats.errors });
      process.exit(1);
    }
    
    return summary;
  }
}

// --- CLI ---
function parseArgs(argv) {
  const args = { 
    full: false,
    reindex: false,
    tagging: false,
    precache: false,
    optimize: false,
    report: false
  };
  
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--full') args.full = true;
    else if (a === '--reindex') args.reindex = true;
    else if (a === '--tagging') args.tagging = true;
    else if (a === '--precache') args.precache = true;
    else if (a === '--optimize') args.optimize = true;
    else if (a === '--report') args.report = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help) {
    console.log(`
Uso:
  node scripts/memtech/memory-structure-improver.mjs [opciones]

Opciones:
  --full          Ejecuta toda la mejora de estructura (default)
  --reindex       Reindexación jerárquica
  --tagging       Tagging automático
  --precache      Precache inteligente
  --optimize      Optimización de almacenamiento
  --report        Generar reporte
  --help, -h      Muestra esta ayuda

Ejemplos:
  node scripts/memtech/memory-structure-improver.mjs --full
  node scripts/memtech/memory-structure-improver.mjs --reindex --tagging
  node scripts/memtech/memory-structure-improver.mjs --optimize --report
`);
    process.exit(0);
  }
  
  const improver = new MemoryStructureImprover();
  await improver.initialize();
  
  // Si no se especifica ninguna opción, ejecutar mejora completa
  if (Object.values(args).every(v => v === false)) {
    args.full = true;
  }
  
  if (args.full) {
    await improver.runFullImprovement();
  } else {
    if (args.reindex) await improver.hierarchicalReindex();
    if (args.tagging) await improver.automaticTagging();
    if (args.precache) await improver.intelligentPrecache();
    if (args.optimize) await improver.optimizeStorage();
    if (args.report) await improver.generateReport();
  }
}

if (import.meta.url === `file://${__filename}`) {
  main().catch((e) => {
    logger.error('Fallo fatal en mejora de estructura', { error: String(e) });
    process.exit(2);
  });
}
