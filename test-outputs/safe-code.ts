
// Safe database operations with proper constraints
const deleteUser = (userId) => {
  return prisma.user.deleteMany({
    where: { id: userId, status: 'inactive' }
  });
};

// Secure configuration with environment variables
const config = {
  database: {
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    apiKey: process.env.API_KEY
  }
};

// Safe query with LIMIT clause
const getUsers = () => {
  return db.findMany({
    take: 100,
    where: { active: true },
    orderBy: { createdAt: 'desc' }
  });
};

// Safe parameterized query
const getUserById = (userId) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  return db.query(query, [userId]);
};

// Safe parsing without eval
const processData = (input) => {
  return JSON.parse(input);
};

// Memory-efficient data processing
const processDataEfficiently = (data) => {
  return data.map(item => ({
    ...item,
    processed: item.value * 2
  }));
};
