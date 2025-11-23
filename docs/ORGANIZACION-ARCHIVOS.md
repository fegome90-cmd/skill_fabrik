# 📁 Organización de Archivos - Resumen

## ✅ Archivos Organizados

### 📚 Documentación

#### Integraciones (`docs/integracion/`)
```
docs/integracion/
├── README.md                          # Índice principal
├── API-CONNECTIONS-SUMMARY.md        # Resumen de todas las conexiones
├── memtech/                          # Integración MemTech Universal
│   ├── README.md
│   ├── MEMTECH-INTEGRATION.md
│   ├── MEMTECH-INTEGRATION-EXAMPLES.md
│   ├── MEMTECH-INTEGRATION-SUMMARY.md
│   └── MEMTECH-CONNECTION-STATUS.md
└── skills-fabrik-api/                # Integración Skills-Fabrik API
    ├── README.md
    ├── SKILLS-FABRIK-API-INTEGRATION.md
    └── PMV2-PROMPT-GENERATOR.md
```

#### CLI Guides (`docs/cli/guides/`)
```
docs/cli/guides/
├── README.md                          # Índice
├── CLI-HOOKS-SKILLS-GUIDE.md         # Guía completa
└── QUICK-START-HOOKS-SKILLS.md       # Inicio rápido
```

### 🔧 Scripts

#### Integraciones (`scripts/integration/`)
```
scripts/integration/
├── memtech-client.py                 # Cliente MemTech Universal
├── skills-fabrik-api-client.py       # Cliente Skills-Fabrik API
└── generate-pmv2-prompt.py          # Generador de prompts PMv2
```

### 📝 Prompts Generados

```
prompts/
└── pmv2-*.md                         # Prompts PMv2 generados
```

---

## 🗺️ Estructura Completa

```
skills-fabrik/
├── docs/
│   ├── integracion/                  # ✨ NUEVO: Integraciones organizadas
│   │   ├── README.md
│   │   ├── API-CONNECTIONS-SUMMARY.md
│   │   ├── memtech/
│   │   └── skills-fabrik-api/
│   └── cli/
│       └── guides/                   # ✨ NUEVO: Guías CLI organizadas
│           ├── README.md
│           ├── CLI-HOOKS-SKILLS-GUIDE.md
│           └── QUICK-START-HOOKS-SKILLS.md
├── scripts/
│   └── integration/                  # ✨ NUEVO: Scripts de integración
│       ├── memtech-client.py
│       ├── skills-fabrik-api-client.py
│       └── generate-pmv2-prompt.py
└── prompts/                          # Prompts generados
    └── pmv2-*.md
```

---

## 📖 Cómo Usar

### Ver Documentación de Integraciones

```bash
# Índice principal
cat docs/integracion/README.md

# MemTech
cat docs/integracion/memtech/README.md

# Skills-Fabrik API
cat docs/integracion/skills-fabrik-api/README.md
```

### Usar Scripts de Integración

```bash
# MemTech
python3 scripts/integration/memtech-client.py

# Skills-Fabrik API
python3 scripts/integration/skills-fabrik-api-client.py

# Generar PMv2
python3 scripts/integration/generate-pmv2-prompt.py "objetivo" ...
```

### Ver Guías CLI

```bash
# Índice
cat docs/cli/guides/README.md

# Guía completa
cat docs/cli/guides/CLI-HOOKS-SKILLS-GUIDE.md

# Inicio rápido
cat docs/cli/guides/QUICK-START-HOOKS-SKILLS.md
```

---

## ✅ Cambios Realizados

1. ✅ **Documentación de integraciones** organizada en subdirectorios
2. ✅ **Guías CLI** movidas a `docs/cli/guides/`
3. ✅ **Scripts de integración** movidos a `scripts/integration/`
4. ✅ **READMEs** creados para cada sección
5. ✅ **Índices** actualizados con referencias correctas

---

**Organización completada** ✨

