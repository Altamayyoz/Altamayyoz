# Vite Proxy Troubleshooting Guide

## Issue: 404 Error on API Requests

### ✅ Verified Working:
- ✅ Backend file exists at `backend/api/users.php`
- ✅ File accessible in XAMPP at `C:\xampp\htdocs\noor\backend\api\users.php`
- ✅ Direct POST request works: `http://localhost/noor/backend/api/users.php`
- ✅ Frontend code correctly calls `/api/users.php`

### 🔧 Solution Steps:

#### Step 1: Restart Vite Dev Server
The Vite proxy configuration requires a server restart to take effect.

1. **Stop the current dev server:**
   - In the terminal where `npm run dev` is running, press `Ctrl+C`

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Wait for the server to fully start** (you should see "Local: http://localhost:5173/")

#### Step 2: Verify Proxy is Working
After restarting, check the browser console:
- Open DevTools (F12)
- Go to Network tab
- Try creating a user
- Look for the request to `/api/users.php`
- Check if it shows status `200` or still `404`

#### Step 3: Check Vite Proxy Logs
In the terminal where Vite is running, you should see proxy activity when making requests.

### Alternative: Test Proxy Directly

You can test if the proxy is working by opening this URL in your browser:
```
http://localhost:5173/api/users.php
```

If it works, you should see JSON data. If it shows 404, the proxy isn't working.

### If Still Not Working:

#### Option 1: Verify XAMPP Apache is Running
- Open XAMPP Control Panel
- Ensure Apache is running (green "Running" status)
- If not, click "Start" next to Apache

#### Option 2: Check File Permissions
- Right-click `C:\xampp\htdocs\noor\backend\api\users.php`
- Properties → Security tab
- Ensure "Users" have "Read & Execute" permissions

#### Option 3: Try Alternative Proxy Configuration
If the proxy still doesn't work after restart, try this alternative config in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost',
    changeOrigin: true,
    secure: false,
    ws: true, // Enable websocket proxying
    rewrite: (path) => {
      const newPath = path.replace(/^\/api/, '/noor/backend/api')
      console.log('Proxy:', path, '→', newPath)
      return newPath
    }
  }
}
```

#### Option 4: Use Absolute URL (Development Only)
As a temporary workaround, you can modify `src/services/api.ts` to use the full URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost/noor/backend/api'
```

Then change the endpoint calls to not include `/api`:
```typescript
const response = await apiRequest<any>('/users.php', { ... })
```

**Note:** This bypasses the proxy but should work for testing.

### Expected Behavior After Fix:
- ✅ Network tab shows `200 OK` status
- ✅ User is created successfully
- ✅ Success toast notification appears
- ✅ User appears in the user list

