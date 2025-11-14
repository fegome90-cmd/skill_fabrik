# Integración API Skills-Fabrik (Puerto 3003)

## Estado de la Conexión

**Fecha:** 2025-01-27  
**Puerto:** 3003  
**Status:** ⚠️ Servidor no disponible actualmente

## Endpoints Documentados

### Base URL
```
http://localhost:3003/api/v1
```

### Endpoints Disponibles

#### 1. Health Check
```bash
GET /api/v1/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-27T19:42:05Z"
  }
}
```

#### 2. Skills Analysis
```bash
POST /api/v1/skills/analyze/prompt
```

**Request:**
```json
{
  "prompt": "crear API REST con autenticación",
  "context": {
    "role": "backend-developer"
  }
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": "backend-dev-guidelines",
        "confidence": 0.85,
        "reasons": ["keyword match", "intent match"]
      }
    ],
    "scores": {},
    "metadata": {}
  }
}
```

#### 3. Enhanced Prompt Builder v2.0
```bash
POST /api/v1/wizard-working/sessions/enhanced-batch-working
```

**Request:**
```json
{
  "wizard": {
    "objective": "crear API REST con autenticación",
    "role": "Backend Developer",
    "directive": "implementar endpoints seguros",
    "framework": "Node.js + Express",
    "guardrails": "OWASP compliance"
  },
  "generation": {
    "provider": "glm",
    "model": "glm-4"
  },
  "skillOptimization": true
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "prompt": "Prompt optimizado con TAGs...",
    "tags": ["[K]", "[C]", "[U]", "[EVIDENCIA]", "[PROPUESTA]"],
    "metrics": {
      "expected_score": 0.3,
      "tags_coverage": 80,
      "template_coverage": 100
    },
    "skills": ["backend-dev-guidelines", "security-testing"]
  }
}
```

## Cliente Creado

**Archivo:** `scripts/skills-fabrik-api-client.py`

### Características

- ✅ Health check del servidor
- ✅ Análisis de skills en prompts
- ✅ Generación de prompts optimizados con Enhanced Prompt Builder v2.0
- ✅ Manejo de errores robusto
- ✅ Ejemplo de uso incluido

### Uso

```bash
# Ejecutar cliente de prueba
python scripts/skills-fabrik-api-client.py

# O usar como módulo
python -c "
from scripts.skills_fabrik_api_client import SkillsFabrikAPIClient
client = SkillsFabrikAPIClient()
health = client.health_check()
print(health)
"
```

## Integración con Skills Fabric

### Ejemplo de Integración en Router

```typescript
// packages/router/src/pre-invoke.ts
import { SkillsFabrikAPIClient } from './skills-fabrik-api-integration.js';

export async function userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput> {
  // ... código existente ...
  
  // Usar API de Skills-Fabrik para análisis mejorado
  if (process.env.SKILLS_FABRIK_API_ENABLED === 'true') {
    try {
      const apiClient = new SkillsFabrikAPIClient();
      if (await apiClient.isAvailable()) {
        const analysis = await apiClient.analyzeSkills(input.prompt, {
          role: 'backend-developer',
          open_files: input.openFiles
        });
        
        // Combinar resultados con matching local
        if (analysis.success && analysis.data?.skills) {
          // Mejorar scores con análisis de la API
        }
      }
    } catch {
      // Silently fail - API es opcional
    }
  }
  
  return output;
}
```

### Ejemplo de Integración para Prompt Builder

```typescript
// packages/router/src/prompt-builder.ts
import { SkillsFabrikAPIClient } from './skills-fabrik-api-integration.js';

export async function buildEnhancedPrompt(
  objective: string,
  context: any
): Promise<string> {
  const apiClient = new SkillsFabrikAPIClient();
  
  if (await apiClient.isAvailable()) {
    const result = await apiClient.enhancedPromptBuilder(
      objective,
      context.role || 'Developer',
      context.directive,
      context.framework,
      context.guardrails
    );
    
    if (result.success) {
      return result.data.prompt;
    }
  }
  
  // Fallback a generación local
  return buildPromptLocally(objective, context);
}
```

## Configuración

### Variables de Entorno

```bash
# Habilitar/deshabilitar API Skills-Fabrik (default: disabled)
export SKILLS_FABRIK_API_ENABLED="true"

# URL del servidor
export SKILLS_FABRIK_API_URL="http://localhost:3003"

# Timeout para operaciones (ms)
export SKILLS_FABRIK_API_TIMEOUT="10000"
```

## Troubleshooting

### Error: "Connection refused"
- Verificar que el servidor esté corriendo en puerto 3003
- Verificar firewall/red

### Error: "Empty reply from server"
- El servidor puede estar iniciando
- Esperar unos segundos y reintentar

### Servidor No Encontrado
- El servicio puede estar en otro repositorio
- Verificar documentación del proyecto
- Buscar scripts de inicio del servicio

## Próximos Pasos

1. **Localizar el servicio**
   - Buscar en otros repositorios
   - Revisar documentación del proyecto
   - Verificar scripts de inicio

2. **Iniciar el servidor**
   - Una vez localizado, seguir instrucciones de inicio
   - Verificar que corra en puerto 3003

3. **Probar la conexión**
   ```bash
   python scripts/skills-fabrik-api-client.py
   ```

4. **Integrar en Skills Fabric**
   - Agregar integración en hooks si es necesario
   - Configurar variables de entorno
   - Probar end-to-end

---

**Cliente listo para usar cuando el servidor esté disponible** 🚀

