# Authentication Flow - Visual Guide

## System Architecture After Fix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          URUTI LENDING AUTHENTICATION                        │
│                           Cookie-Based Session                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─── FRONTEND (Port 3001) ─────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────────────┐                                                   │
│  │   React App (Next.js)│                                                   │
│  ├──────────────────────┤                                                   │
│  │ • Login Page         │ ← User enters email/password                      │
│  │ • Dashboard          │ ← Protected by AuthContext                        │
│  │ • Protected Routes   │ ← Guarded by DashboardLayout                     │
│  └──────────┬───────────┘                                                   │
│             │                                                               │
│  ┌──────────▼───────────┐                                                   │
│  │   AuthContext.tsx    │                                                   │
│  ├──────────────────────┤                                                   │
│  │ • verifySession()    │ ← Calls /auth/me on mount                        │
│  │ • login()            │ ← POST /auth/login                                │
│  │ • logout()           │ ← POST /auth/logout                               │
│  │ • isAuthenticated    │ ← Derived state                                   │
│  │ • loading state      │ ← Prevents flashing                               │
│  └──────────┬───────────┘                                                   │
│             │                                                               │
│  ┌──────────▼───────────┐                                                   │
│  │   API Client         │                                                   │
│  ├──────────────────────┤                                                   │
│  │ • axios client       │                                                   │
│  │ • withCredentials    │ ← Sends cookies automatically                    │
│  │ • request interceptor│ ← Adds Authorization header if needed            │
│  │ • response           │ ← Skips redirect on /auth/me 401                 │
│  │   interceptor        │                                                   │
│  └──────────┬───────────┘                                                   │
│             │                                                               │
│             │ HTTP Requests with Cookies                                   │
│             │ (withCredentials: true)                                       │
│             │                                                               │
└─────────────┼───────────────────────────────────────────────────────────────┘
              │
              │
┌─────────────┼───────────────────────────────────────────────────────────────┐
│             │          BACKEND (Port 3002)                                  │
│             │                                                               │
│  ┌──────────▼───────────┐                                                   │
│  │   HTTP Request       │                                                   │
│  │   Listener           │                                                   │
│  └──────────┬───────────┘                                                   │
│             │                                                               │
│  ┌──────────▼──────────────────────────┐                                    │
│  │   Middleware Chain                  │                                    │
│  ├─────────────────────────────────────┤                                    │
│  │ 1. CORS (credentials: true)         │ ← Allow cookies from client        │
│  │ 2. Cookie-Parser                    │ ← Extract cookies from request     │
│  │ 3. Request Logging                  │ ← Debug info                       │
│  └──────────┬──────────────────────────┘                                    │
│             │                                                               │
│  ┌──────────▼──────────────────────────┐                                    │
│  │   Auth Controller                   │                                    │
│  ├─────────────────────────────────────┤                                    │
│  │ POST /auth/login                    │ ← Authenticate user                │
│  │ └─ Sets HttpOnly Cookie             │   • Verify credentials             │
│  │                                     │   • Generate JWT                   │
│  │ GET /auth/me                        │   • Set cookie with JWT            │
│  │ └─ Verify & Return User             │   • Return user data               │
│  │    • Read from req.cookies          │   • Set HttpOnly flag              │
│  │    • Or from Authorization header   │   • Set Secure flag (prod)         │
│  │    • Verify JWT signature           │   • Set SameSite=Lax               │
│  │    • Return user if valid           │   • 24h expiry                     │
│  │                                     │                                    │
│  │ POST /auth/logout                   │ ← Clear session                    │
│  │ └─ Clear Cookie                     │   • Clear cookie from response     │
│  └──────────┬──────────────────────────┘                                    │
│             │                                                               │
│  ┌──────────▼──────────────────────────┐                                    │
│  │   Auth Service / JWT Handler        │                                    │
│  ├─────────────────────────────────────┤                                    │
│  │ • Verify JWT signature              │                                    │
│  │ • Extract user from JWT             │                                    │
│  │ • Fetch user from database          │                                    │
│  └──────────┬──────────────────────────┘                                    │
│             │                                                               │
│  ┌──────────▼──────────────────────────┐                                    │
│  │   User Database                     │                                    │
│  └─────────────────────────────────────┘                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow: User Login

```
USER CLICKS LOGIN
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend: Submit email & password  │
│  POST /auth/login                   │
└──────────────┬──────────────────────┘
               │
               │ HTTP POST
               ▼
┌──────────────────────────────────────────────┐
│  Backend: Validate credentials               │
│  1. Check email exists                       │
│  2. Verify password hash                     │
│  3. Generate JWT token                       │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  Backend: Set HttpOnly Cookie                │
│  res.cookie('access_token', token, {         │
│    httpOnly: true,                           │
│    sameSite: 'lax',                          │
│    maxAge: 24 * 60 * 60 * 1000              │
│  })                                          │
└──────────────┬───────────────────────────────┘
               │
               │ HTTP 200 + Cookie header
               ▼
┌──────────────────────────────────────────────┐
│  Frontend: Receive response + cookie         │
│  Browser automatically stores cookie         │
│  AuthContext updates:                        │
│  - setUser(response.user)                    │
│  - setToken("cookie-set")                    │
│  - setIsAuthenticated(true)                  │
└──────────────┬───────────────────────────────┘
               │
               ▼
       ✓ REDIRECT TO DASHBOARD
       (No more redirects)
```

---

## Flow: Session Restoration (Page Reload)

```
USER PRESSES F5 (RELOAD)
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend: App mounts                │
│  AuthContext.useEffect() runs        │
│  Calls verifySession()               │
└──────────────┬───────────────────────┘
               │
               ├─► setLoading(true)
               │
               ▼
┌──────────────────────────────────────┐
│  Frontend: Make /auth/me request     │
│  axios.get('/auth/me')               │
│                                      │
│  ✓ withCredentials: true             │
│  ✓ Browser includes Cookie header    │
│    (automatically)                   │
└──────────────┬───────────────────────┘
               │
               │ GET /auth/me
               │ Cookie: access_token=eyJ...
               ▼
┌──────────────────────────────────────┐
│  Backend: Receive request            │
│  1. CORS middleware checks origin    │
│  2. Cookie-parser extracts cookie    │
│  3. Auth controller reads cookie     │
│     req.cookies.access_token         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Backend: Verify JWT                 │
│  1. Check token signature            │
│  2. Check token not expired          │
│  3. Extract userId from token       │
│  4. Fetch user from database         │
└──────────────┬───────────────────────┘
               │
               ├─► User found & valid
               │
               ▼
        ✓ HTTP 200 + User Data
               │
               ▼
┌──────────────────────────────────────┐
│  Frontend: Receive user data         │
│  No error, so:                       │
│  - setUser(userData)                 │
│  - setToken("cookie-set")            │
│  - setLoading(false)                 │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Dashboard Layout checks:            │
│  if (!loading && isAuthenticated)    │
│    RENDER DASHBOARD                  │
│  else if (!loading && !isAuth)       │
│    REDIRECT TO LOGIN                 │
└──────────────┬───────────────────────┘
               │
               ▼
       ✓ DASHBOARD RENDERS
       (Session restored, no redirect loop)
```

---

## Flow: Network Error Handling (IMPROVED)

```
USER PRESSES F5
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend: Call /auth/me             │
└──────────────┬───────────────────────┘
               │
               ▼
        ⚠ NETWORK TIMEOUT / ERROR
        (No response from server)
               │
               ▼
┌──────────────────────────────────────────────┐
│  NEW BEHAVIOR (AFTER FIX):                   │
│                                              │
│  Check error type:                           │
│  if (timeout || network error) {             │
│    ✓ Keep loading = true                     │
│    ✓ DON'T clear user state                  │
│    ✓ Show loading spinner                    │
│    ✓ Wait for connection                     │
│  }                                           │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  OLD BEHAVIOR (BEFORE FIX):                  │
│                                              │
│  ✗ Clear user immediately                    │
│  ✗ Set isAuthenticated = false               │
│  ✗ Dashboard redirects to /login             │
│  ✗ API interceptor redirects to /login       │
│  ✗ REDIRECT LOOP                             │
└──────────────────────────────────────────────┘
```

---

## Flow: 401 Unauthorized (Still Works Correctly)

```
COOKIE EXPIRED OR INVALID
         │
         ▼
┌──────────────────────────────────────┐
│  Frontend: Call /auth/me             │
│  with expired/invalid cookie         │
└──────────────┬───────────────────────┘
               │
               │ Cookie: access_token=expired
               ▼
┌──────────────────────────────────────┐
│  Backend: Verify JWT                 │
│  JWT expired or signature invalid     │
│  ✗ Throw UnauthorizedException      │
└──────────────┬───────────────────────┘
               │
               ▼
        HTTP 401 Unauthorized
               │
               ▼
┌──────────────────────────────────────────────┐
│  Frontend Response Interceptor:              │
│  if (401 && isAuthMe) {                      │
│    ✓ DON'T redirect (let AuthContext handle) │
│    ✓ PASS error to caller                    │
│  }                                           │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  AuthContext: Handle 401                     │
│  if (error.status === 401) {                 │
│    ✓ setUser(null)                           │
│    ✓ setToken(null)                          │
│    ✓ setIsAuthenticated(false)               │
│    ✓ setLoading(false)                       │
│  }                                           │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  Dashboard Layout: Check state               │
│  if (!loading && !isAuthenticated)           │
│    ✓ router.replace("/login")                │
└──────────────┬───────────────────────────────┘
               │
               ▼
        ✓ REDIRECT TO LOGIN
        (Proper 401 handling)
```

---

## Cookie Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                  COOKIE LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

STEP 1: CREATED AT LOGIN
    Backend sets cookie:
    res.cookie('access_token', jwt_token, {
      httpOnly: true,        ← Can't be accessed by JavaScript
      secure: true,          ← HTTPS only (production)
      sameSite: 'lax',       ← CSRF protection
      maxAge: 86400000,      ← Expires in 24 hours
      path: '/'              ← Valid for all paths
    })
    
    ✓ Stored in browser's cookie jar
    ✓ Associated with domain: localhost:3001

STEP 2: AUTOMATICALLY SENT WITH REQUESTS
    Browser automatically includes with every request to same domain:
    
    GET /api/auth/me
    Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    
    ✓ withCredentials: true enables this
    ✓ CORS credentials: true allows it

STEP 3: PARSED ON BACKEND
    cookie-parser middleware extracts:
    req.cookies = {
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    
    ✓ Available in controllers as req.cookies
    ✓ Used for JWT verification

STEP 4: CLEARED ON LOGOUT
    Backend clears cookie:
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/'
    })
    
    ✓ Browser removes cookie
    ✓ No longer sent with requests

STEP 5: EXPIRATION (24 HOURS)
    Browser automatically removes after maxAge expires
    
    ✓ User must log in again
    ✓ Prevents stale sessions
```

---

## State Transitions Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION STATE MACHINE                     │
└──────────────────────────────────────────────────────────────────┘

                      ┌─────────────────┐
                      │  INITIAL STATE  │
                      │                 │
                      │ loading: true   │
                      │ user: null      │
                      │ token: null     │
                      │ isAuth: false   │
                      └────────┬────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                │              │              │
                ▼              ▼              ▼
        ┌───────────────┐ ┌──────────┐ ┌────────────┐
        │  VERIFY FAIL  │ │ SUCCESS  │ │  TIMEOUT   │
        │ (401, etc)    │ │          │ │ (network)  │
        └───────┬───────┘ └────┬─────┘ └─────┬──────┘
                │              │             │
                │              │             │
        ✓ Set loading:false    │      ✓ Keep loading:true
        ✓ Set user: null       │      ✓ Keep user state
        ✓ Set token: null      │      ✓ Show spinner
        ✓ Set isAuth: false    │      ✓ Retry later
                │              │             │
                ▼              ▼             │
        ┌──────────────────┐   │          (retry)
        │  UNAUTHENTICATED │   │             │
        │                  │   │             │
        │ loading: false   │   │         ┌───┴────────┐
        │ user: null       │   │         │            │
        │ token: null      │   │         ▼            │
        │ isAuth: false    │   │    (network ok?)    │
        └────────┬─────────┘   │         │            │
                 │              │         ├─ YES ─────┘
                 │              │         │
                 │              │    NO ──┘
                 │              │         │
      [Redirect] │              │         ▼
                 │              │    (keep waiting)
                 │              │
                 │              │
         ┌───────┴──────────────┴────────┐
         │   USER NAVIGATES TO LOGIN     │
         │   AND SUBMITS CREDENTIALS     │
         └───────┬──────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  LOGIN FLOW    │
        │                │
        │ loading: true  │
        └───────┬────────┘
                │
        ┌───────┴─────────┐
        │                 │
        ▼                 ▼
   ✓ LOGIN OK      ✗ LOGIN FAIL
        │                 │
        ▼                 ▼
   [Set Cookie]   [Show Error]
   [Set User]     [Stay on Login]
   [Set isAuth]
        │
        ▼
   loading: false
   user: {data}
   token: "cookie-set"
   isAuth: true
        │
        ▼
   [Redirect to Dashboard]
        │
        ▼
   ┌──────────────────────┐
   │  AUTHENTICATED STATE │
   │                      │
   │ loading: false       │
   │ user: {data}         │
   │ token: "cookie-set"  │
   │ isAuth: true         │
   │                      │
   │ Can access:          │
   │ • Dashboard          │
   │ • Protected routes   │
   │                      │
   │ Cookie in browser:   │
   │ • Sent auto on reqs  │
   │ • Expires in 24h     │
   │ • Cleared on logout  │
   └────────┬─────────────┘
            │
      ┌─────┴──────┐
      │            │
      ▼            ▼
  [F5 RELOAD]  [CLICK LOGOUT]
      │            │
      ▼            ▼
 [Verify with]  [POST /logout]
 [/auth/me]     [Clear cookie]
      │          [Clear state]
      ▼            │
  (still auth)     ▼
      │    ┌──────────────────┐
      │    │ UNAUTHENTICATED  │
      │    │ (back to start)  │
      │    └──────────────────┘
      │
      └──────► [Redirect to Dashboard again]
```

---

## Error Handling Decision Tree

```
                    ERROR OCCURS
                         │
                         ▼
            ┌────────────────────────┐
            │ /auth/me 401 Response? │
            └────────┬───────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
        YES          NO          │
         │           │           │
         ▼           ▼           ▼
    [Is AuthMe?] [Handle]   [Process]
         │       [normally]  [normally]
         │           │           │
        YES          NO          │
         │           │           │
         ▼           ▼           ▼
    [Skip      [Redirect   [Continue]
    [redirect] [to login]
         │           │
         ▼           ▼
    [Pass error  [Done]
    [to caller]
         │
         ▼
    [AuthContext sees 401]
         │
         ▼
    ┌─────────────┐
    │ Clear State │
    │ Set isAuth  │
    │ = false     │
    └──────┬──────┘
           │
           ▼
    ┌──────────────────┐
    │ Dashboard checks │
    │ !loading &&      │
    │ !isAuthenticated │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ Redirect to      │
    │ /login           │
    └──────────────────┘
         PROPER 401 HANDLING ✓
```

---

## Summary

- **Before**: Redirect loop due to race conditions and aggressive error clearing
- **After**: Clean separation of concerns with proper error differentiation
- **Key Insight**: Network errors ≠ Auth errors (need different handling)
- **Result**: Stable, resilient authentication with graceful error handling
