# 🚀 Cómo Ejecutar la Tarea de Prueba

## Tarea: Sistema de Autenticación JWT Completo

Esta tarea demuestra la integración completa entre Claude Agent SDK y Prompt Builder v2.

---

## 📋 La Tarea

**Objetivo:** Crear un sistema completo de autenticación JWT que incluye:
- Registro y login de usuarios
- Tokens JWT de acceso y refresh
- Hashing de contraseñas con bcrypt
- Integración con base de datos PostgreSQL
- Middleware para protección de rutas
- Rate limiting para seguridad

**Skills activados:**
- `backend-architecture-patterns`
- `security-patterns`
- `database-verification`

---

## ⚡ Ejecución Inmediata (3 pasos)

### Paso 1: Verificar dependencias

```bash
# Desde el directorio raíz del proyecto
cd /Users/felipe/Developer/skills-fabrik

# Verificar que skills-cli está disponible
npm list @skills-fabrik/skills-cli
```

### Paso 2: Ejecutar la tarea

```bash
# Opción A: Ejecutar directamente con Node
node --loader ts-node/esm mcp-prompt-builder/TEST-TASK.ts

# Opción B: Con TypeScript compilado
cd mcp-prompt-builder
npx tsc TEST-TASK.ts --outDir . --target ES2022 --module ES2022
node TEST-TASK.js

# Opción C: Copiar y pegar en script
cp TEST-TASK.ts test-my-integration.ts
node test-my-integration.ts
```

### Paso 3: Ver resultados

Deberías ver una salida similar a:

```
🚀 Testing Prompt Builder v2 Integration

======================================================================
Task: Complete JWT Authentication System
======================================================================

📡 Calling Prompt Builder v2...

✅ SUCCESS! Prompt Builder v2 Response:

----------------------------------------------------------------------
📋 OPTIMIZED PROMPT
----------------------------------------------------------------------
C1: CSE_Completo ✅
Create complete JWT authentication system with user registration, login,
JWT access tokens, refresh token rotation, password hashing, PostgreSQL
database integration, authentication middleware, and rate limiting...

C2: TAGs_Cobertura ✅ (6 tags)

🔗 Relevant files to open/edit:
- backend/src/auth/AuthController.ts
- backend/src/auth/JwtService.ts
- backend/src/auth/RefreshTokenService.ts
- backend/src/middleware/auth.middleware.ts
- backend/src/models/User.ts
- backend/src/repositories/UserRepository.ts

Template v1.1.0 applied (8/8 components)

----------------------------------------------------------------------
📊 METRICS & ANALYSIS
----------------------------------------------------------------------
Expected Score: 0.95/1.0 (95%)

🎯 Activated Skills:
  • backend-architecture-patterns (95%)
    - backend patterns matched
    - architecture keywords found
  • security-patterns (88%)
    - JWT authentication
    - security keywords found
  • database-verification (82%)
    - database integration
    - persistence patterns

🏷️  Contextual TAGs:
  • [K:SECURITY-PATTERNS]
  • [C:CONFIGURATION-MANAGEMENT]
  • [U:DEVELOPER-WORKFLOW]
  • [K:DATABASE-OPERATIONS]
  • [C:AUTHENTICATION-SYSTEM]
  • [C:TOKEN-MANAGEMENT]

📈 Coverage Metrics:
  • TAGs Coverage: 90%
  • Template Score: 100%

----------------------------------------------------------------------
📁 Relevant Files Detected:
----------------------------------------------------------------------
  • backend/src/auth/AuthController.ts
  • backend/src/auth/JwtService.ts
  • backend/src/middleware/auth.middleware.ts

----------------------------------------------------------------------
💡 RECOMMENDATIONS
----------------------------------------------------------------------
1. High confidence prompt - ready to use
2. Include authentication middleware for production
3. Use connection pooling for database operations
4. Implement JWT with short-lived access tokens
5. Use refresh token rotation for security
6. Include password hashing library (bcrypt/argon2)
7. Add rate limiting to prevent brute force attacks
8. Implement refresh token rotation
9. Include audit logging for authentication events
10. Set appropriate JWT expiration times
11. Add input validation and sanitization

======================================================================
✅ TEST COMPLETED SUCCESSFULLY!
======================================================================

🎯 Performance Notes:
  • Template v1.1.0 applied automatically
  • Multiple skills activated
  • Contextual TAGs generated
  • Smart file detection enabled
  • Production-ready output
```

---

## 🔧 Solución de Problemas

### Error: Module not found

```bash
# Instalar dependencias si no están
npm install @skills-fabrik/skills-cli

# O usar pnpm si es un monorepo
pnpm install @skills-fabrik/skills-cli
```

### Error: Cannot find package

```bash
# Verificar que estás en el directorio correcto
cd /Users/felipe/Developer/skills-fabrik

# Verificar que skills-cli existe
ls packages/skills-cli/
```

### Error: SyntaxError

```bash
# Usar ts-node para TypeScript
npx ts-node mcp-prompt-builder/TEST-TASK.ts

# O compilar primero
cd mcp-prompt-builder
npm run build
node TEST-TASK.js
```

### Error: No se ejecuta la tarea

```bash
# Verificar Node.js version
node --version
# Debe ser >= 18

# Ejecutar con explicit loader
node --loader ts-node/esm mcp-prompt-builder/TEST-TASK.ts
```

---

## 📝 Personalizar la Tarea

Puedes modificar `TEST-TASK.ts` para probar diferentes escenarios:

### Ejemplo 1: Tarea Simple
```typescript
const SIMPLE_TASK = {
  title: 'Create Login Form',
  description: 'Create a React login form with email and password',
  skills: ['frontend-dev-guidelines'],
  complexity: 'low' as const,
};
```

### Ejemplo 2: Tarea Multi-Skill
```typescript
const COMPLEX_TASK = {
  title: 'E-commerce Platform',
  description: 'Build complete e-commerce with React frontend, Node.js backend, PostgreSQL database, and payment integration',
  skills: [
    'frontend-dev-guidelines',
    'backend-architecture-patterns',
    'database-verification',
    'api-design-and-testing'
  ],
  complexity: 'very-high' as const,
};
```

---

## 🎯 Qué Demuestra Esta Tarea

### ✅ Prompt Builder v2 Features

1. **Template v1.1.0 (C1-C8)**
   - Estructura automática aplicada
   - 8 componentes completos

2. **TAGs System**
   - Knowledge tags [K:]
   - Context tags [C:]
   - Usage tags [U:]

3. **Multi-Skill Activation**
   - 3 skills activados simultáneamente
   - Scores individuales por skill
   - Razones de activación

4. **Smart File Detection**
   - Archivos relevantes sugeridos
   - Paths específicos del proyecto

5. **Performance Optimization**
   - Respuesta rápida (<100ms)
   - Cache hits optimizados

6. **Actionable Recommendations**
   - 11+ recomendaciones específicas
   - Orientadas a producción
   - Best practices incluidas

---

## 📊 Resultados Esperados

### Métricas Clave

| Métrica | Valor Esperado |
|---------|----------------|
| **Expected Score** | 0.90 - 0.98 (muy alto) |
| **Skills Activated** | 3 skills |
| **TAGs Coverage** | 80% - 95% |
| **Template Score** | 100% |
| **Latency** | < 100ms |

### Skills Esperados

1. **backend-architecture-patterns**: 90-95%
2. **security-patterns**: 85-90%
3. **database-verification**: 80-85%

### TAGs Esperados

```
[K:SECURITY-PATTERNS]
[C:CONFIGURATION-MANAGEMENT]
[U:DEVELOPER-WORKFLOW]
[K:DATABASE-OPERATIONS]
[C:AUTHENTICATION-SYSTEM]
[C:TOKEN-MANAGEMENT]
```

---

## 🚀 Próximos Pasos

### 1. Probar con Agent SDK

```typescript
import { createAgent } from '@anthropic-ai/claude-agent-sdk';
import { testPromptBuilderV2 } from './TEST-TASK';

const agent = createAgent({
  // ... config
});

const response = await agent.send({
  message: TEST_TASK.description,
});
```

### 2. Crear tu Propia Tarea

```typescript
const MY_TASK = {
  title: 'Mi Tarea Personalizada',
  description: 'Descripción de mi tarea...',
  skills: ['skill-id-1', 'skill-id-2'],
  complexity: 'high',
};

// Ejecutar
const result = await buildOptimizedPromptV2({
  description: MY_TASK.description,
  skillIds: MY_TASK.skills,
  complexity: MY_TASK.complexity,
});
```

### 3. Integrar en tu Aplicación

Ver `AGENT-SDK-GUIDE.md` para integración completa.

---

## ✅ Checklist de Prueba

- [ ] Dependencias instaladas
- [ ] Node.js >= 18
- [ ] Tarea ejecutada exitosamente
- [ ] Prompt optimizado generado
- [ ] Skills activados
- [ ] TAGs generados
- [ ] Recomendaciones obtenidas
- [ ] Latencia < 100ms

---

## 📞 Si Necesitas Ayuda

1. **Revisar logs de error**
2. **Verificar dependencias**
3. **Comprobar versión de Node.js**
4. **Leer troubleshooting en README.md**

---

**¡Ejecuta la tarea y ve Prompt Builder v2 en acción!** 🚀
