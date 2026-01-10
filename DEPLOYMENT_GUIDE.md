# FarmSense Deployment Guide

This guide provides step-by-step instructions for deploying the FarmSense precision irrigation management system in development and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Management](#database-management)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**For Local Development:**
- Node.js 18+ (recommended: 22.x)
- pnpm 10.x or higher
- MySQL 8.0+
- Git

**For Docker Deployment:**
- Docker 20.10+
- Docker Compose 2.0+

**For Production:**
- Linux server (Ubuntu 22.04 LTS recommended)
- Nginx or Apache for reverse proxy
- SSL certificate (Let's Encrypt recommended)
- Monitoring tools (Prometheus, Grafana recommended)

### System Requirements

**Minimum:**
- 2 CPU cores
- 4 GB RAM
- 20 GB storage
- 10 Mbps network connection

**Recommended for Production:**
- 4+ CPU cores
- 8+ GB RAM
- 100+ GB SSD storage
- 100+ Mbps network connection

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/farmsense.git
cd farmsense
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database Configuration
DATABASE_URL=mysql://root:your_password@localhost:3306/farmsense

# Authentication
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=your-strong-random-secret-key

# LLM Integration (optional for development)
OPENAI_API_KEY=sk-your-openai-api-key

# Application
ENVIRONMENT=development
NODE_ENV=development
LOG_LEVEL=debug
```

### Step 4: Set Up MySQL Database

```bash
# Install MySQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install mysql-server

# Start MySQL service
sudo systemctl start mysql

# Create database
sudo mysql -e "CREATE DATABASE farmsense;"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';"
```

### Step 5: Run Database Migrations

```bash
export DATABASE_URL="mysql://root:your_password@localhost:3306/farmsense"
pnpm db:push
```

### Step 6: Load Seed Data (Optional)

```bash
mysql -uroot -pyour_password farmsense < scripts/seed-data.sql
```

### Step 7: Start Development Server

```bash
export DATABASE_URL="mysql://root:your_password@localhost:3306/farmsense"
export OAUTH_SERVER_URL="https://api.manus.im"
pnpm dev
```

The application will be available at `http://localhost:3000`

### Step 8: Run Tests

```bash
export DATABASE_URL="mysql://root:your_password@localhost:3306/farmsense"
pnpm test
```

---

## Docker Deployment

### Step 1: Create Environment File

Create a `.env` file for Docker:

```bash
# Database
DB_PASSWORD=farmsense_secure_password_change_me

# Authentication
JWT_SECRET=your-strong-random-jwt-secret-change-in-production
OAUTH_SERVER_URL=https://api.manus.im

# LLM Integration
OPENAI_API_KEY=sk-your-openai-api-key

# Application
ENVIRONMENT=production
LOG_LEVEL=info
NODE_ENV=production
```

### Step 2: Build and Start Services

```bash
# Build images
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 3: Run Database Migrations

```bash
docker-compose exec backend npm run db:push
```

### Step 4: Load Seed Data (Optional)

```bash
docker-compose exec postgres psql -U farmsense -d farmsense -f /app/scripts/seed-data.sql
```

### Step 5: Verify Deployment

```bash
# Check service status
docker-compose ps

# Test backend API
curl http://localhost:8000/api/trpc/system.health

# Access frontend
open http://localhost:3000
```

### Docker Services

The Docker Compose configuration includes:

- **postgres**: PostgreSQL 15 with TimescaleDB extension
- **redis**: Redis 7 for Celery task queue
- **backend**: Express.js + tRPC API server
- **celery-worker**: Background task processor for data ingestion
- **celery-beat**: Scheduled task coordinator
- **frontend**: Next.js React application

---

## Production Deployment

### Step 1: Server Preparation

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt-get install nginx -y
```

### Step 2: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 3: Set Up SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d farmsense.yourdomain.com
```

### Step 4: Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/farmsense`:

```nginx
upstream farmsense_backend {
    server localhost:8000;
}

upstream farmsense_frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name farmsense.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name farmsense.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/farmsense.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/farmsense.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://farmsense_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://farmsense_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://farmsense_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/farmsense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/yourusername/farmsense.git
cd farmsense

# Set up environment
sudo cp .env.example .env
sudo nano .env  # Edit with production values

# Start services
sudo docker-compose up -d

# Run migrations
sudo docker-compose exec backend npm run db:push
```

### Step 6: Set Up Automated Backups

Create `/opt/farmsense/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/farmsense/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U farmsense farmsense | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

Make it executable and add to crontab:

```bash
chmod +x /opt/farmsense/scripts/backup.sh
sudo crontab -e
# Add: 0 2 * * * /opt/farmsense/scripts/backup.sh
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` | Yes |
| `OAUTH_SERVER_URL` | OAuth server endpoint | `https://api.manus.im` | Yes |
| `JWT_SECRET` | Secret for JWT signing | Random 64-char string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for LLM | `sk-...` | Yes |
| `ENVIRONMENT` | Deployment environment | `development`, `production` | Yes |
| `NODE_ENV` | Node environment | `development`, `production` | Yes |
| `LOG_LEVEL` | Logging verbosity | `debug`, `info`, `warn`, `error` | No |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | Celery broker URL | Same as REDIS_URL |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |

---

## Database Management

### Running Migrations

```bash
# Development
export DATABASE_URL="mysql://root:password@localhost:3306/farmsense"
pnpm db:push

# Docker
docker-compose exec backend npm run db:push
```

### Creating New Migrations

1. Modify schema in `drizzle/schema.ts`
2. Generate migration:
   ```bash
   pnpm drizzle-kit generate
   ```
3. Review generated SQL in `drizzle/` directory
4. Apply migration:
   ```bash
   pnpm db:push
   ```

### Database Backup

```bash
# Manual backup
mysqldump -u root -p farmsense > backup_$(date +%Y%m%d).sql

# Docker backup
docker-compose exec postgres pg_dump -U farmsense farmsense > backup_$(date +%Y%m%d).sql
```

### Database Restore

```bash
# Manual restore
mysql -u root -p farmsense < backup_20260104.sql

# Docker restore
docker-compose exec -T postgres psql -U farmsense farmsense < backup_20260104.sql
```

---

## Monitoring and Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/trpc/system.health

# Database connection
docker-compose exec postgres pg_isready -U farmsense

# Redis connection
docker-compose exec redis redis-cli ping
```

### Log Management

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Performance Monitoring

Monitor these key metrics:

- **API Response Time**: Should be < 200ms for most endpoints
- **Database Query Time**: Should be < 50ms for indexed queries
- **Memory Usage**: Backend should use < 512MB, database < 2GB
- **CPU Usage**: Should be < 50% under normal load
- **Disk I/O**: Monitor for slow disk performance

### Updating the Application

```bash
cd /opt/farmsense

# Pull latest changes
sudo git pull origin main

# Rebuild containers
sudo docker-compose build

# Restart services
sudo docker-compose up -d

# Run migrations if needed
sudo docker-compose exec backend npm run db:push
```

---

## Troubleshooting

### Backend Won't Start

**Symptoms**: Backend container exits immediately

**Solutions**:
1. Check DATABASE_URL is correct
2. Verify MySQL is running and accessible
3. Check logs: `docker-compose logs backend`
4. Verify environment variables are set

### Database Connection Errors

**Symptoms**: "Can't connect to MySQL server"

**Solutions**:
1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check firewall rules
3. Verify credentials in DATABASE_URL
4. Test connection: `mysql -h localhost -u root -p`

### Frontend Not Loading

**Symptoms**: Blank page or connection refused

**Solutions**:
1. Check backend is running: `curl http://localhost:8000/api/trpc/system.health`
2. Verify frontend container is running: `docker-compose ps frontend`
3. Check browser console for errors
4. Clear browser cache

### Celery Tasks Not Running

**Symptoms**: Data not updating, no background jobs

**Solutions**:
1. Verify Redis is running: `docker-compose exec redis redis-cli ping`
2. Check Celery worker logs: `docker-compose logs celery-worker`
3. Verify CELERY_BROKER_URL is correct
4. Restart Celery: `docker-compose restart celery-worker celery-beat`

### High Memory Usage

**Symptoms**: System slowdown, OOM errors

**Solutions**:
1. Check for memory leaks in logs
2. Restart services: `docker-compose restart`
3. Increase Docker memory limits in docker-compose.yml
4. Optimize database queries

### SSL Certificate Issues

**Symptoms**: Certificate expired or invalid

**Solutions**:
1. Renew certificate: `sudo certbot renew`
2. Test renewal: `sudo certbot renew --dry-run`
3. Set up auto-renewal: `sudo systemctl enable certbot.timer`

---

## Production Checklist

Before going live, ensure:

- [ ] Strong JWT_SECRET is set (64+ random characters)
- [ ] Database credentials are secure and unique
- [ ] SSL/TLS is enabled and certificates are valid
- [ ] Firewall is configured to allow only necessary ports
- [ ] Automated backups are configured and tested
- [ ] Monitoring and alerting are set up
- [ ] Log aggregation is configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] Database migrations are up to date
- [ ] All tests pass
- [ ] Documentation is up to date
- [ ] Disaster recovery plan is documented
- [ ] Team has access to necessary credentials

---

## Support

For additional help:

- Documentation: https://docs.farmsense.io
- GitHub Issues: https://github.com/yourusername/farmsense/issues
- Email: support@farmsense.io

---

**Last Updated**: January 4, 2026
**Version**: 1.0.0
