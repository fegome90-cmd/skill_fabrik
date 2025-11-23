# Ejemplos de Integración MemTech con Skills Fabric

## Integración en Pre-invoke Hook

### Guardar contexto de activación de skills

```typescript
// packages/router/src/pre-invoke.ts
import { storeSkillActivationContext } from './memtech-integration.js';

export async function userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput> {
  // ... código existente de activación ...
  
  const output = matchRulesFor(input, rules, threshold);
  
  // Guardar contexto en MemTech (no bloqueante)
  if (output.activated && output.activated.length > 0) {
    for (const skillId of output.activated) {
      const score = output.metadata?.scores?.[skillId] || 0;
      await storeSkillActivationContext(
        skillId,
        input.prompt,
        score,
        {
          open_files: input.openFiles,
          active_file: input.activeFile,
          cwd: input.cwd,
        }
      );
    }
  }
  
  return output;
}
```

### Recuperar contexto relevante antes de activar

```typescript
import { getMemTechIntegration } from './memtech-integration.js';

export async function userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput> {
  // Buscar contexto relevante en MemTech
  const memtech = getMemTechIntegration();
  if (await memtech.isAvailable()) {
    const relevantContext = await memtech.getRelevantContext(input.prompt, 3);
    
    // Inyectar contexto relevante si existe
    if (relevantContext.length > 0) {
      const contextNote = `📚 CONTEXTO RELEVANTE:\n${relevantContext.join('\n\n')}`;
      // Agregar al injectedNote si hay activaciones
    }
  }
  
  // ... resto del código ...
}
```

## Integración en Stop Hook

### Guardar resultados del pipeline de calidad

```typescript
// packages/router/src/stop.ts
import { storeHookContext } from './memtech-integration.js';

export async function stopHook(input: StopHookInput): Promise<StopHookOutput> {
  // ... ejecutar pipeline completo ...
  
  const output = {
    formatted,
    typecheck,
    hints,
    autoResolved,
    kpiEvent,
  };
  
  // Guardar contexto del hook (no bloqueante)
  await storeHookContext(
    'stop',
    {
      editLog: input.editLog,
      reposChanged: Array.from(input.reposChanged),
    },
    output,
    {
      total_errors: typecheck.reduce((sum, r) => sum + Math.max(0, r.errors), 0),
      formatted_count: formatted.length,
      auto_resolved: autoResolved,
    }
  );
  
  return output;
}
```

## Integración en Daemon

### Guardar eventos de ejecución

```typescript
// packages/daemon/src/skills.ts
import { getMemTechIntegration } from '@skills-fabrik/router/memtech-integration';

async function executeSkill(skillId: string, input: any) {
  // ... ejecutar skill ...
  
  const result = await executeSkillLogic(skillId, input);
  
  // Guardar evento en MemTech
  const memtech = getMemTechIntegration();
  if (await memtech.isAvailable()) {
    await memtech.storeMemory({
      content: `Skill "${skillId}" executed successfully`,
      tags: ['skill-execution', skillId, 'daemon'],
      metadata: {
        skill_id: skillId,
        execution_time: result.duration,
        success: result.success,
        timestamp: new Date().toISOString(),
      },
    });
  }
  
  return result;
}
```

## Integración en CLI

### Guardar preferencias del usuario

```typescript
// packages/skills-cli/src/commands/skills.ts
import { getMemTechIntegration } from '@skills-fabrik/router/memtech-integration';

export async function skillsCheckCommand(prompt: string, options: any) {
  // ... verificar skills ...
  
  const results = await checkSkills(prompt, options);
  
  // Guardar preferencias si el usuario acepta resultados
  if (options.savePreferences) {
    const memtech = getMemTechIntegration();
    if (await memtech.isAvailable()) {
      await memtech.storeMemory({
        content: `User preference: ${prompt} → ${results.activated.join(', ')}`,
        tags: ['user-preference', 'skills-fabrik'],
        metadata: {
          prompt,
          activated_skills: results.activated,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
  
  return results;
}
```

## Uso Avanzado: Contexto Persistente

### Crear un módulo de contexto persistente

```typescript
// packages/router/src/context-manager.ts
import { getMemTechIntegration } from './memtech-integration.js';

export class ContextManager {
  private memtech = getMemTechIntegration();
  
  /**
   * Guardar contexto completo de una sesión
   */
  async saveSessionContext(sessionId: string, context: {
    prompts: string[];
    activatedSkills: string[];
    filesEdited: string[];
    errors: number;
    duration: number;
  }): Promise<void> {
    await this.memtech.storeMemory({
      content: `Session ${sessionId}: ${context.prompts.length} prompts, ${context.activatedSkills.length} skills activated`,
      tags: ['session', sessionId, 'skills-fabrik'],
      metadata: {
        session_id: sessionId,
        ...context,
        timestamp: new Date().toISOString(),
      },
    });
  }
  
  /**
   * Recuperar contexto de sesiones anteriores
   */
  async getSessionContext(sessionId: string): Promise<any[]> {
    const results = await this.memtech.searchMemories(
      undefined,
      ['session', sessionId],
      10
    );
    return results.memories;
  }
  
  /**
   * Buscar patrones similares
   */
  async findSimilarContexts(prompt: string, limit: number = 5): Promise<any[]> {
    const results = await this.memtech.searchMemories(prompt, ['skills-fabrik'], limit);
    return results.memories.map(m => ({
      content: m.content,
      metadata: m.metadata,
      similarity: this.calculateSimilarity(prompt, m.content),
    }));
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    // Implementar algoritmo de similitud simple
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
}
```

## Configuración

### Variables de entorno

```bash
# MemTech Universal API
export MEMTECH_API_URL="http://localhost:8080"
export MEMTECH_API_KEY="your_api_key_here"

# Habilitar integración MemTech (opcional, default: true)
export MEMTECH_ENABLED="true"

# Timeout para operaciones MemTech (ms)
export MEMTECH_TIMEOUT="5000"
```

### Configuración en hooks-config.json

```json
{
  "memtech": {
    "enabled": true,
    "storeActivations": true,
    "storeHookContext": true,
    "retrieveContext": true,
    "maxContextMemories": 5
  }
}
```

## Testing

### Test de integración

```typescript
// packages/router/src/__tests__/memtech-integration.spec.ts
import { describe, it, expect } from '@jest/globals';
import { getMemTechIntegration } from '../memtech-integration.js';

describe('MemTech Integration', () => {
  it('should check server availability', async () => {
    const memtech = getMemTechIntegration();
    const available = await memtech.isAvailable();
    expect(typeof available).toBe('boolean');
  });
  
  it('should store skill activation context', async () => {
    const memtech = getMemTechIntegration();
    if (await memtech.isAvailable()) {
      const result = await memtech.storeSkillActivation(
        'test-skill',
        'test prompt',
        0.8,
        { test: true }
      );
      expect(result).toBeDefined();
    }
  });
  
  it('should search memories', async () => {
    const memtech = getMemTechIntegration();
    if (await memtech.isAvailable()) {
      const results = await memtech.searchMemories('test', ['test'], 5);
      expect(results).toHaveProperty('memories');
      expect(Array.isArray(results.memories)).toBe(true);
    }
  });
});
```

## Troubleshooting

### Verificar conexión

```bash
# Verificar servidor
curl http://localhost:8080/health

# Verificar autenticación
python scripts/memtech-client.py

# Verificar almacenamiento
python -c "
from scripts.memtech_client import MemTechClient
client = MemTechClient()
client.authenticate()
result = client.store('Test memory', tags=['test'])
print(result)
"
```

### Logs de depuración

```typescript
// Habilitar logs detallados
process.env.DEBUG = 'memtech:*';

// O en el código
import { getMemTechIntegration } from './memtech-integration.js';

const memtech = getMemTechIntegration();
const available = await memtech.isAvailable();
console.log('MemTech available:', available);
```

## Mejores Prácticas

1. **No bloquear**: Todas las operaciones MemTech deben ser no bloqueantes
2. **Fallback graceful**: Si MemTech no está disponible, continuar sin errores
3. **Rate limiting**: No almacenar cada evento, solo los importantes
4. **Tags consistentes**: Usar tags consistentes para facilitar búsquedas
5. **Metadata estructurada**: Incluir metadata útil para filtrado y análisis

