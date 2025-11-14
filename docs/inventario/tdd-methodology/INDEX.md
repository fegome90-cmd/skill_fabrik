# 🗺️ Guía de Navegación - Metodología TDD

```
📁 tdd-methodology/
│
├── 📄 README.md                         ← EMPIEZA AQUÍ
│   └── Resumen ejecutivo y quick start
│
├── 📘 TDD_METHODOLOGY.md                ← TEORÍA Y PRINCIPIOS
│   ├── Ciclo Red-Green-Refactor
│   ├── Testing por capas
│   ├── Estrategias de mocking
│   ├── Métricas y coverage
│   ├── Workflow diario
│   ├── Casos de uso específicos
│   └── Principios y anti-patrones
│
├── 💻 TDD_PRACTICAL_EXAMPLES.md         ← CÓDIGO REAL
│   ├── Endpoint REST completo (11 pasos)
│   ├── Worker de procesamiento
│   ├── Middleware de validación
│   └── Plantillas reutilizables
│
└── ⚙️ TDD_SETUP_CONFIG.md               ← CONFIGURACIÓN
    ├── Estructura de proyecto
    ├── package.json y dependencies
    ├── jest.config.js
    ├── Helpers de test
    ├── Mocks y fixtures
    ├── CI/CD (GitHub Actions)
    ├── ESLint + Prettier
    └── PM2 ecosystem.config.js
```

---

## 🎯 ¿Por Dónde Empezar?

### Si estás iniciando un proyecto NUEVO:

```
1. README.md
   ↓ (Entender el overview)
2. TDD_SETUP_CONFIG.md
   ↓ (Configurar ambiente)
3. TDD_METHODOLOGY.md
   ↓ (Aprender el método)
4. TDD_PRACTICAL_EXAMPLES.md
   ↓ (Implementar primer feature)
```

### Si tienes un proyecto EXISTENTE:

```
1. README.md
   ↓ (Quick start)
2. TDD_METHODOLOGY.md
   ↓ (Aprender principios)
3. TDD_PRACTICAL_EXAMPLES.md
   ↓ (Refactorizar con TDD)
4. TDD_SETUP_CONFIG.md
   ↓ (Agregar tests al proyecto)
```

### Si quieres aprender TDD:

```
1. TDD_METHODOLOGY.md (Sección 1-2)
   ↓ (Ciclo básico)
2. TDD_PRACTICAL_EXAMPLES.md (Ejemplo 1)
   ↓ (Ver código real)
3. TDD_METHODOLOGY.md (Sección 3-6)
   ↓ (Profundizar)
4. TDD_PRACTICAL_EXAMPLES.md (Resto)
   ↓ (Más ejemplos)
```

---

## 📖 Contenido por Documento

### README.md (5 min lectura)

- ✅ Quick start (5 pasos)
- ✅ Workflow diario
- ✅ Comandos esenciales
- ✅ Checklist pre-production
- ✅ Troubleshooting común

**Usar cuando**: Necesites referencia rápida

---

### TDD_METHODOLOGY.md (30 min lectura)

#### Sección 1: Filosofía (5 min)

- Principios fundamentales
- Ciclo Red-Green-Refactor

#### Sección 2: Testing por Capas (10 min)

- Layer 1: Routers
- Layer 2: Controllers
- Layer 3: Services
- Layer 4: Models
- Layer 5: Daemons/Workers

#### Sección 3: Estrategias de Mocking (5 min)

- ¿Qué mockear?
- Patrones de mock
- Dependency Injection

#### Sección 4: Métricas (3 min)

- Coverage targets
- Indicadores de calidad

#### Sección 5: Workflow (5 min)

- Día a día
- Pre-commit hooks

#### Sección 6: Casos de Uso (7 min)

- Endpoint REST
- Worker de cola
- Middleware

**Usar cuando**: Necesites entender el método completo

---

### TDD_PRACTICAL_EXAMPLES.md (45 min práctica)

#### Ejemplo 1: Endpoint REST (20 min)

**9 pasos** desde test hasta refactor:

1. Test de API (RED)
2. Implementar ruta (GREEN)
3. Test de controlador (RED)
4. Implementar controlador (GREEN)
5. Test de servicio (RED)
6. Implementar servicio (GREEN)
7. Test de repositorio (RED)
8. Implementar repositorio (GREEN)
9. Refactorizar (REFACTOR)

**Código completo** con:

- Tests reales
- Implementación paso a paso
- Explicaciones en cada paso

#### Ejemplo 2: Worker (15 min)

- Test de procesamiento
- Test de idempotencia
- Test de reintentos
- Configuración de cola

#### Ejemplo 3: Middleware (10 min)

- Test de validación
- Test de sanitización
- Implementación

**Usar cuando**: Vayas a escribir código con TDD

---

### TDD_SETUP_CONFIG.md (1 hora setup)

#### Sección 1: Estructura (10 min)

- Carpetas del proyecto
- Organización de tests

#### Sección 2: Configuración (15 min)

- package.json completo
- jest.config.js
- .env.test
- ecosystem.config.js

#### Sección 3: Helpers (15 min)

- Setup global
- Database helper
- Redis helper
- Express mocks

#### Sección 4: CI/CD (10 min)

- GitHub Actions
- Codecov
- Husky + lint-staged

#### Sección 5: Linting (10 min)

- ESLint config
- Prettier config
- Pre-commit hooks

**Usar cuando**: Configures el proyecto

---

## 🎯 Flujos de Trabajo

### Flow 1: Nueva Feature con TDD

```
1. Lee: TDD_PRACTICAL_EXAMPLES.md → Ejemplo 1
   (Paso 1-9 del endpoint REST)

2. Aplica el ciclo:
   - Escribir test (RED)
   - Código mínimo (GREEN)
   - Refactor

3. Referencia: TDD_METHODOLOGY.md → Sección Testing por Capas
   (Para recordar checklist de cada capa)

4. Verifica: README.md → Métricas de Calidad
   (Coverage, tests pasando, etc.)
```

### Flow 2: Refactorizar Código Existente

```
1. Lee: TDD_METHODOLOGY.md → Sección 5 (Workflow)
   (Entender el proceso)

2. Sigue: TDD_PRACTICAL_EXAMPLES.md → Ejemplo relevante
   (Usar como plantilla)

3. Proceso:
   - Escribir tests para código existente
   - Refactorizar con confianza
   - Verificar tests siguen pasando

4. Valida: README.md → Checklist
   (Asegurar calidad)
```

### Flow 3: Setup Inicial Proyecto

```
1. Quick start: README.md → Setup Inicial
   (Comandos básicos)

2. Configuración: TDD_SETUP_CONFIG.md
   (Copiar configs completas)

3. Verificar: Comandos esenciales
   npm test
   npm run test:coverage
   npm run lint

4. Primer feature: TDD_PRACTICAL_EXAMPLES.md → Ejemplo 1
   (Implementar con TDD)
```

---

## 🔍 Búsqueda Rápida

### "¿Cómo testear un...?"

| Qué           | Dónde                                 |
| ------------- | ------------------------------------- |
| Endpoint REST | TDD_PRACTICAL_EXAMPLES.md → Ejemplo 1 |
| Worker/Daemon | TDD_PRACTICAL_EXAMPLES.md → Ejemplo 2 |
| Middleware    | TDD_PRACTICAL_EXAMPLES.md → Ejemplo 3 |
| Servicio      | TDD_METHODOLOGY.md → Layer 3          |
| Controlador   | TDD_METHODOLOGY.md → Layer 2          |
| Repositorio   | TDD_METHODOLOGY.md → Layer 4          |

### "¿Cómo configurar...?"

| Qué                | Dónde                                     |
| ------------------ | ----------------------------------------- |
| Jest               | TDD_SETUP_CONFIG.md → jest.config.js      |
| Base de datos test | TDD_SETUP_CONFIG.md → Helpers             |
| Redis test         | TDD_SETUP_CONFIG.md → Helpers             |
| CI/CD              | TDD_SETUP_CONFIG.md → GitHub Actions      |
| PM2                | TDD_SETUP_CONFIG.md → ecosystem.config.js |
| Mocks              | TDD_SETUP_CONFIG.md → Mocks Útiles        |

### "¿Qué hacer si...?"

| Problema                | Solución                    |
| ----------------------- | --------------------------- |
| Tests lentos            | README.md → Troubleshooting |
| Coverage bajo           | README.md → Troubleshooting |
| Tests frágiles          | README.md → Troubleshooting |
| Mocks complejos         | README.md → Troubleshooting |
| No sé por dónde empezar | Este documento → Flow 1     |

---

## 📚 Documentos Relacionados

### Proyecto Base

```
📁 docs/inventario/
├── 📄 Router-2.docx
│   └── Arquitectura de routers, daemons y PM2
│
├── 📄 Routers, Daemons y PM2: Buenas Prácticas.docx
│   └── Guía completa de producción
│
└── 📁 tdd-methodology/        ← ESTÁS AQUÍ
    ├── README.md
    ├── TDD_METHODOLOGY.md
    ├── TDD_PRACTICAL_EXAMPLES.md
    ├── TDD_SETUP_CONFIG.md
    └── INDEX.md
```

---

## ✅ Checklist de Uso

### Primera vez usando estos documentos:

- [ ] Leer README.md completo
- [ ] Entender estructura del proyecto
- [ ] Configurar ambiente según TDD_SETUP_CONFIG.md
- [ ] Hacer tutorial de TDD_PRACTICAL_EXAMPLES.md Ejemplo 1
- [ ] Verificar tests corriendo
- [ ] Bookmark este INDEX.md para referencia

### Antes de cada feature:

- [ ] Revisar TDD_METHODOLOGY.md → Ciclo TDD
- [ ] Revisar checklist de la capa correspondiente
- [ ] Seguir flow de TDD_PRACTICAL_EXAMPLES.md
- [ ] Verificar coverage > 80%
- [ ] Commit con tests pasando

### Revisión semanal:

- [ ] Revisar métricas de coverage
- [ ] Identificar código sin tests
- [ ] Actualizar este índice si agregaste ejemplos
- [ ] Compartir aprendizajes con el equipo

---

## 🎓 Niveles de Dominio

### Nivel 1: Principiante (Semana 1-2)

**Objetivos**:

- [ ] Configurar ambiente
- [ ] Entender ciclo Red-Green-Refactor
- [ ] Escribir primer test
- [ ] Implementar endpoint con TDD

**Documentos**:

1. README.md
2. TDD_PRACTICAL_EXAMPLES.md (Ejemplo 1)

### Nivel 2: Intermedio (Semana 3-4)

**Objetivos**:

- [ ] Testear todas las capas
- [ ] Implementar workers con TDD
- [ ] Usar mocks efectivamente
- [ ] Coverage > 80%

**Documentos**:

1. TDD_METHODOLOGY.md (completo)
2. TDD_PRACTICAL_EXAMPLES.md (todos)

### Nivel 3: Avanzado (Mes 2+)

**Objetivos**:

- [ ] TDD como segunda naturaleza
- [ ] Refactorizar con confianza
- [ ] Crear patrones propios
- [ ] Mentorear a otros

**Documentos**:

1. Todos los documentos
2. Crear tus propios ejemplos

---

## 🔗 Links Rápidos

- [README](./README.md) - Resumen ejecutivo
- [Metodología](./TDD_METHODOLOGY.md) - Teoría completa
- [Ejemplos](./TDD_PRACTICAL_EXAMPLES.md) - Código real
- [Configuración](./TDD_SETUP_CONFIG.md) - Setup y herramientas

---

## 📝 Notas

### Actualizaciones Futuras

Este índice se actualizará con:

- Nuevos ejemplos de casos de uso
- Patrones descubiertos
- Mejores prácticas del equipo
- Troubleshooting adicional

### Contribuir

Si encuentras mejoras o nuevos ejemplos:

1. Documenta el caso
2. Agrega tests
3. Actualiza el documento correspondiente
4. Actualiza este índice

---

**¡Feliz Testing! 🧪✨**

_Última actualización: 2025-01-13_  
_Versión: 1.0.0_  
_Proyecto: skills-fabrik/inventario_
