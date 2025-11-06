---
id: ci-cd-pipelines
version: 0.1.0
type: guideline
summary: 'Implementa pipelines de CI/CD con GitHub Actions, GitLab CI y Jenkins. Automatiza builds, tests, deployments y monitoring para workflows de desarrollo eficientes.'
audience: devops-engineers, senior-developers, release-managers
when_to_use: 'Al automatizar workflows de deployment, configurar CI/CD, implementar testing automatizado, o configurar releases. Usa en proyectos que requieren deployment frecuente.'
provides: 'Pipelines automatizados, testing automatizado, deployments seguros, monitoring, rollback strategies.'
resources:
  - resources/setup.md
  - resources/workflows.md
  - resources/deployment.md
  - resources/monitoring.md
scripts:
  - name: init-github-actions
    run: mkdir -p .github/workflows && touch .github/workflows/ci.yml .github/workflows/cd.yml
    note: Estructura básica GitHub Actions
  - name: init-gitlab-ci
    run: touch .gitlab-ci.yml
    note: Estructura básica GitLab CI
  - name: init-jenkins
    run: mkdir -p jenkins && touch jenkins/Jenkinsfile jenkins/pipeline.groovy
    note: Estructura básica Jenkins
  - name: run-pipeline-lint
    run: gitlab-ci-lint .gitlab-ci.yml || github-actionslint .github/workflows/* || ansible-lint jenkins/pipeline.yml
    note: Lint pipeline configuration
limits: 'Requiere acceso a repositorios y servicios de CI/CD. Secrets management crítico. Algunos servicios requieren subscripción.'
---

## Objetivo

Implementar **pipelines de CI/CD robustos** que automaticen builds, testing, deployment y monitoring para garantizar releases confiables y eficientes.

**Cuándo usar**:
- Al automatizar workflows de deployment
- Al configurar testing automatizado
- Al implementar continuous integration
- Al configurar releases y rollbacks
- Al gestionar múltiples environments

**Cuándo NO usar**: Para proyectos simples sin deployments automatizados, o cuando el overhead de CI/CD supera el beneficio.

**Qué problema resuelve**: Deployments manuales, inconsistencias, falta de testing automatizado, releases manuales propensos a errores.

## Procedimiento (resumen)

### Seleccionar Platform

1. **GitHub Actions**: Para proyectos GitHub
2. **GitLab CI**: Para proyectos GitLab
3. **Jenkins**: Para infrastructure personalizada

### Diseñar Pipeline

1. **Define stages**: Build, Test, Package, Deploy
2. **Configure triggers**: Push, PR, Manual, Scheduled
3. **Setup environments**: Dev, Staging, Production
4. **Configure notifications**: Slack, Email, Webhooks

### Implementar Testing

1. **Unit tests**: Ejecutar en build stage
2. **Integration tests**: Ejecutar antes de deploy
3. **Security scans**: SAST, DAST, dependency checks
4. **Quality gates**: Coverage, linting, performance

## Plataformas de CI/CD

### GitHub Actions

**Características**:
- **Workflows**: Definidos en YAML
- **Jobs**: Unidades de ejecución
- **Runners**: Ejecutores (self-hosted o GitHub-hosted)
- **Artifacts**: Productos de build

**Estructura**:
```yaml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
```

### GitLab CI

**Características**:
- **.gitlab-ci.yml**: Configuración centralizada
- **Runners**: Ejecutores conectados a GitLab
- **Pipelines**: Colección de jobs
- **Stages**: Grupos de jobs paralelos

**Estructura**:
```yaml
stages: [build, test, deploy]
job1:
  stage: build
  script: npm run build
job2:
  stage: test
  script: npm test
```

### Jenkins

**Características**:
- **Jenkinsfile**: Pipeline as Code
- **Agents**: Ejecutores distribuidos
- **Plugins**: Extensibilidad
- **Blue Ocean**: UI moderna

**Estructura**:
```groovy
pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
    stage('Test') {
      steps {
        sh 'npm test'
      }
    }
  }
}
```

## Checklist

- [ ] Platform seleccionada (GitHub Actions/GitLab CI/Jenkins)
- [ ] Pipeline configurado en repository
- [ ] Stages definidos (build, test, deploy)
- [ ] Triggers configurados (push, PR, manual)
- [ ] Environments definidos (dev, staging, prod)
- [ ] Secrets configurados (API keys, credentials)
- [ ] Testing automatizado (unit, integration)
- [ ] Security scans configurados
- [ ] Quality gates definidos
- [ ] Notifications configuradas
- [ ] Rollback strategy definida
- [ ] Monitoring implementado
- [ ] Documentation actualizada

## Ejemplos

### ✅ Correcto - GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run security audit
        run: npm audit --audit-level moderate

      - name: Run SAST scan
        uses: github/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### ✅ Correcto - GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - install
  - build
  - test
  - security
  - deploy

variables:
  NODE_VERSION: "18"
  npm_config_cache: "$CI_PROJECT_DIR/.npm"

install:
  stage: install
  image: node:$NODE_VERSION
  cache:
    key: npm
    paths:
      - .npm/
  script:
    - npm ci
  only:
    changes:
      - package.json
      - package-lock.json

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  only:
    - main
    - develop

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm run lint
    - npm test -- --coverage
  coverage: '/Coverage: \d+\.\d+ %/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      junit: coverage/junit.xml

deploy_staging:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to staging..."
    - curl -X POST $STAGING_DEPLOY_HOOK
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - main

deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to production..."
    - curl -X POST $PRODUCTION_DEPLOY_HOOK
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main
```

### ✅ Correcto - Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
  agent {
    docker {
      image 'node:18-alpine'
      args '-v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  environment {
    NODE_ENV = 'test'
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Test') {
      parallel {
        stage('Unit Tests') {
          steps {
            sh 'npm test -- --coverage'
          }
          post {
            always {
              publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'coverage/lcov-report',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
              ])
            }
          }
        }

        stage('Integration Tests') {
          steps {
            sh 'npm run test:integration'
          }
        }
      }
    }

    stage('Security Scan') {
      steps {
        sh 'npm audit --audit-level moderate'
        sh 'npx audit-ci --moderate'
      }
    }

    stage('Deploy - Staging') {
      when {
        branch 'develop'
      }
      steps {
        sh 'echo "Deploying to staging..."'
        sh 'curl -X POST $STAGING_WEBHOOK'
      }
    }

    stage('Deploy - Production') {
      when {
        branch 'main'
      }
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          input(
            message: 'Deploy to production?',
            ok: 'Deploy'
          )
        }
        sh 'echo "Deploying to production..."'
        sh 'curl -X POST $PRODUCTION_WEBHOOK'
      }
    }
  }

  post {
    always {
      cleanWs()
    }
    failure {
      emailext(
        subject: "Pipeline Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
