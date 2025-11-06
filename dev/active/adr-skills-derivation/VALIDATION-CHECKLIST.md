# Validation Checklist for ADR-Derived Skills

**Fecha**: 2025-10-29  
**Objetivo**: Checklist completo para validar calidad de especificaciones de skills derivados de ADRs

---

## 1. YAML Frontmatter Completeness

### Campos Requeridos
- [ ] `id`: skill-id único en formato kebab-case
- [ ] `version`: versión semántica (0.1.0)
- [ ] `type`: guideline|guardrail|workflow|analyst|generator
- [ ] `summary`: descripción breve orientada a acción
- [ ] `audience`: audiencia objetivo especificada
- [ ] `when_to_use`: condiciones de activación claras

### Campos Opcionales (si aplican)
- [ ] `enforcement`: nivel de enforcement (suggest|require|block)
- [ ] `provides`: qué proporciona el skill
- [ ] `resources`: lista de recursos adicionales
- [ ] `scripts`: comandos ejecutables documentados
- [ ] `limits`: limitaciones y alcance

---

## 2. Trigger Rule Coverage

### Keyword Triggers
- [ ] Keywords definidos (mínimo 5-8)
- [ ] Términos específicos del dominio
- [ ] Sinónimos y variaciones incluidos
- [ ] Keywords en idioma apropiado (EN/ES)

### Intent Patterns
- [ ] Patterns definidos (mínimo 2-3)
- [ ] Capturan intención, no solo palabras
- [ ] Usan grupos de captura correctamente
- [ ] Regex validos y escapados

### File Triggers
- [ ] PathPatterns definidos
- [ ] Usan globs específicos
- [ ] Consideran estructura del proyecto
- [ ] No son demasiado amplios

### Content Patterns
- [ ] ContentPatterns definidos
- [ ] Regex precisos para evitar falsos positivos
- [ ] Caracteres especiales escapados
- [ ] Documentado qué detecta cada pattern

---

## 3. Procedure Clarity and Actionability

### Estructura
- [ ] Procedimiento dividido en pasos numerados
- [ ] Cada paso tiene descripción clara
- [ ] Orden lógico de pasos
- [ ] Mínimo 3 pasos, máximo 10

### Accionabilidad
- [ ] Cada paso es ejecutable
- [ ] Comandos/código incluidos donde aplica
- [ ] Sin pasos vagos o ambiguos
- [ ] Ejemplos concretos proporcionados

### Completitud
- [ ] Cubre el flujo completo
- [ ] Maneja casos especiales
- [ ] Incluye validación/verificación
- [ ] Menciona recursos adicionales

---

## 4. Examples Quality

### Ejemplos Correctos (✅)
- [ ] Ejemplo mínimo 1, recomendado 2-3
- [ ] Código real, no pseudocódigo
- [ ] Contexto claro (what/why)
- [ ] Explicación de por qué es correcto

### Ejemplos Incorrectos (❌)
- [ ] Ejemplo mínimo 1, recomendado 2
- [ ] Muestra el anti-pattern
- [ ] Explicación de por qué es incorrecto
- [ ] Sugiere corrección cuando aplica

### Realismo
- [ ] Ejemplos realistas del contexto del proyecto
- [ ] Escenarios verosímiles
- [ ] No ejemplos triviales ni imposibles

---

## 5. Checklist Quality

### Definition of Done
- [ ] Checklist presente en spec
- [ ] Mínimo 5 items, máximo 12
- [ ] Cada item verifica criterio específico
- [ ] Formato checkbox markdown

### Criterios Medibles
- [ ] Todos los criterios son verificables
- [ ] No hay criterios vagos ("hacerlo bien")
- [ ] Criterios cuantificables cuando aplica
- [ ] Orden lógico de verificación

---

## 6. Resources Structure

### On-Demand Loading
- [ ] Recursos definidos en `resources` array
- [ ] Cada recurso tiene propósito claro
- [ ] Recursos modulares (no monolíticos)
- [ ] Descripción de contenido de cada recurso

### Recursos Necesarios
- [ ] Todos los recursos necesarios listados
- [ ] Recursos agrupados por tipo
- [ ] No hay sobrecarga (máximo 5 recursos)
- [ ] Recursos complementarios del SKILL.md

---

## 7. Scripts Documentation

### Scripts Reales
- [ ] Scripts referenciados deben existir (o planificados)
- [ ] No inventar comandos ficticios
- [ ] Cada script documentado con nombre y nota
- [ ] Formato: `run: <comando>`

### Ejemplos de Ejecución
- [ ] Ejemplos de uso de scripts incluidos
- [ ] Argumentos explicados
- [ ] Output esperado documentado

---

## 8. Integration with Existing Skills

### Sin Duplicación
- [ ] No duplica funcionalidad de skills existentes
- [ ] Verificado contra registry/index.json
- [ ] Diferencia clara con skills similares

### Dependencias
- [ ] Skills relacionados identificados
- [ ] Dependencias documentadas
- [ ] Orden de activación sugerido

### Complementariedad
- [ ] Funciona bien con skills existentes
- [ ] No crea conflictos
- [ ] Sin solapamiento innecesario

---

## 9. Source ADR Traceability

### Source ADRs
- [ ] Source ADRs listados en spec
- [ ] Enlaces a ADRs si disponibles
- [ ] Referencia sección específica cuando aplica

### Pattern Extraction
- [ ] Patrón extraído claramente del ADR
- [ ] No es copia literal del ADR
- [ ] Adaptado a formato skill
- [ ] Contexto preservado

---

## 10. Success Metrics

### Métricas Definidas
- [ ] Métricas de éxito definidas
- [ ] Métricas medibles (no subjetivas)
- [ ] Baseline y targets especificados
- [ ] Mínimo 2 métricas por skill

### Tipos de Métricas
- [ ] Frecuencia de uso/activación
- [ ] Adherencia/completion rate
- [ ] Tiempo ahorrado (si aplica)
- [ ] Calidad de outputs (si aplica)

---

## 11. Overall Quality Assessment

### Completitud
- [ ] Todas las secciones requeridas presentes
- [ ] No hay secciones vacías
- [ ] Content completeness > 80%

### Claridad
- [ ] Lenguaje claro y conciso
- [ ] Sin jerga innecesaria
- [ ] Bien estructurado y organizado
- [ ] Fácil de seguir

### Utilidad
- [ ] Resuelve problema real
- [ ] Añade valor al proyecto
- [ ] Reutilizable y generalizable
- [ ] Implementable con esfuerzo razonable

---

## 12. Technical Validation

### Syntax
- [ ] YAML frontmatter sintácticamente válido
- [ ] Markdown válido
- [ ] Links funcionan
- [ ] Code blocks formateados correctamente

### Consistency
- [ ] Nomenclatura consistente
- [ ] Estilo consistente con otros specs
- [ ] Referencias consistentes
- [ ] Tipos de datos consistentes

---

## Summary Score

**Total Checks**: 12 categorías principales  
**Max Score**: ~100 puntos  
**Passing Threshold**: ≥ 80 puntos

### Scoring Guide
- ✅ Complete: 10 puntos
- ⚠️ Partial: 5 puntos
- ❌ Missing: 0 puntos

---

## Validation Process

1. **Self-Review**: Autor valida contra checklist
2. **Peer-Review**: Otro miembro del equipo revisa
3. **Automated**: Scripts de validación (lint, syntax check)
4. **Integration**: Validar contra registry existente

---

## Action Items for Reviewer

- [ ] Ejecutar checklist completo
- [ ] Documentar issues encontrados
- [ ] Priorizar issues (critical/high/medium/low)
- [ ] Asignar a autor para corrección
- [ ] Re-validar tras correcciones
- [ ] Aprobar o rechazar spec

---

**Last Updated**: 2025-10-29  
**Version**: 1.0.0

