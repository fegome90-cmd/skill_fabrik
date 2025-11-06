# /route-research-for-testing

[K:TESTING-STRATEGY] [C:ROUTE-ANALYSIS] [U:QA-WORKFLOW]

Research routes and generate comprehensive testing strategies for API endpoints and application routes. Analyzes route structure and creates detailed testing plans.

## Usage

```bash
/route-research-for-testing <route-pattern> [options]
```

## Options

- `--endpoint=<url>` - Specific endpoint to analyze
- `--method=<method>` - HTTP method to focus on (GET, POST, PUT, DELETE)
- `--depth=<level>` - Analysis depth (shallow|medium|deep)
- `--format=<type>` - Output format (markdown|json|test-plan)

## Examples

```bash
# Research all API routes
/route-research-for-testing api/users

# Analyze specific endpoint
/route-research-for-testing --endpoint=/api/auth/login

# Focus on POST methods
/route-research-for-testing api/orders --method=POST

# Deep analysis with test plan output
/route-research-for-testing api/* --depth=deep --format=test-plan
```

## Implementation

This command uses the Skills Fabric slash commands system for intelligent route analysis:

1. **Route Discovery** - Identifies all available routes and endpoints
2. **Pattern Analysis** - Analyzes URL patterns and structures
3. **Parameter Mapping** - Documents route parameters and requirements
4. **Test Strategy Generation** - Creates comprehensive testing approaches
5. **Coverage Analysis** - Ensures complete test coverage

## Research Categories

### 🔍 Route Analysis
- Endpoint discovery and mapping
- HTTP method documentation
- Parameter identification
- Response structure analysis

### 🧪 Testing Strategy
- Unit test recommendations
- Integration test scenarios
- Edge case identification
- Performance test planning

### 🔒 Security Testing
- Authentication requirement analysis
- Authorization testing scenarios
- Input validation testing
- Security vulnerability assessment

### 📊 Coverage Planning
- Test case prioritization
- Risk-based testing approach
- Coverage gap identification
- Test matrix generation

## Analysis Types

### Shallow Analysis
- Basic route structure documentation
- HTTP method identification
- Simple parameter mapping
- Basic test recommendations

### Medium Analysis
- Detailed parameter validation
- Response structure analysis
- Integration point identification
- Comprehensive test scenarios

### Deep Analysis
- Security vulnerability assessment
- Performance bottleneck identification
- Complex interaction mapping
- Advanced testing strategies

## Output Formats

### Markdown Report
- Structured documentation
- Visual route mapping
- Test scenario descriptions
- Implementation recommendations

### JSON Data
- Machine-readable route data
- Test automation integration
- API documentation format
- Tool integration ready

### Test Plan
- Detailed test procedures
- Step-by-step instructions
- Expected results documentation
- Test data requirements

## Command Execution

```bash
node packages/skills-cli/dist/index.js / route-research-for-testing {{args}}
```

Or if installed globally:

```bash
skills-cli / route-research-for-testing {{args}}
```

---

[EVIDENCIA]
- Intelligent route discovery algorithms
- Multi-dimensional testing strategy generation
- Security-focused analysis capabilities
- Comprehensive coverage assessment
- Tool integration ready output formats

[PROPUESTA]
- Integrar con más herramientas de análisis de API
- Agregar soporte para GraphQL y WebSockets
- Implementar modo de análisis automatizado
- Crear dashboard de métricas de testing
- Integrar con sistemas de CI/CD testing