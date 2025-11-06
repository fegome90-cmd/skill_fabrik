/**
 * Service Discovery HTTP Server
 *
 * REST API for service registration, discovery, and management
 */

import Fastify, { FastifyInstance } from 'fastify';
import { ServiceDiscovery, ServiceDiscoveryConfig } from './service-discovery.js';
import { ServiceInfo, ServiceRegistration, ServiceQuery } from './service-registry.js';

export interface DiscoveryServerConfig {
  port: number;
  host: string;
  cors: boolean;
  logging: boolean;
}

export class ServiceDiscoveryServer {
  private server: FastifyInstance;
  private discovery: ServiceDiscovery;
  private config: DiscoveryServerConfig;

  constructor(
    discoveryConfig: Partial<ServiceDiscoveryConfig> = {},
    serverConfig: Partial<DiscoveryServerConfig> = {}
  ) {
    this.config = {
      port: 8877,
      host: '127.0.0.1',
      cors: true,
      logging: true,
      ...serverConfig
    };

    this.discovery = new ServiceDiscovery(discoveryConfig);
    this.server = Fastify({
      logger: this.config.logging
    });

    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup server routes
   */
  private setupRoutes(): void {
    // Enable CORS if configured
    if (this.config.cors) {
      this.server.register(import('@fastify/cors'));
    }

    // Health check endpoint
    this.server.get('/health', async (request, reply) => {
      const stats = await this.discovery.getServiceStats();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'service-discovery',
        version: '1.0.0',
        uptime: process.uptime(),
        stats
      };
    });

    // Service registration
    this.server.post('/services/register', async (request, reply) => {
      try {
        const registration = request.body as ServiceRegistration;

        if (!registration.service || !registration.service.name) {
          return reply.code(400).send({
            success: false,
            error: 'Invalid service registration data'
          });
        }

        await this.discovery.registerService(registration);

        return reply.code(201).send({
          success: true,
          message: `Service ${registration.service.name} registered successfully`,
          service: registration.service.name
        });

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed'
        });
      }
    });

    // Service deregistration
    this.server.delete('/services/:serviceName', async (request, reply) => {
      try {
        const { serviceName } = request.params as { serviceName: string };

        await this.discovery.deregisterService(serviceName);

        return {
          success: true,
          message: `Service ${serviceName} deregistered successfully`
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Deregistration failed'
        });
      }
    });

    // Service discovery
    this.server.get('/services/:serviceName', async (request, reply) => {
      try {
        const { serviceName } = request.params as { serviceName: string };
        const includeEndpoints = (request.query as { endpoints?: string }).endpoints === 'true';

        const service = await this.discovery.discoverService(serviceName);

        if (!service) {
          return reply.code(404).send({
            success: false,
            error: `Service ${serviceName} not found`
          });
        }

        const response: any = {
          success: true,
          service
        };

        if (includeEndpoints) {
          response.endpoints = await this.discovery.getServiceEndpoints(serviceName);
        }

        return response;

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Discovery failed'
        });
      }
    });

    // Get service endpoint (load balanced)
    this.server.get('/services/:serviceName/endpoint', async (request, reply) => {
      try {
        const { serviceName } = request.params as { serviceName: string };

        const endpoint = await this.discovery.getServiceEndpoint(serviceName);

        if (!endpoint) {
          return reply.code(404).send({
            success: false,
            error: `No healthy endpoints found for service ${serviceName}`
          });
        }

        return {
          success: true,
          endpoint
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Endpoint discovery failed'
        });
      }
    });

    // Service health check
    this.server.get('/services/:serviceName/health', async (request, reply) => {
      try {
        const { serviceName } = request.params as { serviceName: string };

        const isHealthy = await this.discovery.checkServiceHealth(serviceName);

        return {
          success: true,
          serviceName,
          healthy: isHealthy,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Health check failed'
        });
      }
    });

    // Service heartbeat/refresh
    this.server.post('/services/:serviceName/heartbeat', async (request, reply) => {
      try {
        const { serviceName } = request.params as { serviceName: string };

        const success = await this.discovery.refreshService(serviceName);

        if (success) {
          return {
            success: true,
            message: `Service ${serviceName} heartbeat received`
          };
        } else {
          return reply.code(404).send({
            success: false,
            error: `Service ${serviceName} not found`
          });
        }

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Heartbeat failed'
        });
      }
    });

    // Query services
    this.server.post('/services/query', async (request, reply) => {
      try {
        const query = request.body as ServiceQuery;

        const services = await this.discovery.queryServices(query);

        return {
          success: true,
          query,
          services,
          count: services.length
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Query failed'
        });
      }
    });

    // List all services
    this.server.get('/services', async (request, reply) => {
      try {
        const healthyOnly = (request.query as { healthy?: string }).healthy === 'true';

        let services;
        if (healthyOnly) {
          services = await this.discovery.getHealthyServices();
        } else {
          services = await this.discovery.getRegistry().getAllServices();
        }

        return {
          success: true,
          services,
          count: services.length,
          healthyOnly
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list services'
        });
      }
    });

    // Get service statistics
    this.server.get('/stats', async (request, reply) => {
      try {
        const stats = await this.discovery.getServiceStats();

        return {
          success: true,
          timestamp: new Date().toISOString(),
          stats
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get statistics'
        });
      }
    });

    // Get configuration
    this.server.get('/config', async (request, reply) => {
      try {
        return {
          success: true,
          config: this.discovery.getConfig()
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get configuration'
        });
      }
    });

    // Update configuration
    this.server.patch('/config', async (request, reply) => {
      try {
        const updates = request.body as Partial<ServiceDiscoveryConfig>;

        this.discovery.updateConfig(updates);

        return {
          success: true,
          message: 'Configuration updated successfully',
          config: this.discovery.getConfig()
        };

      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Configuration update failed'
        });
      }
    });

    // Root endpoint with API information
    this.server.get('/', async (request, reply) => {
      return {
        service: 'service-discovery',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: 'GET /health',
          register: 'POST /services/register',
          deregister: 'DELETE /services/:serviceName',
          discover: 'GET /services/:serviceName',
          endpoint: 'GET /services/:serviceName/endpoint',
          healthCheck: 'GET /services/:serviceName/health',
          heartbeat: 'POST /services/:serviceName/heartbeat',
          query: 'POST /services/query',
          list: 'GET /services',
          stats: 'GET /stats',
          config: 'GET|PATCH /config'
        }
      };
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.setErrorHandler((error, request, reply) => {
      console.error('❌ Service Discovery Server Error:', error);

      reply.code(500).send({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url
      });
    });

    this.server.setNotFoundHandler((request, reply) => {
      reply.code(404).send({
        success: false,
        error: 'Endpoint not found',
        path: request.url,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /services',
          'POST /services/register',
          'GET /services/:serviceName',
          'GET /stats'
        ]
      });
    });
  }

  /**
   * Start the discovery server
   */
  async start(): Promise<void> {
    try {
      await this.server.listen({
        port: this.config.port,
        host: this.config.host
      });

      console.log(`🔍 Service Discovery server started on http://${this.config.host}:${this.config.port}`);
      console.log(`📊 API documentation: http://${this.config.host}:${this.config.port}/`);
      console.log(`🏥 Health check: http://${this.config.host}:${this.config.port}/health`);

    } catch (error) {
      console.error('❌ Failed to start service discovery server:', error);
      throw error;
    }
  }

  /**
   * Stop the discovery server
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
      this.discovery.destroy();
      console.log('🔌 Service discovery server stopped');
    } catch (error) {
      console.error('❌ Failed to stop service discovery server:', error);
      throw error;
    }
  }

  /**
   * Get discovery instance for direct access
   */
  getDiscovery(): ServiceDiscovery {
    return this.discovery;
  }

  /**
   * Get server instance
   */
  getServer(): FastifyInstance {
    return this.server;
  }
}

// Export utility function for easy startup
export async function startDiscoveryServer(
  discoveryConfig?: Partial<ServiceDiscoveryConfig>,
  serverConfig?: Partial<DiscoveryServerConfig>
): Promise<ServiceDiscoveryServer> {
  const server = new ServiceDiscoveryServer(discoveryConfig, serverConfig);
  await server.start();
  return server;
}