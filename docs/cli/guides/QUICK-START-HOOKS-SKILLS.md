# 🚀 Instrucciones Rápidas: Activar Hooks y Skills vía CLI

## ✅ Estado Actual

Los hooks y skills están funcionando correctamente. Aquí están las instrucciones para probarlos:

---

## 📝 Instrucciones Paso a Paso

### 1️⃣ Instalar Hooks (Ya ejecutado ✅)

```bash
node packages/skills-cli/dist/index.js hooks --verbose
```

**Resultado esperado:**
```
✅ ✓ Installed: userPromptSubmit
✅ ✓ Installed: stop
✅ Configuration saved: .cursor/hooks/hooks-config.json
```

**Verificar instalación:**
```bash
ls -la .cursor/hooks/
# Deberías ver:
# - userPromptSubmit.mjs
# - stop.mjs
# - hooks-config.json
```

---

### 2️⃣ Probar Activación de Skills

#### Opción A: Comando básico

```bash
node packages/skills-cli/dist/index.js skills check "crear API REST con autenticación"
```

#### Opción B: Con Prompt Builder v2 (Recomendado)

```bash
node packages/skills-cli/dist/index.js skills check "crear API REST con autenticación" --v2 --verbose
```

**Resultado esperado:**
```
✅ Found 1 matching skill(s):
  ✓ backend-dev-guidelines (80.0%)

🔍 Enhanced analysis with Prompt Builder v2:
  📊 Expected score: 0.1
  🏷️  TAGs coverage: 20%
  🔗 Template coverage: 100%
  ⚡ Skill activations: api-design-and-testing, ci-cd-pipelines
```

#### Opción C: Con archivos abiertos (simula contexto del editor)

```bash
node packages/skills-cli/dist/index.js skills check "crear endpoint usuarios" \
  --open-files packages/router/src/index.ts \
  --v2 \
  --verbose
```

---

### 3️⃣ Más Ejemplos de Prueba

```bash
# Backend
node packages/skills-cli/dist/index.js skills check "implementar autenticación JWT" --v2

# Frontend
node packages/skills-cli/dist/index.js skills check "crear componente React con estado" --v2

# Database
node packages/skills-cli/dist/index.js skills check "crear migración de base de datos" --v2

# Security
node packages/skills-cli/dist/index.js skills check "validar input contra SQL injection" --v2
```

---

### 4️⃣ Activar Skills vía Daemon (Opcional)

Si el daemon está corriendo en el puerto 7727:

```bash
# Verificar que el daemon está corriendo
curl http://127.0.0.1:7727/health

# Activar skills vía daemon
node packages/skills-cli/dist/index.js skills activate --intent "crear API REST"

# Con salida JSON
node packages/skills-cli/dist/index.js skills activate --intent "crear API REST" --json
```

---

### 5️⃣ Probar Hooks Manualmente

#### Probar userPromptSubmit hook:

```bash
node .cursor/hooks/userPromptSubmit.mjs "crear endpoint backend" '["packages/router/src/index.ts"]'
```

#### Probar stop hook:

```bash
# Primero hacer algunos cambios en archivos
# Luego ejecutar:
node .cursor/hooks/stop.mjs
```

---

## 🔍 Comandos Útiles Adicionales

### Validar Skills

```bash
# Validar todos los skills
node packages/skills-cli/dist/index.js skills lint ./skills

# Con strict mode
node packages/skills-cli/dist/index.js skills lint ./skills --strict
```

### Regenerar Índice

```bash
# Si los skills no se activan, regenerar el índice
node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json
```

### Ver Help de Comandos

```bash
# Help general
node packages/skills-cli/dist/index.js --help

# Help de hooks
node packages/skills-cli/dist/index.js hooks --help

# Help de skills
node packages/skills-cli/dist/index.js skills --help
```

---

## 📊 Resultados de la Prueba Actual

✅ **Hooks instalados correctamente:**
- `userPromptSubmit` ✓
- `stop` ✓

✅ **Skills activándose correctamente:**
- `backend-dev-guidelines` se activa con "crear API REST" (80% match)
- Prompt Builder v2 funcionando
- TAGs y Template coverage aplicados

---

## 🎯 Próximos Pasos

1. **Usar en Cursor**: Los hooks se ejecutarán automáticamente cuando uses Cursor
2. **Probar más prompts**: Experimenta con diferentes tipos de prompts
3. **Ajustar threshold**: Usa `--threshold` para cambiar el umbral de activación
4. **Ver detalles**: Usa `--verbose` para ver información completa

---

## 📚 Documentación Completa

Ver `docs/CLI-HOOKS-SKILLS-GUIDE.md` para documentación detallada.

---

**¡Listo para usar!** 🚀

