# Testing Authentication Flow

## Steps to Test

### 1. Clear Browser State
- Open DevTools (F12)
- Application → Cookies → Select localhost:3001 → Delete all cookies
- Application → Local Storage → Clear all
- Close and reopen browser console

### 2. Test Login Flow
1. Navigate to http://localhost:3001/login
2. Enter credentials:
   - Email: test@example.com
   - Password: password
3. Click Login
4. Check Backend Console for:
   - "Login successful for: test@example.com"
   - Should show successful authentication

### 3. Verify Cookie is Set
1. After successful login, check DevTools:
   - Application → Cookies → localhost:3001
   - Look for `access_token` cookie
   - Verify it's HttpOnly and has a value

### 4. Check Network Request
1. In DevTools, go to Network tab
2. Reload the page (Ctrl+R)
3. Look for `/auth/me` request
4. Click on it and check:
   - Headers → Request Headers → Cookie: should contain `access_token`
   - Response Headers → Status should be 200 (not 401)
   - Response Preview → Should show user data

### 5. Monitor Console Logs
1. Check both Frontend and Backend console logs:
   - Frontend: `[AuthContext]` and `[API Client]` logs
   - Backend: `[Auth/Me]` logs
2. Verify the following sequence:
   1. User logs in
   2. Backend sets cookie
   3. Page reloads
   4. AuthContext calls `/auth/me`
   5. Cookie is sent in request
   6. Backend logs show cookie received
   7. User data returned
   8. Dashboard renders (no redirect)

### 6. Test Session Persistence
1. After successful login on dashboard
2. Hard refresh the page (Ctrl+Shift+R)
3. Should stay on dashboard (no redirect to login)
4. Console should show successful session verification

## Expected Behavior

✅ User logs in → No redirect loop
✅ Dashboard loads → User data displayed
✅ Page reload → Session persists
✅ Cookie is set and sent automatically
✅ `/auth/me` returns 200 with user data

## If Redirect Loop Occurs

Check the following:
1. **Frontend Console Logs**:
   - Are both `[AuthContext]` and `[API Client]` logging?
   - Look for error messages

2. **Backend Console Logs**:
   - Is `[Auth/Me]` endpoint being called?
   - Does it show cookies received?
   - What's the token verification status?

3. **Network Tab**:
   - Is `/auth/me` request being made?
   - What status is it returning?
   - Are cookies in Request Headers?

4. **Browser Cookies**:
   - Does `access_token` cookie exist?
   - Is it being sent to backend?

## Debug Command Outputs

### To check Backend Status
```powershell
# Check if backend is running and listening
netstat -ano | findstr "3002"
```

### To check if cookie-parser is working
- Look in backend console for `[Auth/Me] Request received:` logs
- Should show `cookieKeys: ['access_token']` if cookie parsed correctly

### To inspect cookie details
```javascript
// Run in browser console
console.log(document.cookie);
```
