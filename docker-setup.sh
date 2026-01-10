#!/bin/bash

# Frappe Docker Setup Script
# This script sets up Frappe with ERPNext and Lending app

set -e

echo "Starting Frappe Docker setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start services
echo "Starting Docker containers..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Create a new site (if needed)
echo "Creating Frappe site..."
docker-compose exec -T frappe bench new-site lending.localhost --db-root-password admin --admin-password admin --no-mariadb-socket || true

# Install ERPNext
echo "Installing ERPNext..."
docker-compose exec -T frappe bench get-app erpnext https://github.com/frappe/erpnext || true
docker-compose exec -T frappe bench --site lending.localhost install-app erpnext || true

# Install Lending app
echo "Installing Lending app..."
docker-compose exec -T frappe bench get-app lending https://github.com/frappe/lending || true
docker-compose exec -T frappe bench --site lending.localhost install-app lending || true

echo "Setup complete!"
echo "Access Frappe at: http://localhost:8000"
echo "Username: Administrator"
echo "Password: admin"

