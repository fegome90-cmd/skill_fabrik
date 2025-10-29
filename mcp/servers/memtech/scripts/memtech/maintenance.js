/**
 * MemTech Maintenance Module
 *
 * Módulo para funciones de mantenimiento del sistema de memoria
 * Promoción/degradación, destilación, extracción de anchors, etc.
 */

import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';
import process from 'process';
import { Buffer } from 'buffer';

// Importar indexers
import DistillationEngine from '../indexers/distill.mjs';
import AnchorExtractor from '../indexers/anchors.mjs';
import VectorizationEngine from '../indexers/vectorize.mjs';
import RouterWarmup from '../indexers/router-warmup.mjs';

// Configuración del logger
const logger = winston.createLogger({
  level: process?.env?.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

class MaintenanceManager {
  constructor(config = {}) {
    this.config = {
      project_root: config.project_root || process.cwd(),
      scripts_dir:
        config.scripts_dir || path.join(process.cwd(), 'packages/memtech-mcp/scripts/indexers'),
      ...config,
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      logger.info('Initializing Maintenance Manager...');
      this.initialized = true;
      logger.info('Maintenance Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Maintenance Manager:', error);
      throw error;
    }
  }

  async promoteDemote(args) {
    await this.initialize();

    try {
      logger.info(`Executing promote/demote operation: ${args.operation}`);

      const { operation, item_uri, target_layer, force } = args;

      if (!item_uri) {
        throw new Error('Item URI is required for promote/demote operations');
      }

      // Cargar manifest actual
      const manifestPath = '.memtech/manifests/manifest_latest.json';
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      // Encontrar el item
      let foundItem = null;
      let currentLayer = null;

      for (const [layerName, layerData] of Object.entries(manifest.layers)) {
        const item = layerData.items.find(item => item.uri === item_uri);
        if (item) {
          foundItem = item;
          currentLayer = layerName;
          break;
        }
      }

      if (!foundItem) {
        throw new Error(`Item not found: ${item_uri}`);
      }

      // Ejecutar operación
      let result;

      if (operation === 'promote') {
        result = await this.promoteItem(foundItem, currentLayer, target_layer, force);
      } else if (operation === 'demote') {
        result = await this.demoteItem(foundItem, currentLayer, target_layer, force);
      } else {
        throw new Error(`Invalid operation: ${operation}. Must be 'promote' or 'demote'`);
      }

      logger.info(`Promote/demote operation completed successfully`);
      return result;
    } catch (error) {
      logger.error(`Error in promote/demote operation:`, error);
      throw new Error(`Promote/demote operation failed: ${error.message}`);
    }
  }

  async promoteItem(item, currentLayer, targetLayer, force = false) {
    const layerOrder = ['L3', 'L2', 'L1', 'L0'];
    const currentIndex = layerOrder.indexOf(currentLayer);

    if (currentIndex === -1) {
      throw new Error(`Invalid current layer: ${currentLayer}`);
    }

    // Determinar capa de destino
    let finalTargetLayer;
    if (targetLayer) {
      const targetIndex = layerOrder.indexOf(targetLayer);
      if (targetIndex === -1 || targetIndex <= currentIndex) {
        throw new Error(`Invalid target layer for promotion: ${targetLayer}`);
      }
      finalTargetLayer = targetLayer;
    } else {
      // Promover a la siguiente capa
      if (currentIndex === layerOrder.length - 1) {
        throw new Error(`Item is already in highest layer: ${currentLayer}`);
      }
      finalTargetLayer = layerOrder[currentIndex + 1];
    }

    // Verificar capacidad de capa de destino
    const manifestPath = '.memtech/manifests/manifest_latest.json';
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    const targetLayerData = manifest.layers[finalTargetLayer];
    const layerConfigPath = '.memtech/config.yaml';
    const layerConfigData = await fs.readFile(layerConfigPath, 'utf8');
    const layerConfig = JSON.parse(layerConfigData.toString()).layers[finalTargetLayer];

    if (!force && targetLayerData.count >= layerConfig.max_items) {
      throw new Error(`Target layer ${finalTargetLayer} is at capacity`);
    }

    // Mover item entre capas
    await this.moveItemBetweenLayers(item, currentLayer, finalTargetLayer);

    return {
      success: true,
      operation: 'promote',
      item_uri: item.uri,
      from_layer: currentLayer,
      to_layer: finalTargetLayer,
      promoted_at: new Date().toISOString(),
    };
  }

  async demoteItem(item, currentLayer, targetLayer) {
    const layerOrder = ['L3', 'L2', 'L1', 'L0'];
    const currentIndex = layerOrder.indexOf(currentLayer);

    if (currentIndex === -1) {
      throw new Error(`Invalid current layer: ${currentLayer}`);
    }

    // Determinar capa de destino
    let finalTargetLayer;
    if (targetLayer) {
      const targetIndex = layerOrder.indexOf(targetLayer);
      if (targetIndex === -1 || targetIndex >= currentIndex) {
        throw new Error(`Invalid target layer for demotion: ${targetLayer}`);
      }
      finalTargetLayer = targetLayer;
    } else {
      // Degradar a la siguiente capa inferior
      if (currentIndex === 0) {
        throw new Error(`Item is already in lowest layer: ${currentLayer}`);
      }
      finalTargetLayer = layerOrder[currentIndex - 1];
    }

    // Mover item entre capas
    await this.moveItemBetweenLayers(item, currentLayer, finalTargetLayer);

    return {
      success: true,
      operation: 'demote',
      item_uri: item.uri,
      from_layer: currentLayer,
      to_layer: finalTargetLayer,
      demoted_at: new Date().toISOString(),
    };
  }

  async moveItemBetweenLayers(item, fromLayer, toLayer) {
    // Actualizar manifest
    const manifestPath = '.memtech/manifests/manifest_latest.json';
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    // Remover de capa actual
    const fromLayerItems = manifest.layers[fromLayer].items;
    const itemIndex = fromLayerItems.findIndex(i => i.uri === item.uri);

    if (itemIndex === -1) {
      throw new Error(`Item not found in layer ${fromLayer}: ${item.uri}`);
    }

    const movedItem = fromLayerItems.splice(itemIndex, 1)[0];
    movedItem.layer = toLayer;
    movedItem.moved_at = new Date().toISOString();

    // Agregar a nueva capa
    manifest.layers[toLayer].items.push(movedItem);

    // Actualizar contadores
    manifest.layers[fromLayer].count = fromLayerItems.length;
    manifest.layers[toLayer].count++;

    // Guardar manifest actualizado
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    logger.info(`Moved item ${item.uri} from ${fromLayer} to ${toLayer}`);
  }

  async distillSource(args) {
    await this.initialize();

    try {
      logger.info(`Executing distillation for source: ${args.source_uri}`);

      const { source_uri, target_layer, method } = args;

      if (!source_uri) {
        throw new Error('Source URI is required for distillation');
      }

      // Ejecutar motor de destilación
      const distillationEngine = new DistillationEngine();
      await distillationEngine.initialize();

      // Ejecutar destilación focalizada en la fuente específica
      const result = await this.distillSpecificSource(
        distillationEngine,
        source_uri,
        target_layer,
        method
      );

      logger.info(`Distillation completed for source: ${source_uri}`);
      return result;
    } catch (error) {
      logger.error(`Error in distillation:`, error);
      throw new Error(`Distillation failed: ${error.message}`);
    }
  }

  async distillSpecificSource(engine, sourceUri, targetLayer, method) {
    // Cargar manifest para encontrar el item
    const manifestPath = '.memtech/manifests/manifest_latest.json';
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    // Encontrar el item
    let sourceItem = null;

    for (const [layerName, layerData] of Object.entries(manifest.layers)) {
      const item = layerData.items.find(item => item.uri === sourceUri);
      if (item) {
        sourceItem = { ...item, layer: layerName };
        break;
      }
    }

    if (!sourceItem) {
      throw new Error(`Source item not found: ${sourceUri}`);
    }

    // Determinar capa de destino
    const finalTargetLayer = targetLayer || this.determineTargetLayer(sourceItem);

    // Crear candidato para destilación
    const candidate = {
      ...sourceItem,
      target_layer: finalTargetLayer,
      distillation_method: method || 'hybrid',
    };

    // Ejecutar destilación
    const content = await this.readFullContent(candidate);
    if (!content) {
      throw new Error(`No content available for distillation: ${sourceUri}`);
    }

    const distilledContent = await this.applyDistillation(
      content,
      candidate.distillation_method,
      candidate
    );
    const distilledItem = await this.createDistilledItem(
      candidate,
      distilledContent,
      candidate.distillation_method
    );

    // Guardar item destilado
    await this.saveDistilledItem(distilledItem);

    return {
      success: true,
      source_uri: sourceUri,
      distilled_uri: distilledItem.uri,
      target_layer: finalTargetLayer,
      method: candidate.distillation_method,
      compression_ratio: distilledItem.compression_ratio,
      quality_score: distilledItem.quality_score,
      distilled_at: new Date().toISOString(),
    };
  }

  async readFullContent(candidate) {
    try {
      // Para archivos del sistema
      if (candidate.path && (await this.fileExists(candidate.path))) {
        return await fs.readFile(candidate.path, 'utf8');
      }

      // Para elementos en memoria MemTech
      if (candidate.uri && candidate.uri.startsWith('mem://')) {
        const memoryPath = `.memtech/memory/${candidate.uri.replace('mem://', '')}.json`;
        if (await this.fileExists(memoryPath)) {
          const memoryData = await fs.readFile(memoryPath, 'utf8');
          const memoryItem = JSON.parse(memoryData);
          return memoryItem.content || '';
        }
      }

      // Usar content_preview si está disponible
      if (candidate.content_preview) {
        return candidate.content_preview;
      }

      return null;
    } catch (error) {
      logger.warn(`Error reading content for ${candidate.uri}:`, error);
      return null;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  determineTargetLayer(item) {
    // Lógica para determinar capa de destino
    let score = 0;

    // Factores que favorecen L0
    if (item.size_mb < 1) score += 3;
    if (item.layer === 'L2') score += 2; // Más cercano a L0

    // Factores basados en contenido
    if (item.content_preview) {
      const preview = item.content_preview.toLowerCase();
      if (preview.includes('critical') || preview.includes('urgent')) score += 5;
      if (preview.includes('config') || preview.includes('setup')) score += 3;
    }

    return score >= 5 ? 'L0' : 'L1';
  }

  async applyDistillation(content, method) {
    // Importar funciones de destilación
    const { extractiveDistillation, abstractiveDistillation, hybridDistillation } = await import(
      '../indexers/distill.mjs'
    );

    switch (method) {
      case 'extractive':
        return extractiveDistillation(content);
      case 'abstractive':
        return abstractiveDistillation(content);
      case 'hybrid':
        return hybridDistillation(content);
      default:
        return extractiveDistillation(content);
    }
  }

  async createDistilledItem(candidate, distilledContent, method) {
    // Importar funciones del motor de destilación
    const {
      generateDistilledId,
      extractTitle,
      extractSummary,
      extractKeyPoints,
      extractConclusions,
      extractTags,
      calculateQualityScore,
    } = await import('../indexers/distill.mjs');

    const distilledItem = {
      id: generateDistilledId(candidate),
      uri: `mem://distilled/${candidate.target_layer}/${generateDistilledId(candidate)}`,
      source_uri: candidate.uri,
      source_layer: candidate.layer,
      target_layer: candidate.target_layer,
      distillation_method: method,
      content: distilledContent,
      size_bytes: Buffer.byteLength(distilledContent, 'utf8'),
      size_mb: Buffer.byteLength(distilledContent, 'utf8') / (1024 * 1024),
      compression_ratio:
        candidate.size_mb > 0
          ? Buffer.byteLength(distilledContent, 'utf8') / (1024 * 1024) / candidate.size_mb
          : 1,

      // Preservar campos clave del original
      title: extractTitle(candidate, distilledContent),
      summary: extractSummary(distilledContent),
      key_points: extractKeyPoints(distilledContent),
      conclusions: extractConclusions(distilledContent),
      tags: extractTags(candidate, distilledContent),

      // Metadata
      created_at: new Date().toISOString(),
      distilled_at: new Date().toISOString(),
      quality_score: calculateQualityScore(candidate, distilledContent),

      // Referencia al original
      original_path: candidate.path,
      original_modified_at: candidate.modified_at,
      original_size_mb: candidate.size_mb,
    };

    return distilledItem;
  }

  async saveDistilledItem(distilledItem) {
    try {
      const dir = `.memtech/distilled/${distilledItem.target_layer}`;
      const filename = `${distilledItem.id}.json`;
      const filepath = path.join(dir, filename);

      await fs.writeFile(filepath, JSON.stringify(distilledItem, null, 2));

      logger.debug(`Distilled item saved: ${filepath}`);
    } catch (error) {
      logger.error(`Error saving distilled item ${distilledItem.id}:`, error);
      throw error;
    }
  }

  async indexAnchors(args) {
    await this.initialize();

    try {
      logger.info('Executing anchor extraction...');

      const { source_uri, anchor_types } = args;

      // Ejecutar extractor de anchors
      const anchorExtractor = new AnchorExtractor();
      await anchorExtractor.initialize();

      // Ejecutar extracción
      const result = await anchorExtractor.run();

      // Filtrar por tipos específicos si se solicita
      let filteredResult = result;
      if (anchor_types && Array.isArray(anchor_types)) {
        const filteredAnchors = {
          ...result,
          anchors: {},
        };

        for (const anchorType of anchor_types) {
          if (result.anchors[anchorType]) {
            filteredAnchors.anchors[anchorType] = result.anchors[anchorType];
          }
        }

        filteredResult = filteredAnchors;
      }

      // Filtrar por URI específico si se solicita
      if (source_uri) {
        const filteredByUri = {
          ...filteredResult,
          anchors: {},
        };

        for (const [anchorType, anchors] of Object.entries(filteredResult.anchors)) {
          filteredByUri.anchors[anchorType] = anchors.filter(
            anchor => anchor.source_uri === source_uri
          );
        }

        filteredResult = filteredByUri;
      }

      logger.info('Anchor extraction completed successfully');
      return {
        success: true,
        total_anchors_extracted: this.countTotalAnchors(filteredResult),
        anchor_types: Object.keys(filteredResult.anchors),
        extracted_at: new Date().toISOString(),
        result: filteredResult,
      };
    } catch (error) {
      logger.error(`Error in anchor extraction:`, error);
      throw new Error(`Anchor extraction failed: ${error.message}`);
    }
  }

  countTotalAnchors(anchorsResult) {
    let total = 0;

    for (const anchors of Object.values(anchorsResult.anchors)) {
      total += anchors.length;
    }

    return total;
  }

  async vectorizeDir(args) {
    await this.initialize();

    try {
      logger.info(`Executing vectorization for directory: ${args.directory}`);

      const { directory, layer } = args;

      if (!directory) {
        throw new Error('Directory is required for vectorization');
      }

      // Ejecutar motor de vectorización
      const vectorizationEngine = new VectorizationEngine();
      await vectorizationEngine.initialize();

      // Ejecutar vectorización
      const result = await vectorizationEngine.run();

      // Filtrar por directorio específico si se solicita
      let filteredResult = result;
      if (directory) {
        const filteredVectors = {
          ...result,
          vectors: result.vectors.filter(
            vector => vector.payload.source_uri && vector.payload.source_uri.includes(directory)
          ),
        };

        filteredResult = filteredVectors;
      }

      // Filtrar por capa específica si se solicita
      if (layer) {
        const filteredByLayer = {
          ...filteredResult,
          vectors: filteredResult.vectors.filter(vector => vector.payload.source_layer === layer),
        };

        filteredResult = filteredByLayer;
      }

      logger.info(`Vectorization completed for directory: ${directory}`);
      return {
        success: true,
        directory,
        layer,
        total_vectors_generated: filteredResult.vectors.length,
        collections: Object.keys(filteredResult.collections),
        vectorized_at: new Date().toISOString(),
        result: filteredResult,
      };
    } catch (error) {
      logger.error(`Error in vectorization:`, error);
      throw new Error(`Vectorization failed: ${error.message}`);
    }
  }

  async prune(args) {
    await this.initialize();

    try {
      logger.info('Executing prune operation...');

      const { dry_run, force, layer, older_than_days } = args;

      // Cargar manifest actual
      const manifestPath = '.memtech/manifests/manifest_latest.json';
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      // Identificar items para podar
      const itemsToPrune = [];

      for (const [layerName, layerData] of Object.entries(manifest.layers)) {
        if (layer && layerName !== layer) {
          continue; // Skip if not the requested layer
        }

        for (const item of layerData.items) {
          const shouldPrune = this.shouldPruneItem(item, older_than_days);

          if (shouldPrune) {
            itemsToPrune.push({
              ...item,
              layer: layerName,
              reason: shouldPrune.reason,
            });
          }
        }
      }

      if (dry_run) {
        return {
          success: true,
          dry_run: true,
          items_to_prune: itemsToPrune.length,
          items: itemsToPrune,
          analyzed_at: new Date().toISOString(),
        };
      }

      // Ejecutar podado si no es dry_run
      if (!force && itemsToPrune.length > 0) {
        return {
          success: false,
          dry_run: false,
          items_to_prune: itemsToPrune.length,
          message: 'Use force=true to execute prune operation',
          items: itemsToPrune,
        };
      }

      // Ejecutar podado
      const prunedItems = [];

      for (const item of itemsToPrune) {
        try {
          await this.pruneItem(item, manifest);
          prunedItems.push(item);
        } catch (error) {
          logger.error(`Error pruning item ${item.uri}:`, error);
        }
      }

      // Guardar manifest actualizado
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      logger.info(`Prune operation completed: ${prunedItems.length} items pruned`);
      return {
        success: true,
        dry_run: false,
        items_pruned: prunedItems.length,
        items: prunedItems,
        pruned_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error in prune operation:`, error);
      throw new Error(`Prune operation failed: ${error.message}`);
    }
  }

  shouldPruneItem(item, olderThanDays) {
    const ageDays =
      (Date.now() - new Date(item.accessed_at || item.modified_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const threshold = olderThanDays || 30;

    if (ageDays > threshold) {
      return { reason: 'old', age_days: ageDays };
    }

    // Otros criterios de podado
    if (item.size_mb === 0) {
      return { reason: 'empty', size_mb: item.size_mb };
    }

    if (item.classification_score < 0.1) {
      return { reason: 'low_score', score: item.classification_score };
    }

    return null;
  }

  async pruneItem(item, manifest) {
    // Remover del manifest
    const layerItems = manifest.layers[item.layer].items;
    const itemIndex = layerItems.findIndex(i => i.uri === item.uri);

    if (itemIndex !== -1) {
      layerItems.splice(itemIndex, 1);
      manifest.layers[item.layer].count--;
    }

    // Opcionalmente, eliminar archivo físico
    if (item.path && (await this.fileExists(item.path))) {
      // En una implementación real, esto podría moverse a una carpeta de eliminados
      // en lugar de eliminar directamente
      logger.debug(`Would prune file: ${item.path}`);
    }

    logger.debug(`Pruned item: ${item.uri}`);
  }

  async routerWarm(args) {
    await this.initialize();

    try {
      logger.info('Executing router warmup...');

      const { max_items, priority_layers } = args;

      // Ejecutar warmup de router
      const routerWarmup = new RouterWarmup();
      await routerWarmup.initialize();

      // Modificar configuración si se proporcionan parámetros
      if (max_items || priority_layers) {
        // En una implementación real, esto modificaría la configuración
        logger.debug(
          `Custom warmup parameters: max_items=${max_items}, priority_layers=${priority_layers}`
        );
      }

      // Ejecutar warmup
      const result = await routerWarmup.run();

      logger.info('Router warmup completed successfully');
      return {
        success: true,
        cache_items_loaded: result.metadata.total_cache_items_loaded,
        processing_time_ms: result.metadata.processing_time_ms,
        warmed_at: new Date().toISOString(),
        result: result,
      };
    } catch (error) {
      logger.error(`Error in router warmup:`, error);
      throw new Error(`Router warmup failed: ${error.message}`);
    }
  }

  async statsReport(args) {
    await this.initialize();

    try {
      logger.info('Generating maintenance statistics report...');

      const { include_layer_stats, include_performance, include_health } = args;

      const report = {
        generated_at: new Date().toISOString(),
        maintenance_stats: {
          last_classification: await this.getLastRunTime('classification'),
          last_anchor_extraction: await this.getLastRunTime('anchor_extraction'),
          last_distillation: await this.getLastRunTime('distillation'),
          last_vectorization: await this.getLastRunTime('vectorization'),
          last_relations_building: await this.getLastRunTime('relations_building'),
          last_router_warmup: await this.getLastRunTime('router_warmup'),
        },
      };

      // Incluir estadísticas de capas si se solicita
      if (include_layer_stats !== false) {
        report.layer_stats = await this.generateLayerStats();
      }

      // Incluir estadísticas de rendimiento si se solicita
      if (include_performance) {
        report.performance_stats = await this.generatePerformanceStats();
      }

      // Incluir estadísticas de salud si se solicita
      if (include_health !== false) {
        report.health_stats = await this.generateHealthStats();
      }

      logger.info('Maintenance statistics report generated successfully');
      return report;
    } catch (error) {
      logger.error(`Error generating stats report:`, error);
      throw new Error(`Stats report generation failed: ${error.message}`);
    }
  }

  async getLastRunTime(operation) {
    try {
      const reportPath = `.memtech/reports/${operation}_report_latest.json`;
      const reportData = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportData);

      return report.timestamp || null;
    } catch (error) {
      logger.debug(`Error getting last run time for ${operation}:`, error);
      return null;
    }
  }

  async generateLayerStats() {
    try {
      const manifestPath = '.memtech/manifests/manifest_latest.json';
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      const layerStats = {};

      for (const [layerName, layerData] of Object.entries(manifest.layers)) {
        layerStats[layerName] = {
          count: layerData.count,
          total_size_mb: layerData.size_mb,
          avg_item_size_mb:
            layerData.count > 0 ? (layerData.size_mb / layerData.count).toFixed(2) : 0,
          newest_item:
            layerData.items.length > 0
              ? layerData.items.reduce((newest, item) =>
                  new Date(item.modified_at) > new Date(newest.modified_at) ? item : newest
                ).modified_at
              : null,
          oldest_item:
            layerData.items.length > 0
              ? layerData.items.reduce((oldest, item) =>
                  new Date(item.modified_at) < new Date(oldest.modified_at) ? item : oldest
                ).modified_at
              : null,
        };
      }

      return layerStats;
    } catch (error) {
      logger.error('Error generating layer stats:', error);
      return {};
    }
  }

  async generatePerformanceStats() {
    try {
      const stats = {};

      // Obtener estadísticas de los últimos reports
      const operations = [
        'classification',
        'anchor_extraction',
        'distillation',
        'vectorization',
        'relations_building',
        'router_warmup',
      ];

      for (const operation of operations) {
        try {
          const reportPath = `.memtech/reports/${operation}_report_latest.json`;
          const reportData = await fs.readFile(reportPath, 'utf8');
          const report = JSON.parse(reportData);

          stats[operation] = {
            last_run: report.timestamp,
            processing_time_seconds: report.summary?.processing_time_seconds || 0,
            items_processed: report.summary?.total_items_processed || 0,
            errors:
              report.summary?.classification_errors ||
              report.summary?.extraction_errors ||
              report.summary?.distillation_errors ||
              report.summary?.vectorization_errors ||
              report.summary?.relation_errors ||
              0,
          };
        } catch (error) {
          logger.debug(`Error getting performance stats for ${operation}:`, error);
          stats[operation] = {
            last_run: null,
            processing_time_seconds: 0,
            items_processed: 0,
            errors: 0,
          };
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error generating performance stats:', error);
      return {};
    }
  }

  async generateHealthStats() {
    try {
      // Obtener estado del router
      const routerCachePath = '.memtech/router.cache.json';
      const routerCacheData = await fs.readFile(routerCachePath, 'utf8');
      const routerCache = JSON.parse(routerCacheData);

      return {
        router_health: routerCache.health_status?.overall_health || 'unknown',
        cache_utilization: routerCache.metadata?.total_cache_items_loaded || 0,
        last_health_check: routerCache.health_status?.last_health_check || null,
      };
    } catch (error) {
      logger.error('Error generating health stats:', error);
      return {
        router_health: 'unknown',
        cache_utilization: 0,
        last_health_check: null,
      };
    }
  }
}

export default MaintenanceManager;
