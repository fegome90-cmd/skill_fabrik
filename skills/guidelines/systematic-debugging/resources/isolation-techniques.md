# Técnicas de Aislamiento - Métodos para Encontrar el Componente Problemático

## Principios de Aislamiento

### 1. Reduce la Superficie de Ataque
- **Divide y vencerás**: Separa el sistema en componentes más pequeños
- **Control de variables**: Cambia una cosa a la vez
- **Reproducibilidad**: Aísla condiciones que reproducen el problema
- **Eliminación sistemática**: Descarta componentes no problemáticos

### 2. Métodos de Aislamiento por Capa

#### Aislamiento de Red
```typescript
// Test sin dependencias de red
class NetworkIsolatedService {
  constructor(private httpClient: HTTPClient) {}

  async fetchUserData(userId: string): Promise<User> {
    try {
      // Aislar llamada de red
      const response = await this.httpClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      // Log de red separado de lógica de negocio
      console.error('Network error:', error.message);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }
}

// Test con mock de red
const mockHttpClient = {
  get: jest.fn().mockResolvedValue({ data: { id: '1', name: 'John' } })
};
const service = new NetworkIsolatedService(mockHttpClient);
```

#### Aislamiento de Base de Datos
```typescript
// Patrón Repository para aislar acceso a datos
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

class ProductionUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return row ? new User(row.id, row.name, row.email) : null;
  }
}

class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}

// Testing con repository aislado
const testRepo = new InMemoryUserRepository();
await testRepo.save(new User('1', 'John', 'john@example.com'));
const service = new UserService(testRepo);
```

#### Aislamiento de Componentes UI
```typescript
// Componente aislado con props controladas
interface UserAvatarProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  onError?: (error: Error) => void;
}

export function UserAvatar({ userId, size = 'medium', onError }: UserAvatarProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchUserAvatar(userId)
      .then(setImageUrl)
      .catch(onError || console.error)
      .finally(() => setIsLoading(false));
  }, [userId, onError]);

  if (isLoading) return <AvatarSkeleton size={size} />;
  if (!imageUrl) return <DefaultAvatar size={size} />;

  return <img src={imageUrl} alt={`User ${userId}`} className={`avatar-${size}`} />;
}

// Test aislado sin dependencias de red
describe('UserAvatar', () => {
  it('should show loading state initially', () => {
    render(<UserAvatar userId="123" />);
    expect(screen.getByTestId('avatar-skeleton')).toBeInTheDocument();
  });

  it('should show image when loaded', async () => {
    const mockFetch = jest.fn().mockResolvedValue('avatar-url');
    (fetchUserAvatar as jest.Mock) = mockFetch;

    render(<UserAvatar userId="123" />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', 'avatar-url');
    });
  });
});
```

## Técnicas Específicas de Aislamiento

### 1. Binary Search Debugging

#### Para Código
```typescript
function binarySearchCodeDebug(
  codeLines: string[],
  start: number,
  end: number,
  testFn: (code: string) => boolean
): number {
  if (start >= end) return start;

  const mid = Math.floor((start + end) / 2);
  const testCode = codeLines.slice(0, mid + 1).join('\n');

  console.log(`Testing lines ${start}-${mid}`);

  if (testFn(testCode)) {
    // El bug está en la primera mitad
    return binarySearchCodeDebug(codeLines, start, mid, testFn);
  } else {
    // El bug está en la segunda mitad
    return binarySearchCodeDebug(codeLines, mid + 1, end, testFn);
  }
}

// Uso práctico
const buggyCode = `
function processUsers(users) {
  const validUsers = users.filter(u => u.age >= 18);
  const processed = validUsers.map(u => ({...u, processed: true}));
  return processed;
}
`;

const lines = buggyCode.split('\n');
const bugLine = binarySearchCodeDebug(
  lines,
  0,
  lines.length - 1,
  (code) => {
    try {
      eval(code);
      return false; // No hay bug
    } catch (error) {
      return true; // Hay bug
    }
  }
);

console.log(`Bug found around line ${bugLine}`);
```

#### Para Features
```typescript
class FeatureIsolator {
  private features: Map<string, boolean> = new Map();

  enableFeature(feature: string): void {
    this.features.set(feature, true);
  }

  disableFeature(feature: string): void {
    this.features.set(feature, false);
  }

  runWithFeatures<T>(enabledFeatures: string[], callback: () => T): T {
    // Reset all features
    this.features.clear();

    // Enable only specified features
    enabledFeatures.forEach(feature => this.features.set(feature, true));

    return callback();
  }

  isFeatureEnabled(feature: string): boolean {
    return this.features.get(feature) || false;
  }
}

// Binary search en features
const isolator = new FeatureIsolator();
const allFeatures = ['auth', 'logging', 'caching', 'validation', 'notifications'];

function findProblematicFeature(): string | null {
  let start = 0;
  let end = allFeatures.length - 1;

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const testFeatures = allFeatures.slice(start, mid + 1);

    console.log(`Testing features: ${testFeatures.join(', ')}`);

    const hasBug = isolator.runWithFeatures(testFeatures, () => {
      return runApplicationTests();
    });

    if (hasBug) {
      if (start === end) return testFeatures[0];
      end = mid;
    } else {
      start = mid + 1;
    }
  }

  return null;
}
```

### 2. Dependency Injection para Aislamiento

#### Constructor Injection
```typescript
interface Logger {
  log(message: string): void;
  error(error: Error): void;
}

interface Database {
  query(sql: string, params?: any[]): Promise<any>;
}

class UserService {
  constructor(
    private db: Database,
    private logger: Logger,
    private emailService: EmailService
  ) {}

  async createUser(userData: UserData): Promise<User> {
    try {
      this.logger.log(`Creating user: ${userData.email}`);

      const result = await this.db.query(
        'INSERT INTO users (email, name) VALUES (?, ?)',
        [userData.email, userData.name]
      );

      const user = new User(result.insertId, userData.email, userData.name);

      await this.emailService.sendWelcomeEmail(user.email);

      this.logger.log(`User created successfully: ${user.id}`);
      return user;

    } catch (error) {
      this.logger.error(error as Error);
      throw error;
    }
  }
}

// Tests con dependencias aisladas
const mockDb = {
  query: jest.fn().mockResolvedValue({ insertId: 123 })
};
const mockLogger = {
  log: jest.fn(),
  error: jest.fn()
};
const mockEmailService = {
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined)
};

const service = new UserService(mockDb, mockLogger, mockEmailService);
```

#### Property Injection
```typescript
class ConfigurableService {
  private config: ServiceConfig = defaultConfig;

  setConfig(config: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ServiceConfig {
    return this.config;
  }

  async processData(data: any): Promise<any> {
    if (this.config.enableValidation && !this.isValid(data)) {
      throw new Error('Invalid data');
    }

    if (this.config.enableCaching) {
      return this.getCachedOrProcess(data);
    }

    return this.processDirectly(data);
  }
}

// Test aislando configuración específica
const service = new ConfigurableService();
service.setConfig({
  enableValidation: true,
  enableCaching: false,
  timeout: 5000
});
```

### 3. Mocking y Stubbing

#### Function Mocking
```typescript
// Original problemático
function processPayment(amount: number, cardInfo: CardInfo): Promise<PaymentResult> {
  return paymentGateway.charge(amount, cardInfo);
}

// Versión con mocking para debugging
class PaymentProcessor {
  constructor(
    private gateway: PaymentGateway,
    private validator: CardValidator,
    private logger: Logger
  ) {}

  async processPayment(amount: number, cardInfo: CardInfo): Promise<PaymentResult> {
    this.logger.log(`Processing payment: $${amount}`);

    if (!this.validator.isValid(cardInfo)) {
      throw new Error('Invalid card information');
    }

    try {
      const result = await this.gateway.charge(amount, cardInfo);
      this.logger.log(`Payment successful: ${result.transactionId}`);
      return result;
    } catch (error) {
      this.logger.error(`Payment failed: ${error.message}`);
      throw error;
    }
  }
}

// Mocks para testing
const mockGateway = {
  charge: jest.fn()
    .mockResolvedValueOnce({ transactionId: '123', status: 'success' })
    .mockRejectedValueOnce(new Error('Insufficient funds'))
};

const mockValidator = {
  isValid: jest.fn().mockReturnValue(true)
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn()
};
```

#### Time/Date Mocking
```typescript
class TimeSensitiveService {
  constructor(private timeProvider: TimeProvider) {}

  isBusinessHours(): boolean {
    const now = this.timeProvider.now();
    const hour = now.getHours();
    return hour >= 9 && hour <= 17;
  }

  isWeekend(): boolean {
    const now = this.timeProvider.now();
    const day = now.getDay();
    return day === 0 || day === 6;
  }
}

interface TimeProvider {
  now(): Date;
}

// Provider para testing
class MockTimeProvider implements TimeProvider {
  constructor(private fixedDate: Date) {}

  now(): Date {
    return this.fixedDate;
  }

  advanceHours(hours: number): void {
    this.fixedDate = new Date(this.fixedDate.getTime() + hours * 60 * 60 * 1000);
  }
}

// Testing con tiempo controlado
const monday9am = new Date('2023-01-02T09:00:00');
const timeProvider = new MockTimeProvider(monday9am);
const service = new TimeSensitiveService(timeProvider);

expect(service.isBusinessHours()).toBe(true);
expect(service.isWeekend()).toBe(false);

timeProvider.advanceHours(10); // Ahora son 7pm
expect(service.isBusinessHours()).toBe(false);
```

### 4. Environment Isolation

#### Configuration Isolation
```typescript
interface AppConfig {
  databaseUrl: string;
  redisUrl: string;
  enableFeatureX: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class App {
  constructor(private config: AppConfig) {}

  async initialize(): Promise<void> {
    if (this.config.enableFeatureX) {
      await this.initializeFeatureX();
    }
  }
}

// Configurations para diferentes escenarios
const developmentConfig: AppConfig = {
  databaseUrl: 'postgresql://localhost:5432/dev_db',
  redisUrl: 'redis://localhost:6379',
  enableFeatureX: true,
  logLevel: 'debug'
};

const productionConfig: AppConfig = {
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  enableFeatureX: false,
  logLevel: 'info'
};

const testConfig: AppConfig = {
  databaseUrl: 'sqlite::memory:',
  redisUrl: 'redis://localhost:6379/1',
  enableFeatureX: true,
  logLevel: 'error'
};
```

#### Database Isolation
```typescript
class DatabaseIsolator {
  private connections: Map<string, Database> = new Map();

  async getIsolatedConnection(name: string): Promise<Database> {
    if (!this.connections.has(name)) {
      const db = await this.createIsolatedDatabase(name);
      this.connections.set(name, db);
      await this.seedDatabase(db, name);
    }
    return this.connections.get(name)!;
  }

  private async createIsolatedDatabase(name: string): Promise<Database> {
    // Crear base de datos única para el test
    const dbName = `test_${name}_${Date.now()}`;
    await this.createDatabase(dbName);
    return this.connectToDatabase(dbName);
  }

  private async seedDatabase(db: Database, name: string): Promise<void> {
    // Cargar datos específicos para el escenario de test
    const seedData = await this.loadSeedData(name);
    await db.insert(seedData);
  }

  async cleanup(name: string): Promise<void> {
    if (this.connections.has(name)) {
      const db = this.connections.get(name)!;
      await db.close();
      await this.dropDatabase(db.name);
      this.connections.delete(name);
    }
  }
}

// Uso en tests
describe('UserService', () => {
  let isolator: DatabaseIsolator;
  let db: Database;

  beforeEach(async () => {
    isolator = new DatabaseIsolator();
    db = await isolator.getIsolatedConnection('user_service_test');
  });

  afterEach(async () => {
    await isolator.cleanup('user_service_test');
  });

  it('should create user successfully', async () => {
    const service = new UserService(db);
    const user = await service.create({ name: 'John', email: 'john@test.com' });

    expect(user.id).toBeDefined();

    const savedUser = await db.users.findById(user.id);
    expect(savedUser.name).toBe('John');
  });
});
```

### 5. Network Isolation

#### Service Virtualization
```typescript
class MockHTTPServer {
  private app: Express;
  private server: Server | null = null;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/api/users/:id', (req, res) => {
      const { id } = req.params;
      if (id === '404') {
        res.status(404).json({ error: 'User not found' });
      } else if (id === '500') {
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ id, name: `User ${id}`, email: `user${id}@test.com` });
      }
    });

    this.app.post('/api/users', express.json(), (req, res) => {
      const { name, email } = req.body;
      if (!name || !email) {
        res.status(400).json({ error: 'Missing required fields' });
      } else {
        res.status(201).json({ id: Date.now(), name, email });
      }
    });
  }

  async start(port: number = 0): Promise<string> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        const address = this.server!.address() as AddressInfo;
        resolve(`http://localhost:${address.port}`);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(resolve);
      });
    }
  }
}

// Test con servidor virtualizado
describe('UserService with real HTTP', () => {
  let mockServer: MockHTTPServer;
  let serverUrl: string;

  beforeAll(async () => {
    mockServer = new MockHTTPServer();
    serverUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  it('should handle user not found', async () => {
    const client = new HTTPClient(serverUrl);
    const service = new UserService(client);

    await expect(service.getUserById('404')).rejects.toThrow('User not found');
  });
});
```

## Checklist de Aislamiento

### Preparación
- [ ] Identificar todas las dependencias del componente
- [ ] Crear mocks/stubs para dependencias externas
- [ ] Configurar entorno de testing aislado
- [ ] Establecer datos de prueba controlados

### Ejecución
- [ ] Ejecutar tests con dependencias aisladas
- [ ] Verificar que el problema persiste/solo ocurre con ciertas dependencias
- [ ] Documentar qué dependencias son problemáticas
- [ ] Confirmar que el aislamiento no introduce nuevos problemas

### Validación
- [ ] El componente funciona en aislamiento
- [ ] Las dependencias problemáticas están identificadas
- [ ] Los tests son reproducibles y consistentes
- [ ] La solución puede implementarse sin efectos secundarios