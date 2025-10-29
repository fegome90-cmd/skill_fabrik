
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// Función para verificar conexión a bases de datos usando configuración correcta
function checkDatabaseConnection(config, name) {
  try {
    if (name === "Redis") {
      execSync(`nc -z ${config.host} ${config.port}`, { timeout: 2000 });
      console.log(`✅ ${name} conectado (${config.host}:${config.port})`);
      return true;
    } else if (name === "PostgreSQL") {
      execSync(`nc -z ${config.host} ${config.port}`, { timeout: 2000 });
      console.log(`✅ ${name} conectado (${config.host}:${config.port})`);
      return true;
    } else if (name === "Qdrant") {
      // Para Qdrant verificamos con curl
      const { stdout } = execSync(`curl -s -o /dev/null -w "%{http_code}" ${config.url}`, { timeout: 2000 });
      if (stdout.trim() === "200") {
        console.log(`✅ ${name} conectado (${config.url})`);
        return true;
      } else {
        console.log(`❌ ${name} no disponible (${config.url})`);
        return false;
      }
    }
  } catch (error) {
    console.log(`❌ ${name} no disponible (${config.host || config.url}:${config.port})`);
    return false;
  }
}

// Función para restaurar memoria desde backup
function restoreMemoryFromBackup() {
  try {
    console.log("🔄 Restaurando memoria desde backup...");
    
    // Leer backup de memoria
    const backupData = readFileSync("./memory-state-backup.json", "utf8");
    const backup = JSON.parse(backupData);
    
    // Leer memoria actual
    const currentData = readFileSync("./memory-state.json", "utf8");
    const current = JSON.parse(currentData);
    
    // Combinar datos
    const restored = {
      short_memory: [...(current.short_memory || []), ...(backup.short_memory || [])],
      long_memory: [...(current.long_memory || []), ...(backup.long_memory || [])],
      last_restored: new Date().toISOString()
    };
    
    // Guardar memoria restaurada
    writeFileSync("./memory-state.json", JSON.stringify(restored, null, 2));
    
    console.log(`✅ Memoria restaurada: ${restored.short_memory.length} items cortos, ${restored.long_memory.length} items largos`);
    return true;
  } catch (error) {
    console.error("❌ Error al restaurar memoria:", error.message);
    return false;
  }
}

// Función principal de reconexión usando configuración correcta
async function reconnectToDatabases() {
  console.log("🚀 Iniciando proceso de reconexión a bases de datos...");
  
  // Leer configuración correcta desde memory-system
  try {
    const configData = readFileSync("../../memory-system/CORRECT-CONNECTION-CONFIG.json", "utf8");
    const config = JSON.parse(configData);
    
    console.log("📋 Usando configuración correcta de conexiones:");
    
    // Verificar conexiones a bases de datos
    const connections = {
      redis: checkDatabaseConnection(config.database_connections.redis, "Redis"),
      postgresql: checkDatabaseConnection(config.database_connections.postgresql, "PostgreSQL"),
      qdrant: checkDatabaseConnection(config.database_connections.qdrant_cloud, "Qdrant")
    };
    
    // Restaurar memoria desde backup
    const memoryRestored = restoreMemoryFromBackup();
    
    // Resumen de estado
    const connectedCount = Object.values(connections).filter(Boolean).length;
    const totalCount = Object.keys(connections).length;
    
    console.log("\n📊 Resumen de reconexión:");
    console.log(`🔗 Bases de datos conectadas: ${connectedCount}/${totalCount}`);
    console.log(`💾 Memoria restaurada: ${memoryRestored ? "✅" : "❌"}`);
    
    if (connectedCount === totalCount && memoryRestored) {
      console.log("\n🎉 Reconexión completada exitosamente");
    } else {
      console.log("\n⚠️ Reconexión parcial - algunos servicios pueden no estar disponibles");
    }
    
    return { connections, memoryRestored, config };
    
  } catch (error) {
    console.error("❌ Error al leer configuración:", error.message);
    return { connections: {}, memoryRestored: false, config: null };
  }
}

// Ejecutar reconexión
reconnectToDatabases().catch(console.error);

