import { withRetry } from '../resilience/retry.js';
import { circuitBreakerRegistry } from '../resilience/circuit-breaker-registry.js';
import type { ActivateRequest, ActivateResponse, ExecuteRequest, ExecuteResponse } from './types.js';

type Transport = (path: string, body: any, headers?: Record<string, string>) => Promise<{ ok: boolean; status: number; json: any }>;

async function defaultTransport(baseURL: string, path: string, body: any, headers?: Record<string, string>) {
  const res = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(headers || {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

export interface DaemonClientOptions {
  baseURL: string;
  apiKey?: string;
  breakerName?: string;
  transport?: Transport;
}

export class DaemonClient {
  private baseURL: string;
  private apiKey?: string;
  private transport?: Transport;
  private breakerName: string;

  constructor(opts: DaemonClientOptions) {
    this.baseURL = opts.baseURL;
    this.apiKey = opts.apiKey || process.env.SF_API_KEY;
    this.transport = opts.transport;
    this.breakerName = opts.breakerName || 'http:daemon';
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'content-type': 'application/json' };
    if (this.apiKey) h['x-api-key'] = this.apiKey;
    return h;
  }

  async activate(req: ActivateRequest): Promise<ActivateResponse> {
    const breaker = circuitBreakerRegistry.getOrCreate<any>(this.breakerName, {
      timeout: 10000,
      failureThreshold: 3,
      successThreshold: 1,
      resetTimeout: 15000,
    });
    const fn = async () => {
      const t = this.transport || ((p: string, b: any, h?: Record<string, string>) => defaultTransport(this.baseURL, p, b, h));
      const { json } = await breaker.execute(() => t('/activate', req, this.headers()));
      return json as ActivateResponse;
    };
    return withRetry(fn, { operationName: 'daemon.activate', initialDelay: 200, maxAttempts: 3, maxDelay: 2000 });
  }

  async execute(req: ExecuteRequest): Promise<ExecuteResponse> {
    const breaker = circuitBreakerRegistry.getOrCreate<any>(this.breakerName, {
      timeout: 15000,
      failureThreshold: 3,
      successThreshold: 1,
      resetTimeout: 15000,
    });
    const fn = async () => {
      const t = this.transport || ((p: string, b: any, h?: Record<string, string>) => defaultTransport(this.baseURL, p, b, h));
      const { json } = await breaker.execute(() => t('/execute', req, this.headers()));
      return json as ExecuteResponse;
    };
    return withRetry(fn, { operationName: 'daemon.execute', initialDelay: 200, maxAttempts: 3, maxDelay: 2000 });
  }
}

