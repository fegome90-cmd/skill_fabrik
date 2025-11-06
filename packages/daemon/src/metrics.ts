const activationBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, Infinity];
const executeBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, Infinity];

const activation = createHistogram(activationBuckets);
const execute = createHistogram(executeBuckets);
const policyDecisions = new Map<string, number>();

// Advanced metrics (F4)
const retryAttempts = new Map<string, number>();
const retrySuccesses = new Map<string, number>();
const retryExhausted = new Map<string, number>();
let cacheHits = 0;
let cacheMisses = 0;

const startTime = Date.now();
const version = process.env.npm_package_version || '0.0.0';

function createHistogram(buckets: number[]) {
  return {
    buckets: buckets.map(boundary => ({ boundary, value: 0 })),
    count: 0,
    sum: 0,
  };
}

function observe(hist: ReturnType<typeof createHistogram>, value: number) {
  hist.count += 1;
  hist.sum += value;
  for (const bucket of hist.buckets) {
    if (value <= bucket.boundary) {
      bucket.value += 1;
    }
  }
}

function formatHistogram(name: string, hist: ReturnType<typeof createHistogram>) {
  const lines: string[] = [];
  hist.buckets.forEach(bucket => {
    const suffix = bucket.boundary === Infinity ? '+Inf' : bucket.boundary;
    lines.push(`${name}_bucket{le="${suffix}"} ${bucket.value}`);
  });
  lines.push(`${name}_count ${hist.count}`);
  lines.push(`${name}_sum ${hist.sum}`);
  return lines.join('\n');
}

export function recordActivation(latencyMs: number) {
  observe(activation, Math.max(0, latencyMs));
}

export function recordExecute(latencyMs: number) {
  observe(execute, Math.max(0, latencyMs));
}

export function recordPolicyDecision(level: string, decision: string) {
  const key = `${level}:${decision}`;
  policyDecisions.set(key, (policyDecisions.get(key) || 0) + 1);
}

export function recordRetryAttempt(operation = 'generic') {
  retryAttempts.set(operation, (retryAttempts.get(operation) || 0) + 1);
}

export function recordRetrySuccess(operation = 'generic') {
  retrySuccesses.set(operation, (retrySuccesses.get(operation) || 0) + 1);
}

export function recordRetryExhausted(operation = 'generic') {
  retryExhausted.set(operation, (retryExhausted.get(operation) || 0) + 1);
}

export function recordCacheHit() {
  cacheHits += 1;
}

export function recordCacheMiss() {
  cacheMisses += 1;
}

export function renderMetrics(): string {
  const lines: string[] = [];
  lines.push('# HELP daemon_info Static daemon metadata');
  lines.push('# TYPE daemon_info gauge');
  lines.push(`daemon_info{version="${version}"} 1`);
  lines.push('# HELP daemon_uptime_seconds Seconds since daemon module initialised');
  lines.push('# TYPE daemon_uptime_seconds gauge');
  lines.push(`daemon_uptime_seconds ${(Date.now() - startTime) / 1000}`);
  lines.push('# HELP skills_activation_latency_ms Activation latency histogram (ms)');
  lines.push('# TYPE skills_activation_latency_ms histogram');
  lines.push(formatHistogram('skills_activation_latency_ms', activation));
  lines.push('# HELP skills_execute_latency_ms Execute latency histogram (ms)');
  lines.push('# TYPE skills_execute_latency_ms histogram');
  lines.push(formatHistogram('skills_execute_latency_ms', execute));
  lines.push('# HELP policy_decisions_total Policy decisions taken');
  lines.push('# TYPE policy_decisions_total counter');
  for (const [key, value] of policyDecisions.entries()) {
    const [level, decision] = key.split(':');
    lines.push(`policy_decisions_total{level="${level}",decision="${decision}"} ${value}`);
  }
  // Retry metrics
  lines.push('# HELP retry_attempts_total Retry attempts per operation');
  lines.push('# TYPE retry_attempts_total counter');
  for (const [op, val] of retryAttempts.entries()) {
    lines.push(`retry_attempts_total{operation="${op}"} ${val}`);
  }
  lines.push('# HELP retry_successes_total Retry successes per operation');
  lines.push('# TYPE retry_successes_total counter');
  for (const [op, val] of retrySuccesses.entries()) {
    lines.push(`retry_successes_total{operation="${op}"} ${val}`);
  }
  lines.push('# HELP retry_exhausted_total Retry exhaustions per operation');
  lines.push('# TYPE retry_exhausted_total counter');
  for (const [op, val] of retryExhausted.entries()) {
    lines.push(`retry_exhausted_total{operation="${op}"} ${val}`);
  }
  // Cache metrics
  lines.push('# HELP activation_cache_hits_total Cache hits on /activate');
  lines.push('# TYPE activation_cache_hits_total counter');
  lines.push(`activation_cache_hits_total ${cacheHits}`);
  lines.push('# HELP activation_cache_misses_total Cache misses on /activate');
  lines.push('# TYPE activation_cache_misses_total counter');
  lines.push(`activation_cache_misses_total ${cacheMisses}`);

  // Circuit breaker metrics (if registry available)
  try {
    // Lazy import to avoid cycles
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { circuitBreakerRegistry } = require('./resilience/circuit-breaker-registry.js');
    const all = circuitBreakerRegistry.getAllMetrics() as Record<string, any>;
    lines.push('# HELP circuit_breaker_state Circuit breaker state (0=CLOSED,1=OPEN,2=HALF_OPEN)');
    lines.push('# TYPE circuit_breaker_state gauge');
    for (const [name, m] of Object.entries(all)) {
      const state = (m as any).state === 'OPEN' ? 1 : (m as any).state === 'HALF_OPEN' ? 2 : 0;
      lines.push(`circuit_breaker_state{service="${name}"} ${state}`);
      lines.push(`# HELP circuit_breaker_total_requests Total requests seen by breaker ${name}`);
      lines.push('# TYPE circuit_breaker_total_requests counter');
      lines.push(`circuit_breaker_total_requests{service="${name}"} ${(m as any).totalRequests}`);
      lines.push('# HELP circuit_breaker_total_failures Total failures seen by breaker');
      lines.push('# TYPE circuit_breaker_total_failures counter');
      lines.push(`circuit_breaker_total_failures{service="${name}"} ${(m as any).totalFailures}`);
      lines.push('# HELP circuit_breaker_total_successes Total successes seen by breaker');
      lines.push('# TYPE circuit_breaker_total_successes counter');
      lines.push(`circuit_breaker_total_successes{service="${name}"} ${(m as any).totalSuccesses}`);
    }
  } catch {
    // registry not available; skip
  }
  return lines.join('\n') + '\n';
}

export function resetMetrics(): void {
  activation.buckets.forEach(bucket => (bucket.value = 0));
  activation.count = 0;
  activation.sum = 0;
  execute.buckets.forEach(bucket => (bucket.value = 0));
  execute.count = 0;
  execute.sum = 0;
  policyDecisions.clear();
  retryAttempts.clear();
  retrySuccesses.clear();
  retryExhausted.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
