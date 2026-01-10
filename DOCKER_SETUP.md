# Docker Setup for Frappe Lending

This guide will help you set up Frappe with ERPNext and the Lending app using Docker.

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop/
   - Make sure Docker Desktop is running before proceeding

2. **Git** must be installed

## Quick Setup (Recommended)

The easiest way to set up Frappe with Docker is to use the official `frappe_docker` repository:

### Step 1: Clone frappe_docker

```bash
cd ..
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker
```

### Step 2: Create environment file

Create a `.env` file in the `frappe_docker` directory:

```env
FRAPPE_VERSION=v15.0.0
ERPNEXT_VERSION=v15.0.0
```

### Step 3: Start the containers

```bash
docker-compose up -d
```

### Step 4: Create a new site

```bash
docker-compose exec backend bench new-site lending.localhost --db-root-password admin --admin-password admin --no-mariadb-socket
```

### Step 5: Install ERPNext

```bash
docker-compose exec backend bench get-app erpnext https://github.com/frappe/erpnext
docker-compose exec backend bench --site lending.localhost install-app erpnext
```

### Step 6: Install Lending app

```bash
docker-compose exec backend bench get-app lending https://github.com/frappe/lending
docker-compose exec backend bench --site lending.localhost install-app lending
```

### Step 7: Access Frappe

Open your browser and navigate to:
- **URL**: http://lending.localhost:8000
- **Username**: Administrator
- **Password**: admin

## Alternative: Using Custom Docker Compose

If you prefer to use the docker-compose.yml in this repository:

1. **Start Docker Desktop**

2. **Start the services**:
   ```powershell
   docker-compose up -d
   ```

3. **Run the setup script**:
   ```powershell
   .\docker-setup.ps1
   ```

   Or manually:
   ```powershell
   # Create site
   docker-compose exec frappe bench new-site lending.localhost --db-root-password admin --admin-password admin --no-mariadb-socket
   
   # Install ERPNext
   docker-compose exec frappe bench get-app erpnext https://github.com/frappe/erpnext
   docker-compose exec frappe bench --site lending.localhost install-app erpnext
   
   # Install Lending
   docker-compose exec frappe bench get-app lending https://github.com/frappe/lending
   docker-compose exec frappe bench --site lending.localhost install-app lending
   ```

4. **Access at**: http://localhost:8000

## Troubleshooting

### Docker is not running
- Make sure Docker Desktop is started
- Check with: `docker ps`

### Port already in use
- Change the port in docker-compose.yml (e.g., "8001:8000")
- Update the access URL accordingly

### Site creation fails
- Wait a few minutes for the database to be fully ready
- Check logs: `docker-compose logs db`
- Try creating the site again

### App installation fails
- Check if the app is already installed: `docker-compose exec frappe bench --site lending.localhost list-apps`
- Check logs: `docker-compose logs frappe`

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Access bench shell
docker-compose exec frappe bash

# Run bench commands
docker-compose exec frappe bench --site lending.localhost [command]
```

## Next Steps

After setup:
1. Change the default admin password
2. Configure your site settings
3. Set up your company and chart of accounts
4. Start using the Lending app!

