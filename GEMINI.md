# GEMINI.md

This file provides a comprehensive overview of the Skills Fabric project, its structure, and its development conventions. It is intended to be used as a reference for developers working on the project.

## Project Overview

Skills Fabric is a sophisticated, editor-agnostic kit for auto-activating skills, quality hooks, structured dev-docs, and debugging with PM2. The project is a monorepo managed with pnpm and written in TypeScript.

The core of the project is the `skills-cli`, a command-line interface for managing and using "skills". Skills are reusable components or pieces of knowledge for software development, defined in `SKILL.md` files. The project also includes a number of other packages, such as a router, a daemon, and a set of slash commands.

The project is highly structured and follows the CLOOP methodology, a five-phase iterative development process: Clarify, Layout, Operate, Observe, and Reflect.

### Main Technologies

- **Node.js:** The project is built on the Node.js runtime.
- **TypeScript:** The project is written in TypeScript.
- **pnpm:** The project uses pnpm for package management.
- **Jest:** The project uses Jest for testing.
- **ESLint:** The project uses ESLint for linting.
- **Prettier:** The project uses Prettier for code formatting.
- **PM2:** The project uses PM2 for process management.
- **Fastify:** The project uses Fastify for building web services.

## Building and Running

### Installation

To install the project's dependencies, run the following command:

```bash
pnpm install
```

### Building

To build the project, run the following command:

```bash
pnpm -w build
```

### Running the CLI

The `skills-cli` is the main entry point for interacting with the Skills Fabric project. You can run the CLI using the `sf` alias:

```bash
sf --help
```

### Running Services

The project uses PM2 to manage a number of services, including a daemon, a service discovery registry, and a router. To start all services, run the following command:

```bash
pm2 start scripts/pm2/ecosystem.config.cjs --env development
```

## Development Conventions

### Coding Style

The project uses ESLint and Prettier to enforce a consistent coding style. Before committing any code, be sure to run the following command to lint and format your changes:

```bash
pnpm lint:fix
```

### Testing

The project has a comprehensive test suite that includes unit tests, integration tests, and end-to-end tests. To run all tests, run the following command:

```bash
pnpm test
```

### CLOOP Methodology

The project follows the CLOOP methodology, a five-phase iterative development process:

1.  **Clarify:** Define the objective, hypothesis, and success criteria.
2.  **Layout:** Create a minimum executable plan (MVP).
3.  **Operate:** Execute the workflow/agents.
4.  **Observe:** Collect metrics and evidence.
5.  **Reflect:** Metacognition (error analysis, adjustments).

All development work should follow this methodology. For more information, see the [CLOOP Methodology Guide](cloop/CLOOP-METHODOLOGY-GUIDE.md).

## Key Files and Directories

- `packages/`: The directory containing the individual packages of the monorepo.
- `packages/skills-cli/`: The source code for the `skills-cli`.
- `skills/`: The directory containing the canonical library of skills.
- `cloop/`: The directory containing documentation for the CLOOP methodology.
- `README.md`: The main README file for the project.
- `package.json`: The main `package.json` file for the project.
- `pnpm-workspace.yaml`: The file that defines the pnpm workspace.

## 🛡️ Protocolo de Seguridad y Auditoría (2025)

**Instrucciones Críticas para Agentes:**
Se requiere realizar verificaciones periódicas de seguridad en este repositorio para mitigar amenazas de cadena de suministro y vulnerabilidades conocidas.

### 1. Detección de Paquetes Maliciosos

Buscar proactivamente dependencias conocidas por contener malware (robo de credenciales SSH, inyección de código):

- `warbeast2000`
- `kodiak2k`
- `lottie-player` (versiones comprometidas)

**Comando de verificación:**

```bash
npm list warbeast2000 kodiak2k || pnpm list warbeast2000 kodiak2k
```

### 2. Vulnerabilidades Críticas (React/Next.js)

Verificar versiones vulnerables a RCE (Remote Code Execution):

- **React:** Versiones 19.0, 19.1, 19.2 son vulnerables. Usar v18.3.1 o superior parcheada.
- **Next.js:** Versiones 15.x, 16.x y canaries recientes pueden ser vulnerables.

### 3. Mantenimiento Preventivo

- **Lockfiles:** Asegurar que `package-lock.json` o `pnpm-lock.yaml` estén siempre versionados.
- **Auditoría:** Ejecutar `npm audit` o `pnpm audit` regularmente.
