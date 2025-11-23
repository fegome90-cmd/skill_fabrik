# Prompt PBv2 · PM2 Ecosystem Review

## Objetivo

Validar que exista un único `ecosystem` oficial para Skills Core y que sus procesos (router, daemon) estén alineados con configuraciones documentadas.

## Instrucciones para Prompt Builder v2

- **Entrada**: Rutas de archivos pm2 (`scripts/pm2/*.cjs`), documentación de referencia (`docs/skills/DAEMON.md`, `docs/skills/ROUTER.md`).
- **Contexto clave**: Gobernanza de despliegue, puertos estándar, healthchecks.
- **Salidas esperadas**:
  - Inventario de archivos pm2 con estado (`oficial`, `sospechoso`, `legacy`).
  - Validación de procesos registrados (nombres, scripts, watch, env).
  - Lista de discrepancias y recomendaciones.
- **Validación**:
  - Confirmar que solo exista un archivo etiquetado como oficial.
  - Verificar que los puertos y comandos coinciden con los contratos.

## Checklist

- [ ] Registrar hallazgos en `hallazgos.json`.
- [ ] Actualizar `acciones.md` con pasos de consolidación si se detectan duplicados.
- [ ] Documentar conclusiones en `skills-core-inventario.md`.
