# CLI Pack/Verify/Install Workflow

**Fecha**: 2025-11-02
**Versión**: 1.0.0

---

## 📋 **Descripción General**

El workflow Pack/Verify/Install es el sistema completo de Skills Fabric para empaquetar, validar e instalar skills de forma segura y determinística. Este documento detalla el flujo completo, APIs disponibles, y mejores prácticas.

## 🏗️ **Arquitectura del Workflow**

```mermaid
graph TD
    A[SKILL.md] --> B[packSkill]
    B --> C[.tgz Package]
    B --> D[manifest.json]
    C --> E[verifyPackage]
    D --> E
    E --> F[installPackage]
    F --> G[skills/{id}]

    B --> H[Snapshot Validation]
    H --> I[Determinism Check]
```

## 📦 **1. PACK - Empaquetado de Skills**

### Función Principal
```typescript
packSkill(skillDir: string, options?: PackOptions): Promise<{
  manifest: SkillManifest;
  packagePath: string;
  manifestPath: string;
}>
```

### Proceso de Empaquetado

#### 1.1 Lectura de SKILL.md
- Lee el archivo `SKILL.md` desde el directorio del skill
- Extrae metadata del frontmatter (YAML)
- Valida campos requeridos: `id`, `name`, `version`, `allowed-tools`

#### 1.2 Creación de Staging
- Crea directorio temporal (`/tmp/sf-pack-XXXXX`)
- Copia el skill al directorio `skill/` dentro del staging
- Asegura empaquetado determinístico (excluye node_modules, .git, etc.)

#### 1.3 Generación de Tarball
- Utiliza Python con tarfile para crear `.tgz` determinístico
- Mtime fijo en 0 para consistencia
- Ordenamiento consistente de archivos y directorios
- Compresión gzip con mtime=0

#### 1.4 Cálculo de Hash
- Computa SHA-256 hash del paquete tarball
- Hash de 64 caracteres en minúsculas (formato hexadecimal)

#### 1.5 Generación de Manifest
```typescript
interface SkillManifest {
  id: string;              // Identificador único del skill
  version: string;         // Versión semver (MAJOR.MINOR.PATCH)
  name: string;            // Nombre descriptivo
  'allowed-tools': string[]; // Lista de herramientas permitidas
  scripts?: {              // Scripts opcionales
    run?: string;
    'dry-run'?: string;
  };
  hash: string;            // SHA-256 del paquete
  createdAt: string;       // ISO 8601 timestamp
}
```

#### 1.6 Escritura de Archivos
- **Paquete**: `.registry/{id}-{version}.tgz`
- **Manifest**: `.registry/{id}-{version}.manifest.json`

### Ejemplo de Uso

```typescript
import { packSkill } from '@skills-fabrik/skills-cli';

const result = await packSkill('./skills/my-skill', {
  outDir: './.registry',
  version: '1.0.0'
});

console.log('Package:', result.packagePath);
console.log('Manifest:', result.manifestPath);
console.log('Hash:', result.manifest.hash);
```

### Opciones de Pack

```typescript
interface PackOptions {
  outDir?: string;      // Directorio de salida (default: '.registry')
  version?: string;     // Versión específica (override frontmatter)
}
```

### Validaciones

✅ **Estructura Requerida**
- SKILL.md debe existir
- Frontmatter debe tener `id` obligatorio
- `id`: string no-vacía
- `version`: formato semver (MAJOR.MINOR.PATCH)
- `name`: string no-vacía
- `allowed-tools`: array de strings
- `hash`: 64 caracteres hex (SHA-256)
- `createdAt`: ISO 8601 válido

✅ **Scripts Permitidos**
- `run`: comando de ejecución
- `dry-run`: comando de ejecución en modo dry-run

❌ **Errores Comunes**
- SKILL.md no encontrado
- Frontmatter inválido
- Versión no-semver
- Hash inválido
- Timestamps inválidos

## 🔍 **2. VERIFY - Validación de Paquetes**

### Función Principal
```typescript
verifyPackage(packagePath: string, manifest: SkillManifest): Promise<void>
```

### Proceso de Verificación

#### 2.1 Validación de Manifest
- Verifica estructura contra `SkillManifest`
- Valida tipos y formatos
- Confirma campos requeridos

#### 2.2 Verificación de Hash
- Computa SHA-256 del paquete `.tgz`
- Compara con hash en el manifest
- Falla si hay discrepancia

### Ejemplo de Uso

```typescript
import { loadManifest, verifyPackage } from '@skills-fabrik/skills-cli';

const manifest = await loadManifest('./.registry/my-skill-1.0.0.manifest.json');
await verifyPackage('./.registry/my-skill-1.0.0.tgz', manifest);

console.log('✅ Package verification passed!');
```

### Casos de Falla

❌ **Hash Mismatch**
```
Error: Package hash mismatch. Expected abc123..., got def456...
```
**Causa**: Paquete corrupto o modificado
**Solución**: Re-empaquetar el skill

❌ **Manifest Inválido**
```
Error: Manifest validation failed: unexpected property "foo"
```
**Causa**: Manifest con campos no permitidos
**Solución**: Regenerar manifest con campos válidos

## 📥 **3. INSTALL - Instalación de Skills**

### Función Principal
```typescript
installPackage(
  packagePath: string,
  manifest: SkillManifest,
  options?: InstallOptions
): Promise<string>
```

### Proceso de Instalación

#### 3.1 Preparación de Directorio
- Crea directorio `skills/` si no existe
- Calcula directorio objetivo: `skills/{id}`
- Verifica si ya existe (opcional con `--force`)

#### 3.2 Extracción de Paquete
- Utiliza Python tarfile para extraer `.tgz`
- Mantiene estructura: `skill/*` → `skills/{id}/*`
- Preserva permisos y metadatos

#### 3.3 Escritura de Manifest
- Guarda manifest como `skills/{id}/skill-manifest.json`
- Permite verificación posterior

### Ejemplo de Uso

```typescript
import { loadManifest, installPackage } from '@skills-fakra/skills-cli';

const manifest = await loadManifest('./.registry/my-skill-1.0.0.manifest.json');
const installDir = await installPackage(
  './.registry/my-skill-1.0.0.tgz',
  manifest,
  { targetDir: './skills', force: false }
);

console.log('Installed to:', installDir);
```

### Opciones de Install

```typescript
interface InstallOptions {
  targetDir?: string;  // Directorio base (default: 'skills')
  force?: boolean;     // Override si existe (default: false)
}
```

### Estructura Resultante

```
skills/
└── {id}/
    ├── skill/
    │   ├── SKILL.md
    │   ├── resources/
    │   └── scripts/
    └── skill-manifest.json
```

## 🔄 **Flujo Completo: Pack → Verify → Install**

### Ejemplo Práctico

```typescript
import { packSkill, loadManifest, verifyPackage, installPackage } from '@skills-fabrik/skills-cli';

async function installSkill(skillDir: string): Promise<void> {
  // 1. PACK: Empaquetar skill
  console.log('📦 Packing skill...');
  const packResult = await packSkill(skillDir, {
    outDir: './.registry',
    version: '1.0.0'
  });
  console.log(`   ✅ Packed: ${packResult.packagePath}`);

  // 2. VERIFY: Verificar integridad
  console.log('🔍 Verifying package...');
  await verifyPackage(packResult.packagePath, packResult.manifest);
  console.log('   ✅ Verification passed');

  // 3. INSTALL: Instalar skill
  console.log('📥 Installing skill...');
  const installDir = await installPackage(
    packResult.packagePath,
    packResult.manifest,
    { targetDir: './skills', force: true }
  );
  console.log(`   ✅ Installed: ${installDir}`);
}

// Uso
await installSkill('./skills/my-custom-skill');
```

### Script Bash Equivalent

```bash
#!/bin/bash
SKILL_DIR="./skills/my-custom-skill"
REGISTRY_DIR="./.registry"
INSTALL_DIR="./skills"

# Pack
echo "📦 Packing skill..."
skills-cli pack $SKILL_DIR --out $REGISTRY_DIR --version 1.0.0

# Verify
echo "🔍 Verifying package..."
MANIFEST="$REGISTRY_DIR/my-skill-1.0.0.manifest.json"
PACKAGE="$REGISTRY_DIR/my-skill-1.0.0.tgz"
skills-cli verify $PACKAGE $MANIFEST

# Install
echo "📥 Installing skill..."
skills-cli install $PACKAGE $MANIFEST --target $INSTALL_DIR --force
```

## 🔐 **Snapshot Testing (P6)**

### Función Avanzada
```typescript
packSkillWithSnapshotValidation(
  skillDir: string,
  options: SnapshotValidationOptions
): Promise<{
  manifest: SkillManifest;
  packagePath: string;
  manifestPath: string;
  validationResult: SnapshotValidationResult;
}>
```

### Características

✅ **Validación Estructural**
- Verifica estructura de manifest
- Valida campos requeridos y opcionales
- Comprueba formatos (version, hash, timestamp)

✅ **Validación de Determinismo**
- Empaqueta skill múltiples veces
- Compara hashes resultantes
- Asegura reproducibilidad

✅ **Validación Cruzada con Snapshot**
- Compara contra snapshot almacenado
- Detecta cambios no intencionados
- Reporta diferencias detalladas

### Ejemplo de Uso

```typescript
import { packSkillWithSnapshotValidation } from '@skills-fabrik/skills-cli';

const result = await packSkillWithSnapshotValidation(
  './skills/my-skill',
  {
    outDir: './.registry',
    strictMode: true,
    validateDeterminism: true,
    compareWithSnapshot: './snapshots/my-skill.snapshot.json'
  }
);

if (result.validationResult.isValid) {
  console.log('✅ All validations passed');
} else {
  console.log('❌ Validation errors:', result.validationResult.errors);
}
```

### Configuración de Snapshot

```typescript
interface SnapshotValidationOptions {
  strictMode?: boolean;              // Validación estricta
  validateDeterminism?: boolean;     // Test de determinismo
  compareWithSnapshot?: string;      // Snapshot de referencia
  platform?: string;                 // Plataforma objetivo
}
```

## 📊 **Métricas y Observabilidad**

### Métricas de Pack
- **Tiempo de empaquetado**: `skills_pack_duration_ms`
- **Tamaño del paquete**: `skills_package_size_bytes`
- **Número de archivos**: `skills_package_files_count`
- **Hash computation**: `skills_hash_computation_ms`

### Métricas de Verify
- **Tiempo de verificación**: `skills_verify_duration_ms`
- **Hash mismatches**: `skills_verify_hash_mismatches_total`
- **Validations passed**: `skills_verify_validations_passed_total`

### Métricas de Install
- **Tiempo de instalación**: `skills_install_duration_ms`
- **Instalaciones exitosas**: `skills_install_success_total`
- **Instalaciones fallidas**: `skills_install_failure_total`
- **Espacio utilizado**: `skills_install_disk_usage_bytes`

## 🚨 **Manejo de Errores**

### Errores de Pack

| Código | Mensaje | Causa | Solución |
|--------|---------|-------|----------|
| `SKILL_NOT_FOUND` | SKILL.md not found | Skill no existe | Verificar ruta |
| `INVALID_FRONTMATTER` | Frontmatter missing 'id' | Frontmatter inválido | Corregir SKILL.md |
| `INVALID_SEMVER` | version must follow semver | Versión malformada | Usar MAJOR.MINOR.PATCH |
| `INVALID_HASH` | hash must be 64-character hex | Hash inválido | Regenerar paquete |
| `PACK_FAILED` | Failed to create tarball | Error de sistema | Verificar permisos |

### Errores de Verify

| Código | Mensaje | Causa | Solución |
|--------|---------|-------|----------|
| `HASH_MISMATCH` | Package hash mismatch | Paquete corrupto | Re-empaquetar |
| `MANIFEST_INVALID` | Manifest validation failed | Manifest malformado | Regenerar |
| `FILE_NOT_FOUND` | Package not found | Paquete no existe | Verificar ruta |

### Errores de Install

| Código | Mensaje | Causa | Solución |
|--------|---------|-------|----------|
| `ALREADY_INSTALLED` | Skill already installed | Skill existe | Usar `--force` |
| `EXTRACT_FAILED` | Failed to extract tarball | Error de extracción | Verificar paquete |
| `PERMISSION_DENIED` | Permission denied | Sin permisos | Corregir permisos |

## 🧪 **Testing**

### Tests Unitarios
```bash
# Ejecutar todos los tests
pnpm test

# Tests específicos de pack/verify/install
pnpm test:unit -- test/utils/skill-packager.test.ts

# Tests de snapshot
pnpm test:snapshot
```

### Tests de Integración
```bash
# Workflow completo pack→verify→install
pnpm test:integration -- test/pack-workflow.spec.ts

# Tests de determinismo
pnpm test:pack:determinism
```

### Tests de Performance
```bash
# Benchmark de empaquetado
pnpm test:pack:benchmark

# Test de carga
pnpm test:load:pack
```

## 📚 **API Reference**

### Funciones Exportadas

#### `packSkill(skillDir, options?)`
Empaqueta un skill en un tarball con manifest.

**Parámetros:**
- `skillDir: string` - Directorio del skill
- `options?: PackOptions` - Opciones de empaquetado

**Retorna:**
```typescript
{
  manifest: SkillManifest;
  packagePath: string;
  manifestPath: string;
}
```

#### `loadManifest(manifestPath)`
Carga y valida un manifest desde archivo.

**Parámetros:**
- `manifestPath: string` - Ruta al manifest

**Retorna:** `Promise<SkillManifest>`

#### `verifyPackage(packagePath, manifest)`
Verifica integridad de un paquete.

**Parámetros:**
- `packagePath: string` - Ruta al paquete
- `manifest: SkillManifest` - Manifest de referencia

**Retorna:** `Promise<void>` (throws on error)

#### `installPackage(packagePath, manifest, options?)`
Instala un skill desde paquete.

**Parámetros:**
- `packagePath: string` - Ruta al paquete
- `manifest: SkillManifest` - Manifest del skill
- `options?: InstallOptions` - Opciones de instalación

**Retorna:** `Promise<string>` (directorio de instalación)

#### `packSkillWithSnapshotValidation(skillDir, options)`
Empaqueta con validación de snapshot avanzada.

**Parámetros:**
- `skillDir: string` - Directorio del skill
- `options: SnapshotValidationOptions` - Opciones de validación

**Retorna:**
```typescript
{
  manifest: SkillManifest;
  packagePath: string;
  manifestPath: string;
  validationResult: SnapshotValidationResult;
}
```

## 🔒 **Seguridad**

### Hash Verification
- ✅ SHA-256 para integridad
- ✅ Verificación obligatoria antes de install
- ✅ Timestamps determinísticos
- ✅ Reproducibilidad garantizada

### Sandboxing
- ✅ Extracción en directorio aislado
- ✅ Validación de paths (no escape)
- ✅ Límites de tamaño (50 archivos, 1.5MB)
- ✅ Permisos fijos (uid/gid=0)

### Validación de Input
- ✅ Sanitización de frontmatter
- ✅ Validación de estructura
- ✅ Límites de tamaño
- ✅ Paths seguros

## 📈 **Performance**

### Optimizaciones

1. **Empaquetado Determinístico**
   - Staging temporal evita node_modules
   - Orden consistente de archivos
   - Mtime fijo en 0

2. **Compresión Eficiente**
   - Gzip con nivel 6 (balance speed/size)
   - Exclusión de archivos innecesarios
   - Streaming para archivos grandes

3. **Verificación Paralela**
   - Hash computation en streaming
   - Validación asíncrona
   - Cache de manifests

### Benchmarks Típicos

| Operación | Tiempo | Tamaño |
|-----------|--------|--------|
| Pack (10 archivos) | ~150ms | ~50KB |
| Pack (100 archivos) | ~300ms | ~500KB |
| Verify | ~50ms | N/A |
| Install | ~100ms | N/A |

## 🚀 **Best Practices**

### Para Developers

1. **Versionado Semántico**
   - Usar MAJOR.MINOR.PATCH
   - Incrementar PATCH para bugfixes
   - Incrementar MINOR para nuevas features
   - Incrementar MAJOR para breaking changes

2. **Determinismo**
   - No incluir timestamps en SKILL.md
   - Evitar archivos con timestamps variables
   - Usar snapshot testing en CI

3. **allowed-tools**
   - Lista mínima necesaria
   - Evitar wildcards (*)
   - Documentar cada tool

4. **Scripts**
   - Usar rutas relativas
   - Evitar dependencias hardcodeadas
   - Testear en modo dry-run

### Para DevOps

1. **Registry Management**
   - Versionado de packages
   - Backup de manifests
   - Cleanup de versiones antiguas

2. **Verification Pipeline**
   - Verificar antes de deploy
   - Checksums en manifest
   - Audit de integridad

3. **Storage**
   - SSD para registry
   - Backup automático
   - Retención por versión

## 🐛 **Troubleshooting**

### Problemas Comunes

#### Hash Mismatch
```bash
# Verificar si el paquete está corrupto
sha256sum my-skill-1.0.0.tgz

# Comparar con manifest
cat my-skill-1.0.0.manifest.json | jq '.hash'

# Re-empaquetar si necesario
skills-cli pack ./skills/my-skill --out .registry
```

#### Permisos de Install
```bash
# Verificar permisos
ls -la skills/

# Corregir ownership
sudo chown -R $USER:$USER skills/

# Verificar espacio
df -h skills/
```

#### Snapshot Failures
```bash
# Actualizar snapshots (si es intencionado)
UPDATE_SNAPSHOTS=true pnpm test:snapshot

# Ver diferencias
diff snapshots/my-skill.snapshot.json <(jq . .registry/my-skill-1.0.0.manifest.json)
```

### Debug Mode

```bash
# Logs detallados
LOG_LEVEL=debug skills-cli pack ./skills/my-skill

# Validación estricta
STRICT_MODE=true skills-cli verify package manifest

# Verbose output
VERBOSE=true skills-cli install package manifest
```

## 📖 **Referencias**

- [Skill Packager API](../cli/API.md#skill-packager)
- [Snapshot Testing](P6-SNAPSHOT-TESTING.md)
- [CLI Commands Guide](../cli/CLI-COMMANDS-GUIDE.md)
- [Security Best Practices](../security/PACKAGING-SECURITY.md)

---

**Última Actualización**: 2025-11-02
**Autor**: Skills Fabrik Team
**Estado**: ✅ Completado
