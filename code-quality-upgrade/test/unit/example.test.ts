import { calcularAreaCirculo, saludar, validarEmail } from '../../src/example';

describe('Funciones de ejemplo', () => {
  describe('función saludar', () => {
    it('debe saludar correctamente', () => {
      const resultado = saludar('Mundo');
      expect(resultado).toBe('¡Hola, Mundo!');
    });

    it('debe manejar string vacío', () => {
      const resultado = saludar('');
      expect(resultado).toBe('¡Hola, !');
    });
  });

  describe('función calcularAreaCirculo', () => {
    it('debe calcular área correctamente para radio positivo', () => {
      const resultado = calcularAreaCirculo(2);
      const areaEsperada = Math.PI * 4;
      expect(resultado).toBeCloseTo(areaEsperada, 2);
    });

    it('debe lanzar error para radio negativo', () => {
      expect(() => calcularAreaCirculo(-1)).toThrow(
        'El radio debe ser positivo'
      );
    });

    it('debe lanzar error para radio cero', () => {
      expect(() => calcularAreaCirculo(0)).toThrow(
        'El radio debe ser positivo'
      );
    });
  });

  describe('función validarEmail', () => {
    it('debe validar email correcto', () => {
      expect(validarEmail('test@example.com')).toBe(true);
    });

    it('debe rechazar email sin @', () => {
      expect(validarEmail('testexample.com')).toBe(false);
    });

    it('debe rechazar email sin dominio', () => {
      expect(validarEmail('test@')).toBe(false);
    });

    it('debe rechazar email con espacios', () => {
      expect(validarEmail('test @example.com')).toBe(false);
    });
  });
});
