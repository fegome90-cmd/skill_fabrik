# Prompt PBv2 · Contract Consistency

## Objetivo

Comparar contratos oficiales (`docs/skills/*.md`) con artefactos operativos (router, daemon, SKILL.md) y reportar desviaciones.

## Instrucciones para Prompt Builder v2

- **Entrada**: Contrato objetivo, lista de archivos vinculados, reglas clave.
- **Contexto clave**: Política de single source of truth, hipótesis de auditoría H1 y H2.
- **Salidas esperadas**:
  - Matriz de cumplimiento por dominio (`ok`, `observación`, `riesgo`).
  - Detalle de campos faltantes o divergentes.
  - Recomendaciones de consolidación.
- **Validación**:
  - Confirmar que cada dominio cuenta con un contrato referenciado.
  - Señalar explícitamente cuando no se encuentra documento oficial.

## Checklist

- [ ] Actualizar `hallazgos.json` con cualquier riesgo.
- [ ] Notificar al owner correspondiente en `acciones.md`.
- [ ] Registrar evidencias y capturas relevantes.
