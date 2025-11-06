# CI/CD Pipelines - Setup y Configuración Inicial

## Configuración de Plataformas de CI/CD

Esta guía cubre la configuración inicial de GitHub Actions, GitLab CI y Jenkins.

---

## 1. GitHub Actions Setup

### Configuración Básica

#### Repository Configuration

```bash
# 1. Crear directorio de workflows
mkdir -p .github/workflows

# 2. Configurar secrets en GitHub
# Repository Settings → Secrets and variables → Actions
# Añadir secrets:
# - NPM_TOKEN
# - CODECOV_TOKEN
# - STAGING_WEBHOOK
# - PRODUCTION_WEBHOOK
# - SSH_PRIVATE_KEY
```

#### Workflow Template

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

# Trigger configuration
on:
  push:
    branches: [ main, develop, 'feature/*' ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

# Concurrency control
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# Job definitions
jobs:
  # Matrix build for multiple Node versions
  test:
    name: Test on Node ${{ matrix.node-version }}
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # Build job
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-${{ github.sha }}
          path: dist/
          retention-days: 7

  # Docker build (optional)
  docker:
    name: Build Docker Image
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myapp:latest
            myapp:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### Environment Configuration

```yaml
# .github/workflows/deploy.yml
name: Deploy Application

on:
  push:
    branches: [ main ]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Your deployment script here

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    needs: deploy-staging

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Your production deployment here
```

---

## 2. GitLab CI Setup

### Configuración Básica

#### Repository Configuration

```bash
# 1. Crear archivo de configuración
touch .gitlab-ci.yml

# 2. Configurar CI/CD Variables
# Project Settings → CI/CD → Variables
# Añadir variables:
# - NPM_TOKEN
# - STAGING_SERVER
# - PRODUCTION_SERVER
# - SSH_PRIVATE_KEY
```

#### Pipeline Configuration

```yaml
# .gitlab-ci.yml
# Default configuration
default:
  image: node:18-alpine
  cache:
    key: npm
    paths:
      - .npm/
  before_script:
    - npm ci

# Stages definition
stages:
  - install
  - build
  - test
  - security
  - package
  - deploy

# Job templates
.install_template: &install_template
  stage: install
  script:
    - npm ci
  only:
    changes:
      - package.json
      - package-lock.json

.build_template: &build_template
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  only:
    - main
    - develop

.test_template: &test_template
  stage: test
  script:
    - npm run lint
    - npm test -- --coverage --coverageReporters=cobertura
  coverage: '/Coverage: \d+\.\d+ %/'
  artifacts:
    reports:
      junit: coverage/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

  # Parallel testing
  parallel:
    matrix:
      - TEST_SUITE: [unit, integration, e2e]

# Pipeline jobs
install:
  <<: *install_template

build:
  <<: *build_template

unit_test:
  <<: *test_template
  name: Unit Tests
  script:
    - npm run test:unit
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'

integration_test:
  <<: *test_template
  name: Integration Tests
  script:
    - npm run test:integration

e2e_test:
  stage: test
  image: cypress/included:12.0.0
  script:
    - npx cypress run
  artifacts:
    when: always
    paths:
      - cypress/videos/
      - cypress/screenshots/
    expire_in: 1 week

# Security scanning
security_scan:
  stage: security
  image: node:18-alpine
  script:
    - npm audit --audit-level=moderate
    - npx audit-ci --moderate
  allow_failure: true

# SAST scanning
sast:
  stage: security
  image: securecodewarrior/semgrep
  script:
    - semgrep --config=auto --json -o semgrep-report.json .
  artifacts:
    reports:
      sast: semgrep-report.json
  allow_failure: true

# Deployment jobs
deploy_staging:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to staging server: $STAGING_SERVER"
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $STAGING_SERVER >> ~/.ssh/known_hosts
    - ssh $STAGING_SERVER "cd /var/www/app && git pull && npm ci && npm run build"
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to production server: $PRODUCTION_SERVER"
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $PRODUCTION_SERVER >> ~/.ssh/known_hosts
    - ssh $PRODUCTION_SERVER "cd /var/www/app && git pull && npm ci && npm run build"
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main
```

---

## 3. Jenkins Setup

### Configuración Básica

#### Jenkins Installation

```bash
# Using Docker
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Initial setup
# 1. Open http://localhost:8080
# 2. Follow setup wizard
# 3. Install recommended plugins
# 4. Create admin user
```

#### Jenkinsfile (Declarative)

```groovy
// Jenkinsfile
pipeline {
  agent {
    docker {
      image 'node:18-alpine'
      args '-v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  options {
    // Build configuration
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(
      logRotator(
        numToKeepStr: '10',
        daysToKeepStr: '30'
      )
    )
    // Disable concurrent builds
    disableConcurrentBuilds()
    // Add timestamps to console output
    timestamps()
  }

  // Environment variables
  environment {
    NODE_ENV = 'test'
    CI = 'true'
    NPM_CONFIG_CACHE = '.npm'
  }

  // Tools configuration
  tools {
    nodejs '18'
    dockerTool 'latest'
  }

  // Stage definitions
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          // Get commit info
          def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
          env.GIT_COMMIT = commitHash
          env.BUILD_TAG = "build-${commitHash}"
        }
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Test') {
      parallel {
        stage('Unit Tests') {
          steps {
            sh 'npm test -- --coverage --coverageReporters=cobertura'
            publishHTML([
              allowMissing: false,
              alwaysLinkToLastBuild: true,
              keepAll: true,
              reportDir: 'coverage/lcov-report',
              reportFiles: 'index.html',
              reportName: 'Coverage Report'
            ])
          }
          post {
            always {
              publishTestResults testResultsPattern: 'coverage/junit.xml'
            }
          }
        }

        stage('Integration Tests') {
          steps {
            sh 'npm run test:integration'
          }
        }

        stage('E2E Tests') {
          when {
            branch 'main'
          }
          steps {
            sh 'npx cypress run'
          }
          post {
            always {
              archiveArtifacts artifacts: 'cypress/screenshots/*', allowEmptyArchive: true
              archiveArtifacts artifacts: 'cypress/videos/*', allowEmptyArchive: true
            }
          }
        }
      }
    }

    stage('Security Scan') {
      steps {
        sh 'npm audit --audit-level=moderate'
      }
      post {
        always {
          publishChecks name: 'Security Audit', summary: 'NPM audit completed'
        }
      }
    }

    stage('Build') {
      when {
        anyOf {
          branch 'main'
          branch 'develop'
        }
      }
      steps {
        sh 'npm run build'
        archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
      }
    }

    stage('Deploy - Staging') {
      when {
        branch 'develop'
      }
      steps {
        script {
          // Deploy to staging
          withCredentials([sshUserPrivateKey(
            credentialsId: 'staging-ssh-key',
            keyFileVariable: 'SSH_KEY'
          )]) {
            sh '''
              eval $(ssh-agent -s)
              ssh-add $SSH_KEY
              ssh -o StrictHostKeyChecking=no user@staging-server "cd /var/www/app && git pull && npm ci && npm run build"
            '''
          }
        }
      }
    }

    stage('Deploy - Production') {
      when {
        branch 'main'
      }
      steps {
        timeout(time: 10, unit: 'MINUTES') {
          input(
            id: 'DeployGate', message: 'Deploy to production?',
            submitter: 'admin,devops-team'
          )
        }
        script {
          // Deploy to production
          withCredentials([sshUserPrivateKey(
            credentialsId: 'production-ssh-key',
            keyFileVariable: 'SSH_KEY'
          )]) {
            sh '''
              eval $(ssh-agent -s)
              ssh-add $SSH_KEY
              ssh -o StrictHostKeyChecking=no user@production-server "cd /var/www/app && git pull && npm ci && npm run build && pm2 restart app"
            '''
          }
        }
      }
    }
  }

  // Post-build actions
  post {
    always {
      cleanWs()
    }
    success {
      emailext(
        subject: "✅ Build Success: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
        body: """
          Build completed successfully.
          Check console output at ${env.BUILD_URL}
          Commit: ${env.GIT_COMMIT}
        """,
        to: "${env.CHANGE_AUTHOR_EMAIL}",
        recipientProviders: [developers(), requestor()]
      )
      publishChecks(
        name: env.JOB_NAME,
        summary: 'Build completed successfully',
        status: 'PASSED'
      )
    }
    failure {
      emailext(
        subject: "❌ Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
        body: """
          Build failed.
          Check console output at ${env.BUILD_URL}
          Commit: ${env.GIT_COMMIT}
        """,
        to: "${env.CHANGE_AUTHOR_EMAIL}",
        recipientProviders: [developers(), requestor()]
      )
      publishChecks(
        name: env.JOB_NAME,
        summary: 'Build failed',
        status: 'FAILED'
      )
    }
    unstable {
      emailext(
        subject: "⚠️ Build Unstable: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
        body: """
          Build completed but with issues.
          Check console output at ${env.BUILD_URL}
        """,
        to: "${env.CHANGE_AUTHOR_EMAIL}"
      )
    }
  }
}
```

---

## 4. Runner Configuration

### GitHub Self-Hosted Runner

```bash
# 1. Download runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64-2.311.0.tar.gz

# 2. Extract
tar xzf actions-runner-linux-x64-2.311.0.tar.gz

# 3. Configure
./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN

# 4. Install as service
sudo ./svc.sh install
sudo ./svc.sh start

# 5. Docker support (optional)
sudo usermod -aG docker $USER
```

### GitLab Runner

```bash
# 1. Install GitLab Runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner

# 2. Register runner
sudo gitlab-runner register \
  --url https://gitlab.com/ \
  --token YOUR_TOKEN \
  --executor docker \
  --docker-image node:18-alpine

# 3. Configure
sudo nano /etc/gitlab-runner/config.toml

[[runners]]
  name = "my-runner"
  url = "https://gitlab.com/"
  token = "YOUR_TOKEN"
  executor = "docker"
  docker = {
    image = "node:18-alpine"
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
  }

# 4. Restart runner
sudo gitlab-runner restart
```

---

## 5. Secrets Management

### GitHub Actions

```yaml
# Using secrets in workflows
steps:
  - name: Deploy to server
    run: |
      curl -X POST ${{ secrets.DEPLOY_WEBHOOK }}
    env:
      API_KEY: ${{ secrets.API_KEY }}
```

### GitLab CI

```yaml
# Using CI/CD variables
deploy:
  script:
    - echo "Deploying with token: $CI_JOB_TOKEN"
    - deploy-script --api-key $API_KEY
  variables:
    API_KEY: $API_KEY
```

### Jenkins

```groovy
// Using credentials
pipeline {
  environment {
    API_KEY = credentials('api-key-id')
  }
  stages {
    stage('Deploy') {
      steps {
        sh 'deploy-script --api-key $API_KEY'
      }
    }
  }
}
```

---

## 6. Notifications Setup

### Slack Integration

```yaml
# GitHub Actions
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#ci-cd'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

```groovy
// Jenkins
emailext(
  subject: "Build ${currentBuild.currentResult}: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
  body: """
    Build: ${env.BUILD_URL}
    Status: ${currentBuild.currentResult}
    Duration: ${currentBuild.durationString}
  """,
  to: "${env.CHANGE_AUTHOR_EMAIL}",
  recipientProviders: [developers(), requestor()]
)
```

---

**Estado**: Setup completo de CI/CD
**GitHub Actions**: Workflows, artifacts, environments
**GitLab CI**: Pipelines, stages, artifacts
**Jenkins**: Jenkinsfile, agents, notifications
**Runners**: Self-hosted runners configuration
**Secrets**: Secure credential management
**Notifications**: Slack, email integration
