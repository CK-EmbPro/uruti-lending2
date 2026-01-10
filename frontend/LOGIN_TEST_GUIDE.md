# Frontend Login Test Guide

## 🧪 Testing the Login Functionality

### Prerequisites

1. **Backend must be running** on `http://localhost:3000`
2. **Frontend must be running** (usually on `http://localhost:3001` or `http://localhost:3000`)
3. **Browser console open** (F12 → Console tab) to see logs

---

## 📋 Step-by-Step Test Process

### Step 1: Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend should start on **port 3001** (or check the terminal output for the actual port).

### Step 2: Open Browser Console

1. Open your browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. **Clear the console** (right-click → Clear console)

### Step 3: Navigate to Login Page

Go to: `http://localhost:3001/login` (or whatever port your frontend is running on)

### Step 4: Check Initial Logs

You should see in the console:
```
[AuthContext] useEffect - Checking for existing token...
[AuthContext] Stored token check: { hasToken: false }
[AuthContext] No token verification needed: { reason: 'no token' }
```

### Step 5: Test Login

**Test Credentials:**
- Email: `admin@urutilending.com`
- Password: `admin123`

**Or seed users first:**
```bash
# In backend terminal or via API
POST http://localhost:3000/api/auth/seed
```

### Step 6: Watch Console Logs During Login

When you click "SIGN IN", you should see:

```
[LoginPage] Form submitted, attempting login...
[LoginPage] Calling login function...
[AuthContext] Starting login process for: admin@urutilending.com
[AuthContext] Calling authApi.login...
[API Client] Request interceptor - No token found: { url: '/auth/login' }
[AuthContext] Login API response received: { hasToken: true, hasUser: true, ... }
[AuthContext] Token stored in localStorage
[AuthContext] Login successful - State updated: { isAuthenticated: true }
[LoginPage] Login successful, redirecting to dashboard...
[LoginPage] Router.push called for /dashboard
[DashboardLayout] Auth check: { isAuthenticated: true, willRedirect: false }
```

### Step 7: Verify Success

✅ **Success indicators:**
- You should be redirected to `/dashboard`
- Console shows `isAuthenticated: true`
- No 401 errors in console
- Dashboard loads without redirecting back to login
- Token is stored in localStorage (check Application → Local Storage)

❌ **If you see errors:**
- Check the console logs for specific error messages
- Verify backend is running
- Check API URL configuration
- Verify credentials are correct

---

## 🔍 What to Check

### In Browser Console:

1. **Login Process:**
   - `[LoginPage]` logs show form submission
   - `[AuthContext]` logs show login flow
   - `[API Client]` logs show token handling

2. **After Login:**
   - `[DashboardLayout]` shows `isAuthenticated: true`
   - No `[API Client] 401 Unauthorized` errors
   - Token is added to subsequent API requests

3. **API Requests:**
   - All requests should have `Authorization: Bearer <token>` header
   - No 401 responses for protected endpoints

### In Browser DevTools:

1. **Application Tab → Local Storage:**
   - Key: `auth_token`
   - Value: Should contain a JWT token (starts with `eyJ...`)

2. **Network Tab:**
   - Login request to `/api/auth/login` should return 200
   - Response should contain `access_token` and `user` object
   - Subsequent requests should include `Authorization` header

---

## 🐛 Troubleshooting

### Issue: Redirects back to login immediately

**Check:**
- Browser console for `[API Client] 401 Unauthorized` logs
- Verify token is in localStorage
- Check if `/auth/me` endpoint is working
- Look for `[DashboardLayout] Auth check` logs

### Issue: No logs appearing

**Check:**
- Browser console is open and not filtered
- Frontend code has been rebuilt/refreshed
- No console errors blocking execution

### Issue: 401 errors after login

**Check:**
- Token is being stored correctly
- Token is being sent in Authorization header
- Backend JWT secret matches
- Token hasn't expired

### Issue: Login succeeds but dashboard doesn't load

**Check:**
- `[DashboardLayout]` logs show authentication status
- Hooks are waiting for authentication (`enabled: isAuthenticated`)
- No errors in console

---

## ✅ Expected Behavior

### Successful Login Flow:

1. ✅ User enters credentials and clicks "SIGN IN"
2. ✅ Form validates input
3. ✅ API call to `/api/auth/login` succeeds
4. ✅ Token stored in localStorage
5. ✅ User state updated in AuthContext
6. ✅ Redirect to `/dashboard`
7. ✅ Dashboard loads successfully
8. ✅ API calls for data include token
9. ✅ Data loads without errors
10. ✅ User stays on dashboard (no redirect loop)

---

## 📝 Test Checklist

- [ ] Frontend server is running
- [ ] Backend server is running
- [ ] Browser console is open
- [ ] Navigate to login page
- [ ] Enter valid credentials
- [ ] Click "SIGN IN"
- [ ] Check console logs for login flow
- [ ] Verify redirect to dashboard
- [ ] Check localStorage for token
- [ ] Verify dashboard loads data
- [ ] Check no redirect back to login
- [ ] Refresh page - should stay logged in

---

## 🎯 Quick Test Commands

### Test via Browser:
1. Open: `http://localhost:3001/login`
2. Login with: `admin@urutilending.com` / `admin123`
3. Watch console logs

### Test via API (verify backend first):
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@urutilending.com","password":"admin123"}'
```

### Check if users exist:
```bash
# Seed users if needed
curl -X POST http://localhost:3000/api/auth/seed
```

---

## 📊 Log Reference

### Normal Login Logs:
```
[LoginPage] Form submitted...
[AuthContext] Starting login process...
[AuthContext] Login API response received...
[AuthContext] Login successful - State updated...
[LoginPage] Router.push called for /dashboard
[DashboardLayout] Auth check: { isAuthenticated: true }
```

### Error Logs to Watch For:
```
[API Client] 401 Unauthorized response
[AuthContext] Token verification failed
[DashboardLayout] Not authenticated, redirecting to login
```

---

## 🚀 Next Steps After Successful Login

Once login works:
1. Test dashboard data loading
2. Test protected routes
3. Test logout functionality
4. Test token refresh
5. Test session persistence (refresh page)

