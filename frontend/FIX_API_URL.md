# Fix API URL Configuration

## Problem
Getting 404 error: `Cannot POST /api/api/auth/login`

This means the API URL has a double `/api/api/` prefix.

## Solution

### Check Environment Variables

1. **Check if `.env.local` or `.env` exists in the frontend directory:**
   ```bash
   cd frontend
   cat .env.local  # or .env
   ```

2. **If `NEXT_PUBLIC_API_URL` is set, make sure it's:**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```
   
   **NOT:**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/api  ❌
   ```

3. **If the file doesn't exist or the variable is not set**, the default from `next.config.js` will be used, which is correct: `http://localhost:3001/api`

### Fix Steps

1. **Remove or fix `.env.local` or `.env` file:**
   ```bash
   # Remove the file if it has wrong URL
   rm frontend/.env.local
   
   # Or edit it to have correct URL
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > frontend/.env.local
   ```

2. **Restart the frontend dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

3. **Clear browser cache** (optional but recommended):
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache

## Current Configuration

- **Backend**: Runs on `http://localhost:3001` with global prefix `/api`
- **Frontend baseURL**: Should be `http://localhost:3001/api`
- **API routes**: Should be `/auth/login`, `/accounting/journal-entries`, etc.
- **Final URLs**: `http://localhost:3001/api/auth/login` ✓

## Verification

After fixing, test the login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}'
```

This should return a JWT token, not a 404 error.

