# Integraciones - Índice

Este directorio contiene documentación sobre integraciones externas con Skills Fabric.

## 📁 Estructura

### MemTech Universal
- **[README.md](memtech/README.md)** - Índice de integración MemTech
- **[MEMTECH-INTEGRATION.md](memtech/MEMTECH-INTEGRATION.md)** - Guía completa de integración
- **[MEMTECH-INTEGRATION-EXAMPLES.md](memtech/MEMTECH-INTEGRATION-EXAMPLES.md)** - Ejemplos prácticos
- **[MEMTECH-INTEGRATION-SUMMARY.md](memtech/MEMTECH-INTEGRATION-SUMMARY.md)** - Resumen ejecutivo
- **[MEMTECH-CONNECTION-STATUS.md](memtech/MEMTECH-CONNECTION-STATUS.md)** - Estado de conexión

### Skills-Fabrik API
- **[README.md](skills-fabrik-api/README.md)** - Índice de integración Skills-Fabrik API
- **[SKILLS-FABRIK-API-INTEGRATION.md](skills-fabrik-api/SKILLS-FABRIK-API-INTEGRATION.md)** - Guía de integración
- **[PMV2-PROMPT-GENERATOR.md](skills-fabrik-api/PMV2-PROMPT-GENERATOR.md)** - Generador de prompts PMv2

### Resumen General
- **[API-CONNECTIONS-SUMMARY.md](API-CONNECTIONS-SUMMARY.md)** - Resumen de todas las conexiones API

## 🚀 Inicio Rápido

### MemTech Universal
```bash
# Ver guía completa
cat docs/integracion/memtech/MEMTECH-INTEGRATION.md

# Usar cliente Python
python3 scripts/integration/memtech-client.py
```

### Skills-Fabrik API
```bash
# Ver guía completa
cat docs/integracion/skills-fabrik-api/SKILLS-FABRIK-API-INTEGRATION.md

# Generar prompt PMv2
python3 scripts/integration/generate-pmv2-prompt.py "objetivo" "rol" "directiva" "framework" "guardrails"
```

## 📝 Notas

- Todas las integraciones están diseñadas para ser **no bloqueantes**
- Los errores de conexión se manejan gracefulmente
- Verificar que los servicios externos estén corriendo antes de usar
