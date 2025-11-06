/**
 * Authentication Middleware
 * Task: SF-STABILITY-2025-T3.1
 * Date: 2025-11-05
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * API Key authentication middleware
 */
export async function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string;
  const expectedApiKey = process.env.SF_API_KEY;

  // If no API key is configured, allow all requests (development mode)
  if (!expectedApiKey) {
    return;
  }

  // Check if API key is provided
  if (!apiKey) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required'
      }
    });
    return;
  }

  // Validate API key
  if (apiKey !== expectedApiKey) {
    reply.code(403).send({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key'
      }
    });
    return;
  }

  // API key is valid, continue
}

/**
 * Optional API key authentication (logs warning but doesn't block)
 */
export async function optionalApiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string;
  const expectedApiKey = process.env.SF_API_KEY;

  if (expectedApiKey && !apiKey) {
    // Log warning but don't block
    (request as any).log?.warn?.('Request without API key');
  }
}

/**
 * IP whitelist middleware
 */
export function createIpWhitelist(allowedIps: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const clientIp = request.ip;

    // Always allow localhost
    const localhostIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    if (localhostIps.includes(clientIp)) {
      return;
    }

    // Check whitelist
    if (!allowedIps.includes(clientIp)) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Your IP address is not allowed to access this resource'
        }
      });
      return;
    }
  };
}

