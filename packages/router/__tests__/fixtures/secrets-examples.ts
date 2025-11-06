/**
 * Fixture: Secrets Examples
 * Contiene ejemplos de secretos hardcodeados
 */

export const DANGEROUS_SECRETS = [
  // API Keys
  'const apiKey = "sk_live_1234567890abcdef";',
  'const secretKey = "AKIAIOSFODNN7EXAMPLE";',
  'const token = "ghp_XXXXXXXXXXXXXXXXXXXX";',

  // Passwords
  'const password = "P@ssw0rd123!";',
  'const dbConfig = { password: "admin123" };',

  // JWT Secrets
  'jwt.sign(payload, "my-secret-key");',
  'const jwtSecret = "super-secret-jwt-key";',

  // AWS Credentials
  'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
  'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
];

export const SAFE_SECRETS = [
  // Environment Variables
  'const apiKey = process.env.API_KEY;',
  'const password = process.env.DB_PASSWORD;',
  'const jwtSecret = process.env.JWT_SECRET;',

  // AWS from env
  'AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}',
  'const awsKey = Deno.env.get("AWS_SECRET_KEY");',
];

export const PATTERN_EXAMPLES = [
  // Should match
  { code: 'const key = "secret";', shouldMatch: true, type: 'hardcoded-secret' },
  { code: 'password: "123456"', shouldMatch: true, type: 'hardcoded-password' },
  { code: 'api_key = "live_key_123"', shouldMatch: true, type: 'api-key' },

  // Should NOT match
  { code: 'const key = process.env.SECRET_KEY;', shouldMatch: false, type: 'env-var' },
  { code: 'password: process.env.PASSWORD', shouldMatch: false, type: 'env-var' },
];
