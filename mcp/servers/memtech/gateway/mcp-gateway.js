/**
 * MCP GATEWAY - Wrapper para llamadas MCP REALES con timeout y manejo de errores
 * Usa el SDK oficial de MCP para conexiones reales al MemTech MCP
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export class MCPGateway {
  constructor(defaultTimeout = 5000, defaultRetries = 2, defaultRetryDelay = 1000) {
    this.client = null;
    this.defaultTimeout = defaultTimeout;
    this.defaultRetries = defaultRetries;
    this.defaultRetryDelay = defaultRetryDelay;
    // Ruta al servidor MemTech MCP
    this.memtechServerPath = join(__dirname, '..', 'scripts', 'memtech', 'mcp-server.mjs');
  }
  /**
   * MCP CALL con timeout y retries
   */
  async mcpCall(tool, params = {}, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries || this.defaultRetries;
    const retryDelay = options.retryDelay || this.defaultRetryDelay;
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        // Usar conexión MCP REAL en lugar de simulación
        const result = await this.realMCPCall(tool, params, timeout);
        return {
          success: true,
          data: result,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          console.warn(`MCP call failed (attempt ${attempt + 1}/${retries + 1}):`, error);
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      duration: 0,
    };
  }
  /**
   * MCP CALL con timeout específico
   */
  async withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
  }
  /**
   * CONEXIÓN MCP REAL - Conecta al servidor MemTech MCP usando stdio
   */
  async realMCPCall(tool, params, timeoutMs) {
    try {
      // Inicializar cliente MCP si no existe
      if (!this.client) {
        await this.initializeMCPClient();
      }
      if (!this.client) {
        throw new Error('Failed to initialize MCP client');
      }
      // Hacer llamada real al MCP
      const result = await this.client.callTool({
        name: tool,
        arguments: params,
      });
      return result;
    } catch (error) {
      console.error('MCP call failed:', error);
      throw error;
    }
  }
  /**
   * INICIALIZAR CLIENTE MCP REAL
   */
  async initializeMCPClient() {
    try {
      // Crear transporte stdio con configuración del servidor
      const transport = new StdioClientTransport({
        command: 'node',
        args: [this.memtechServerPath],
        env: {
          ...process.env,
          VICTORIA_METRICS_TOKEN: 'test-token',
        },
        cwd: process.cwd(),
      });
      // Crear cliente MCP
      this.client = new Client(
        {
          name: 'memtech-gateway-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );
      // Conectar usando stdio
      await this.client.connect(transport);
      console.log('✅ MCP Client conectado al MemTech MCP Server');
    } catch (error) {
      console.error('❌ Error inicializando cliente MCP:', error);
      throw error;
    }
  }
  /**
   * DELAY utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /**
   * HEALTH CHECK del gateway
   */
  async healthCheck() {
    try {
      const result = await this.mcpCall('memtech.health.ping', {}, { timeout: 2000 });
      return {
        status: result.success ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
      };
    }
  }
}
// Singleton instance
let mcpGateway = null;
/**
 * GET MCP GATEWAY
 */
export function getMCPGateway() {
  if (!mcpGateway) {
    mcpGateway = new MCPGateway();
  }
  return mcpGateway;
}
export default MCPGateway;
