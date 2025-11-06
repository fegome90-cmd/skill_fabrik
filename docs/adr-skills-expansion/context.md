# Context — ADR Skills Expansion 2025

**Proyecto:** Skills-Fabrik  
**Propósito:** Integrar un conjunto de *skills inteligentes* derivados de ADRs (Architecture Decision Records) para establecer gobernanza documental, validación sistemática y procesos reproducibles.  
**Versión:** 1.0.0  
**Fecha:** 2025-10-30  

---

## Contexto General

El ecosistema Skills-Fabrik funciona como un marco universal de *skills modulares* que siguen metodología CLOOP (Clarify → Layout → Operate → Observe → Reflect) y se integran con MemTech L0-L3.

**Misión:** Convertir decisiones arquitectónicas documentadas, patrones técnicos validados y experiencias previas en acciones reproducibles y auditables.

Para avanzar hacia un entorno auto-mejorable y con control de calidad, se implementará una familia de **12 skills** basados en análisis sistemático de:

- **~287 archivos ADR** encontrados en startkit-main
- **~95 ADRs analizados en detalle** con patrones identificables
- **9 ADRs clave** utilizados como fuentes primarias

---

## Pilares de los Skills

Los 12 skills derivados se basan en:

### 1. Unified ADR Protocol (ADR-085)
- Nomenclatura estándar y YAML frontmatter estructurado
- Validación automática de formato y contenido
- Lifecycle management (Proposed → Accepted → Deprecated)
- Integración con búsqueda semántica

### 2. Memory-First Approach (ADR-089)
- Consultar ADRs existentes ANTES de implementar
- Prevenir pérdida de tiempo (2-3 horas por incidente)
- Documentar lecciones aprendidas
- Reutilizar soluciones probadas

### 3. CLOOP Methodology (ADR-057)
- Aplicación sistemática de 5 fases
- Artifacts por fase con métricas cuantificables
- 100% success rate documentado
- Basado en research académico

### 4. Validation Systems (ADR-024, ADR-034, ADR-066)
- Gates incrementales (Go/No-Go)
- Métricas objetivas con umbrales
- Quality gates en CI/CD
- Prevención de degradación

---

## Objetivo del Contexto

Dotar al ecosistema de:

- **Documentación Estándar**: ADRs consistentes y validados
- **Consulta Proactiva**: Memory-first antes de codificar
- **Validación Automática**: Gates que previenen errores
- **Workflows Reproducibles**: Procesos claros y medibles
- **Gobernanza Documental**: Trazabilidad y lifecycle

El contexto define el **por qué**:  

estas extensiones buscan **consciencia documental** y **prevención de errores recurrentes** dentro del ciclo CLOOP, convirtiendo conocimiento implícito en procesos explícitos y validables.

---

## ADRs Fuente Utilizados

| ADR | Tema Principal | Skills Derivados |
|-----|----------------|------------------|
| ADR-085 | Unified ADR Protocol | 3 skills |
| ADR-089 | Consultar ADRs Antes | 1 skill |
| ADR-057 | CLOOP Methodology | 1 skill |
| ADR-024 | Go/No-Go Validation | 3 skills |
| ADR-034 | Pipeline RAG Gates | 2 skills |
| ADR-066 | Truth + Fluency | 2 skills |
| ADR-010 | Testing Isolated | 1 skill |
| ADR-016 | ACE Delta Pipeline | 1 skill |
| ADR-021 | IDE Integration | 1 skill |

---

## Impacto Esperado

**Time Saved**: ≥2-3 horas por incidente evitado (ADR consultation)  
**Quality Improvement**: ≥95% ADR completeness (validation gates)  
**Automation**: 20% time saved en workflows  
**Degradation Prevented**: ≥3 por mes (metric gates)

---

**Versión**: 1.0.0  
**Última actualización**: 2025-10-30

