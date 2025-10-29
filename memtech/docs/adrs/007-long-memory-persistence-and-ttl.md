# ADR-007: Persistencia y TTL de Long Memory en MemTech

## Status

Accepted - 2025-10-19

## Context

El archivo `core/memory/memory-state.json` solo almacenaba `short_memory` y `context_cache`. El adaptador (`core/memtech-agent/memory-adapter.js`) esperaba un arreglo `records`, pero nunca se llenaba; como consecuencia:

- `LongMemory` no contenía registros reales.
- La restauración de contexto tras reinicios dependía únicamente de L0/L1 (volátiles).
- No existía política de retención ni límite de elementos para la memoria larga.

Esto comprometía la continuidad del conocimiento y dificultaba auditorías históricas.

## Decision

Implementar un mecanismo persistente y gobernado para Long Memory:

1. **Estructura de datos**: añadir `long_memory` al estado, y mantener `records` como compatibilidad.
2. **Persistencia en disco**: toda escritura de contexto guarda una entrada con metadatos (`source`, `topic`, `tags`, `ts`) y límite circular de 500 elementos.
3. **TTL operativo**: definir un tiempo de vida de 90 días para Long Memory; una tarea de limpieza remueve registros vencidos.
4. **Carga inteligente**: al iniciar, el adaptador precarga Short Memory con los registros más recientes de long_memory (hasta 500).
5. **Uso transparente**: `Memory.injectContext()` mezcla resultados de short y long para ofrecer contexto consistente.

## Consequences

- ✅ La memoria de largo plazo sobrevive reinicios y recupera histórico relevante.
- ✅ Se delimitan recursos (máximo 500 registros activos) y se evita crecimiento sin control.
- ✅ Las búsquedas de contexto aprovechan L0/L1/L3 sin cambios en el código de consumo.
- ⚠️ Se requiere mantener el fichero `memory-state.json` actualizado; los backups deben incluirlo.
- ⚠️ Cualquier cambio futuro al formato JSON debe considerar compatibilidad con las herramientas que lo consumen.

## Implementation

- Actualización del adaptador (`core/memtech-agent/memory-adapter.js`):
  - Nuevo límite y TTL (`longMemoryLimit`, `longMemoryTtlMs`).
  - Persistencia de entradas en `long_memory` y `records`.
  - Limpieza de registros vencidos en `cleanupExpiredMemory`.
  - Precarga de Short Memory desde registros persistidos.
- Ajustes en `core/memory/index.ts/js` para combinar resultados short + long.
- Pruebas manuales: ejecución de `node scripts/verify-local-memory.mjs` muestra `Long memory > 0` tras guardar registros.

## References

- Scripts relevantes: `core/memtech-agent/memory-adapter.js`, `core/memory/index.{ts,js}`.
- Validación: `scripts/verify-local-memory.mjs` (actualizado en la misma jornada).
