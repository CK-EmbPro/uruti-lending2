# Authentication Diagnostics Guide

## Understanding the Auth State Log

When you see:
```javascript
{
  hasUser: false,
  hasToken: false,
  isAuthenticated: false,
  loading: false
}
```

This means:
- ✅ **Normal state** if you haven't logged in yet
- ✅ Authentication check has completed
- ❌ No token found in localStorage
- ❌ No user data loaded

## Quick Diagnostic Steps

### 1. Check if You Need to Log In

Open browser console and run:
```javascript
// Check if token exists
localStorage.getItem('auth_token')

// If returns null, you need to log in
// If returns a token, there might be a verification issue
```

### 2. Check Backend Connection

```javascript
// Test if backend is reachable
fetch('http://localhost:3000/api/auth/users')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### 3. Check Login Process

1. Go to `/login` page
2. Enter credentials
3. Watch console for:
   - `[LoginPage] Form submitted`
   - `[AuthAPI] Attempting login`
   - `[AuthAPI] Login successful`
   - `[AuthContext] Login successful`

### 4. Verify Token Storage

After login, check:
```javascript
// In browser console
localStorage.getItem('auth_token')
// Should return a JWT token (starts with "eyJ...")
```

## Common Scenarios

### Scenario 1: Not Logged In (Expected)
- **State**: `hasUser: false, hasToken: false`
- **Action**: Go to `/login` and log in
- **Expected**: After login, state should change to `hasUser: true, hasToken: true`

### Scenario 2: Token Expired
- **State**: `hasUser: false, hasToken: false` (but token was in localStorage)
- **Check**: Look for `[AuthContext] Token verification failed` in console
- **Action**: Log in again

### Scenario 3: Network Error
- **State**: `hasUser: false, hasToken: false`
- **Check**: Look for `[AuthContext] Token verification timeout/network error`
- **Action**: Check if backend is running on `http://localhost:3000`

### Scenario 4: Backend Not Running
- **State**: `hasUser: false, hasToken: false`
- **Check**: Network tab shows connection errors
- **Action**: Start backend server: `cd backend && npm run start:dev`

## Debugging Commands

### Check Current Auth State
```javascript
// In browser console
const token = localStorage.getItem('auth_token');
console.log('Token exists:', !!token);
console.log('Token preview:', token?.substring(0, 20));
```

### Clear Auth State (Start Fresh)
```javascript
// In browser console
localStorage.removeItem('auth_token');
sessionStorage.clear();
location.reload();
```

### Test Login API Directly
```javascript
// In browser console
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@urutilending.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## Expected Flow After Login

1. **Login Form Submitted**
   ```
   [LoginPage] Form submitted, attempting login...
   ```

2. **API Call**
   ```
   [AuthAPI] Attempting login: { email: "..." }
   [AuthAPI] Login successful: { hasToken: true, hasUser: true }
   ```

3. **Token Stored**
   ```
   [AuthContext] Token stored in localStorage
   [AuthContext] Login successful - State updated
   ```

4. **State Change**
   ```
   [AuthContext] Authentication state changed: {
     hasUser: true,
     hasToken: true,
     isAuthenticated: true
   }
   ```

5. **Redirect**
   ```
   [LoginPage] Login successful, redirecting to dashboard...
   [DashboardLayout] Auth check: { isAuthenticated: true }
   ```

## If Login Fails

Check console for:
- `[AuthAPI] Login error:` - Shows the error details
- `[API Client]` errors - Network or timeout issues
- `[AuthContext] Login error:` - Context-level errors

Common errors:
- **401**: Invalid credentials
- **400**: Invalid email format
- **Network Error**: Backend not running
- **Timeout**: Backend too slow or not responding

## Next Steps

1. **If not logged in**: Go to `/login` and log in
2. **If login fails**: Check console errors and backend status
3. **If token exists but user is null**: Check token verification logs
4. **If backend is down**: Start the backend server

