# Fix 404 Error - Backend Not Found

## 🔍 Problem Diagnosis

The error "API request failed: 404 Not Found" means the frontend can't reach the backend.

## ✅ Solution Options

### Option 1: Use XAMPP (Easiest - Recommended)

**Step 1: Copy Project to XAMPP**
1. Copy your project folder to: `C:\xampp\htdocs\noor\`
2. Make sure backend folder is inside: `C:\xampp\htdocs\noor\backend\`

**Step 2: Start XAMPP**
1. Open XAMPP Control Panel
2. Start **Apache**
3. Start **MySQL**

**Step 3: Test Backend**
- Open browser: `http://localhost/noor/backend/auth.php`
- Should see JSON response (even if error, that's normal)

**Step 4: Restart Frontend**
```powershell
# Stop frontend (Ctrl+C)
# Then restart
npm run dev
```

**Step 5: Try Registration Again**
- The vite.config.ts is already configured for `/noor/backend`
- Should work now!

### Option 2: Use PHP Built-in Server (If XAMPP Not Available)

**Step 1: Navigate to Project Root**
```powershell
cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor
```

**Step 2: Start PHP Server**
```powershell
# First, add PHP to PATH or use full path:
C:\xampp\php\php.exe -S localhost:8000 -t backend
```

**Step 3: Update vite.config.ts**
Change proxy target to port 8000:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

**Step 4: Restart Frontend**
```powershell
npm run dev
```

### Option 3: Check Current Setup

**Quick Check:**
1. **Is backend accessible?**
   - Try: `http://localhost/noor/backend/auth.php` (XAMPP)
   - Or: `http://localhost:8000/auth.php` (PHP server)

2. **Check Network Tab:**
   - Press `F12` → Network tab
   - Try registration
   - See what URL it's trying to call
   - Check if 404 or connection refused

3. **Check Console:**
   - Press `F12` → Console tab
   - Look for error messages

## 🎯 Quick Fix Steps

### If Using XAMPP:

1. **Copy project:**
   ```powershell
   # Create folder
   mkdir C:\xampp\htdocs\noor
   
   # Copy files (use File Explorer or PowerShell)
   Copy-Item -Path "C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor\*" -Destination "C:\xampp\htdocs\noor\" -Recurse
   ```

2. **Verify backend exists:**
   - Check: `C:\xampp\htdocs\noor\backend\auth.php` exists

3. **Start XAMPP:**
   - Apache ON
   - MySQL ON

4. **Test backend:**
   - `http://localhost/noor/backend/auth.php`

5. **Restart frontend:**
   ```powershell
   # Stop (Ctrl+C) and restart
   npm run dev
   ```

### If Using PHP Built-in Server:

1. **Find PHP:**
   ```powershell
   # Check if exists
   Test-Path "C:\xampp\php\php.exe"
   ```

2. **Start backend:**
   ```powershell
   cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor
   C:\xampp\php\php.exe -S localhost:8000 -t backend
   ```

3. **Update vite.config.ts** (see Option 2 above)

4. **Restart frontend**

## 🔧 Current vite.config.ts Configuration

Your current config expects:
- Backend at: `http://localhost/noor/backend/`

This means:
- ✅ Using XAMPP with project in `C:\xampp\htdocs\noor\`
- ❌ Not using PHP built-in server (different port)

## 🚀 Recommended Fix

**Easiest solution: Use XAMPP**

1. Copy project to `C:\xampp\htdocs\noor\`
2. Start Apache in XAMPP
3. Restart frontend
4. Try registration again

**No need to modify vite.config.ts** - it's already configured!

## ✅ Verification

After fixing, check:

1. **Backend accessible:**
   - `http://localhost/noor/backend/auth.php` returns JSON

2. **Network tab:**
   - `POST /api/users.php` returns 200 OK (not 404)

3. **Registration works:**
   - Form submits successfully
   - User appears in database

---

**Most likely:** You need to copy project to XAMPP's htdocs folder!

