---
id: test-driven-development
version: 0.1.0
type: guideline
enforcement: suggest
summary: 'Ciclo RED-GREEN-REFACTOR para desarrollo guiado por pruebas. Crear pruebas que fallen primero, luego hacerlas pasar, luego refactorizar.'
audience: engineers
when_to_use: 'Al implementar nuevas features o corregir bugs, antes de escribir código de producción.'
provides: Metodología TDD, estructura de pruebas, ejemplos prácticos, comandos automatizados.
resources:
  - resources/why-tdd.md
  - resources/test-structure.md
  - resources/refactoring-patterns.md
  - resources/examples.md
scripts:
  - name: tdd-cycle
    run: npm run test:tdd
    note: Ejecuta ciclo TDD en modo watch
  - name: test-coverage
    run: npm run test:coverage
    note: Muestra cobertura de pruebas actual
  - name: test-single
    run: npm test -- --testNamePattern="<test-name>"
    note: Ejecuta prueba específica
limits: Requiere framework de testing (jest/vitest/mocha) y configuración previa.
---

## Objetivo

Implementar software siguiendo el ciclo **RED-GREEN-REFACTOR** para garantizar calidad, mantener code coverage alto y facilitar refactorizaciones seguras.

**Cuándo usar**:
- Al desarrollar nuevas features desde cero
- Al corregir bugs (primero escribir prueba que reproduzca el error)
- Al refactorizar código existente

**Cuándo NO usar**: Para prototipos rápidos sin intención de mantener o experimentos de concepto.

**Qué problema resuelve**: Previene regresiones, guía el diseño de código, documenta comportamiento mediante pruebas, facilita mantenimiento.

## Procedimiento (resumen)

### Ciclo RED-GREEN-REFACTOR

1. **RED**: Escribir prueba que falle
   - Definir comportamiento esperado
   - Escribir prueba sin implementación
   - Verificar que falle (rojo)

2. **GREEN**: Hacer que la prueba pase
   - Escribir código mínimo para pasar
   - Sin preocuparse por diseño óptimo
   - Verificar que pase (verde)

3. **REFACTOR**: Mejorar el código
   - Limpiar y optimizar implementación
   - Mantener pruebas pasando
   - Aplicar patrones de diseño

### Estructura de Pruebas

```typescript
// Prueba unitaria básica
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };

      // Act
      const user = await UserService.createUser(userData);

      // Assert
      expect(user.id).toBeDefined();
      expect(user.name).toBe(userData.name);
    });
  });
});
```

## Checklist

- [ ] Prueba escrita ANTES que implementación
- [ ] Prueba falla inicialmente (RED)
- [ ] Implementación mínima para pasar (GREEN)
- [ ] Código refactorizado manteniendo pruebas verdes
- [ ] Cobertura ≥ 80% en código nuevo
- [ ] Tests ejecutan < 100ms cada uno
- [ ] Nombres descriptivos en pruebas

## Ejemplos

### ✅ Correcto - Desarrollo de Feature

```typescript
// 1. RED - Prueba que falla
test('should calculate total price with tax', () => {
  const cart = new ShoppingCart();
  cart.addItem({ price: 100, quantity: 2 });

  expect(cart.getTotalWithTax(0.21)).toBe(242); // Falla: método no existe
});

// 2. GREEN - Implementación mínima
getTotalWithTax(taxRate: number): number {
  const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 + taxRate);
}

// 3. REFACTOR - Mejorar diseño
class ShoppingCart {
  private taxCalculator: TaxCalculator;

  constructor(taxCalculator = new TaxCalculator()) {
    this.taxCalculator = taxCalculator;
  }

  getTotalWithTax(taxRate: number): number {
    const subtotal = this.calculateSubtotal();
    return this.taxCalculator.applyTax(subtotal, taxRate);
  }
}
```

### ✅ Correcto - Bug Fix

```typescript
// 1. RED - Reproducir bug
test('should handle empty cart gracefully', () => {
  const cart = new ShoppingCart();
  expect(() => cart.getTotalWithTax(0.21)).not.toThrow();
  expect(cart.getTotalWithTax(0.21)).toBe(0);
});

// 2. GREEN - Fix mínimo
getTotalWithTax(taxRate: number): number {
  if (!this.items || this.items.length === 0) {
    return 0;
  }
  // ... resto de lógica
}
```

### ❌ Incorrecto

```typescript
// ❌ Escribir código primero, pruebas después
function calculateDiscount(price: number): number {
  if (price > 100) return price * 0.9;
  return price;
}

// ❌ Prueba solo para verificar (no guía diseño)
test('discount works', () => {
  expect(calculateDiscount(150)).toBe(135);
});
```

## Comandos Útiles

```bash
# Ejecutar en modo watch (TDD)
npm run test:tdd

# Cobertura de código
npm run test:coverage

# Prueba específica
npm test -- --testNamePattern="should calculate total"

# Actualizar snapshots
npm test -- --updateSnapshot

# Ejecutar solo pruebas fallidas
npm test -- --onlyFailures
```

## Recursos

Ver `resources/` para:
- `why-tdd.md`: Beneficios y justificación del TDD
- `test-structure.md`: Patrones de organización de pruebas
- `refactoring-patterns.md`: Técnicas de refactorización segura
- `examples.md`: Ejemplos completos por tipo de prueba