# FarmSense Quick Reference Guide

Quick commands and tips for common development tasks.

---

## Development Commands

### Start Development Server
```bash
export DATABASE_URL="mysql://root:password@localhost:3306/farmsense"
export OAUTH_SERVER_URL="https://api.manus.im"
pnpm dev
```
Access at: http://localhost:3000

### Run Tests
```bash
export DATABASE_URL="mysql://root:password@localhost:3306/farmsense"
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test --watch
```

### Type Check
```bash
pnpm check
```

### Format Code
```bash
pnpm format
```

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

---

## Database Commands

### Run Migrations
```bash
export DATABASE_URL="mysql://root:password@localhost:3306/farmsense"
pnpm db:push
```

### Generate New Migration
```bash
# 1. Edit drizzle/schema.ts
# 2. Generate migration
pnpm drizzle-kit generate
```

### Load Seed Data
```bash
mysql -uroot -ppassword farmsense < scripts/seed-data.sql
```

### Reset Database
```bash
mysql -uroot -ppassword -e "DROP DATABASE IF EXISTS farmsense; CREATE DATABASE farmsense;"
export DATABASE_URL="mysql://root:password@localhost:3306/farmsense"
pnpm db:push
mysql -uroot -ppassword farmsense < scripts/seed-data.sql
```

### Backup Database
```bash
mysqldump -uroot -ppassword farmsense > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -uroot -ppassword farmsense < backup_20260104.sql
```

---

## Docker Commands

### Start All Services
```bash
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Service
```bash
docker-compose restart backend
```

### Rebuild Service
```bash
docker-compose build backend
docker-compose up -d backend
```

### Execute Command in Container
```bash
docker-compose exec backend npm run db:push
```

### Check Service Status
```bash
docker-compose ps
```

---

## Git Commands

### Initial Setup
```bash
git init
git add .
git commit -m "Initial commit: FarmSense precision irrigation system"
git remote add origin https://github.com/yourusername/farmsense.git
git push -u origin main
```

### Daily Workflow
```bash
# Pull latest changes
git pull

# Create feature branch
git checkout -b feature/new-feature

# Make changes, then commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature
```

### Check Status
```bash
git status
git log --oneline -10
```

---

## Testing Specific Features

### Test Decision Engine
```bash
pnpm test server/decisionEngine.test.ts
```

### Test Irrigation Control
```bash
pnpm test server/irrigationControl.test.ts
```

### Test LLM Analysis
```bash
pnpm test server/llmAnalysis.test.ts
```

### Test with Coverage
```bash
pnpm test --coverage
```

---

## API Testing

### Health Check
```bash
curl http://localhost:3000/api/trpc/system.health
```

### Test tRPC Endpoint
```bash
# Get farms list (requires authentication)
curl -X POST http://localhost:3000/api/trpc/farms.list \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your_session_token"
```

---

## Environment Variables

### Required for Development
```bash
export DATABASE_URL="mysql://root:password@localhost:3306/farmsense"
export OAUTH_SERVER_URL="https://api.manus.im"
export JWT_SECRET="dev-secret-key"
export OPENAI_API_KEY="sk-your-api-key"
export NODE_ENV="development"
```

### Create .env.local File
```bash
cat > .env.local << EOF
DATABASE_URL=mysql://root:password@localhost:3306/farmsense
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=dev-secret-key
OPENAI_API_KEY=sk-your-api-key
NODE_ENV=development
LOG_LEVEL=debug
EOF
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Clear Node Modules
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -uroot -ppassword -e "SELECT 1;"

# Check database exists
mysql -uroot -ppassword -e "SHOW DATABASES LIKE 'farmsense';"
```

### Reset Everything
```bash
# Stop all processes
pkill -f "tsx watch"
pkill -f "vite"

# Clean database
mysql -uroot -ppassword -e "DROP DATABASE IF EXISTS farmsense; CREATE DATABASE farmsense;"

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Run migrations
export DATABASE_URL="mysql://root:password@localhost:3306/farmsense"
pnpm db:push

# Load seed data
mysql -uroot -ppassword farmsense < scripts/seed-data.sql

# Start fresh
pnpm dev
```

---

## Useful MySQL Queries

### Check Table Counts
```sql
SELECT 
  'farms' as table_name, COUNT(*) as count FROM farms
UNION ALL SELECT 'fields', COUNT(*) FROM fields
UNION ALL SELECT 'equipment', COUNT(*) FROM irrigationEquipment
UNION ALL SELECT 'metrics', COUNT(*) FROM normalizedMetrics
UNION ALL SELECT 'recommendations', COUNT(*) FROM irrigationRecommendations;
```

### View Recent Metrics
```sql
SELECT fieldId, metricType, value, unit, timestamp 
FROM normalizedMetrics 
ORDER BY timestamp DESC 
LIMIT 10;
```

### View Active Recommendations
```sql
SELECT f.name as field, r.recommendationStatus, r.confidence, r.reasoning
FROM irrigationRecommendations r
JOIN fields f ON r.fieldId = f.id
WHERE r.expiresAt > NOW()
ORDER BY r.timestamp DESC;
```

### View Control Actions
```sql
SELECT f.name as field, e.name as equipment, a.actionType, a.status, a.timestamp
FROM irrigationControlActions a
JOIN fields f ON a.fieldId = f.id
JOIN irrigationEquipment e ON a.equipmentId = e.id
ORDER BY a.timestamp DESC
LIMIT 10;
```

---

## Performance Monitoring

### Check Process Memory
```bash
ps aux | grep -E "(tsx|node)" | grep -v grep
```

### Check Port Usage
```bash
netstat -tuln | grep -E "(3000|3001|3306)"
```

### Monitor Logs in Real-time
```bash
tail -f /tmp/server.log
```

### Check Database Size
```sql
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = "farmsense"
ORDER BY (data_length + index_length) DESC;
```

---

## Code Quality

### Lint Check
```bash
# Type checking
pnpm check

# Format check
pnpm prettier --check .
```

### Auto-fix Formatting
```bash
pnpm format
```

### Find TODO Comments
```bash
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" client/ server/
```

---

## Deployment

### Build Production Bundle
```bash
pnpm build
```

### Test Production Build Locally
```bash
NODE_ENV=production pnpm start
```

### Deploy to Server
```bash
# SSH to server
ssh user@your-server.com

# Pull latest code
cd /opt/farmsense
git pull

# Install dependencies
pnpm install

# Run migrations
export DATABASE_URL="mysql://user:pass@localhost:3306/farmsense"
pnpm db:push

# Restart service
sudo systemctl restart farmsense
```

---

## Keyboard Shortcuts (VS Code)

- `Ctrl+P` - Quick file open
- `Ctrl+Shift+P` - Command palette
- `Ctrl+` - Toggle terminal
- `F12` - Go to definition
- `Shift+F12` - Find all references
- `Ctrl+Shift+F` - Search in files
- `Ctrl+/` - Toggle comment

---

## Important File Locations

- **Schema**: `drizzle/schema.ts`
- **API Routes**: `server/routers.ts`
- **Decision Engine**: `server/decisionEngine.ts`
- **Control Logic**: `server/irrigationControl.ts`
- **Database Queries**: `server/db.ts`
- **Frontend App**: `client/src/App.tsx`
- **Environment**: `.env.local`
- **Tests**: `server/*.test.ts`

---

## Common Issues & Solutions

### "Port 3000 is busy"
Server will automatically use port 3001. Check logs for actual port.

### "DATABASE_URL is required"
Export the environment variable before running commands.

### "Cannot find module"
Run `pnpm install` to install dependencies.

### "Table doesn't exist"
Run `pnpm db:push` to create tables.

### "No data in database"
Load seed data: `mysql -uroot -p farmsense < scripts/seed-data.sql`

### "Tests failing"
Ensure DATABASE_URL is set and database is accessible.

---

## Support Resources

- **Documentation**: README.md, ARCHITECTURE.md, DEPLOYMENT_GUIDE.md
- **Project Summary**: PROJECT_SUMMARY.md
- **Test Files**: Look at `*.test.ts` files for usage examples
- **Schema Reference**: `drizzle/schema.ts` for database structure

---

*Last Updated: January 4, 2026*
