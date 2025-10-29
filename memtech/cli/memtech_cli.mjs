#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env.memtech si está disponible en la raíz del proyecto
const projectRoot = resolve(__dirname, '..');
const envFile = resolve(projectRoot, '..', '.env.memtech');
loadEnvFile(envFile);

const MemoryManagerModule = await import('../../mcp/servers/memtech/scripts/memtech/memory.js');
const MemoryManager = MemoryManagerModule.default;

function loadEnvFile(filePath) {
  try {
    if (!existsSync(filePath)) {
      return;
    }
    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key && value !== undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn('[memtech-cli] No se pudo procesar archivo de entorno:', error?.message);
  }
}

/**
 * Parse an array of command-line tokens into an object of long-form flag options.
 *
 * Processes tokens of the form `--key` and assigns each key either the following token
 * (if that token does not start with `--`) or the string `"true"` when no value is provided.
 * Non-flag tokens are ignored except when consumed as a flag's value.
 *
 * @param {string[]} argv - Array of command-line arguments (tokens).
 * @returns {{[key: string]: string}} An object mapping flag names (without leading `--`) to their values.
 */
function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    options[key] = value;
  }
  return options;
}

async function run() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || ['help', '-h', '--help'].includes(command)) {
    printHelp();
    return;
  }

  const options = parseArgs(rest);
  const manager = new MemoryManager({
    storage_path: process.env.MEMTECH_STORAGE_PATH || resolve(projectRoot, '.memtech/memory')
  });

  try {
    switch (command) {
      case 'health':
        await manager.initialize();
        const stats = await manager.getStats();
        output({ success: true, stats });
        break;
      case 'store': {
        const title = options.title || options.name;
        if (!title) throw new Error('Se requiere --title');
        const content = options.content || '';
        const tags = options.tags ? options.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const description = options.description || '';
        const sensitivity = options.sensitivity || 'normal';
        const access_frequency = options.access_frequency || options.accessFrequency;
        const age_days = options.age_days || options.ageDays;

        const meta = {
          title,
          description,
          tags,
          content,
          sensitivity,
          access_frequency,
          age_days
        };

        const result = await manager.addItem(meta);
        output({ success: true, result });
        break;
      }
      case 'resolve': {
        const uri = options.uri;
        const query = options.query;
        if (!uri && !query) {
          throw new Error('Se requiere --uri o --query');
        }
        const result = await manager.resolve(uri || query);
        output({ success: true, result });
        break;
      }
      case 'search': {
        const query = options.query;
        const tags = options.tags ? options.tags.split(',').map(t => t.trim()).filter(Boolean) : null;
        if (!query && (!tags || tags.length === 0)) {
          throw new Error('Se requiere --query o --tags');
        }
        let result;
        if (tags && tags.length > 0) {
          result = await manager.search(tags);
        } else {
          result = await manager.searchQuery(query);
        }
        output({ success: true, result });
        break;
      }
      case 'stats': {
        await manager.initialize();
        const stats = await manager.getStats();
        output({ success: true, stats });
        break;
      }
      default:
        throw new Error(`Comando no soportado: ${command}`);
    }
  } catch (error) {
    output({ success: false, error: error.message });
    process.exitCode = 1;
  }
}

function output(payload) {
  process.stdout.write(JSON.stringify(payload, null, 2));
}

function printHelp() {
  const helpText = `
memtech-cli - Utilidad para interactuar con MemTech

Uso:
  node memtech/cli/memtech_cli.mjs <comando> [opciones]

Comandos disponibles:
  health                 Verifica estado general del sistema de memoria
  store --title t [--content c] [--tags a,b] [--description desc]
                         Crea un nuevo recuerdo en MemTech
  resolve --uri mem://... | --query "texto"
                         Recupera un ítem por URI o consulta textual
  search --tags a,b | --query "texto"
                         Búsqueda por etiquetas o texto
  stats                  Devuelve estadísticas agregadas de la memoria
`;
  console.log(helpText);
}

await run();
