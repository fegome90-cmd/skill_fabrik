/**
 * Test mínimo para verificar que Jest funciona
 */

describe('Jest Minimal Test', () => {
  test('test básico de matemáticas', () => {
    expect(2 + 2).toBe(4);
  });

  test('test básico de strings', () => {
    expect('Hola Mundo').toContain('Hola');
  });

  test('test básico de arrays', () => {
    const array = [1, 2, 3];
    expect(array).toHaveLength(3);
  });

  test('test básico de objetos', () => {
    const obj = { nombre: 'test', valor: 42 };
    expect(obj.nombre).toBe('test');
  });

  test('test básico booleano', () => {
    expect(true).toBe(true);
  });
});