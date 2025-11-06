# Prompt Builder - Generador de Prompts Optimizados para Skills

**Basado en**: `/Users/felipe/Developer/startkit-main/cloop-research/metacognicion/playbook-bmcc/promptcreate.md`

---

## Concepto

Crear un generador de prompts que **automáticamente** incluya los elementos necesarios para activar skills según la heurística multi-señal:

- **Keywords** (20%): Incluir palabras clave relevantes
- **Intent Patterns** (30%): Usar frases que coincidan con patrones de intención
- **Path Patterns** (30%): Sugerir archivos en rutas que coincidan
- **Content Patterns** (20%): Incluir contenido que active content patterns

---

## Ejemplo de Uso

```bash
# Generar prompt para backend-dev-guidelines
prompt-builder backend-dev "crear endpoint de autenticación"

# Generar prompt para plan-architect
prompt-builder plan-architect "integración daemon SFP"

# Generar prompt multi-skill
prompt-builder multiple --skills backend-dev,frontend-dev "feature completa login"
```

---

## Estructura del Prompt Generado

El prompt generado seguirá la estructura de `promptcreate.md` pero **enriquecido** con:

1. **Keywords explícitas** al inicio: "backend, controller, service, API, endpoint..."
2. **Intent patterns** en la acción: "crear endpoint nuevo para..."
3. **Sugerencias de archivos**: "edita backend/src/controllers/AuthController.ts"
4. **Content snippets**: "router.post('/auth', ...)"

---

## Implementación Propuesta

### Opción A: CLI Tool `prompt-builder`

**Comando**:
```bash
prompt-builder <skill-id> "<descripción>" [opciones]
```

**Output**: Prompt optimizado que garantiza activación del skill

### Opción B: Skill Generator "prompt-optimizer"

**Skill ID**: `prompt-optimizer` (generator type)

**Funcionalidad**:
- Analiza skill-rules.json
- Genera prompt con todas las señales necesarias
- Valida score esperado ≥ 0.6

### Opción C: Hook Pre-Prompt

**Integración**: En pre-invoke hook, si score < 0.6, sugerir prompt mejorado

---

## Ejemplo Concreto

### Input del Usuario:
```
"necesito ayuda con autenticación"
```

### Prompt Optimizado Generado:
```
crear endpoint nuevo para autenticación de usuarios en backend

Archivos a editar:
- backend/src/controllers/AuthController.ts
- backend/src/services/AuthService.ts

Contenido esperado:
- router.post('/auth/login', AuthController.login);
- export class AuthController { ... }
```

**Score esperado**: 1.0 (Keywords 0.2 + Intent 0.3 + Path 0.3 + Content 0.2)

---

## Beneficios

1. **Activation Rate**: Aumenta probabilidad de activación de skills
2. **Claridad**: Usuario recibe prompt estructurado y claro
3. **Consistencia**: Mismo formato para todos los prompts
4. **Evolución**: Prompt se adapta cuando cambian las reglas

---

## Próximos Pasos

1. Implementar generador básico
2. Validar con tests que prompts generados activan skills
3. Integrar con CLI o hooks existentes

