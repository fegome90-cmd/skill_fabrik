---
id: secrets-and-config
version: 0.1.0
type: guardrail
enforcement: require
summary: Sin secretos embebidos; validar config en arranque y mantener .env.example.
audience: engineers
resources:
  - resources/.env.example
---

## Reglas

- Prohibido credenciales/API keys en código/config JSON.

- Validación de variables requeridas al boot.

- `.env.example` siempre actualizado.

## Checklist

- [ ] 0 secretos hardcodeados.
- [ ] Schema de config valida y falla temprano.
- [ ] .env.example reflejado.

## Ejemplos

### ❌ BLOQUEADO

```typescript
// ❌ Secrets hardcodeados
const API_KEY = 'sk_live_1234567890abcdef'; // BLOQUEADO
const DB_PASSWORD = 'super-secret-123'; // BLOQUEADO

// ❌ En config JSON
{
  "database": {
    "password": "secret123" // BLOQUEADO
  }
}
```

### ✅ PERMITIDO

```typescript
// ✅ Desde variables de entorno
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY is required');
}

// ✅ Validación con zod
const config = z
  .object({
    database: z.object({
      url: z.string().url(),
    }),
  })
  .parse(process.env);
```

## Recursos

Ver `resources/.env.example` para template completo.
