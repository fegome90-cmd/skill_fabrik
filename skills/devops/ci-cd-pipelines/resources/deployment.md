# CI/CD Deployment Strategies - Estrategias de Deployment

## Estrategias de Deployment para Producción

Esta guía cubre diferentes estrategias de deployment, desde básico hasta avanzado.

---

## 1. Basic Deployment

### Simple Server Deployment

```yaml
# GitHub Actions - Basic deployment
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/app
            git pull origin main
            npm ci --production
            npm run build
            pm2 restart app
```

### Rolling Deployment

```yaml
# Jenkins - Rolling deployment
pipeline {
  agent any

  stages {
    stage('Deploy') {
      steps {
        script {
          def servers = ['server1', 'server2', 'server3']
          def index = 0

          // Deploy to each server with health check
          for (server in servers) {
            sh "Deploying to $server"
            sh "ssh $server 'cd /var/www/app && git pull && npm ci --production && pm2 restart app'"

            // Health check
            timeout(time: 5, unit: 'MINUTES') {
              waitUntil {
                def healthCheck = sh(
                  script: "curl -f http://$server:3000/health",
                  returnStatus: true
                )
                return (healthCheck == 0)
              }
            }

            echo "Server $server deployment successful"
          }
        }
      }
    }
  }
}
```

---

## 2. Blue-Green Deployment

### Zero-Downtime Deployment

```yaml
# GitLab CI - Blue-Green deployment
stages:
  - deploy-staging
  - deploy-production

deploy-staging:
  stage: deploy-staging
  image: alpine:latest
  variables:
    STAGING_GREEN_PORT: 3001
  script:
    - apk add --no-cache curl openssh-client
    - eval $(ssh-agent -s)
    - echo "$STAGING_SSH_PRIVATE_KEY" | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan staging-server >> ~/.ssh/known_hosts

    # Deploy to green environment
    - ssh staging-server "cd /var/www/app && git pull && npm ci --production"
    - ssh staging-server "pm2 delete green || true"
    - ssh staging-server "pm2 start ecosystem.config.js --name green --env staging"

    # Health check green environment
    - |
      for i in {1..30}; do
        if curl -f http://staging-server:$STAGING_GREEN_PORT/health; then
          echo "Green environment healthy"
          break
        fi
        echo "Waiting for green environment..."
        sleep 10
      done

    # Switch traffic
    - ssh staging-server "pm2 delete blue || true"
    - ssh staging-server "pm2 rename green blue"
  environment:
    name: staging
    url: http://staging-server:3000

deploy-production:
  stage: deploy-production
  image: alpine:latest
  variables:
    PROD_GREEN_PORT: 3001
  script:
    - apk add --no-cache curl openssh-client
    - eval $(ssh-agent -s)
    - echo "$PROD_SSH_PRIVATE_KEY" | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan production-server >> ~/.ssh/known_hosts

    # Deploy to green environment
    - ssh production-server "cd /var/www/app && git pull && npm ci --production"
    - ssh production-server "pm2 delete green || true"
    - ssh production-server "pm2 start ecosystem.config.js --name green --env production"

    # Health check green environment
    - |
      for i in {1..30}; do
        if curl -f http://production-server:$PROD_GREEN_PORT/health; then
          echo "Green environment healthy"
          break
        fi
        echo "Waiting for green environment..."
        sleep 10
      done

    # Traffic test (send small percentage of traffic)
    - |
      for i in {1..10}; do
        ROUTE=$(curl -s http://production-server:$PROD_GREEN_PORT/health)
        echo "Test request result: $ROUTE"
        sleep 2
      done

    # Switch traffic
    - ssh production-server "pm2 delete blue || true"
    - ssh production-server "pm2 rename green blue"
  environment:
    name: production
    url: http://production-server:3000
  when: manual
```

### Blue-Green with Nginx

```nginx
# nginx.conf - Blue-green configuration
upstream backend_blue {
    server blue-server:3000;
}

upstream backend_green {
    server green-server:3001;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend_blue;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```yaml
# Deployment script to switch Nginx
- name: Switch Nginx to green
  run: |
    # Deploy to green server
    ssh green-server "cd /var/www/app && git pull && npm ci"

    # Switch Nginx configuration
    if grep -q "backend_blue" /etc/nginx/nginx.conf; then
      sed -i 's/backend_blue/backend_temp/g' /etc/nginx/nginx.conf
      sed -i 's/backend_green/backend_blue/g' /etc/nginx/nginx.conf
      sed -i 's/backend_temp/backend_green/g' /etc/nginx/nginx.conf
      nginx -t && nginx -s reload
    fi
```

---

## 3. Canary Deployment

### Gradual Rollout

```yaml
# GitHub Actions - Canary deployment
name: Canary Deployment

on:
  push:
    branches: [main]

jobs:
  deploy-canary:
    name: Deploy Canary (10%)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to canary servers
        run: |
          # Deploy to 1 out of 10 servers
          SERVER_INDEX=$(($RANDOM % 10 + 1))
          CANARY_SERVER="server${SERVER_INDEX}"

          echo "Deploying to canary server: $CANARY_SERVER"
          ssh $CANARY_SERVER "cd /var/www/app && git pull && npm ci --production"

      - name: Monitor canary
        run: |
          # Monitor canary for 10 minutes
          for i in {1..60}; do
            ERROR_RATE=$(curl -s http://canary-server:3000/metrics | jq '.error_rate')
            RESPONSE_TIME=$(curl -s http://canary-server:3000/metrics | jq '.response_time')

            if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
              echo "ERROR: High error rate in canary: $ERROR_RATE"
              exit 1
            fi

            sleep 10
          done
        env:
          CANARY_SERVER: ${{ secrets.CANARY_SERVER }}

  deploy-remainder:
    name: Deploy to Remainder (90%)
    runs-on: ubuntu-latest
    needs: deploy-canary

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to all servers
        run: |
          # Deploy to all servers except canary
          for server in server{1..10}; do
            if [ "$server" != "$CANARY_SERVER" ]; then
              echo "Deploying to $server"
              ssh $server "cd /var/www/app && git pull && npm ci --production"
            fi
          done
```

### Istio Canary with Kubernetes

```yaml
# Kubernetes with Istio
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp.example.com
  http:
    - match:
        - headers:
            user-group:
              exact: "canary"
      route:
        - destination:
            host: myapp
            subset: v2
          weight: 100
    - route:
        - destination:
            host: myapp
            subset: v1
          weight: 90
        - destination:
            host: myapp
            subset: v2
          weight: 10

---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: myapp
spec:
  host: myapp
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

---

## 4. Kubernetes Deployment

### Rolling Update

```yaml
# kubernetes/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Allow 1 extra pod during update
      maxUnavailable: 1      # Allow 1 pod to be unavailable
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1
    spec:
      containers:
      - name: myapp
        image: myapp:v1
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Blue-Green Kubernetes

```yaml
# Kubernetes blue-green deployment
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: myapp-rollout
spec:
  replicas: 5
  strategy:
    blueGreen:
      activeService: myapp-blue
      previewService: myapp-green
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: myapp-green
      duration: 5m
      successCondition: result[0] >= 0.95
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:v1
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: myapp-blue
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000

---
apiVersion: v1
kind: Service
metadata:
  name: myapp-green
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

### GitHub Actions Deployment to Kubernetes

```yaml
# Deploy to Kubernetes
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'latest'

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_DATA }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            myapp:${{ github.sha }}
            myapp:latest

      - name: Deploy to Kubernetes
        run: |
          export KUBECONFIG=kubeconfig
          # Update image tag in deployment
          kubectl set image deployment/myapp \
            myapp=myapp:${{ github.sha }}

          # Wait for rollout to complete
          kubectl rollout status deployment/myapp --timeout=300s

      - name: Verify deployment
        run: |
          export KUBECONFIG=kubeconfig
          kubectl get pods
          kubectl get services
```

---

## 5. Docker Deployment

### Multi-Stage Build

```dockerfile
# Dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# Docker deployment workflow
name: Docker Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
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
            myapp:${{ github.sha }}
            myapp:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to Docker Swarm
        run: |
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > deploy_key
          chmod 600 deploy_key

          for server in manager1 worker1 worker2; do
            ssh -i deploy_key -o StrictHostKeyChecking=no ${{ secrets.USERNAME }}@$server "
              docker pull myapp:${{ github.sha }}
              docker service update --image myapp:${{ github.sha }} myapp_service || \
              docker service create --name myapp_service myapp:${{ github.sha }}
            "
          done
```

---

## 6. Database Migration During Deployment

### Safe Migration Pattern

```yaml
# GitLab CI - Database migration
stages:
  - pre-migration
  - deploy
  - post-migration

pre-migration-backup:
  stage: pre-migration
  image: postgres:14
  script:
    - pg_dump $DATABASE_URL > backup.sql
    - |
      aws s3 cp backup.sql \
        s3://$BACKUP_BUCKET/backups/backup-$(date +%Y%m%d-%H%M%S).sql
  artifacts:
    paths:
      - backup.sql
  only:
    - main

deploy-with-migration:
  stage: deploy
  image: node:18
  script:
    - npm ci
    - npm run build

    # Run migration
    - npx prisma migrate deploy

    # Verify schema
    - npx prisma db pull --preview-feature

  environment:
    name: production
    url: $PRODUCTION_URL
  only:
    - main

post-migration-verification:
  stage: post-migration
  image: node:18
  script:
    - npm run test:smoke --production
    - curl -f $PRODUCTION_URL/health
    - curl -f $PRODUCTION_URL/api/status
  only:
    - main
  on_failure:
    trigger:
      stage: rollback
      project: $CI_PROJECT_ID
      branch: main
```

---

## 7. Rollback Strategies

### Automated Rollback

```yaml
# GitHub Actions - Rollback workflow
name: Rollback

on:
  workflow_run:
    workflows: ["Deploy"]
    types:
      - completed

jobs:
  rollback:
    name: Rollback on Failure
    runs-on: ubuntu-latest
    if: |
      github.event.workflow_run.conclusion == 'failure' &&
      github.event.workflow_run.head_branch == 'main'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get previous successful build
        id: previous-build
        run: |
          PREVIOUS_SHA=$(gh run list --workflow Deploy --branch main --limit 1 --json headSha --jq '.[0].headSha')
          echo "previous_sha=$PREVIOUS_SHA" >> $GITHUB_OUTPUT

      - name: Rollback deployment
        run: |
          echo "Rolling back to commit: ${{ steps.previous-build.outputs.previous_sha }}"
          ssh ${{ secrets.USERNAME }}@${{ secrets.HOST }} "
            cd /var/www/app
            git checkout ${{ steps.previous-build.outputs.previous_sha }}
            npm ci --production
            pm2 restart all
          "

      - name: Notify
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#deployments'
          message: "Deployment rolled back to previous version"
```

### Manual Rollback Button

```yaml
# Manual rollback job
rollback-manual:
  runs-on: ubuntu-latest
  environment: production

  steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Get last 10 releases
      id: releases
      run: |
        RELEASES=$(gh release list --limit 10 --json tagName,name,url)
        echo "releases=$RELEASES" >> $GITHUB_OUTPUT

    - name: Rollback to selected version
      if: inputs.version
      run: |
        echo "Rolling back to: ${{ inputs.version }}"
        ssh ${{ secrets.USERNAME }}@${{ secrets.HOST }} "
          cd /var/www/app
          git checkout ${{ inputs.version }}
          npm ci --production
          pm2 restart all
        "
```

---

## 8. Deployment Verification

### Health Checks

```yaml
# Deployment with verification
name: Deploy with Verification

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy application
        run: |
          # Deploy code
          ssh $SERVER "cd /var/www/app && git pull && npm ci --production"

      - name: Wait for deployment
        run: |
          echo "Waiting for application to start..."
          for i in {1..30}; do
            if curl -f http://$SERVER/health; then
              echo "Application is healthy"
              break
            fi
            echo "Waiting... ($i/30)"
            sleep 10
          done

      - name: Run smoke tests
        run: |
          npm run test:smoke --baseUrl=http://$SERVER

      - name: Verify database connection
        run: |
          curl -f http://$SERVER/api/db-status

      - name: Verify external services
        run: |
          curl -f http://$SERVER/api/ping-payment-gateway
          curl -f http://$SERVER/api/ping-notification-service

      - name: Performance check
        run: |
          RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://$SERVER/api/health)
          if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
            echo "ERROR: Slow response time: $RESPONSE_TIME"
            exit 1
          fi

      - name: Post-deployment cleanup
        run: |
          ssh $SERVER "pm2 flush"  # Clear logs
          ssh $SERVER "npm cache clean --force"
```

### Smoke Tests

```bash
#!/bin/bash
# smoke-tests.sh
set -e

BASE_URL=${BASE_URL:-http://localhost:3000}

echo "Running smoke tests..."

# Test 1: Health endpoint
echo "Test 1: Health check"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$response" != "200" ]; then
  echo "ERROR: Health check failed"
  exit 1
fi

# Test 2: API endpoint
echo "Test 2: API status"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/status)
if [ "$response" != "200" ]; then
  echo "ERROR: API status check failed"
  exit 1
fi

# Test 3: Database connection
echo "Test 3: Database connection"
response=$(curl -s $BASE_URL/api/db-status | jq -r '.status')
if [ "$response" != "connected" ]; then
  echo "ERROR: Database not connected"
  exit 1
fi

# Test 4: Response time
echo "Test 4: Response time"
response_time=$(curl -o /dev/null -s -w '%{time_total}' $BASE_URL/health)
echo "Response time: ${response_time}s"
if (( $(echo "$response_time > 2.0" | bc -l) )); then
  echo "ERROR: Slow response time"
  exit 1
fi

echo "All smoke tests passed!"
```

---

## 9. Zero-Downtime Best Practices

### Checklist

✅ **Prerequisites**:
- [ ] Application is stateless (or uses external session store)
- [ ] Database migrations are backward compatible
- [ ] Health check endpoints are implemented
- [ ] Rollback plan is defined
- [ ] Monitoring is in place
- [ ] Load balancer can handle multiple versions

✅ **During Deployment**:
- [ ] Deploy to isolated environment first (staging)
- [ ] Run full test suite before production
- [ ] Deploy during low-traffic hours
- [ ] Monitor metrics during deployment
- [ ] Have a rollback button ready
- [ ] Communicate deployment to team

✅ **After Deployment**:
- [ ] Verify health checks pass
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify all features work
- [ ] Update documentation

---

**Estado**: Estrategias de deployment completadas
**Basic**: Simple server deployments, rolling updates
**Blue-Green**: Zero-downtime with environment switching
**Canary**: Gradual rollout with monitoring
**Kubernetes**: Rolling updates, Argo Rollouts
**Docker**: Multi-stage builds, swarm deployments
**Database**: Safe migrations with backups
**Rollback**: Automated and manual rollback strategies
**Verification**: Health checks, smoke tests, monitoring
