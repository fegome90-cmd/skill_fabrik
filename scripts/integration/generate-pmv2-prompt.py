#!/usr/bin/env python3
"""
Script para generar un prompt PMv2 usando la API de Skills-Fabrik (puerto 3003)

REQUISITO: El servicio debe estar corriendo en http://localhost:3003/api/v1

Para iniciar el servicio:
  cd /Users/felipe/Developer/startkit-main/zen-mcp-agents-hub
  npm start
"""

import requests
import json
import sys
from datetime import datetime

# Configuración
API_BASE_URL = "http://localhost:3003/api/v1"
TIMEOUT = 5

def generate_pmv2_via_api(objective, role="Backend Developer", directive="implementar solución", framework="Node.js + Express", guardrails="OWASP compliance"):
    """Intenta generar un prompt PMv2 usando la API"""
    try:
        payload = {
            "wizard": {
                "objective": objective,
                "role": role,
                "directive": directive,
                "framework": framework,
                "guardrails": guardrails
            },
            "generation": {
                "provider": "glm",
                "model": "glm-4"
            },
            "skillOptimization": True
        }
        
        response = requests.post(
            f"{API_BASE_URL}/wizard-working/sessions/enhanced-batch-working",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        return None

def generate_pmv2_manual(objective, role="Backend Developer", directive="implementar solución", framework="Node.js + Express", guardrails="OWASP compliance"):
    """Genera un prompt PMv2 completo manualmente siguiendo Template v1.1.0"""
    
    # Template v1.1.0 - 8 Componentes
    prompt = f"""---
# Prompt Builder v2.0 - Template v1.1.0
# Generado: {timestamp}
# Objetivo: {objective}
---

# 🎯 PROMPT OPTIMIZADO - PMv2

## [C1] CSE_COMPLETO - Contexto del Sistema

**Sistema:** Skills Fabric - Desarrollo Agéntico con CLOOP
**Rol:** {role}
**Framework:** {framework}
**Guardrails:** {guardrails}
**Metodología:** CLOOP (Clarify, Layout, Operate, Observe, Reflect)

---

## [C2] TAGs_COBERTURA - Sistema de Tags

### [K:KNOWLEDGE] - Conocimiento Base
- Stack tecnológico: {framework}
- Patrones de arquitectura aplicables
- Mejores prácticas del dominio

### [C:CONTEXT] - Contexto Específico
- Objetivo: {objective}
- Directiva: {directive}
- Restricciones: {guardrails}

### [U:USAGE] - Uso y Workflow
- Metodología CLOOP aplicada
- Quality gates activos
- Integración con Skills Fabric

### [EVIDENCIA] - Referencias
- Documentación: `docs/arquitectura/ANALISIS-ARQUITECTURA-SKILLS-FABRIC.md`
- Skills activos: Verificar `configs/skill-rules.json`
- ADRs: `docs/adr/`

### [PROPUESTA] - Acción Propuesta
- {directive}
- Implementar siguiendo CLOOP
- Aplicar quality gates

---

## [C3] BOUNDARY_MARKERS - Delimitadores

### ✅ IN SCOPE
- Implementación de {objective}
- Aplicación de {framework}
- Cumplimiento de {guardrails}
- Integración con Skills Fabric

### ❌ OUT OF SCOPE
- Cambios en arquitectura core sin aprobación
- Modificaciones fuera del objetivo definido
- Bypass de quality gates

---

## [C4] FRONTMATTER_YAML - Metadatos

```yaml
prompt_version: "2.0"
template_version: "1.1.0"
objective: "{objective}"
role: "{role}"
framework: "{framework}"
guardrails: "{guardrails}"
complexity: "medium"
estimated_duration: "8h"
target_coverage: 80
skills_required:
  - backend-dev-guidelines
  - database-verification
tags:
  - [K:KNOWLEDGE]
  - [C:CONTEXT]
  - [U:USAGE]
  - [EVIDENCIA]
  - [PROPUESTA]
```

---

## [C5] ANTI_DRIFT - Prevención de Desviación

### Puntos de Control
1. **Clarify Phase**: Verificar que el objetivo esté claramente definido
2. **Layout Phase**: Validar arquitectura contra ADRs existentes
3. **Operate Phase**: Aplicar quality gates en cada commit
4. **Observe Phase**: Monitorear métricas y KPIs
5. **Reflect Phase**: Documentar aprendizajes

### Señales de Alerta
- Cambios fuera del scope definido
- Bypass de quality gates
- Modificaciones sin tests
- Violación de guardrails

---

## [C6] OBJETIVOS_SMART

### Specific (Específico)
{objective}

### Measurable (Medible)
- Cobertura de tests ≥80%
- Zero errors en lint/build
- Latency <500ms (si aplica)

### Achievable (Alcanzable)
- Framework: {framework}
- Recursos disponibles: Skills Fabric, Quality Gates
- Tiempo estimado: 8h

### Relevant (Relevante)
- Alineado con objetivos del proyecto
- Cumple guardrails: {guardrails}
- Integra con Skills Fabric

### Time-bound (Temporal)
- Fase Clarify: 1h
- Fase Layout: 2h
- Fase Operate: 4h
- Fase Observe: 30min
- Fase Reflect: 30min

---

## [C7] TESTS_EJECUTABLES - Casos de Test

### Unit Tests
```typescript
describe('{objective}', () => {{
  it('should meet requirements', () => {{
    // Test implementation
  }});
  
  it('should comply with guardrails', () => {{
    // Guardrail validation
  }});
}});
```

### Integration Tests
```typescript
describe('Integration: {objective}', () => {{
  it('should integrate with Skills Fabric', () => {{
    // Integration test
  }});
}});
```

### Quality Gates
- ✅ Build: `pnpm build`
- ✅ Lint: `pnpm lint`
- ✅ Tests: `pnpm test`
- ✅ Skills: `pnpm skills:lint --strict`

---

## [C8] SEPARACION_EVIDENCIA_PROPUESTA

### 📊 EVIDENCIA - Estado Actual

**Contexto:**
- Sistema: Skills Fabric
- Arquitectura: Multi-service (CLI → Router → Daemon)
- MemTech: Integrado (L0-L3)
- Quality Gates: G1-G8 activos

**Skills Disponibles:**
- backend-dev-guidelines
- database-verification
- api-design-and-testing
- security-testing-guide

**Métricas Actuales:**
- Latency: 466ms promedio
- Activation Rate: 93.5%
- Test Coverage: 100% (20/20 passing)

### 🚀 PROPUESTA - Acción a Tomar

**Objetivo:** {objective}

**Plan de Acción:**
1. **[Clarify]** Definir objetivos específicos y criterios de éxito
2. **[Layout]** Diseñar arquitectura y estructura siguiendo {framework}
3. **[Operate]** Implementar solución aplicando guardrails: {guardrails}
4. **[Observe]** Monitorear métricas y validar quality gates
5. **[Reflect]** Documentar aprendizajes y mejoras

**Entregables:**
- Código implementado
- Tests con cobertura ≥80%
- Documentación actualizada
- ADR si hay decisiones arquitectónicas

**Criterios de Éxito:**
- ✅ Todos los quality gates pasan
- ✅ Tests ejecutados y pasando
- ✅ Documentación actualizada
- ✅ Integración con Skills Fabric funcionando

---

## 📈 MÉTRICAS DE CALIDAD

### Score Esperado
- **Template Coverage:** 100% (8/8 componentes)
- **TAGs Coverage:** 60%+ (5 tags aplicados)
- **Expected Score:** 0.6-0.8

### Quality Metrics
- **Complejidad:** Media
- **Duración Estimada:** 8h
- **Innovation Level:** Alto
- **Target Coverage:** 80%

---

## 🎯 RESUMEN EJECUTIVO

**Prompt PMv2 generado para:**
- Objetivo: {objective}
- Rol: {role}
- Framework: {framework}
- Guardrails: {guardrails}

**Template v1.1.0 aplicado:** ✅ 8/8 componentes
**TAGs aplicados:** ✅ [K][C][U][EVIDENCIA][PROPUESTA]
**Metodología:** ✅ CLOOP completo
**Quality Gates:** ✅ G1-G8 activos

---

**Generado con Skills Fabric Prompt Builder v2.0**
**Template v1.1.0 - {timestamp}**
"""
    
    return {
        "success": True,
        "data": {
            "prompt": prompt,
            "metadata": {
                "template_version": "1.1.0",
                "components_applied": 8,
                "tags_applied": 5,
                "expected_score": 0.7,
                "generation_method": "manual",
                "timestamp": timestamp
            },
            "metrics": {
                "template_coverage": "100%",
                "tags_coverage": "60%+",
                "complexity": "medium",
                "estimated_duration": "8h"
            }
        }
    }

def main():
    """Función principal"""
    if len(sys.argv) < 2:
        objective = "Crear API REST con autenticación"
        print(f"⚠️  No se proporcionó objetivo, usando: '{objective}'")
    else:
        objective = sys.argv[1]
    
    role = sys.argv[2] if len(sys.argv) > 2 else "Backend Developer"
    directive = sys.argv[3] if len(sys.argv) > 3 else "implementar solución segura"
    framework = sys.argv[4] if len(sys.argv) > 4 else "Node.js + Express"
    guardrails = sys.argv[5] if len(sys.argv) > 5 else "OWASP compliance"
    
    print("🚀 Generando Prompt PMv2 usando API Skills-Fabrik...")
    print(f"📋 Objetivo: {objective}")
    print(f"👤 Rol: {role}")
    print()
    
    # Intentar usar API primero
    print("1️⃣ Conectando a API Skills-Fabrik (http://localhost:3003/api/v1)...")
    result = generate_pmv2_via_api(objective, role, directive, framework, guardrails)
    
    if result and result.get("success"):
        print("✅ Prompt generado exitosamente usando la API")
        print()
        print("=" * 80)
        
        # Extraer el prompt del resultado de la API
        if "data" in result:
            if "prompt" in result["data"]:
                print(result["data"]["prompt"])
            elif "result" in result["data"]:
                print(result["data"]["result"])
            else:
                print(json.dumps(result["data"], indent=2, ensure_ascii=False))
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        print("=" * 80)
        print()
        
        # Guardar en archivo
        output_file = f"prompts/pmv2-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"
        import os
        os.makedirs("prompts", exist_ok=True)
        
        prompt_content = ""
        if "data" in result:
            if "prompt" in result["data"]:
                prompt_content = result["data"]["prompt"]
            elif "result" in result["data"]:
                prompt_content = result["data"]["result"]
            else:
                prompt_content = json.dumps(result["data"], indent=2, ensure_ascii=False)
        else:
            prompt_content = json.dumps(result, indent=2, ensure_ascii=False)
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(prompt_content)
        print(f"💾 Prompt guardado en: {output_file}")
        
        # Mostrar métricas si están disponibles
        if "data" in result and "metrics" in result["data"]:
            print()
            print("📊 Métricas:")
            print(json.dumps(result["data"]["metrics"], indent=2, ensure_ascii=False))
    else:
        print("❌ Error: La API no está disponible")
        print()
        print("📝 Para iniciar el servicio:")
        print("   1. Ve al directorio: cd /Users/felipe/Developer/startkit-main/zen-mcp-agents-hub")
        print("   2. Inicia el servicio: npm start")
        print("   3. O en modo desarrollo: npm run dev")
        print()
        print("   El servicio debe estar corriendo en: http://localhost:3003")
        print()
        print("⚠️  No se puede generar el prompt sin la API.")
        sys.exit(1)

if __name__ == "__main__":
    main()

