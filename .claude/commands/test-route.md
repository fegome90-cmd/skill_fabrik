# /test-route

[K:TESTING-AUTOMATION] [C:ROUTE-VALIDATION] [U:QA-WORKFLOW]

Execute comprehensive automated tests on specific routes and endpoints. Performs functional, security, and performance testing with detailed reporting.

## Usage

```bash
/test-route <route> [options]
```

## Options

- `--method=<method>` - HTTP method to test (GET, POST, PUT, DELETE, PATCH)
- `--data=<file>` - Request body data file
- `--headers=<file>` - Custom headers file
- `--auth=<type>` - Authentication type (bearer|basic|none)
- `--timeout=<ms>` - Request timeout in milliseconds
- `--verbose` - Show detailed test output

## Examples

```bash
# Test GET endpoint
/test-route /api/users

# Test POST with data
/test-route /api/users --method=POST --data=test-user.json

# Test with authentication
/test-route /api/admin/users --method=GET --auth=bearer

# Verbose testing with timeout
/test-route /api/slow-endpoint --timeout=5000 --verbose
```

## Implementation

This command leverages the Skills Fabric slash commands system for comprehensive route testing:

1. **Route Validation** - Verifies endpoint accessibility and functionality
2. **Functional Testing** - Tests expected behaviors and responses
3. **Security Assessment** - Validates authentication and authorization
4. **Performance Analysis** - Measures response times and resource usage
5. **Error Handling** - Tests edge cases and error scenarios

## Test Categories

### ✅ Functional Testing
- Happy path scenarios
- Input validation testing
- Response structure validation
- Business logic verification

### 🔒 Security Testing
- Authentication requirement validation
- Authorization testing
- Input sanitization verification
- Common vulnerability checks

### ⚡ Performance Testing
- Response time measurement
- Load handling assessment
- Resource usage monitoring
- Scalability testing

### 🛡️ Error Testing
- Invalid input handling
- Network error simulation
- Timeout behavior verification
- Graceful degradation testing

## Test Scenarios

### Standard Tests
- Basic connectivity
- Expected response codes
- Response format validation
- Performance benchmarks

### Advanced Tests
- Concurrent request handling
- Large data payload testing
- Network condition simulation
- Authentication edge cases

### Integration Tests
- Database interaction validation
- External service dependency testing
- Cache behavior verification
- Session management testing

## Output Format

The command provides comprehensive test results including:
- Test execution summary
- Performance metrics
- Security assessment results
- Error condition analysis
- Recommendations for improvements

## Command Execution

```bash
node packages/skills-cli/dist/index.js / test-route {{args}}
```

Or if installed globally:

```bash
skills-cli / test-route {{args}}
```

---

[EVIDENCIA]
- Comprehensive test automation framework
- Multi-dimensional testing capabilities
- Real-time performance monitoring
- Security-focused test scenarios
- Detailed reporting with actionable insights

[PROPUESTA]
- Integrar con más frameworks de testing
- Agregar soporte para testing de carga
- Implementar modo de testing visual
- Crear dashboard de métricas de tests
- Integrar con sistemas de monitorización