# Authentication System - Validation & Testing Guide

## Quick Test (2 minutes)

### Step 1: Clear State
1. Open http://localhost:3001 in browser
2. Press F12 to open DevTools
3. Application → Cookies → Select localhost:3001 → Delete All
4. Application → Local Storage → Select http://localhost:3001 → Clear All
5. Close DevTools and refresh page (should redirect to /login)

### Step 2: Test Login
1. On /login page, enter:
   - Email: `test@example.com`
   - Password: `password`
2. Click "Login"
3. **Expected**: Should redirect to dashboard (not stuck on login)

### Step 3: Verify Session Works
1. You should now be on dashboard
2. Press F5 (soft refresh)
3. **Expected**: Stay on dashboard, no redirect loop

### Step 4: Verify Hard Refresh Works
1. Press Ctrl+Shift+R (hard refresh)
2. **Expected**: Stay on dashboard, session persists

---

## Detailed Validation (5 minutes)

### Part 1: Cookie Verification

```
Step 1: Log Out
- Click logout if you're logged in
- DevTools → Application → Cookies
- Should be EMPTY (access_token deleted)

Step 2: Log In Again
- Enter credentials and click login
- Wait for redirect to dashboard
- DevTools → Application → Cookies
- **VERIFY**: access_token cookie exists with value

Step 3: Check Cookie Properties
- Click on access_token cookie
- **VERIFY** these properties:
  ✓ Name: access_token
  ✓ Value: (long JWT token starting with eyJ)
  ✓ Domain: localhost
  ✓ Path: /
  ✓ HttpOnly: ✓ (checked)
  ✓ Secure: ✓ (checked if HTTPS, unchecked if HTTP)
  ✓ SameSite: Lax
  ✓ Expires: 24 hours from now
```

### Part 2: Network Request Verification

```
Step 1: Open Network Tab
- DevTools → Network tab
- Clear previous requests
- Press F5 (refresh page)

Step 2: Find /auth/me Request
- Look for request to "localhost:3002/api/auth/me"
- Click on it to inspect

Step 3: Verify Request Headers
- Headers tab → Request headers
- **FIND**: Cookie header
- **VERIFY**: Cookie header contains "access_token=..."
- **EXAMPLE**: Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Step 4: Verify Response
- Response tab
- **VERIFY**: Status is 200 (not 401)
- **VERIFY**: Response shows user object:
  ```json
  {
    "id": "...",
    "email": "test@example.com",
    "name": "...",
    "roles": [...]
  }
  ```
```

### Part 3: Console Logs Verification

#### Frontend Console Logs (Browser DevTools → Console)

```
[AuthContext] useEffect - Checking for existing session...
[AuthAPI] Getting current user from /auth/me...
[API Client] Request: { url: "/auth/me", method: "GET", withCredentials: true }
[AuthAPI] Current user retrieved: { userId: "...", userEmail: "test@example.com", hasUser: true }
[AuthContext] Session verification successful: { userId: "...", userEmail: "test@example.com" }
[AuthContext] Authentication state changed: { hasUser: true, hasToken: true, isAuthenticated: true, ... }
[DashboardLayout] Auth check: { loading: false, isAuthenticated: true, willRedirect: false }
[DashboardLayout] Rendering dashboard layout
```

#### Backend Console Logs (Terminal running backend)

```
[Auth/Me] Request received: { hasAuthHeader: false, hasCookies: true, cookieKeys: ['access_token'], hasAccessToken: true }
[Auth/Me] Token found in cookie: { tokenPrefix: "eyJhbGciOiJIUzI1NiIsInR5c" }
[Auth/Me] Token verified successfully, retrieving user: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Common Issues & Solutions

### Issue 1: Redirect Loop (URL keeps alternating between /login and /dashboard)

**Diagnosis**:
```
Check Backend Logs:
- Do you see [Auth/Me] Request received?
  ✗ NO  → Cookie not being sent
  ✓ YES → Go to next check

- Do you see cookieKeys: ['access_token']?
  ✗ NO  → Cookie-parser not working or cookie not sent
  ✓ YES → Go to next check

- Do you see Token verification failed?
  ✗ YES → JWT is invalid (check expiry, signing key)
  ✓ NO  → Token should be valid
```

**Solutions**:

**If cookie not in cookieKeys:**
1. Check DevTools → Application → Cookies
2. Is access_token cookie present? 
   - NO: Check backend is setting cookie in /auth/login
   - YES: Check that cookie is being sent to backend
3. Run in browser console:
   ```javascript
   console.log(document.cookie);
   // Should show: access_token=eyJ...
   ```

**If cookie is present but not sent:**
1. Check axios config has `withCredentials: true`
   - File: frontend/lib/api/client.ts
   - Should have: `withCredentials: true`
2. Check backend CORS has `credentials: true`
   - File: backend/src/main.ts
   - Should have: `credentials: true`
3. Ensure CORS origin matches your frontend URL

**If cookie sent but JWT fails verification:**
1. Check token expiry:
   ```javascript
   // Decode JWT in browser console
   const token = document.cookie.split('access_token=')[1];
   const decoded = JSON.parse(atob(token.split('.')[1]));
   console.log('Expires at:', new Date(decoded.exp * 1000));
   ```
2. If expired, log out and log back in
3. Check JWT signing key matches between login and /auth/me

---

### Issue 2: /auth/me Returns 401 (but cookie is being sent)

**Diagnosis**:
```
Backend logs show:
[Auth/Me] Request received: { ..., hasAccessToken: true }
[Auth/Me] Token verification failed: ...
```

**Solution**:
1. Check JWT verification error in backend logs
2. Common causes:
   - Token expired: Check token expiry vs current time
   - Wrong secret key: Verify JWT_SECRET env variable
   - Token tampered: Check browser didn't modify cookie
3. Try fresh login to get new token

---

### Issue 3: No Backend Logs for /auth/me

**Diagnosis**:
- Browser console shows network request to /auth/me
- But backend has no [Auth/Me] logs

**Solutions**:
1. Verify backend is actually running:
   ```powershell
   netstat -ano | findstr "3002"
   # Should show PID for process on port 3002
   ```
2. Check if /auth/me endpoint exists:
   - Visit: http://localhost:3002/api/swagger
   - Look for GET /auth/me endpoint
3. Verify logs are being shown:
   - Check backend terminal isn't in "paused" state
   - Try a different endpoint: http://localhost:3002/api/health

---

### Issue 4: Cookie Shows But Says "No token provided"

**Diagnosis**:
```
Backend logs show:
[Auth/Me] Request received: { ..., cookieKeys: ['access_token'], hasAccessToken: true }
[Auth/Me] No token found in headers or cookies - returning 401
```

**Problem**: Cookie is being parsed, but code isn't finding it

**Solution**:
1. Verify cookie-parser middleware is loaded in correct order
2. File: backend/src/main.ts
3. Should be after CORS but before routes:
   ```typescript
   app.enableCors({...});
   app.use(cookieParser()); // Must be here
   app.setGlobalPrefix("api");
   // Routes go after
   ```

---

## Performance Validation

### Metrics to Check

1. **Session Verification Time**
   - Time from page load to `/auth/me` response
   - Goal: < 500ms
   - Check Network tab for /auth/me response time

2. **Dashboard Load Time**
   - Time from `/auth/me` response to dashboard render
   - Goal: < 300ms
   - Check browser performance tab

3. **No Unnecessary Requests**
   - Should only call `/auth/me` ONCE per page load
   - Check Network tab for duplicates

---

## Security Validation

### Verify Security Measures

1. **HttpOnly Cookie**
   ```javascript
   // Run in browser console
   console.log(document.cookie);
   // Should show empty or other cookies, but NOT access_token
   // (because it's HttpOnly)
   ```

2. **HTTPS in Production**
   - Check backend has `secure: true` set for production
   - File: backend/src/modules/auth/auth.controller.ts
   - `secure: process.env.NODE_ENV === "production"`

3. **SameSite Protection**
   - Backend logs should show: SameSite: Lax
   - Prevents CSRF attacks

4. **Logout Clears Cookie**
   ```
   1. Click Logout
   2. DevTools → Application → Cookies
   3. Should show NO access_token cookie
   ```

---

## Complete Test Scenario

### Scenario: Full User Journey

```
1. START
   └─ Fresh browser session
      └─ No cookies, no local storage

2. LOGIN
   ├─ Navigate to http://localhost:3001/login
   ├─ Enter test@example.com / password
   ├─ Click Login
   └─ VERIFY: Redirects to /dashboard

3. VERIFY COOKIE
   ├─ DevTools → Application → Cookies
   ├─ Find access_token cookie
   └─ VERIFY: Value is not empty

4. NAVIGATE
   ├─ Click on any dashboard menu item
   ├─ Wait for page to load
   └─ VERIFY: No redirect to login

5. HARD REFRESH
   ├─ Press Ctrl+Shift+R
   ├─ Wait for page to load
   └─ VERIFY: Still on dashboard (session persists)

6. MULTIPLE REFRESHES
   ├─ Press F5 multiple times
   └─ VERIFY: Stays on same page each time

7. LOGOUT
   ├─ Click Logout button
   ├─ Wait for redirect
   └─ VERIFY: Redirects to /login

8. VERIFY COOKIE CLEARED
   ├─ DevTools → Application → Cookies
   └─ VERIFY: access_token cookie is gone

9. FRESH LOGIN
   ├─ Enter credentials again
   ├─ Click Login
   └─ VERIFY: Redirects to dashboard

10. COMPLETE ✓
    └─ All steps successful = working system
```

---

## Debug Mode Setup

### To Get Maximum Logs

Add this to browser console before testing:
```javascript
// Enable all console logs (already in code, just for reference)
localStorage.setItem('debug', '*');
```

Check backend logs:
```
Watch for these prefixes:
- [AuthContext] → Session verification logs
- [API Client] → Request/response logs
- [AuthAPI] → API call logs
- [Auth/Me] → Backend endpoint logs
- [DashboardLayout] → Redirect logic logs
```

---

## Rollback Instructions

If something goes wrong, rollback changes:

### Git Rollback
```powershell
# Frontend
cd frontend
git diff  # See what changed
git restore contexts/AuthContext.tsx
git restore app/(dashboard)/layout.tsx
git restore lib/api/client.ts

# Backend
cd ../backend
git diff  # See what changed
git restore src/modules/auth/auth.controller.ts
```

### Manual Rollback
- Restore files from backup or previous git commit
- Restart both frontend and backend servers
