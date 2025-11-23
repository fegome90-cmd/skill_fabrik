# Generador de Prompts PMv2 - Documentación

## Descripción

Script para generar prompts PMv2 (Prompt Builder v2) siguiendo el Template v1.1.0 con 8 componentes completos.

## Uso

### Básico
```bash
python3 scripts/generate-pmv2-prompt.py "Objetivo del prompt"
```

### Completo
```bash
python3 scripts/generate-pmv2-prompt.py \
  "Crear API REST con autenticación JWT" \
  "Backend Developer" \
  "implementar endpoints seguros" \
  "Node.js + Express" \
  "OWASP compliance"
```

### Parámetros
1. **Objetivo** (requerido): Descripción de lo que se quiere lograr
2. **Rol** (opcional): Rol del desarrollador (default: "Backend Developer")
3. **Directiva** (opcional): Instrucción específica (default: "implementar solución")
4. **Framework** (opcional): Stack tecnológico (default: "Node.js + Express")
5. **Guardrails** (opcional): Restricciones de seguridad (default: "OWASP compliance")

## Características

### Template v1.1.0 - 8 Componentes

1. **[C1] CSE_COMPLETO** - Contexto del Sistema
2. **[C2] TAGs_COBERTURA** - Sistema de Tags [K][C][U][EVIDENCIA][PROPUESTA]
3. **[C3] BOUNDARY_MARKERS** - Delimitadores IN/OUT SCOPE
4. **[C4] FRONTMATTER_YAML** - Metadatos estructurados
5. **[C5] ANTI_DRIFT** - Prevención de desviación
6. **[C6] OBJETIVOS_SMART** - Objetivos específicos y medibles
7. **[C7] TESTS_EJECUTABLES** - Casos de test definidos
8. **[C8] SEPARACION_EVIDENCIA_PROPUESTA** - Separación clara

### Métricas de Calidad

- **Template Coverage:** 100% (8/8 componentes)
- **TAGs Coverage:** 60%+ (5 tags aplicados)
- **Expected Score:** 0.6-0.8
- **Complejidad:** Media
- **Duración Estimada:** 8h

## Requisitos

**IMPORTANTE**: Este script requiere que la API de Skills-Fabrik esté corriendo en el puerto 3003.

### Iniciar el Servicio

```bash
cd /Users/felipe/Developer/startkit-main/zen-mcp-agents-hub
npm start
# O en modo desarrollo:
npm run dev
```

El servicio debe estar disponible en: `http://localhost:3003/api/v1`

### Verificar que el Servicio Está Corriendo

```bash
curl http://localhost:3003/api/v1/health
```

Si el servicio no está disponible, el script mostrará instrucciones para iniciarlo.

## Archivos Generados

Los prompts se guardan en `prompts/pmv2-YYYYMMDD-HHMMSS.md`

## Ejemplo de Salida

Ver `prompts/pmv2-20251107-165708.md` para un ejemplo completo.

