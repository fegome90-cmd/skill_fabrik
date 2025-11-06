/**
 * Fixture: Database Queries Examples
 * Contiene ejemplos de queries con y sin WHERE clause
 */

export const DANGEROUS_QUERIES = [
  // Prisma/TypeScript
  'await prisma.user.deleteMany();',
  'await prisma.user.updateMany({ data: { active: false } });',
  'await prisma.post.findMany();',

  // SQL directo
  'DELETE FROM users;',
  'UPDATE users SET active = false;',
  'SELECT * FROM users;',
];

export const SAFE_QUERIES = [
  // Con WHERE clause
  'await prisma.user.deleteMany({ where: { id: 1 } });',
  'await prisma.user.updateMany({ where: { active: true }, data: { active: false } });',
  'await prisma.user.findMany({ where: { active: true } });',

  // SQL con WHERE
  'DELETE FROM users WHERE id = 1;',
  'UPDATE users SET active = false WHERE active = true;',
  'SELECT * FROM users WHERE active = true;',
];

export const SQL_INJECTION_EXAMPLES = [
  'SELECT * FROM users WHERE id = 1; DROP TABLE users;',
  'DELETE FROM users WHERE id = 1 OR 1=1;',
];
