// Minimal OTEL tracing bootstrap (feature-flagged).
// Uses dynamic imports and no hard dependency; safe when packages are absent.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let sdk: any = null;

export async function initTracing(): Promise<void> {
  if (process.env.SF_OTEL !== '1') return;
  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
    const { Resource } = require('@opentelemetry/resources');
    const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

    const serviceName = process.env.OTEL_SERVICE_NAME || 'sf-daemon';
    const exporterEndpoint = process.env.OTEL_EXPORTER_JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';

    const exporter = new JaegerExporter({ endpoint: exporterEndpoint });
    sdk = new NodeSDK({
      resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName }),
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });
    await sdk.start();
    // eslint-disable-next-line no-console
    console.log('[sf-daemon] OpenTelemetry tracing enabled');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[sf-daemon] SF_OTEL=1 but OTEL packages not installed; tracing disabled');
  }
}

export async function shutdownTracing(): Promise<void> {
  if (sdk && typeof sdk.shutdown === 'function') {
    try { await sdk.shutdown(); } catch {}
  }
}
