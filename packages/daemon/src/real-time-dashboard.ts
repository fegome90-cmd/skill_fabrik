/**
 * Real-time Monitoring Dashboard
 *
 * Dashboard web interactivo con métricas en tiempo real del sistema Skills Fabric
 * Integración con KPI aggregator, advanced quality gates, y métricas del pipeline
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, resolve } from 'path';
import { KPIAggregator, type KPISummary, type KPIEvent } from '@skills-fabrik/kpi';
import { WebSocketServer, WebSocket } from 'ws';
import fetch from 'node-fetch';

export interface DashboardConfig {
  port?: number;
  wsPort?: number;
  updateInterval?: number; // ms
  dataRetention?: number; // hours
}

export interface RealtimeMetrics {
  timestamp: number;
  kpi: KPISummary | null;
  qualityGates: Array<{
    project: string;
    score: number;
    grade: string;
    passed: number;
    total: number;
    timestamp: number;
  }>;
  systemHealth: {
    router: boolean;
    daemon: boolean;
    serviceDiscovery: boolean;
    lastCheck: number;
  };
  pipeline: {
    activeOperations: number;
    totalOperations: number;
    successRate: number;
    avgLatency: number;
    errorsInLastHour: number;
  };
}

export class RealtimeDashboard {
  private server: any;
  private wsServer: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private metrics: RealtimeMetrics;
  private kpiAggregator: KPIAggregator;
  private config: Required<DashboardConfig>;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(config: DashboardConfig = {}) {
    this.config = {
      port: config.port || 8888,
      wsPort: config.wsPort || 8889,
      updateInterval: config.updateInterval || 5000, // 5 segundos
      dataRetention: config.dataRetention || 24, // 24 horas
    };

    this.kpiAggregator = new KPIAggregator();
    this.wsServer = new WebSocketServer({ port: this.config.wsPort });

    this.metrics = {
      timestamp: Date.now(),
      kpi: null,
      qualityGates: [],
      systemHealth: {
        router: false,
        daemon: false,
        serviceDiscovery: false,
        lastCheck: Date.now(),
      },
      pipeline: {
        activeOperations: 0,
        totalOperations: 0,
        successRate: 0,
        avgLatency: 0,
        errorsInLastHour: 0,
      },
    };
  }

  /**
   * Inicia el dashboard
   */
  async start(): Promise<void> {
    console.log(`🚀 Iniciando Real-time Dashboard...`);
    console.log(`   HTTP Server: http://localhost:${this.config.port}`);
    console.log(`   WebSocket Server: ws://localhost:${this.config.wsPort}`);

    // Iniciar servidor HTTP
    this.server = createServer((req, res) => this.handleRequest(req, res));
    this.server.listen(this.config.port);

    // Configurar WebSocket
    this.setupWebSocket();

    // Iniciar actualización periódica de métricas
    this.startMetricsUpdates();

    // Actualización inicial
    await this.updateMetrics();

    console.log(`✅ Dashboard iniciado exitosamente`);
  }

  /**
   * Detiene el dashboard
   */
  async stop(): Promise<void> {
    console.log(`🛑 Deteniendo Real-time Dashboard...`);

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.clients.clear();

    if (this.server) {
      this.server.close();
    }

    this.wsServer.close();

    console.log(`✅ Dashboard detenido`);
  }

  /**
   * Configura el servidor WebSocket
   */
  private setupWebSocket(): void {
    this.wsServer.on('connection', (ws: WebSocket) => {
      console.log(`📡 Cliente conectado al dashboard (total: ${this.clients.size + 1})`);
      this.clients.add(ws);

      // Enviar métricas actuales al nuevo cliente
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.metrics,
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`📡 Cliente desconectado (total: ${this.clients.size})`);
      });

      ws.on('error', (error) => {
        console.error(`❌ Error en WebSocket:`, error);
        this.clients.delete(ws);
      });
    });

    this.wsServer.on('error', (error) => {
      console.error(`❌ Error en WebSocket server:`, error);
    });
  }

  /**
   * Inicia actualización periódica de métricas
   */
  private startMetricsUpdates(): void {
    this.updateTimer = setInterval(async () => {
      await this.updateMetrics();
      this.broadcastUpdate();
    }, this.config.updateInterval);
  }

  /**
   * Actualiza todas las métricas
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Actualizar timestamp
      this.metrics.timestamp = Date.now();

      // Actualizar KPIs
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (this.config.dataRetention * 60 * 60 * 1000));
      this.metrics.kpi = await this.kpiAggregator.aggregate({
        start: startTime,
        end: endTime,
      });

      // Actualizar quality gates (simulado por ahora)
      await this.updateQualityGates();

      // Actualizar salud del sistema
      await this.updateSystemHealth();

      // Actualizar métricas del pipeline
      await this.updatePipelineMetrics();

    } catch (error) {
      console.error(`❌ Error actualizando métricas:`, error);
    }
  }

  /**
   * Actualiza métricas de quality gates
   */
  private async updateQualityGates(): Promise<void> {
    // Simulación - en producción leería desde base de datos o cache
    this.metrics.qualityGates = [
      {
        project: 'router',
        score: 80,
        grade: 'B',
        passed: 1,
        total: 3,
        timestamp: Date.now() - 60000,
      },
      {
        project: 'daemon',
        score: 92,
        grade: 'A',
        passed: 4,
        total: 5,
        timestamp: Date.now() - 120000,
      },
    ];
  }

  /**
   * Actualiza salud del sistema
   */
  private async updateSystemHealth(): Promise<void> {
    const checkService = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(2000) // 2 segundos timeout
        });
        return response.ok;
      } catch {
        return false;
      }
    };

    const [router, daemon, serviceDiscovery] = await Promise.all([
      checkService('http://localhost:3000/health'),
      checkService('http://localhost:7727/health'),
      checkService('http://localhost:8877/health'),
    ]);

    this.metrics.systemHealth = {
      router,
      daemon,
      serviceDiscovery,
      lastCheck: Date.now(),
    };
  }

  /**
   * Actualiza métricas del pipeline
   */
  private async updatePipelineMetrics(): Promise<void> {
    if (!this.metrics.kpi) return;

    const events = this.metrics.kpi.totalEvents;
    const avgLatency = this.metrics.kpi.metricPairs.velocity.meanActivationLatency;
    const successRate = this.metrics.kpi.metricPairs.quality.zeroErrorsRate;

    // Calcular errores en la última hora
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentErrors = Math.floor(Math.random() * 5); // Simulación

    this.metrics.pipeline = {
      activeOperations: Math.floor(Math.random() * 3), // Simulación
      totalOperations: events,
      successRate: successRate || 0,
      avgLatency: avgLatency || 0,
      errorsInLastHour: recentErrors,
    };
  }

  /**
   * Envía actualización a todos los clientes conectados
   */
  private broadcastUpdate(): void {
    if (this.clients.size === 0) return;

    const message = JSON.stringify({
      type: 'update',
      data: this.metrics,
      timestamp: Date.now(),
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error(`❌ Error enviando a cliente:`, error);
          this.clients.delete(client);
        }
      }
    });
  }

  /**
   * Maneja peticiones HTTP
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url || '/';
    const method = req.method || 'GET';

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      if (url === '/' || url === '/index.html') {
        await this.serveIndexHtml(res);
      } else if (url === '/api/metrics') {
        await this.serveMetricsAPI(res);
      } else if (url === '/api/kpi') {
        await this.serveKPIAPI(res);
      } else if (url.startsWith('/static/')) {
        await this.serveStaticFile(url, res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    } catch (error) {
      console.error(`❌ Error manejando petición ${url}:`, error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  /**
   * Sirve el HTML principal del dashboard
   */
  private async serveIndexHtml(res: ServerResponse): Promise<void> {
    const html = this.generateDashboardHTML();
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(html);
  }

  /**
   * Sirve API de métricas actuales
   */
  private async serveMetricsAPI(res: ServerResponse): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(this.metrics));
  }

  /**
   * Sirve API de KPIs
   */
  private async serveKPIAPI(res: ServerResponse): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(this.metrics.kpi || {}));
  }

  /**
   * Sirve archivos estáticos
   */
  private async serveStaticFile(url: string, res: ServerResponse): Promise<void> {
    // Implementación básica para archivos estáticos
    res.writeHead(404);
    res.end('Static file not found');
  }

  /**
   * Genera el HTML del dashboard
   */
  private generateDashboardHTML(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skills Fabric - Real-time Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        h1 {
            font-size: 2rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        .status-dot.connected {
            background: #10b981;
        }

        .status-dot.disconnected {
            background: #ef4444;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .card-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1f2937;
        }

        .card-icon {
            font-size: 1.5rem;
        }

        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            margin: 10px 0;
        }

        .metric-label {
            color: #6b7280;
            font-size: 0.9rem;
        }

        .metric-change {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-top: 8px;
        }

        .metric-change.positive {
            background: #d1fae5;
            color: #065f46;
        }

        .metric-change.negative {
            background: #fee2e2;
            color: #991b1b;
        }

        .health-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }

        .health-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border-radius: 8px;
            font-size: 0.9rem;
        }

        .health-item.healthy {
            background: #d1fae5;
            color: #065f46;
        }

        .health-item.unhealthy {
            background: #fee2e2;
            color: #991b1b;
        }

        .quality-gates {
            margin-top: 20px;
        }

        .quality-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
            background: rgba(0, 0, 0, 0.05);
        }

        .quality-score {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .grade {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.9rem;
        }

        .grade.A { background: #d1fae5; color: #065f46; }
        .grade.B { background: #fef3c7; color: #92400e; }
        .grade.C { background: #fed7aa; color: #9a3412; }
        .grade.D { background: #fecaca; color: #991b1b; }
        .grade.F { background: #1f2937; color: white; }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #34d399);
            transition: width 0.5s ease;
        }

        .last-updated {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin-top: 20px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
            }

            h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <h1>🚀 Skills Fabric Dashboard</h1>
                <div class="status-indicator">
                    <div class="status-dot" id="connectionStatus"></div>
                    <span id="connectionText">Conectando...</span>
                </div>
            </div>
        </header>

        <div class="dashboard-grid">
            <!-- System Health Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🏥 Salud del Sistema</h2>
                    <div class="card-icon">❤️</div>
                </div>
                <div class="health-grid" id="systemHealth">
                    <div class="health-item">Router: ⏳</div>
                    <div class="health-item">Daemon: ⏳</div>
                    <div class="health-item">Discovery: ⏳</div>
                </div>
                <div class="metric-label">Última verificación: <span id="lastHealthCheck">-</span></div>
            </div>

            <!-- Pipeline Metrics Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">⚡ Pipeline</h2>
                    <div class="card-icon">📊</div>
                </div>
                <div class="metric-value" id="successRate">-</div>
                <div class="metric-label">Tasa de éxito</div>
                <div class="metric-change positive" id="activeOps">0 operaciones activas</div>
                <div class="metric-label">Latencia promedio: <span id="avgLatency">-</span>ms</div>
                <div class="metric-label">Errores última hora: <span id="recentErrors">-</span></div>
            </div>

            <!-- KPI Velocity Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🚀 Velocidad</h2>
                    <div class="card-icon">⚡</div>
                </div>
                <div class="metric-value" id="activationLatency">-</div>
                <div class="metric-label">Latencia de activación (ms)</div>
                <div class="metric-label">Tasa de activación: <span id="activationRate">-</span></div>
                <div class="metric-label">Progressive disclosure: <span id="disclosureRate">-</span></div>
            </div>

            <!-- KPI Quality Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🎯 Calidad</h2>
                    <div class="card-icon">✨</div>
                </div>
                <div class="metric-value" id="adherenceRate">-</div>
                <div class="metric-label">Tasa de adherencia (%)</div>
                <div class="metric-label">Zero errors rate: <span id="zeroErrorsRate">-</span></div>
                <div class="metric-label">Guardrail effectiveness: <span id="guardrailEffect">-</span></div>
            </div>
        </div>

        <!-- Quality Gates Section -->
        <div class="card quality-gates">
            <div class="card-header">
                <h2 class="card-title">🔍 Quality Gates</h2>
                <div class="card-icon">🛡️</div>
            </div>
            <div id="qualityGatesList">
                <div class="quality-item">
                    <span>Cargando quality gates...</span>
                </div>
            </div>
        </div>

        <div class="last-updated" id="lastUpdated">
            Última actualización: -
        </div>
    </div>

    <script>
        class RealtimeDashboard {
            constructor() {
                this.ws = null;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 5;
                this.reconnectInterval = 5000;

                this.init();
            }

            init() {
                this.connectWebSocket();
                this.setupEventListeners();
            }

            connectWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = \`\${protocol}//\${window.location.hostname}:8889\`;

                try {
                    this.ws = new WebSocket(wsUrl);

                    this.ws.onopen = () => {
                        console.log('✅ Conectado al dashboard');
                        this.updateConnectionStatus(true);
                        this.reconnectAttempts = 0;
                    };

                    this.ws.onmessage = (event) => {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    };

                    this.ws.onclose = () => {
                        console.log('❌ Desconectado del dashboard');
                        this.updateConnectionStatus(false);
                        this.attemptReconnect();
                    };

                    this.ws.onerror = (error) => {
                        console.error('❌ Error en WebSocket:', error);
                        this.updateConnectionStatus(false);
                    };
                } catch (error) {
                    console.error('❌ Error creando WebSocket:', error);
                    this.attemptReconnect();
                }
            }

            attemptReconnect() {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(\`🔄 Intentando reconectar (\${this.reconnectAttempts}/\${this.maxReconnectAttempts})...\`);

                    setTimeout(() => {
                        this.connectWebSocket();
                    }, this.reconnectInterval);
                } else {
                    console.error('❌ Máximo de intentos de reconexión alcanzado');
                    this.updateConnectionStatus(false, 'Conexión perdida');
                }
            }

            handleMessage(message) {
                if (message.type === 'initial' || message.type === 'update') {
                    this.updateDashboard(message.data);
                }
            }

            updateDashboard(metrics) {
                // System Health
                this.updateSystemHealth(metrics.systemHealth);

                // Pipeline metrics
                this.updatePipelineMetrics(metrics.pipeline);

                // KPI metrics
                if (metrics.kpi) {
                    this.updateKPIMetrics(metrics.kpi);
                }

                // Quality Gates
                this.updateQualityGates(metrics.qualityGates);

                // Last updated timestamp
                this.updateLastUpdated(metrics.timestamp);
            }

            updateSystemHealth(health) {
                const container = document.getElementById('systemHealth');
                const services = [
                    { name: 'Router', key: 'router' },
                    { name: 'Daemon', key: 'daemon' },
                    { name: 'Discovery', key: 'serviceDiscovery' }
                ];

                container.innerHTML = services.map(service => {
                    const isHealthy = health[service.key];
                    const className = isHealthy ? 'healthy' : 'unhealthy';
                    const icon = isHealthy ? '✅' : '❌';

                    return \`<div class="health-item \${className}">
                        \${icon} \${service.name}
                    </div>\`;
                }).join('');

                document.getElementById('lastHealthCheck').textContent =
                    new Date(health.lastCheck).toLocaleTimeString();
            }

            updatePipelineMetrics(pipeline) {
                document.getElementById('successRate').textContent =
                    \`\${Math.round(pipeline.successRate * 100)}%\`;
                document.getElementById('activeOps').textContent =
                    \`\${pipeline.activeOperations} operaciones activas\`;
                document.getElementById('avgLatency').textContent =
                    Math.round(pipeline.avgLatency);
                document.getElementById('recentErrors').textContent =
                    pipeline.errorsInLastHour;
            }

            updateKPIMetrics(kpi) {
                const velocity = kpi.metricPairs?.velocity || {};
                const quality = kpi.metricPairs?.quality || {};

                // Velocity metrics
                document.getElementById('activationLatency').textContent =
                    Math.round(velocity.meanActivationLatency || 0);
                document.getElementById('activationRate').textContent =
                    (velocity.skillActivationRate || 0).toFixed(2);
                document.getElementById('disclosureRate').textContent =
                    \`\${Math.round((velocity.progressiveDisclosureRate || 0) * 100)}%\`;

                // Quality metrics
                document.getElementById('adherenceRate').textContent =
                    Math.round((quality.skillAdherenceRate || 0) * 100);
                document.getElementById('zeroErrorsRate').textContent =
                    Math.round((quality.zeroErrorsRate || 0) * 100);
                document.getElementById('guardrailEffect').textContent =
                    Math.round((quality.guardrailEffectiveness || 0) * 100);
            }

            updateQualityGates(qualityGates) {
                const container = document.getElementById('qualityGatesList');

                if (!qualityGates || qualityGates.length === 0) {
                    container.innerHTML = '<div class="quality-item"><span>No hay quality gates disponibles</span></div>';
                    return;
                }

                container.innerHTML = qualityGates.map(gate => {
                    const percentage = Math.round((gate.passed / gate.total) * 100);

                    return \`<div class="quality-item">
                        <div>
                            <div>\${gate.project}</div>
                            <div class="quality-score">
                                <span class="grade \${gate.grade}">\${gate.grade}</span>
                                <span>\${gate.score}/100</span>
                                <span>(\${gate.passed}/\${gate.total})</span>
                            </div>
                        </div>
                        <div style="flex: 1; margin: 0 20px;">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: \${percentage}%"></div>
                            </div>
                        </div>
                        <div style="font-size: 0.9rem; color: #6b7280;">
                            \${new Date(gate.timestamp).toLocaleTimeString()}
                        </div>
                    </div>\`;
                }).join('');
            }

            updateLastUpdated(timestamp) {
                document.getElementById('lastUpdated').textContent =
                    \`Última actualización: \${new Date(timestamp).toLocaleString()}\`;
            }

            updateConnectionStatus(connected, text = null) {
                const statusDot = document.getElementById('connectionStatus');
                const statusText = document.getElementById('connectionText');

                if (connected) {
                    statusDot.className = 'status-dot connected';
                    statusText.textContent = 'Conectado';
                } else {
                    statusDot.className = 'status-dot disconnected';
                    statusText.textContent = text || 'Desconectado';
                }
            }

            setupEventListeners() {
                // Opcional: añadir interactividad adicional
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
                        this.connectWebSocket();
                    }
                });
            }
        }

        // Inicializar dashboard cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            new RealtimeDashboard();
        });
    </script>
</body>
</html>`;
  }
}

// Instancia global
export const realtimeDashboard = new RealtimeDashboard();