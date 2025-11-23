# Guía: Activar Hooks y Skills vía CLI

## 📋 Resumen

Esta guía te muestra cómo activar y probar los hooks y skills usando el CLI de Skills Fabric.

---

## 🎯 1. Activar Hooks

### Instalar Hooks en Cursor

Los hooks se instalan en `.cursor/hooks/` y se activan automáticamente cuando usas Cursor.

```bash
# Instalar todos los hooks configurados
node packages/skills-cli/dist/index.js hooks

# Instalar hook específico
node packages/skills-cli/dist/index.js hooks --hook-name userPromptSubmit
node packages/skills-cli/dist/index.js hooks --hook-name stop

# Con verbose para ver detalles
node packages/skills-cli/dist/index.js hooks --verbose
```

### Hooks Disponibles

1. **userPromptSubmit** - Se ejecuta antes de enviar el prompt al modelo
   - Activa skills automáticamente basado en el prompt
   - Inyecta notas si skills son activados
   - Ubicación: `.cursor/hooks/userPromptSubmit.mjs`

2. **stop** - Se ejecuta después de recibir la respuesta
   - Ejecuta quality gates (prettier, typecheck, guardrails)
   - Emite KPIs
   - Ubicación: `.cursor/hooks/stop.mjs`

### Verificar Hooks Instalados

```bash
# Verificar que los hooks están instalados
ls -la .cursor/hooks/

# Deberías ver:
# - userPromptSubmit.mjs
# - stop.mjs
# - hooks-config.json
```

---

## 🔍 2. Activar Skills vía CLI

### Comando: `skills check`

Este comando simula la activación de skills como lo haría el hook `userPromptSubmit`.

```bash
# Básico - Verificar qué skills se activarían
node packages/skills-cli/dist/index.js skills check "crear endpoint backend"

# Con archivos abiertos (simula contexto del editor)
node packages/skills-cli/dist/index.js skills check "crear endpoint backend" --open-files packages/router/src/index.ts

# Con verbose para ver detalles completos
node packages/skills-cli/dist/index.js skills check "crear endpoint backend" --verbose

# Con Prompt Builder v2 (recomendado)
node packages/skills-cli/dist/index.js skills check "crear endpoint backend" --v2

# Con v2 y verbose para análisis completo
node packages/skills-cli/dist/index.js skills check "crear endpoint backend" --v2 --verbose
```

### Ejemplos de Pruebas

```bash
# Backend development
node packages/skills-cli/dist/index.js skills check "crear API REST con autenticación JWT" --v2

# Frontend development
node packages/skills-cli/dist/index.js skills check "crear componente React con estado" --v2

# Database operations
node packages/skills-cli/dist/index.js skills check "crear migración de base de datos" --v2

# Security
node packages/skills-cli/dist/index.js skills check "validar input contra SQL injection" --v2
```

### Comando: `skills activate`

Este comando usa el daemon para activar skills (requiere que el daemon esté corriendo).

```bash
# Activar skills vía daemon
node packages/skills-cli/dist/index.js skills activate --intent "crear endpoint backend"

# Con threshold personalizado
node packages/skills-cli/dist/index.js skills activate --intent "crear endpoint backend" --threshold 0.5

# Con salida JSON
node packages/skills-cli/dist/index.js skills activate --intent "crear endpoint backend" --json

# Especificar daemon URL
node packages/skills-cli/dist/index.js skills activate --intent "crear endpoint backend" --daemon http://localhost:7727
```

---

## 🧪 3. Prueba Completa: Hooks + Skills

### Paso 1: Asegurar que el Router está construido

```bash
# Construir el router (necesario para los hooks)
pnpm --filter @skills-fabrik/router build
```

### Paso 2: Instalar Hooks

```bash
node packages/skills-cli/dist/index.js hooks --verbose
```

### Paso 3: Probar Activación de Skills

```bash
# Probar con diferentes prompts
node packages/skills-cli/dist/index.js skills check "implementar autenticación" --v2 --verbose

# Probar con contexto de archivos
node packages/skills-cli/dist/index.js skills check "crear componente" --open-files packages/router/src/index.ts --v2
```

### Paso 4: Verificar que los Hooks Funcionan

Los hooks se ejecutan automáticamente en Cursor cuando:
- **userPromptSubmit**: Envías un prompt en Cursor
- **stop**: Recibes una respuesta del modelo

Para probar manualmente los hooks:

```bash
# Probar userPromptSubmit hook manualmente
node .cursor/hooks/userPromptSubmit.mjs "crear endpoint backend" '["packages/router/src/index.ts"]'

# Probar stop hook manualmente (después de hacer cambios)
node .cursor/hooks/stop.mjs
```

---

## 📊 4. Ver Resultados Detallados

### Con `--verbose`

```bash
node packages/skills-cli/dist/index.js skills check "crear API REST" --v2 --verbose
```

Esto muestra:
- Skills activados
- Scores de cada skill
- Razones de activación
- Metadata completa
- Métricas de calidad

### Con `--json` (para activate)

```bash
node packages/skills-cli/dist/index.js skills activate --intent "crear API REST" --json
```

---

## 🔧 5. Troubleshooting

### Los hooks no se ejecutan

1. Verificar que están instalados:
```bash
ls -la .cursor/hooks/
```

2. Verificar permisos:
```bash
chmod +x .cursor/hooks/*.mjs
```

3. Verificar configuración:
```bash
cat .cursor/hooks/hooks-config.json
```

### Skills no se activan

1. Verificar que el índice existe:
```bash
ls -la registry/index.json
```

2. Regenerar índice si es necesario:
```bash
node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json
```

3. Verificar skill-rules:
```bash
cat configs/skill-rules.json | head -50
```

### Router no está disponible

1. Construir el router:
```bash
pnpm --filter @skills-fabrik/router build
```

2. Verificar que el build fue exitoso:
```bash
ls -la packages/router/dist/index.js
```

---

## 📝 6. Comandos Útiles Adicionales

### Validar Skills

```bash
# Validar todos los skills
node packages/skills-cli/dist/index.js skills lint ./skills

# Con strict mode
node packages/skills-cli/dist/index.js skills lint ./skills --strict
```

### Indexar Skills

```bash
# Crear/actualizar índice
node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json
```

### Ver Reglas de Skills

```bash
# Generar skill-rules.json
node packages/skills-cli/dist/index.js skills rules
```

---

## 🎯 Ejemplo Completo de Prueba

```bash
# 1. Construir todo
pnpm -w build

# 2. Instalar hooks
node packages/skills-cli/dist/index.js hooks --verbose

# 3. Verificar hooks instalados
ls -la .cursor/hooks/

# 4. Probar activación de skills
node packages/skills-cli/dist/index.js skills check "crear API REST con autenticación JWT" --v2 --verbose

# 5. Probar con contexto
node packages/skills-cli/dist/index.js skills check "implementar endpoint usuarios" \
  --open-files packages/router/src/index.ts \
  --v2 \
  --verbose

# 6. Si el daemon está corriendo, probar activate
node packages/skills-cli/dist/index.js skills activate --intent "crear API REST" --json
```

---

## 📚 Referencias

- **Hooks**: `packages/skills-cli/src/commands/hooks.ts`
- **Skills Check**: `packages/skills-cli/src/commands/skills.ts` (línea 849+)
- **Router Hook**: `packages/router/src/pre-invoke.ts`
- **Documentación**: `CLAUDE.md` y `docs/skills/README.md`

