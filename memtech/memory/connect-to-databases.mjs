import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function connectToDatabases() {
  console.log("Conectando a bases de datos...");
  
  try {
    // Conectar a Redis
    console.log("Verificando conexión a Redis (puerto 6379)...");
    const { stdout: redisOutput } = await execAsync("nc -z localhost 6379 && echo Redis conectado || echo Redis no disponible");
    console.log(redisOutput.trim());
    
    // Conectar a VictoriaMetrics
    console.log("Verificando conexión a VictoriaMetrics (puerto 8428)...");
    const { stdout: vmOutput } = await execAsync("nc -z localhost 8428 && echo VictoriaMetrics conectado || echo VictoriaMetrics no disponible");
    console.log(vmOutput.trim());
    
    // Conectar a Grafana
    console.log("Verificando conexión a Grafana (puerto 3001)...");
    const { stdout: grafanaOutput } = await execAsync("nc -z localhost 3001 && echo Grafana conectado || echo Grafana no disponible");
    console.log(grafanaOutput.trim());
    
    // Conectar a PostgreSQL
    console.log("Verificando conexión a PostgreSQL (puerto 5433)...");
    const { stdout: pgOutput } = await execAsync("nc -z localhost 5433 && echo PostgreSQL conectado || echo PostgreSQL no disponible");
    console.log(pgOutput.trim());
    
    // Conectar a Qdrant
    console.log("Verificando conexión a Qdrant (puerto 6333)...");
    const { stdout: qdrantOutput } = await execAsync("nc -z localhost 6333 && echo Qdrant conectado || echo Qdrant no disponible");
    console.log(qdrantOutput.trim());
    
    console.log("Verificación de conexiones completada.");
  } catch (error) {
    console.error("Error al verificar conexiones:", error.message);
  }
}

connectToDatabases();
