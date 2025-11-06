# Grafana Setup (Daemon Metrics)

- Datasource: Prometheus (point to your Prometheus endpoint scraping the daemon's `/metrics`).
- Import dashboard: `local/grafana/dashboards/daemon-metrics.json`.
- Panels included:
  - Activation latency (count)
  - Activation latency P95
  - Activation cache hits/misses
  - Retry attempts/success/exhausted (by operation)
  - Circuit breaker state per service

Notes
- Update the datasource UID in the dashboard to your Prometheus DS (replace `PROMETHEUS_DS` if needed).
- The daemon exposes metrics at `GET /metrics`.
- Extend the dashboard with additional panels as needed (P95 latency, policy decisions, etc.).
  - Example P95: `histogram_quantile(0.95, sum by (le) (rate(skills_activation_latency_ms_bucket[5m])))`
