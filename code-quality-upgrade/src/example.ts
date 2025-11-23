export function saludar(nombre: string): string {
  return `¡Hola, ${nombre}!`;
}

export function calcularAreaCirculo(radio: number): number {
  if (radio <= 0) {
    throw new Error('El radio debe ser positivo');
  }
  return Math.PI * radio ** 2;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
