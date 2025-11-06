# MemTech MCP Adapter - Troubleshooting Guide

Based on ADR patterns from startkit-main (ADR-064, ADR-065).

## Common Issues

### 0. ChromaDB Pydantic 2.x Compatibility Issue

**Symptom**: `PydanticImportError: BaseSettings has been moved to pydantic-settings` or `ValidationError: 70 validation errors for Settings`

**Cause**: ChromaDB 0.3.23 is not fully compatible with Pydantic 2.x. The Settings class tries to validate all environment variables against a strict schema.

**Solutions**:

**Option 1: Use Virtual Environment (Recommended)**
```bash
# Create a virtual environment
python3 -m venv chromadb-env
source chromadb-env/bin/activate

# Install ChromaDB with Pydantic 1.x
pip install 'pydantic<2.0' 'chromadb<0.4.0' python-dotenv

# Use the virtual environment's Python for the bridge
# Update chroma-wrapper.mjs to use: chromadb-env/bin/python3
```

**Option 2: System-wide with Pydantic 2.x (Complex)**
- The `python-bridge.py` includes monkey-patches for Pydantic 2.x compatibility
- However, Settings validation may still fail
- Recommended: Use Option 1 for production

**Option 3: Upgrade ChromaDB (Future)**
```bash
# When compatible versions are available
pip install chromadb>=0.4.22 --break-system-packages
```

**Workaround**: For now, L3 (ChromaDB) storage may be unavailable. L0, L1, and L2 (Redis and PostgreSQL) will continue to work.

### 1. Redis Connection Failures

**Symptom**: `Failed to set L1 item after 3 attempts: Connection refused`

**Causes**:
- Redis not running
- Wrong port configuration
- Firewall blocking connection
- Wrong password

**Solutions**:
```bash
# Check if Redis is running
redis-cli -p 6381 ping
# Expected: PONG

# Verify port
netstat -an | grep 6381

# Test connection manually
redis-cli -h localhost -p 6381 -a <password> ping
```

**Configuration fix**:
```bash
# Set correct environment variables
export REDIS_URL_CORE=redis://localhost:6381
export MEMTECH_REDIS_CORE_PASSWORD=<password-if-needed>
```

### 2. Configuration Validation Errors

**Symptom**: `Configuration errors: REDIS_URL_CORE or MEMTECH_REDIS_CORE_HOST must be set`

**Solution**:
```typescript
import { validateConfig } from '@skills-fabrik/mcp-adapters';

const validation = validateConfig();
if (!validation.valid) {
  console.error('Fix these errors:', validation.errors);
}
```

### 3. Max Reconnection Attempts Reached

**Symptom**: `Max reconnection attempts (10) reached`

**Causes**:
- Redis server is down
- Network issues
- Configuration incorrect

**Solutions**:
1. Verify Redis is running: `redis-cli -p 6381 ping`
2. Check network connectivity
3. Verify configuration with `validateConfig()`
4. Check Redis logs for errors

### 4. Health Check Timeout

**Symptom**: `Health check timeout`

**Causes**:
- Redis server overloaded
- Network latency
- Timeout too short

**Solutions**:
- Check Redis server load
- Increase timeout in code (if needed)
- Check network latency

## Diagnostic Commands

### Test Connection
```typescript
import { testConnection } from '@skills-fabrik/mcp-adapters';

const health = await testConnection();
console.log(health);
// { connected: true, latency: 2 } or { connected: false, error: '...' }
```

### Validate Configuration
```typescript
import { validateConfig } from '@skills-fabrik/mcp-adapters';

const validation = validateConfig();
console.log(validation);
```

### Test L1 Operations
```typescript
import { setL1Item, getL1Item } from '@skills-fabrik/mcp-adapters';

// Store test item
await setL1Item('test-key', 'test-value', 60);

// Retrieve test item
const value = await getL1Item('test-key');
console.log('Retrieved:', value); // Should be 'test-value'
```

## Performance Issues

### High Latency

**Check**:
1. Redis server load: `redis-cli -p 6381 info stats`
2. Network latency: `ping localhost`
3. Redis memory usage: `redis-cli -p 6381 info memory`

**Solutions**:
- Optimize Redis configuration (see ADR-012)
- Check for memory pressure
- Consider Redis clustering for high load

### Connection Pool Exhaustion

**Symptom**: Connection hangs or timeouts

**Solutions**:
- Increase connection pool size
- Implement connection reuse
- Check for connection leaks

## Recovery Procedures

Based on ADR-014 and ADR-065 patterns:

### 1. Restart Redis Client

```typescript
import { closeRedisConnection } from '@skills-fabrik/mcp-adapters';

// Close current connection
await closeRedisConnection();

// Next operation will create new connection
```

### 2. Full System Recovery

```bash
# 1. Check Redis status
redis-cli -p 6381 ping

# 2. Check Redis configuration
redis-cli -p 6381 CONFIG GET "*"

# 3. Test connectivity
curl -v redis://localhost:6381

# 4. Restart Redis if needed
# (depends on your setup)
```

### 3. Verify Snapshot Storage

```typescript
import { getL1Item } from '@skills-fabrik/mcp-adapters';

// Check if snapshot exists
const snapshot = await getL1Item('your-snapshot-id');
if (!snapshot) {
  console.warn('Snapshot not found - may have expired (24h TTL)');
}
```

## Prevention

Based on ADR patterns, implement these checks:

1. **Pre-flight checks**: Always validate config and test connection before operations
2. **Health monitoring**: Use `testConnection()` periodically
3. **Graceful degradation**: Handle Redis unavailability gracefully
4. **Configuration validation**: Validate on startup with `validateConfig()`

## Getting Help

If issues persist:
1. Check logs for detailed error messages
2. Run diagnostic commands above
3. Verify Redis server is healthy
4. Check network connectivity
5. Review ADRs: ADR-012, ADR-014, ADR-019, ADR-064, ADR-065

