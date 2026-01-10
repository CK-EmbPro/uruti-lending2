# Troubleshooting Guide

## Docker Port Conflicts

### PostgreSQL Port Already in Use

**Error**: `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution 1: Use Different Port (Recommended)**

The docker-compose.yml is already configured to use port 5433. Update your `.env` file:

```env
DB_PORT=5433
```

Then restart containers:
```bash
docker-compose down
docker-compose up -d
```

**Solution 2: Stop Existing PostgreSQL Service**

If you have PostgreSQL running locally and want to use Docker instead:

**Windows:**
```powershell
# Stop PostgreSQL service
Stop-Service postgresql-x64-15  # Adjust version number as needed

# Or using Services
services.msc  # Find PostgreSQL service and stop it
```

**Linux:**
```bash
sudo systemctl stop postgresql
# or
sudo service postgresql stop
```

**macOS:**
```bash
brew services stop postgresql
```

**Solution 3: Use Existing PostgreSQL Instance**

If you want to use your existing PostgreSQL instead of Docker:

1. Update `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=lending_db
```

2. Create the database:
```bash
psql -U your_username -h localhost
CREATE DATABASE lending_db;
\q
```

3. Comment out or remove the postgres service from docker-compose.yml

### Redis Port Already in Use

**Error**: `Bind for 0.0.0.0:6379 failed: port is already allocated`

**Solution 1: Use Different Port**

Update docker-compose.yml:
```yaml
redis:
  ports:
    - "6380:6379"  # Use 6380 instead
```

Update `.env`:
```env
REDIS_PORT=6380
```

**Solution 2: Stop Existing Redis**

**Windows:**
```powershell
Stop-Service Redis
```

**Linux:**
```bash
sudo systemctl stop redis
```

**macOS:**
```bash
brew services stop redis
```

## Database Connection Issues

### Cannot Connect to Database

**Check:**
1. Is PostgreSQL container running?
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify connection settings in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5433  # Or 5432 if using local PostgreSQL
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=lending_db
   ```

### Database Does Not Exist

**Create database:**
```bash
# Using Docker PostgreSQL
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE lending_db;"

# Using local PostgreSQL
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE lending_db;"
```

## Application Startup Issues

### Port 3000 Already in Use

**Solution: Change application port**

Update `.env`:
```env
PORT=3001
```

### Module Not Found Errors

**Solution: Reinstall dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeORM Connection Errors

**Check:**
1. Database is running
2. Connection credentials are correct
3. Database exists
4. Network connectivity

**Test connection:**
```bash
# Using Docker
docker-compose exec postgres psql -U postgres -d lending_db

# Using local PostgreSQL
psql -U postgres -h localhost -p 5432 -d lending_db
```

## Common Solutions

### Reset Everything

```bash
# Stop and remove containers
docker-compose down -v

# Remove node_modules
rm -rf node_modules

# Reinstall
npm install

# Start fresh
docker-compose up -d
npm run start:dev
```

### Check What's Using a Port

**Windows:**
```powershell
netstat -ano | findstr :5432
```

**Linux/macOS:**
```bash
lsof -i :5432
# or
sudo netstat -tulpn | grep :5432
```

