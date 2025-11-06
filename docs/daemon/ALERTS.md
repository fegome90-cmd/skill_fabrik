# Prometheus Alerting Rules (Examples)

Create a Prometheus rules file (e.g., `alerts-daemon.yml`) and load it in your Prometheus config. Adjust labels/selectors as needed.

```yaml
groups:
  - name: sf-daemon-alerts
    rules:
      - alert: DaemonHighP95ActivationLatency
        expr: histogram_quantile(0.95, sum by (le) (rate(skills_activation_latency_ms_bucket[5m]))) > 250
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High P95 activation latency"
          description: "P95 activation latency above 250ms for 10m."

      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker OPEN"
          description: "Service {{ $labels.service }} breaker OPEN for 5m."

      - alert: RetryExhaustedSpike
        expr: increase(retry_exhausted_total[10m]) > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Retry exhausted spike"
          description: "More than 10 exhausted retries in 10m (all operations)."
```

Notes
- Tune thresholds for your environment.
- Add routing/receivers in Alertmanager for paging or Slack.
- Consider additional alerts (cache miss ratio, error rate) as you grow.
