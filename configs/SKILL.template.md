---
name: <skill-id>
description: <descripción orientada a acción, clara sobre cuándo usar y NO usar>
type: guideline|guardrail|workflow|analyst|generator
enforcement: suggest|require|block
version: 0.1.0
---

# Skill: <nombre-descriptivo>

## Objetivo

**Cuándo usar este skill**: [Describe escenarios específicos donde este skill es relevante]

**Cuándo NO usar este skill**: [Describe casos donde este skill no aplica o puede confundir]

**Qué problema resuelve**: [Explica qué necesidad cubre este skill]

## Procedimiento Mínimo

Sigue estos pasos cuando este skill esté activo:

1. **Paso 1**: [Descripción clara del primer paso]
2. **Paso 2**: [Descripción clara del segundo paso]
3. **Paso 3**: [Continuar según sea necesario]

**Nota**: Solo incluir pasos esenciales. Detalles adicionales en recursos on-demand.

## Checklist (Definition of Done)

Antes de considerar completa una tarea que usa este skill, verifica:

- [ ] Criterio 1: [Descripción clara]
- [ ] Criterio 2: [Descripción clara]
- [ ] Criterio 3: [Continuar según sea necesario]

## Scripts Reales

Este skill utiliza scripts ejecutables reales del proyecto:

- `pnpm -C <service> test` - Ejecutar tests del servicio
- `node scripts/test-auth-route.js <url>` - Probar ruta autenticada
- `tsc --noEmit` - Verificar tipos sin compilar

**Importante**: Estos scripts existen realmente en el repositorio. NO simular ni inventar comandos.

## Ejemplos Mínimos

### ✅ Correcto

```typescript
// Ejemplo de código que sigue la guía
export class UserController {
  async getById(id: string) {
    // Implementación correcta
  }
}
```

### ❌ Incorrecto

```typescript
// Ejemplo de código que viola la guía
export class UserController {
  getById(id: string) {
    // Implementación incorrecta - falta async, manejo de errores, etc.
  }
}
```

## Recursos Adicionales

Para más detalles, consulta estos recursos (se cargan on-demand):

- `./resources/reference.md` - Referencias técnicas detalladas
- `./resources/examples.md` - Ejemplos avanzados
- `./resources/checklist.md` - Checklist extendido
- `./scripts/validate.sh` - Script de validación

---

**Nota sobre Divulgación Progresiva**:

- Solo los metadatos (name, description) se cargan inicialmente
- El cuerpo de este SKILL.md se carga cuando hay match fuerte
- Los recursos se cargan solo cuando son referenciados explícitamente
