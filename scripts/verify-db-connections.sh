#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Verificando conexiones a Redis y Postgres..."
echo ""

# Redis
echo "📊 Redis:"
if command -v redis-cli &> /dev/null; then
  if redis-cli PING 2>&1 | grep -q "PONG"; then
    echo "  ✅ Redis responde (PONG)"
    redis-cli INFO SERVER 2>&1 | grep "redis_version" | head -1 | sed 's/^/    /'
  else
    echo "  ❌ Redis no responde"
  fi
else
  echo "  ⚠️  redis-cli no está instalado"
fi

# Variables Redis
if [ -n "${REDIS_URL:-}" ]; then
  echo "  ✅ REDIS_URL configurado: ${REDIS_URL}"
else
  echo "  ⚠️  REDIS_URL no configurado"
fi
echo ""

# Postgres
echo "🐘 Postgres:"
if command -v pg_isready &> /dev/null; then
  if pg_isready 2>&1 | grep -q "accepting"; then
    echo "  ✅ Postgres aceptando conexiones"
  else
    echo "  ❌ Postgres no disponible"
  fi
else
  echo "  ⚠️  pg_isready no está instalado"
fi

# Variables Postgres
if [ -n "${DATABASE_URL:-}" ]; then
  echo "  ✅ DATABASE_URL configurado"
elif [ -n "${PGHOST:-}" ] && [ -n "${PGDATABASE:-}" ]; then
  echo "  ✅ Variables PG* configuradas (PGHOST=${PGHOST})"
else
  echo "  ⚠️  Variables de Postgres no configuradas"
fi
echo ""

# Test de conexión Node.js (si hay vars)
if [ -n "${REDIS_URL:-}" ]; then
  echo "🧪 Probando conexión Node.js a Redis..."
  node -e "
    import('redis').then(async r => {
      const c = r.default.createClient({ url: process.env.REDIS_URL });
      c.on('error', e => { console.error('❌ Error:', e.message); process.exit(1); });
      await c.connect();
      console.log('✅ Conexión Node.js a Redis OK');
      await c.quit();
    }).catch(e => { console.error('❌ Fallo:', e.message); process.exit(1); });
  " 2>&1 | sed 's/^/    /' || echo "    ❌ Fallo en conexión Node.js"
else
  echo "⚠️  Skipping test Node.js (REDIS_URL no configurado)"
fi
