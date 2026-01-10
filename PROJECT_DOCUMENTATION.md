# Uruti Lending Platform - Project Documentation

## 📚 Documentation Index

This project contains comprehensive documentation for both frontend and backend architectures, as well as seed mechanisms.

### Backend Documentation
- **[Backend Architecture](./backend/ARCHITECTURE.md)** - Complete backend architecture, module structure, patterns, and best practices
- **[Seed Mechanism](./backend/SEED_MECHANISM.md)** - Database seeding documentation, available seed scripts, and execution guide

### Frontend Documentation
- **[Frontend Architecture](./frontend/ARCHITECTURE.md)** - Frontend architecture, component structure, routing, and integration patterns

## 🏗️ Project Structure

```
uruti-Lending/
├── backend/              # NestJS backend application
│   ├── ARCHITECTURE.md   # Backend architecture documentation
│   ├── SEED_MECHANISM.md # Database seeding guide
│   └── src/             # Source code
├── frontend/             # Next.js frontend application
│   ├── ARCHITECTURE.md   # Frontend architecture documentation
│   └── app/              # Next.js app router
└── README.md             # Main project README
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📖 Key Documentation Sections

### Backend
- **Architecture Patterns**: Modular NestJS structure, service layer, dependency injection
- **Module Organization**: 100+ feature modules organized by domain
- **Database**: TypeORM configuration, entity patterns, migrations
- **API**: RESTful API structure, authentication, request flow
- **Seeds**: Manual seed execution (no automatic seeding on boot)

### Frontend
- **Architecture Patterns**: Next.js 14 App Router, component-based structure
- **API Integration**: Axios client, React Query hooks, error handling
- **State Management**: Context API, React Query for server state
- **Routing**: Dashboard routes, customer portal, public routes
- **Styling**: Tailwind CSS utility-first approach

### Seeds
- **Execution Method**: Manual execution only (via npm scripts)
- **Available Seeds**: 7 seed scripts for different data types
- **Execution Order**: Recommended order for fresh database setup
- **Troubleshooting**: Common issues and solutions

## 🔍 Finding Information

- **Architecture Questions**: See `ARCHITECTURE.md` files
- **Seed Questions**: See `backend/SEED_MECHANISM.md`
- **Module Structure**: See backend/frontend `ARCHITECTURE.md`
- **API Patterns**: See architecture docs for request/response flows

## 📝 Documentation Standards

All documentation follows these principles:
- **Comprehensive**: Covers structure, patterns, and best practices
- **Practical**: Includes code examples and usage patterns
- **Maintainable**: Organized by domain and concern
- **Accessible**: Clear sections and navigation

## 🔄 Keeping Documentation Updated

When making significant changes:
1. Update relevant `ARCHITECTURE.md` files
2. Update `SEED_MECHANISM.md` if seed scripts change
3. Update this index if new documentation is added

