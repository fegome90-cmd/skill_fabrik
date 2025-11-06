# Prompt Builder v2 – Notas para Devs

Estado: estable para CLI; integración con plan-check se limita por rutas relativas.

## Uso recomendado
- `skills prompt-builder <skill> "<desc>" --v2 --include-template --include-tags --show-score`
- Aumenta activación real con `--include-files` (por defecto: ON) y `--include-content` (ON).

## Limitaciones actuales
- Plan-check: import dinámico busca `packages/router/src/utils/plan-check.js`.
  - Si no existe el build JS contiguo, cae a fallback (sin plan).
  - Mitigación: mover plan-check a shared o importar desde `@skills-fabrik/router/dist/...`.
- Auditoría 4D agregada por defecto al prompt final.
  - Mitigación: se propone `--raw/--no-audit` (por agregar) para texto limpio.

## Validación manual
- Sugerencias del builder pueden validarse con:
```
skills-cli skills activate --intent "<desc>" --json
```
- Si el expectedScore < 0.6, usar `--include-template` y revisar archivos sugeridos.

## Próximos pasos (planeado)
- Flag `--raw` y `--no-audit`.
- Reutilizar `computeSignals` shared para mantener paridad con daemon.
