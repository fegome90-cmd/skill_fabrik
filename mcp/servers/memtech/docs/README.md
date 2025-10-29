# MemTech MCP Documentation

## Overview

MemTech MCP es un sistema de gestión de memoria y checkpoints diseñado para proporcionar persistencia y recuperación de estado en aplicaciones Node.js. El sistema ofrece una arquitectura modular con servicios para memoria, seguridad, checkpoints, integración con Grafana, gestión de máquinas virtuales y monitoreo del sistema.

## Architecture

### Core Components

1. **Memory Service** - Gestión de memoria persistente
2. **Security Service** - Control de acceso y políticas de seguridad
3. **Checkpoints Service** - Creación y restauración de checkpoints
4. **Grafana Service** - Integración con dashboards de Grafana
5. **VM Service** - Gestión de máquinas virtuales
6. **System Service** - Monitoreo y gestión del sistema

### Directory Structure

```
packages/memtech-mcp/
├── .memtech/                    # Configuración del sistema
│   ├── catalog.json            # Catálogo de servicios
│   ├── config.yaml             # Configuración principal
│   ├── router.cache.json       # Configuración de caché
│   ├── checkpoints.jsonl       # Registro de checkpoints
│   └── policies/               # Políticas del sistema
│       ├── default.json        # Políticas por defecto
│       └── write-allowlist.json # Lista de permitidos para escritura
├── .checkpoints/               # Índice de checkpoints
│   └── index.json             # Índice maestro
├── scripts/                    # Scripts de utilidad
│   ├── memtech/               # Scripts principales
│   ├── grafana/               # Scripts de Grafana
│   ├── checkpoints/           # Scripts de checkpoints
│   └── test/                  # Scripts de prueba
├── docs/                      # Documentación
└── sprints/                   # Configuración de sprints
```

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

```bash
# Configuración de Grafana
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your-api-key

# Configuración del entorno
NODE_ENV=development
USER=your-username

# Configuración de MemTech
MEMTECH_CONFIG_PATH=./.memtech/config.yaml
MEMTECH_CHECKPOINTS_PATH=./.memtech/checkpoints.jsonl
```

## Usage

### Starting the MCP Server

```bash
npm start
```

### Using the Checkpoint Manager

```bash
# Crear un checkpoint del sistema
node scripts/checkpoints/manager.js create system "Checkpoint inicial"

# Listar checkpoints disponibles
node scripts/checkpoints/manager.js list

# Restaurar un checkpoint
node scripts/checkpoints/manager.js restore chkp_001

# Realizar backup de checkpoints
node scripts/checkpoints/manager.js backup
```

### Using the Grafana Dashboard Manager

```bash
# Configurar Grafana
node scripts/grafana/setup.js

# Importar dashboards
node scripts/grafana/dashboard-manager.js import

# Listar dashboards
node scripts/grafana/dashboard-manager.js list

# Crear un nuevo dashboard
node scripts/grafana/dashboard-manager.js create "Mi Dashboard"
```

## API Reference

### Memory Service

- `GET /memory` - Obtener estado de la memoria
- `POST /memory/backup` - Crear backup de memoria
- `POST /memory/restore` - Restaurar memoria desde backup

### Security Service

- `GET /security/policies` - Obtener políticas de seguridad
- `POST /security/policies` - Actualizar políticas de seguridad
- `GET /security/validate` - Validar permisos de acceso

### Checkpoints Service

- `GET /checkpoints` - Listar checkpoints
- `POST /checkpoints` - Crear nuevo checkpoint
- `POST /checkpoints/:id/restore` - Restaurar checkpoint
- `DELETE /checkpoints/:id` - Eliminar checkpoint

### Grafana Service

- `GET /grafana/dashboards` - Listar dashboards
- `POST /grafana/dashboards` - Crear dashboard
- `GET /grafana/metrics` - Obtener métricas

### VM Service

- `GET /vm` - Listar máquinas virtuales
- `POST /vm` - Crear máquina virtual
- `POST /vm/:id/snapshot` - Crear snapshot
- `DELETE /vm/:id` - Eliminar máquina virtual

### System Service

- `GET /system/status` - Obtener estado del sistema
- `GET /system/metrics` - Obtener métricas del sistema
- `POST /system/restart` - Reiniciar servicios

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please open an issue in the repository.
