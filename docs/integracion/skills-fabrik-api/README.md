# Skills-Fabrik API - Integración

## 📚 Documentación

- **[SKILLS-FABRIK-API-INTEGRATION.md](SKILLS-FABRIK-API-INTEGRATION.md)** - Guía completa de integración
- **[PMV2-PROMPT-GENERATOR.md](PMV2-PROMPT-GENERATOR.md)** - Generador de prompts PMv2 usando la API

## 🔧 Scripts

- **Cliente API**: `scripts/integration/skills-fabrik-api-client.py`
- **Generador PMv2**: `scripts/integration/generate-pmv2-prompt.py`

## 🚀 Uso Rápido

### Generar Prompt PMv2

```bash
python3 scripts/integration/generate-pmv2-prompt.py \
  "Crear API REST con autenticación JWT" \
  "Backend Developer" \
  "implementar endpoints seguros" \
  "Node.js + Express" \
  "OWASP compliance"
```

### Cliente API

```bash
python3 scripts/integration/skills-fabrik-api-client.py
```

## 📊 Estado

- ✅ Cliente Python implementado
- ✅ Generador PMv2 implementado
- ❌ Servidor no disponible en puerto 3003 (requiere iniciar servicio)

## 🔧 Requisitos

El servicio debe estar corriendo en `http://localhost:3003/api/v1`

Para iniciar:
```bash
cd /Users/felipe/Developer/startkit-main/zen-mcp-agents-hub
npm start
```

