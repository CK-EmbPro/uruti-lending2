# Quick Fix for Missing Dependencies

## Issue
The error shows that `@nestjs/mapped-types` is missing.

## Solution

Run this command to install the missing package:

```bash
cd backend
npm install @nestjs/mapped-types
```

Or reinstall all dependencies:

```bash
cd backend
npm install
```

## After Installation

Once dependencies are installed, the application should start:

```bash
npm run start:dev
```

## What Was Fixed

1. ✅ Added `@nestjs/mapped-types` to package.json
2. ✅ Fixed UpdateLoanDto to include `status` field
3. ✅ Added proper imports and validators


