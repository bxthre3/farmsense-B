# FarmSense Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying FarmSense in various environments, from local development to production.

## Local Development Setup

### Prerequisites

Ensure you have the following installed:

- Node.js 18+ (for frontend and backend)
- Docker and Docker Compose (for containerized services)
- PostgreSQL 15+ (if not using Docker)
- Python 3.10+ (for Celery workers)
- Git for version control

### Quick Start

1. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/yourusername/farmsense.git
cd farmsense
```

2. Create environment configuration:

```bash
cp .env.example .env.local
```

3. Edit `.env.local` with your local settings:

```bash
DATABASE_URL=postgresql://farmsense:password@localhost:5432/farmsense
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-local-secret-key
ENVIRONMENT=development
```

4. Install dependencies:

```bash
pnpm install
```

5. Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Docker Deployment

### Building Docker Images

The project includes Dockerfiles for all components. Build the images:

```bash
docker-compose build
```

### Starting the Stack

Launch all services with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL with TimescaleDB
- Redis
- FastAPI backend
- Celery worker and beat scheduler
- Next.js frontend

### Verifying Services

Check service status:

```bash
docker-compose ps
```

View logs for a specific service:

```bash
docker-compose logs -f backend
docker-compose logs -f celery-worker
docker-compose logs -f frontend
```

### Database Setup

Run migrations on the first deployment:

```bash
docker-compose exec backend pnpm db:push
```

### Stopping Services

Stop all services:

```bash
docker-compose down
```

To also remove volumes (careful - this deletes data):

```bash
docker-compose down -v
```

## Production Deployment

### Environment Configuration

Create a production environment file with secure values:

```bash
# .env.production
DATABASE_URL=postgresql://farmsense_user:STRONG_PASSWORD@db.example.com:5432/farmsense
REDIS_URL=redis://redis.example.com:6379/0
JWT_SECRET=GENERATE_WITH_$(openssl rand -base64 32)
ENVIRONMENT=production
LOG_LEVEL=warn
OPENAI_API_KEY=sk-your-production-key
```

### Security Considerations

**Database Security**
- Use strong, randomly generated passwords
- Enable SSL/TLS for database connections
- Restrict database access to application servers only
- Enable database backups and point-in-time recovery
- Use read replicas for analytics queries

**Application Security**
- Enable HTTPS/TLS for all connections
- Use environment variables for secrets (never commit to Git)
- Implement rate limiting on API endpoints
- Enable CORS restrictions
- Use security headers (CSP, X-Frame-Options, etc.)
- Implement request validation and sanitization

**Infrastructure Security**
- Use VPC/private networks for internal services
- Implement firewall rules
- Use security groups to restrict access
- Enable audit logging
- Monitor for suspicious activity

### Scaling Considerations

**Horizontal Scaling**
- Run multiple backend instances behind a load balancer
- Use managed database services (RDS, Cloud SQL)
- Use managed Redis (ElastiCache, Memorystore)
- Deploy Celery workers on separate machines
- Use container orchestration (Kubernetes, ECS)

**Vertical Scaling**
- Increase server resources (CPU, RAM)
- Optimize database queries with indexes
- Implement caching strategies
- Use CDN for static assets

### Database Backup Strategy

Regular backups are critical:

```bash
# Daily automated backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/farmsense-$(date +\%Y\%m\%d).sql.gz

# Weekly full backups to S3
0 3 * * 0 pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://farmsense-backups/weekly-$(date +\%Y\%m\%d).sql.gz

# Point-in-time recovery configuration
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
```

### Monitoring and Alerting

Set up comprehensive monitoring:

**Application Metrics**
- API response times
- Error rates and types
- Request volume
- Database query performance
- Celery task queue depth

**Infrastructure Metrics**
- CPU and memory usage
- Disk space
- Network I/O
- Database connections
- Redis memory usage

**Alerting Rules**
- High error rate (> 1%)
- API response time > 1s
- Database connection pool exhausted
- Celery worker failures
- Disk space low (< 10%)
- Memory usage high (> 80%)

### Log Aggregation

Centralize logs for easier troubleshooting:

```bash
# Using ELK Stack
docker-compose up -d elasticsearch logstash kibana

# Or use cloud services
# AWS CloudWatch
# Google Cloud Logging
# Datadog
# New Relic
```

## Kubernetes Deployment

For high-availability production environments:

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Helm 3+

### Deployment Steps

1. Create namespace:

```bash
kubectl create namespace farmsense
```

2. Create secrets:

```bash
kubectl create secret generic farmsense-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=redis-url=$REDIS_URL \
  --from-literal=jwt-secret=$JWT_SECRET \
  -n farmsense
```

3. Deploy PostgreSQL:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql -n farmsense
```

4. Deploy Redis:

```bash
helm install redis bitnami/redis -n farmsense
```

5. Deploy FarmSense backend:

```bash
kubectl apply -f k8s/backend-deployment.yaml -n farmsense
```

6. Deploy Celery workers:

```bash
kubectl apply -f k8s/celery-deployment.yaml -n farmsense
```

7. Deploy frontend:

```bash
kubectl apply -f k8s/frontend-deployment.yaml -n farmsense
```

### Kubernetes Manifests

Example `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: farmsense-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: farmsense-backend
  template:
    metadata:
      labels:
        app: farmsense-backend
    spec:
      containers:
      - name: backend
        image: farmsense:backend-latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: farmsense-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy FarmSense

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm check
      - run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Your deployment script here
          ./scripts/deploy.sh
```

## Troubleshooting Deployment

### Database Connection Issues

**Problem**: Backend cannot connect to database

**Solution**:
1. Verify DATABASE_URL is correct
2. Check database is running: `docker-compose logs postgres`
3. Verify credentials: `psql -U farmsense -h localhost`
4. Check firewall rules allow connection
5. Verify SSL certificates if using SSL

### Celery Tasks Not Processing

**Problem**: Data ingestion tasks are not running

**Solution**:
1. Check Redis connection: `redis-cli ping`
2. Verify Celery worker is running: `docker-compose logs celery-worker`
3. Check task queue: `redis-cli LLEN celery`
4. Restart Celery: `docker-compose restart celery-worker`
5. Check logs for errors: `docker-compose logs celery-worker | tail -100`

### High Memory Usage

**Problem**: Services consuming excessive memory

**Solution**:
1. Check which service: `docker stats`
2. Increase container limits in docker-compose.yml
3. Optimize database queries
4. Implement connection pooling
5. Scale horizontally with multiple instances

### Slow API Responses

**Problem**: API endpoints responding slowly

**Solution**:
1. Check database query performance: `EXPLAIN ANALYZE`
2. Add database indexes
3. Implement caching
4. Scale backend instances
5. Use CDN for static assets
6. Profile application code

## Maintenance

### Regular Tasks

**Daily**
- Monitor error rates and response times
- Check disk space
- Review logs for issues

**Weekly**
- Verify backups are working
- Review security logs
- Check for updates

**Monthly**
- Update dependencies
- Review performance metrics
- Conduct security audit
- Test disaster recovery

### Updates and Patches

1. Test updates in staging environment
2. Create database backup
3. Deploy to production during maintenance window
4. Monitor for issues
5. Have rollback plan ready

### Scaling Operations

Monitor these metrics to determine when to scale:

- CPU usage > 70% consistently
- Memory usage > 80%
- API response time > 500ms
- Database query time > 100ms
- Celery queue depth > 1000 tasks

Scale by:
- Adding more backend instances
- Increasing database resources
- Adding Celery workers
- Implementing caching
- Optimizing queries

## Support and Resources

- Documentation: See README.md and ARCHITECTURE.md
- Issues: Report on GitHub
- Email: support@farmsense.io
- Status Page: https://status.farmsense.io
