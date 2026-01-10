# Frappe Lending - Installation & Setup Guide

## Overview
This guide provides comprehensive installation and setup instructions for the Frappe Lending platform, covering multiple installation methods, system requirements, and initial configuration.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation Methods](#2-installation-methods)
3. [Docker Installation](#3-docker-installation)
4. [Manual Installation](#4-manual-installation)
5. [Cloud Installation](#5-cloud-installation)
6. [Initial Configuration](#6-initial-configuration)
7. [Post-Installation Setup](#7-post-installation-setup)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. System Requirements

### 1.1 Hardware Requirements

#### Minimum Requirements (Development)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB free space
- **Network**: Internet connection for package installation

#### Recommended Requirements (Production)
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 100+ GB SSD
- **Network**: Stable internet connection

### 1.2 Software Requirements

#### Operating System
- **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+
- **macOS**: 10.15+ (for development)
- **Windows**: Windows 10+ with WSL2 or Docker (for development)

#### Required Software
- **Python**: 3.10+ (for Frappe Framework)
- **Node.js**: 18+ (for frontend)
- **MariaDB/MySQL**: 10.6+ or MySQL 8.0+
- **Redis**: 6.0+ (for caching and queues)
- **Nginx**: 1.18+ (for production web server)
- **Git**: Latest version

#### Optional Software
- **Docker**: 20.10+ (for containerized installation)
- **Docker Compose**: 2.0+ (for multi-container setup)
- **wkhtmltopdf**: 0.12.3+ (for PDF generation)

### 1.3 Database Requirements

#### MariaDB Configuration
```ini
[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
max_allowed_packet = 256M
innodb_file_format = Barracuda
innodb_file_per_table = 1
innodb_large_prefix = 1
```

#### Database User Permissions
```sql
CREATE USER 'lending_user'@'localhost' IDENTIFIED BY 'secure_password';
CREATE DATABASE lending_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON lending_db.* TO 'lending_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 2. Installation Methods

### 2.1 Installation Options

1. **Docker Installation** (Recommended for Development)
   - Fastest setup
   - Isolated environment
   - Easy cleanup
   - Best for development/testing

2. **Manual Installation** (Recommended for Production)
   - Full control
   - Better performance
   - Production-ready
   - Customizable

3. **Cloud Installation**
   - Managed services
   - Scalable
   - High availability
   - Professional support

---

## 3. Docker Installation

### 3.1 Prerequisites

```bash
# Check Docker installation
docker --version
docker-compose --version

# Ensure Docker is running
docker ps
```

### 3.2 Quick Setup (Using frappe_docker)

#### Step 1: Clone frappe_docker Repository

```bash
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker
```

#### Step 2: Create Environment File

Create `.env` file:

```env
FRAPPE_VERSION=v15.0.0
ERPNEXT_VERSION=v15.0.0
LENDING_VERSION=develop
```

#### Step 3: Start Services

```bash
docker-compose up -d
```

#### Step 4: Create Site

```bash
docker-compose exec backend bench new-site lending.localhost \
  --db-root-password admin \
  --admin-password admin \
  --no-mariadb-socket
```

#### Step 5: Install ERPNext

```bash
docker-compose exec backend bench get-app erpnext https://github.com/frappe/erpnext
docker-compose exec backend bench --site lending.localhost install-app erpnext
```

#### Step 6: Install Lending App

```bash
docker-compose exec backend bench get-app lending https://github.com/frappe/lending
docker-compose exec backend bench --site lending.localhost install-app lending
```

#### Step 7: Access Application

- **URL**: http://lending.localhost:8000
- **Username**: Administrator
- **Password**: admin

### 3.3 Custom Docker Compose Setup

#### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: admin
    volumes:
      - db-data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis-cache:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  redis-queue:
    image: redis:6-alpine
    ports:
      - "6380:6379"

  frappe:
    image: frappe/bench:latest
    command: sleep infinity
    volumes:
      - ./apps:/workspace/frappe-bench/apps
      - ./sites:/workspace/frappe-bench/sites
    depends_on:
      - db
      - redis-cache
      - redis-queue
    ports:
      - "8000:8000"

volumes:
  db-data:
```

---

## 4. Manual Installation

### 4.1 Install System Dependencies

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y \
  python3-dev \
  python3-pip \
  python3-venv \
  mariadb-server \
  mariadb-client \
  redis-server \
  nginx \
  git \
  curl \
  wget \
  libcups2-dev \
  libssl-dev \
  libffi-dev \
  libjpeg-dev \
  zlib1g-dev \
  libpng-dev
```

#### CentOS/RHEL

```bash
sudo yum update -y
sudo yum install -y \
  python3-devel \
  python3-pip \
  mariadb-server \
  mariadb \
  redis \
  nginx \
  git \
  curl \
  wget \
  gcc \
  gcc-c++ \
  make \
  openssl-devel \
  libffi-devel \
  libjpeg-devel \
  zlib-devel
```

### 4.2 Install Python Dependencies

```bash
# Install frappe-bench
pip3 install frappe-bench

# Initialize bench
bench init frappe-bench --frappe-branch version-15
cd frappe-bench
```

### 4.3 Install ERPNext

```bash
# Get ERPNext app
bench get-app erpnext --branch version-15

# Create site
bench new-site lending.localhost \
  --db-root-password your_db_password \
  --admin-password your_admin_password

# Install ERPNext
bench --site lending.localhost install-app erpnext
```

### 4.4 Install Lending App

```bash
# Get Lending app
bench get-app lending https://github.com/frappe/lending

# Install Lending app
bench --site lending.localhost install-app lending
```

### 4.5 Configure Database

```bash
# Edit site config
bench --site lending.localhost set-config db_name lending_db
bench --site lending.localhost set-config db_password your_password

# Migrate database
bench --site lending.localhost migrate
```

### 4.6 Start Services

```bash
# Start development server
bench start

# Or start in production mode
bench setup production
sudo supervisorctl restart all
```

---

## 5. Cloud Installation

### 5.1 AWS Installation

#### Using EC2

```bash
# Launch EC2 instance (Ubuntu 20.04)
# SSH into instance

# Install dependencies
sudo apt update
sudo apt install -y python3-pip mariadb-server redis-server nginx

# Install frappe-bench
pip3 install frappe-bench

# Follow manual installation steps
```

#### Using RDS for Database

```bash
# Create RDS MariaDB instance
# Update site config with RDS endpoint
bench --site lending.localhost set-config db_host your-rds-endpoint
bench --site lending.localhost set-config db_port 3306
```

### 5.2 Azure Installation

#### Using Azure VM

```bash
# Create Ubuntu VM
# Install dependencies
# Follow manual installation steps
```

#### Using Azure Database for MySQL

```bash
# Create Azure Database for MySQL
# Update connection string in site config
```

### 5.3 Google Cloud Installation

#### Using Compute Engine

```bash
# Create VM instance
# Install dependencies
# Follow manual installation steps
```

---

## 6. Initial Configuration

### 6.1 Site Configuration

#### Basic Settings

```bash
# Set site name
bench --site lending.localhost set-config site_name "Lending Platform"

# Set timezone
bench --site lending.localhost set-config time_zone "Asia/Kolkata"

# Set language
bench --site lending.localhost set-config language "en"
```

#### Database Configuration

```bash
# Database settings
bench --site lending.localhost set-config db_name lending_db
bench --site lending.localhost set-config db_host localhost
bench --site lending.localhost set-config db_port 3306
```

#### Redis Configuration

```bash
# Cache Redis
bench --site lending.localhost set-config redis_cache "redis://localhost:6379"

# Queue Redis
bench --site lending.localhost set-config redis_queue "redis://localhost:6380"
```

### 6.2 Company Setup

1. **Login** to the application
2. Navigate to **Company** doctype
3. Create company with:
   - Company Name
   - Abbreviation
   - Default Currency
   - Country
   - Chart of Accounts

### 6.3 Chart of Accounts Setup

#### Required Account Groups

```
Assets
  ├── Current Assets
  │   ├── Bank Accounts
  │   ├── Accounts Receivable
  │   └── Loans and Advances (Assets)
  └── Fixed Assets

Liabilities
  ├── Current Liabilities
  │   └── Loans (Liabilities)
  └── Long Term Liabilities

Income
  └── Direct Income
      └── Interest Income

Expenses
  └── Direct Expenses
      └── Interest Expenses
```

#### Create Accounts via API

```python
# Create account structure
accounts = [
    {
        "account_name": "Loan Account",
        "parent_account": "Loans and Advances (Assets) - COMPANY",
        "account_type": "Asset",
        "root_type": "Asset"
    },
    {
        "account_name": "Payment Account",
        "parent_account": "Bank Accounts - COMPANY",
        "account_type": "Bank",
        "root_type": "Asset"
    },
    {
        "account_name": "Interest Income Account",
        "parent_account": "Direct Income - COMPANY",
        "account_type": "Income Account",
        "root_type": "Income"
    }
    # ... more accounts
]
```

---

## 7. Post-Installation Setup

### 7.1 Create First Loan Product

#### Via UI
1. Navigate to **Loan Product**
2. Click **New**
3. Fill in:
   - Product Code: `PL-001`
   - Product Name: `Personal Loan`
   - Company: Select your company
   - Rate of Interest: `12.5`
   - Maximum Loan Amount: `1000000`
   - Repayment Schedule Type: `Monthly as per repayment start date`
4. Configure accounts:
   - Disbursement Account
   - Payment Account
   - Loan Account
   - Interest Income Account
   - Penalty Income Account
   - (and other required accounts)
5. Save and Submit

#### Via API

```bash
curl -X POST http://localhost:8000/api/resource/Loan%20Product \
  -H "Authorization: token api_key:api_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "product_code": "PL-001",
    "product_name": "Personal Loan",
    "company": "Your Company",
    "rate_of_interest": 12.5,
    "maximum_loan_amount": 1000000,
    "is_term_loan": 1,
    "repayment_schedule_type": "Monthly as per repayment start date"
  }'
```

### 7.2 Configure Loan Origination Settings

1. Navigate to **Loan Origination Settings**
2. Configure:
   - **Unique Customer**: Enable to enforce unique email/phone
   - **Employee Loans**: Enable if offering employee loans
3. Save

### 7.3 Set Up Users and Roles

#### Create Users

```bash
# Via bench command
bench --site lending.localhost add-user user@example.com --first-name "John" --last-name "Doe"

# Or via UI: User > New User
```

#### Assign Roles

1. Navigate to **User** doctype
2. Select user
3. Go to **Roles** section
4. Add roles:
   - Loan Manager
   - Loan Officer
   - Loan Processor
   - (as needed)

### 7.4 Configure Scheduler

```bash
# Enable scheduler
bench --site lending.localhost set-config enable_scheduler 1

# Start scheduler
bench schedule
```

### 7.5 Set Up Email (Optional)

```bash
# Configure email settings
bench --site lending.localhost set-config mail_server smtp.gmail.com
bench --site lending.localhost set-config mail_port 587
bench --site lending.localhost set-config mail_login your_email@gmail.com
bench --site lending.localhost set-config mail_password your_password
```

---

## 8. Troubleshooting

### 8.1 Common Installation Issues

#### Issue: Database Connection Failed

```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Check connection
mysql -u root -p -e "SHOW DATABASES;"

# Verify site config
bench --site lending.localhost show-config
```

#### Issue: Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8000

# Kill the process or change port
bench --site lending.localhost set-config http_port 8001
```

#### Issue: Permission Denied

```bash
# Fix permissions
sudo chown -R $USER:$USER frappe-bench
chmod -R 755 frappe-bench
```

#### Issue: Module Not Found

```bash
# Reinstall dependencies
bench setup requirements
bench build
```

### 8.2 Docker-Specific Issues

#### Issue: Container Won't Start

```bash
# Check logs
docker-compose logs frappe

# Restart containers
docker-compose restart

# Rebuild containers
docker-compose up -d --build
```

#### Issue: Database Not Ready

```bash
# Wait for database
docker-compose exec db mysqladmin ping -h localhost

# Check database logs
docker-compose logs db
```

### 8.3 Performance Issues

#### Slow Queries

```bash
# Enable query logging
bench --site lending.localhost set-config enable_query_logging 1

# Check slow queries
bench --site lending.localhost mariadb -e "SHOW FULL PROCESSLIST;"
```

#### Memory Issues

```bash
# Increase Redis memory
# Edit redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 8.4 Verification Checklist

- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] Site accessible in browser
- [ ] Can login with admin credentials
- [ ] ERPNext app installed
- [ ] Lending app installed
- [ ] Company created
- [ ] Chart of Accounts configured
- [ ] First Loan Product created
- [ ] Users and roles configured
- [ ] Scheduler running
- [ ] No errors in logs

---

## 9. Production Deployment

### 9.1 Production Checklist

- [ ] Use production database (separate from development)
- [ ] Configure SSL certificates
- [ ] Set up Nginx reverse proxy
- [ ] Configure firewall rules
- [ ] Set up backup procedures
- [ ] Configure monitoring
- [ ] Set up log rotation
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up failover (if needed)

### 9.2 Nginx Configuration

```nginx
server {
    listen 80;
    server_name lending.example.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9.3 SSL Configuration

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d lending.example.com
```

### 9.4 Backup Setup

```bash
# Create backup script
bench --site lending.localhost backup --with-files

# Schedule daily backups (crontab)
0 2 * * * cd /path/to/frappe-bench && bench --site lending.localhost backup
```

---

## 10. Next Steps

After successful installation:

1. **Configure Settings** - See Configuration Guide
2. **Set Up Security** - See Security & Permissions Guide
3. **Create Loan Products** - Define your loan offerings
4. **Set Up Users** - Create users and assign roles
5. **Test Workflows** - Test loan creation and processing
6. **Configure Reports** - Set up required reports
7. **Train Users** - Provide user training

---

## Conclusion

This installation guide provides comprehensive instructions for setting up the Frappe Lending platform. Choose the installation method that best fits your needs:

- **Development**: Use Docker for quick setup
- **Production**: Use manual installation for better control
- **Cloud**: Use cloud services for scalability

For additional help, refer to:
- Configuration Guide
- Security & Permissions Guide
- Troubleshooting Guide

