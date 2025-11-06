
// Massive deletion without constraints (CRITICAL)
const deleteAllUsers = () => {
  prisma.user.deleteMany(); // Critical violation - no WHERE clause
};

// Hardcoded credentials (CRITICAL)
const dbConfig = {
  password: "super-secret-password-123",
  apiKey: "sk_live_1234567890abcdef",
  secretToken: "confidential-token-value"
};

// Unrestricted query (HIGH)
const getAllData = () => {
  return db.findMany(); // High violation - no LIMIT
};

// SQL injection potential (CRITICAL)
const unsafeQuery = `SELECT * FROM users WHERE id = ${userId}`;

// Unsafe eval (MEDIUM)
const processData = (input) => {
  return eval(`(${input})`);
};

// Memory leak pattern (LOW)
const processLargeData = () => {
  const data = new Array(10000);
  for (let i = 0; i < data.length; i++) {
    data.push(new Array(1000));
  }
};
