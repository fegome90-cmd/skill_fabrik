---
id: backend-dev-guidelines
version: 0.1.0
type: guideline
summary: Patrones backend (rutas→controladores→servicios→repositorios), manejo de errores y pruebas.
audience: engineers
when_to_use: Cuando edites rutas, controladores, servicios o repositorios; al crear endpoints; al revisar errores backend.
provides: Arquitectura en capas, convenciones, checklist de calidad y scripts de verificación.
resources:
  - resources/controllers.md
  - resources/services.md
  - resources/repositories.md
  - resources/error-handling.md
  - resources/testing.md
scripts:
  - name: test-auth-route
    run: node scripts/test-auth-route.js <URL>
    note: Obtiene token, arma cookie y ejecuta request autenticado.
limits: Mantener funciones cortas, single-responsibility, sin lógica de dominio en controladores.
---

## Objetivo

Estandarizar la capa API con patrones previsibles y seguras, minimizando regresiones y tiempos de depuración.

## Procedimiento (resumen)

1. **Rutas** solo definen `method + path` y delegan al **Controlador**.

2. **Controlador** valida input, orquesta casos de uso y llama al **Servicio**.

3. **Servicio** aplica reglas de negocio, llama a **Repositorio**.

4. **Repositorio** encapsula ORM/consultas y transacciones.

5. **Errores**: capturar, clasificar, registrar; nunca filtrar silenciosamente.

6. **Pruebas**: unit para servicios, integra para endpoints críticos.

## Checklist esencial

- [ ] Validación de entrada con DTO/Schema.
- [ ] Controlador sin lógica de negocio.
- [ ] Servicio puro, testeable.
- [ ] Consultas aisladas en repositorio.
- [ ] Errores capturados y registrados.
- [ ] Pruebas mínimas al endpoint modificado.
