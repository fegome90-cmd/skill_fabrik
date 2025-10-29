---
id: secrets-and-config
version: 0.1.0
type: guardrail
enforcement: require
summary: Impedir secretos en código; exigir `.env` saneado y validación de config.
resources:
  - resources/.env.example
---

## Reglas

- Nunca credenciales embebidas en código o JSON de config.

- Validar variables requeridas en arranque (schema config).

- `.env.example` debe reflejar todas las claves utilizadas.

## Checklist

- [ ] Ningún secreto hardcodeado.
- [ ] Validación de config en boot.
- [ ] `.env.example` actualizado.
