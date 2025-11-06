import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

type Span = { setAttribute: (k: string, v: unknown) => void; end: () => void } | undefined;

let api: any = null;
function getApi(): any | null {
  if (api !== null) return api;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    api = require('@opentelemetry/api');
    return api;
  } catch {
    api = null;
    return null;
  }
}

export async function withSpan<T>(
  name: string,
  attrs: Record<string, unknown>,
  fn: (span?: Span) => Promise<T> | T
): Promise<T> {
  const otel = getApi();
  if (!otel) return await fn(undefined);
  const tracer = otel.trace.getTracer('sf-daemon');
  return await tracer.startActiveSpan(name, async (span: any) => {
    try {
      for (const [k, v] of Object.entries(attrs)) span.setAttribute(k, v as any);
      const result = await fn(span as Span);
      span.end();
      return result;
    } catch (e) {
      try { span.recordException?.(e); } catch {}
      span.end();
      throw e;
    }
  });
}

