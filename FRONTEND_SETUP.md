# Frontend Setup Guide

## Issue: 404 Error for Next.js Static Chunks

If you're seeing:
```
GET http://localhost:3001/_next/static/chunks/... net::ERR_ABORTED 404 (Not Found)
```

This means you're accessing the frontend through the backend URL instead of the frontend URL.

## Solution

### 1. Start the Frontend Dev Server

The frontend should run on **port 3000** (default Next.js port):

```bash
cd frontend
npm run dev
```

The frontend will be available at: **http://localhost:3000**

### 2. Start the Backend Server

The backend should run on **port 3001**:

```bash
cd backend
npm run start:dev
```

The backend will be available at: **http://localhost:3001**

### 3. Access the Application

**✅ Correct:** Access the frontend at `http://localhost:3000`  
**❌ Wrong:** Don't access `http://localhost:3001` (that's the backend)

## Configuration

### Environment Variables

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Port Configuration

- **Frontend (Next.js):** Port 3000
- **Backend (NestJS):** Port 3001
- **WebSocket:** Port 3001 (same as backend)

## Quick Start

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser:**
   - Go to: `http://localhost:3000`
   - NOT: `http://localhost:3001`

## Troubleshooting

### If you see 404 errors:
- ✅ Make sure frontend dev server is running on port 3000
- ✅ Access the app at `http://localhost:3000` (not 3001)
- ✅ Check that backend is running on port 3001
- ✅ Verify environment variables are set correctly

### If WebSocket doesn't connect:
- ✅ Check `NEXT_PUBLIC_WS_URL` is set to `http://localhost:3001`
- ✅ Verify backend WebSocket gateway is running
- ✅ Check browser console for connection errors

