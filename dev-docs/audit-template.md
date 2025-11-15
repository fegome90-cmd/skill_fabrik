# Auditoría de Código — Template Base

## 1. Contexto y Referencias Obligatorias
- **Dev Docs**: `dev-docs/CONTEXT.md`, `dev-docs/PLAN.md`, `dev-docs/TASKS.md` (o el doc vigente para la fase actual).
- **Reglas Globales**: `code-quality-upgrade/config/code-quality-rules.json`.
- **Configuraciones de Lint/Prettier/TS**: `code-quality-upgrade/eslint.config`, scripts de `code-quality-upgrade/package.json`, `tsconfig.json`, etc.

## 2. Entrada para Cada Auditoría
```
TASK_SUMMARY:   …
AGENT_OUTPUT:   …
CHANGED_FILES:  [ … ]
EXPECTED_OUTCOME: …
```

## 3. Proceso del Auditor
1. Releer `CONTEXT.md`, `PLAN.md`, `TASKS.md` y `code-quality-rules.json`.
2. Revisar `TASK_SUMMARY` + `AGENT_OUTPUT`, abrir cada archivo listado en `CHANGED_FILES`.
3. Validar los cambios contra:
   - ESLint / Prettier / TypeScript (`npm run lint`, `npm run test`, `npm run build`, etc.).
   - Reglas del JSON (TDD obligatorio, zero debt, artifact hygiene, auditorías cada 3 tareas, etc.).
   - Dev Docs (estructura de carpetas, fases activas, documentación requerida).

## 4. Checklist Mínima (Repo `skills-fabrik`)
- **Lint/Formato**: ejecutar `npm run lint` dentro de `code-quality-upgrade/` (o el script indicado).
- **Tests / TDD**: `npm test` o `npm test -- --coverage`; verificar que se agregaron pruebas nuevas si aplica.
- **Pre-commit / CI**: confirmar scripts (`scripts/validate-task-execution.ts`, hooks configurados, etc.).
- **Seguridad**: revisar `scripts/*.sh`, `scripts/*.ts` en busca de `rm -rf`, `curl|bash`, `require` dinámicos, etc.
- **Disciplina de Repo**: validar que se respete la estructura (`packages/`, `code-quality-upgrade/`, `agents/`, etc.) y que no haya artefactos prohibidos.

## 5. Respuesta Obligatoria (JSON)
```json
{
  "decision": "GO | NO_GO",
  "summary": "Breve resumen (1-3 frases).",
  "rule_violations": [
    {
      "rule_id": "ID de rules.json o 'DEV_DOC'",
      "location": "archivo:linea",
      "severity": "critical | high | medium | low",
      "description": "Qué está mal y por qué.",
      "suggested_fix": "Cómo corregirlo."
    }
  ],
  "code_quality_notes": [
    "Observaciones adicionales sobre limpieza, patrones, oportunidades de mejora."
  ],
  "alignment_with_docs": {
    "dev_docs_ok": true,
    "rules_json_ok": true,
    "details": "Cómo se alinean (o no) los cambios."
  },
  "next_actions_for_agent": [
    "Pasos concretos para llegar a GO."
  ]
}
```

> **Nota:** Regla general — si la evidencia es insuficiente o hay dudas, se responde `NO_GO` con la explicación correspondiente. Este template debe copiarse (o insertarse como snippet) en cualquier prompt base de VS Code donde se requiera auditar al agente principal.
