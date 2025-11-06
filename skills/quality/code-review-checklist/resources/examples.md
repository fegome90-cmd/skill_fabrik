# Code Review Examples - Ejemplos Prácticos

## Ejemplos de Buenas Prácticas (Good Examples)

### 1. Clear Function Names ✅

```typescript
// GOOD: Function name explains what it does
async function getUserByEmail(email: string): Promise<User | null> {
  return await db.users.findUnique({
    where: { email }
  });
}

// GOOD: Verb + noun pattern
function validatePassword(password: string): ValidationResult {
  // Implementation
}

// GOOD: Boolean functions start with "is", "has", "can"
function isUserAuthenticated(userId: string): boolean {
  // Implementation
}
```

### 2. Self-Documenting Code ✅

```typescript
// GOOD: Clear logic with good variable names
const recentOrders = orders
  .filter(order => order.status === 'delivered')
  .filter(order => {
    const daysSinceDelivery = Date.now() - order.deliveredAt.getTime();
    const daysInMs = 30 * 24 * 60 * 60 * 1000;
    return daysSinceDelivery <= daysInMs;
  })
  .sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime());

// GOOD: Constants for magic numbers
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
  await lockAccount(userId, LOCKOUT_DURATION_MS);
}
```

### 3. Proper Error Handling ✅

```typescript
// GOOD: Specific error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// GOOD: Try-catch with specific errors
async function createUser(userData: UserData): Promise<User> {
  try {
    // Validate input
    if (!userData.email || !userData.password) {
      throw new ValidationError('Email and password are required', 'credentials');
    }

    // Check if user exists
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('User already exists', 'email');
    }

    // Create user
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await db.users.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    });

    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Re-throw known errors
    }
    // Log unexpected errors
    console.error('Unexpected error creating user:', error);
    throw new DatabaseError('Failed to create user');
  }
}
```

### 4. Input Validation ✅

```typescript
// GOOD: Validate and sanitize all inputs
function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// GOOD: Validate all user inputs
async function updateUserProfile(userId: string, updates: ProfileUpdates): Promise<User> {
  // Validate required fields
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Validate update fields
  if (updates.email && !validateEmail(updates.email)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  if (updates.bio && updates.bio.length > 500) {
    throw new ValidationError('Bio must be 500 characters or less', 'bio');
  }

  // Sanitize inputs
  const sanitizedUpdates = {
    ...updates,
    bio: updates.bio ? sanitizeUserInput(updates.bio) : undefined
  };

  return await db.users.update({
    where: { id: userId },
    data: sanitizedUpdates
  });
}
```

### 5. Secure Code ✅

```typescript
// GOOD: Use parameterized queries to prevent SQL injection
async function getOrdersByUser(userId: string): Promise<Order[]> {
  const query = 'SELECT * FROM orders WHERE user_id = $1';
  return await db.query(query, [userId]);
}

// GOOD: Hash passwords with salt
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Configurable cost factor
  return await bcrypt.hash(password, saltRounds);
}

// GOOD: Compare passwords securely
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// GOOD: Never log sensitive information
async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Don't log passwords!
    logger.info('User logged in', { userId: user.id, email: user.email });

    return { success: true, user };
  } catch (error) {
    logger.error('Login error', { error: error.message, email }); // Don't log password!
    throw error;
  }
}
```

### 6. Testing ✅

```typescript
// GOOD: Comprehensive test suite
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User'
      };

      const user = await userService.createUser(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).toBeDefined();
      expect(user.password).toBeUndefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw ValidationError for missing email', async () => {
      const userData = { password: 'password', name: 'Test' };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too weak
        name: 'Test'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password',
        name: 'Test'
      };

      // Mock existing user
      jest.spyOn(db.users, 'findUnique')
        .mockResolvedValue({ id: '1', email: 'existing@example.com' });

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('User already exists');
    });
  });
});
```

---

## Ejemplos de Malas Prácticas (Bad Examples)

### 1. Poor Function Names ❌

```typescript
// BAD: Unclear function name
function process() {
  // What does this do?
}

// BAD: Generic names
function handleData(data: any) {
  // What kind of data? What happens to it?
}

// BAD: Inconsistent naming
function getUserInfo(userId: string) { }
function fetchProductData(productId: string) { } // Should be getProductInfo
function retrieveOrderDetails(orderId: string) { } // Should be getOrderDetails
```

### 2. Magic Numbers Without Explanation ❌

```typescript
// BAD: Magic numbers
if (user.loginAttempts > 5) {
  user.lockAccount(900000);
}

// BAD: Unclear time calculations
const tokenExpiry = Date.now() + 3600000; // What is this?

// GOOD: Constants with clear names
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ONE_HOUR_MS = 60 * 60 * 1000;

const tokenExpiry = Date.now() + ONE_HOUR_MS;
```

### 3. No Error Handling ❌

```typescript
// BAD: No error handling
async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await db.users.create({
    data: { email, password: hashedPassword }
  });
  return user;
}

// BAD: Catching and ignoring errors
async function deleteUser(userId: string) {
  try {
    await db.users.delete({ where: { id: userId } });
  } catch (error) {
    // Silently fails - bad!
  }
}

// BAD: Generic error handling
async function getOrders(userId: string) {
  try {
    const orders = await db.orders.findMany({ where: { userId } });
    return orders;
  } catch (error) {
    throw new Error('Something went wrong'); // Not specific
  }
}
```

### 4. SQL Injection Vulnerabilities ❌

```typescript
// BAD: SQL injection vulnerability
async function getUserOrders(userId: string) {
  const query = `SELECT * FROM orders WHERE user_id = '${userId}'`;
  return await db.query(query);
}

// BAD: String concatenation with user input
async function searchProducts(searchTerm: string) {
  const query = `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`;
  return await db.query(query);
}

// GOOD: Parameterized queries
async function getUserOrders(userId: string) {
  const query = 'SELECT * FROM orders WHERE user_id = $1';
  return await db.query(query, [userId]);
}

// GOOD: Using ORMs
async function searchProducts(searchTerm: string) {
  return await db.products.findMany({
    where: {
      name: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    }
  });
}
```

### 5. Hardcoded Secrets ❌

```typescript
// BAD: Hardcoded API keys
const API_KEY = 'sk_live_1234567890abcdef';

// BAD: Hardcoded passwords
const dbPassword = 'SuperSecret123!';

// BAD: Credentials in code
const config = {
  database: {
    host: 'localhost',
    user: 'admin',
    password: 'admin123' // Never hardcode!
  }
};

// GOOD: Environment variables
const API_KEY = process.env.STRIPE_API_KEY;
const dbPassword = process.env.DATABASE_PASSWORD;

// GOOD: Config file (not in git)
const config = {
  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
};
```

### 6. No Input Validation ❌

```typescript
// BAD: No validation
async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return await db.users.create({
    data: { email, password: hashedPassword }
  });
}

// What happens with:
// - Empty email?
// - Empty password?
// - Invalid email format?
// - Password too short?

// BAD: Empty strings allowed
async function updateProfile(userId: string, name: string, bio: string) {
  return await db.users.update({
    where: { id: userId },
    data: { name, bio }
  });
}
```

### 7. Poor Variable Names ❌

```typescript
// BAD: Single letter variables
const d = new Date();
const t = d.getTime();

// BAD: Cryptic abbreviations
const usr = await getUser();
const usrNm = usr.name;

// BAD: Inconsistent naming
const userName = 'John';
const firstName = 'Jane'; // Should be userName too

// GOOD: Descriptive names
const currentDate = new Date();
const timestamp = currentDate.getTime();
const user = await getUser();
const userName = user.name;
```

### 8. Code Duplication ❌

```typescript
// BAD: Duplicated code
async function createOrder(customerId: string, productId: string) {
  const customer = await db.customers.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('Customer not found');

  const product = await db.products.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  // Create order...
}

async function createInvoice(customerId: string, productId: string) {
  const customer = await db.customers.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('Customer not found'); // DUPLICATED!

  const product = await db.products.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found'); // DUPLICATED!

  // Create invoice...
}

// GOOD: Extract common logic
async function validateCustomerAndProduct(customerId: string, productId: string) {
  const [customer, product] = await Promise.all([
    db.customers.findUnique({ where: { id: customerId } }),
    db.products.findUnique({ where: { id: productId } })
  ]);

  if (!customer) throw new Error('Customer not found');
  if (!product) throw new Error('Product not found');

  return { customer, product };
}

async function createOrder(customerId: string, productId: string) {
  const { customer, product } = await validateCustomerAndProduct(customerId, productId);
  // Create order...
}
```

### 9. No Comments on Complex Logic ❌

```typescript
// BAD: No comments on complex logic
function calculateDiscount(userType: string, orderTotal: number, orderDate: Date): number {
  let discount = 0;
  const today = new Date();
  const daysSinceOrder = (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

  if (userType === 'vip') {
    discount += 20;
    if (daysSinceOrder > 30) {
      discount += 5;
    }
  } else if (userType === 'premium') {
    discount += 10;
    if (orderTotal > 100) {
      discount += 5;
    }
  }

  return discount;
}

// GOOD: Comments explaining complex logic
function calculateDiscount(userType: string, orderTotal: number, orderDate: Date): number {
  let discount = 0;
  const today = new Date();
  const daysSinceOrder = (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

  // VIP customers get base 20% discount
  if (userType === 'vip') {
    discount += 20;

    // Additional 5% discount for orders older than 30 days
    // (loyalty bonus for waiting)
    if (daysSinceOrder > 30) {
      discount += 5;
    }
  }
  // Premium customers get base 10% discount
  else if (userType === 'premium') {
    discount += 10;

    // Additional 5% discount for orders over $100
    if (orderTotal > 100) {
      discount += 5;
    }
  }

  return discount;
}
```

### 10. Inconsistent Code Style ❌

```typescript
// BAD: Inconsistent formatting
const users=await db.users.findMany({where:{email:{contains:'@gmail.com'}});
if(users.length>0){
for(const user of users){
console.log(user)
}}
}

// BAD: Inconsistent naming conventions
const UserEmail = 'user@example.com'; // PascalCase for variable
const user_name = 'john'; // snake_case here
const UserProfile = { // PascalCase object
  firstName: 'John', // camelCase
  last_name: 'Doe' // snake_case
};

// GOOD: Consistent style
const users = await db.users.findMany({
  where: {
    email: {
      contains: '@gmail.com'
    }
  }
});

if (users.length > 0) {
  for (const user of users) {
    console.log(user);
  }
}
```

---

## Review Comment Examples

### Constructive Feedback ✅

```markdown
**Issue**: Unclear function name on line 45

**Suggestion**: Rename `process()` to `calculateUserDiscount()`

**Why**: The current name doesn't communicate what the function does, making the code harder to understand for future maintainers.

**Priority**: Nice to have (code clarity)
```

### Critical Issue ❌

```markdown
**Issue**: SQL Injection vulnerability on line 67

**Current code**:
```javascript
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

**Why**: This allows attackers to inject malicious SQL code through the email parameter.

**Suggested fix**:
```javascript
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [userEmail]);
```

**Priority**: Critical - Must fix before merge (security vulnerability)
```

### Design Feedback 💡

```markdown
**Question**: Why did you choose to store the full user object in session instead of just the user ID?

**Consideration**: Storing the entire user object could lead to stale data if the user's profile is updated after the session is created. Storing just the ID and fetching fresh data when needed is generally safer.

**Alternative approach**:
```javascript
// Store only user ID in session
session.userId = user.id;

// Fetch fresh user data when needed
const user = await getUserById(session.userId);
```

Would you consider this approach instead?
```

### Praise and Encouragement 🎉

```markdown
Excellent work on the error handling! I particularly like:

1. The specific error types (ValidationError, DatabaseError)
2. Proper error propagation
3. Comprehensive test coverage

This is a great example of defensive programming. Thanks for setting a high standard!
```

---

## Common Review Scenarios

### Scenario 1: Large PR (500+ lines)
**Approach**:
```
Hi [Author],

Thanks for your work on this feature!

**Size concern**: This PR is quite large (500+ lines across 15 files). For future PRs, consider splitting into smaller chunks (ideally <400 lines per PR).

**Current PR**: I'll review the architectural changes now and do a detailed review in a follow-up session.

**Action items**:
1. Architecture: ✅ Looks good
2. Security: Need to review line 123 more carefully
3. Performance: Review pending
4. Testing: Coverage looks good

I'll complete my review by EOD tomorrow.

Best,
[Reviewer]
```

### Scenario 2: Bug Fix PR
**Approach**:
```
Great catch on this bug!

**Testing**: Have you verified the fix works correctly? Could you add a test case for this specific scenario?

**Regression**: I don't see any obvious side effects, but please double-check that this change doesn't affect other parts of the code.

**LGTM** otherwise. Ready to merge after test case is added.
```

### Scenario 3: New Feature PR
**Approach**```
Solid implementation! A few suggestions:

1. **Documentation**: Could you add JSDoc comments for the new public functions?

2. **Error handling**: The API layer looks good, but what happens if the external service is down? Should we add retry logic?

3. **Configuration**: Hard-coded timeout (line 45). Should this be configurable?

Overall, well-structured code and good test coverage. Looking forward to seeing this in production!
```

---

**Estado**: Ejemplos documentados
**Usage**: Referencia para reviewers y authors
**Best Practice**: Learn from both good and bad examples
