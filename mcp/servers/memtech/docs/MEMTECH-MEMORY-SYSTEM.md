# MemTech Memory System Documentation

## Overview

The MemTech Memory System is a sophisticated, multi-layered memory management system designed to optimize information storage, retrieval, and processing. It implements a tiered architecture with automatic promotion/demotion, semantic search capabilities, and intelligent caching.

## Architecture

### Memory Layers

The system organizes information into four distinct layers:

- **L0 (Hot Memory)**: Critical, frequently accessed items with maximum performance
- **L1 (Warm Memory)**: Important items with good performance characteristics
- **L2 (Cool Memory)**: Reference and archival items with moderate performance
- **L3 (Cold Memory)**: Long-term storage with minimal performance overhead

### Components

1. **Classification Engine**: Automatically categorizes and assigns items to appropriate layers
2. **Anchor Extractor**: Identifies key concepts, contexts, and reference points
3. **Distillation Engine**: Condenses and summarizes content for efficient storage
4. **Vectorization Engine**: Generates embeddings for semantic search capabilities
5. **Relations Builder**: Creates knowledge graphs and relationships between items
6. **Router System**: Manages access patterns and optimizes cache performance
7. **Metrics System**: Monitors performance and health of the memory system

## Configuration

### Main Configuration File

The system is configured via `.memtech/config.yaml`:

```yaml
# Layer configuration
layers:
  L0:
    max_items: 100
    max_size_mb: 10
    priority_tags: ['critical', 'active', 'current', 'hot']
  L1:
    max_items: 1000
    max_size_mb: 100
    priority_tags: ['recent', 'frequent', 'context', 'session']
  # ... L2 and L3 configuration

# Classification patterns
classification_patterns:
  L0_patterns:
    - type: 'regex'
      pattern: 'critical|urgent|emergency'
      weight: 0.9
  # ... more patterns

# Anchors configuration
anchors:
  max_anchors_per_layer:
    L0: 50
    L1: 200
    L2: 500
    L3: 1000
  extraction_patterns:
    concept_anchor:
      - type: 'regex'
        pattern: "\\b(important|key|essential)\\b"
        weight: 0.8
    # ... more patterns

# Distillation configuration
distillation:
  max_source_items: 100
  distillation_ratio: 0.1
  compression_methods: ['extractive', 'abstractive', 'hybrid']

# Vectorization configuration
vectorization:
  embedding_model:
    dimension: 384
    provider: 'sentence-transformers'
  vectorization_layers: ['L0', 'L1']
  max_vectors_per_item: 1

# Relations configuration
relations:
  auto_discovery:
    enabled: true
    min_similarity: 0.7
    max_relations_per_item: 10

# Router configuration
router:
  enabled: true
  cache_size: 1000
  cache_ttl_minutes: 30
  routing_strategy: 'layered'
  warmup:
    enabled: true
    schedule: '0 */6 * * *'
    max_items: 100
    priority_layers: ['L0', 'L1']

# Metrics configuration
metrics:
  prometheus:
    enabled: true
    port: 9090
    endpoint: '/metrics'
  grafana:
    enabled: true
    dashboard_path: '.memtech/dashboards/memsys-health.json'

# Scheduled jobs
scheduled_jobs:
  hourly:
    enabled: true
    schedule: '0 * * * *'
    tasks: ['promote_demote', 'cache_cleanup', 'metrics_collection']
  nightly:
    enabled: true
    schedule: '0 2 * * *'
    tasks:
      [
        'full_classification',
        'anchor_extraction',
        'distillation',
        'vectorization',
        'relations_building',
        'router_warmup',
      ]
  weekly:
    enabled: true
    schedule: '0 3 * * 0'
    tasks: ['deep_archive', 'compression', 'graph_optimization', 'backup_verification']
  monthly:
    enabled: true
    schedule: '0 4 1 * *'
    tasks: ['generate_reports', 'cleanup_old_data', 'performance_analysis', 'capacity_planning']
```

### Exclusion Configuration

The system uses `.memtech/skiplist.json` to define exclusions:

```json
{
  "version": "1.0.0",
  "exclusions": {
    "paths": [
      {
        "pattern": "*.tmp",
        "type": "glob",
        "reason": "Temporary files"
      }
    ],
    "directories": [
      {
        "pattern": ".git/*",
        "type": "glob",
        "reason": "Git metadata"
      }
    ],
    "file_types": [
      {
        "extensions": [".exe", ".dll"],
        "reason": "Binary executables"
      }
    ],
    "size_limits": [
      {
        "max_size_mb": 100,
        "layers": ["L0", "L1"],
        "reason": "Too large for hot/warm layers"
      }
    ]
  }
}
```

## Usage

### MCP Tools

The system provides several MCP tools for memory management:

#### Memory Operations

- `mem.store`: Store content in the memory system
- `mem.retrieve`: Retrieve content from the memory system
- `mem.search`: Search for content using semantic or keyword queries
- `mem.query`: Execute complex queries against the memory system

#### Maintenance Operations

- `mem.curate.promoteDemote`: Promote or demote items between layers
- `mem.distill.source`: Distill a specific source to a higher layer
- `mem.index.anchors`: Extract anchors from specific content
- `mem.vectorize.dir`: Vectorize content in a specific directory
- `mem.prune`: Clean up old or low-quality items
- `mem.router.warm`: Warm up the router cache with priority items
- `mem.stats.report`: Generate comprehensive statistics reports

#### System Operations

- `mem.backup.create`: Create backups of the memory system
- `mem.backup.restore`: Restore from backups
- `mem.backup.status`: Check backup system status

### Examples

#### Storing Content

```javascript
// Store a document in the memory system
const result = await mem.store({
  content: 'This is an important document about machine learning.',
  metadata: {
    title: 'ML Overview',
    tags: ['ml', 'overview', 'important'],
    priority: 'high',
  },
});
```

#### Searching Content

```javascript
// Search for content using semantic queries
const results = await mem.search({
  query: 'machine learning algorithms',
  layer: 'L1',
  limit: 10,
});
```

#### Promoting Items

```javascript
// Promote an item to a higher layer
const result = await mem.curate.promoteDemote({
  operation: 'promote',
  item_uri: 'mem://file/example_document',
  target_layer: 'L0',
});
```

## Processing Pipeline

### Phase A: Classification and Inventory

1. **Scanning**: Recursive scanning of allowed directories
2. **Filtering**: Application of skiplist rules
3. **Classification**: Assignment to appropriate layers based on patterns
4. **Manifest Generation**: Creation of comprehensive inventory

### Phase B: Anchor Extraction and Distillation

1. **Anchor Extraction**: Identification of key concepts and contexts
2. **Distillation**: Content summarization and compression
3. **Quality Assessment**: Evaluation of distilled content quality
4. **Storage**: Placement in appropriate layers

### Phase C: Vectorization

1. **Content Selection**: Identification of items for vectorization
2. **Embedding Generation**: Creation of semantic embeddings
3. **Indexing**: Storage in vector database (Qdrant)
4. **Similarity Mapping**: Creation of similarity relationships

### Phase D: Relationship Building

1. **Node Creation**: Generation of graph nodes from items
2. **Relationship Identification**: Discovery of semantic and contextual relationships
3. **Graph Construction**: Building of knowledge graph
4. **Neo4j Integration**: Storage in graph database

### Phase E: Router Warmup

1. **Priority Identification**: Selection of high-priority items
2. **Cache Loading**: Preloading of router cache
3. **Rule Generation**: Creation of routing rules
4. **Performance Optimization**: System tuning for optimal access

### Phase F: Metrics and Dashboard

1. **Metrics Collection**: Gathering of performance and health metrics
2. **Prometheus Integration**: Exposure of metrics for monitoring
3. **Dashboard Generation**: Creation of Grafana dashboards
4. **Alert Configuration**: Setup of health and performance alerts

## Scheduled Jobs

### Hourly Jobs

- **Promotion/Demotion**: Automatic movement of items between layers
- **Cache Cleanup**: Optimization of router cache
- **Metrics Collection**: Gathering of performance metrics

### Nightly Jobs

- **Full Classification**: Complete reclassification of all items
- **Anchor Extraction**: Comprehensive anchor extraction
- **Distillation**: Content distillation and summarization
- **Vectorization**: Generation of semantic embeddings
- **Relationship Building**: Construction of knowledge graphs
- **Router Warmup**: Complete router cache optimization

### Weekly Jobs

- **Deep Archive**: Long-term storage optimization
- **Compression**: Content compression for storage efficiency
- **Graph Optimization**: Knowledge graph optimization
- **Backup Verification**: Validation of backup integrity

### Monthly Jobs

- **Report Generation**: Comprehensive system reports
- **Data Cleanup**: Removal of old and unnecessary data
- **Performance Analysis**: System performance evaluation
- **Capacity Planning**: Resource allocation planning

## Monitoring and Health

### Metrics

The system exposes comprehensive metrics via Prometheus:

- **Layer Metrics**: Item counts, sizes, utilization ratios
- **Performance Metrics**: Operation durations, success/error rates
- **Router Metrics**: Cache hit ratios, request durations
- **Health Metrics**: System health status, processing queue sizes

### Dashboard

The MemSys Health dashboard provides:

- **System Overview**: Total items, layer distribution, storage usage
- **Performance Monitoring**: Operation rates, durations, errors
- **Health Status**: System health indicators, cache performance
- **Resource Utilization**: Layer utilization, processing queue status

### Alerts

The system supports configurable alerts for:

- **High Error Rates**: Elevated operation error rates
- **Capacity Issues**: Layer capacity warnings
- **Performance Degradation**: Slow operation response times
- **Health Problems**: System health status changes

## Backup and Recovery

### Backup Strategy

The system implements a comprehensive backup strategy:

- **Incremental Backups**: Regular incremental backups
- **Full Backups**: Periodic full system backups
- **Layer-specific Backups**: Separate backups for each layer
- **Metadata Backups**: Backup of system metadata and configuration

### Recovery Process

1. **System Assessment**: Evaluation of system state and damage
2. **Backup Selection**: Identification of appropriate backup
3. **System Restoration**: Restoration of system components
4. **Verification**: Validation of restored system integrity

## Troubleshooting

### Common Issues

#### Performance Problems

- **Symptoms**: Slow response times, high latency
- **Causes**: Overloaded layers, inefficient routing, cache misses
- **Solutions**: Layer optimization, router tuning, cache warmup

#### Capacity Issues

- **Symptoms**: Failed promotions, storage warnings
- **Causes**: Layer capacity limits, inefficient storage
- **Solutions**: Layer resizing, content pruning, archiving

#### Classification Errors

- **Symptoms**: Items in wrong layers, poor performance
- **Causes**: Incorrect patterns, outdated configuration
- **Solutions**: Pattern updates, configuration refresh, reclassification

### Debugging Tools

- **Logs**: Comprehensive logging for all system components
- **Reports**: Detailed reports for all operations
- **Metrics**: Real-time performance and health metrics
- **Health Checks**: System health validation tools

## API Reference

### Memory Operations

#### mem.store

Store content in the memory system.

```javascript
await mem.store({
  content: 'Content to store',
  metadata: {
    title: 'Document Title',
    tags: ['tag1', 'tag2'],
    priority: 'high',
  },
});
```

#### mem.retrieve

Retrieve content from the memory system.

```javascript
await mem.retrieve({
  uri: 'mem://file/example_document',
});
```

#### mem.search

Search for content using semantic or keyword queries.

```javascript
await mem.search({
  query: 'search terms',
  layer: 'L1',
  limit: 10,
  semantic: true,
});
```

### Maintenance Operations

#### mem.curate.promoteDemote

Promote or demote items between layers.

```javascript
await mem.curate.promoteDemote({
  operation: 'promote',
  item_uri: 'mem://file/example_document',
  target_layer: 'L0',
  force: false,
});
```

#### mem.distill.source

Distill a specific source to a higher layer.

```javascript
await mem.distill.source({
  source_uri: 'mem://file/large_document',
  target_layer: 'L1',
  method: 'hybrid',
});
```

## Best Practices

### Content Organization

- **Consistent Tagging**: Use consistent tags for similar content
- **Appropriate Priorities**: Assign appropriate priorities to content
- **Regular Maintenance**: Perform regular maintenance operations

### Performance Optimization

- **Layer Management**: Monitor and manage layer capacities
- **Cache Optimization**: Regularly warm up router cache
- **Query Optimization**: Use appropriate query types and parameters

### System Maintenance

- **Regular Backups**: Perform regular system backups
- **Monitor Health**: Monitor system health metrics
- **Update Configuration**: Keep configuration up to date

## Future Enhancements

### Planned Features

- **Machine Learning Classification**: Enhanced classification using ML models
- **Advanced Search**: More sophisticated search capabilities
- **Real-time Collaboration**: Multi-user real-time collaboration
- **Enhanced Security**: Advanced security and access controls

### Integration Opportunities

- **External Databases**: Integration with external database systems
- **Cloud Storage**: Cloud storage integration for scalability
- \*\*API Extensions: Extended API capabilities for third-party integration
- **Plugin System**: Plugin system for custom functionality
