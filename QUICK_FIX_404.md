# QUICK FIX for 404 Error - Choose One Option

## 🚀 Option 1: Copy Project to XAMPP (Easiest - 2 minutes)

### Steps:

1. **Open File Explorer**
2. **Navigate to:** `C:\xampp\htdocs\`
3. **Create folder:** `noor` (if doesn't exist)
4. **Copy entire project** from:
   - From: `C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor\`
   - To: `C:\xampp\htdocs\noor\`

5. **Start XAMPP:**
   - Open XAMPP Control Panel
   - Start **Apache**
   - Start **MySQL**

6. **Test Backend:**
   - Open: `http://localhost/noor/backend/auth.php`
   - Should see JSON response

7. **Restart Frontend:**
   - Stop current server (Ctrl+C)
   - Run: `npm run dev`
   - Keep project in current location for frontend

**Done!** Try registration again.

## 🚀 Option 2: Use PHP Built-in Server (Alternative)

### Steps:

1. **Keep project where it is** (don't move)

2. **Start PHP Server:**
   ```powershell
   cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor
   C:\xampp\php\php.exe -S localhost:8000 -t backend
   ```

3. **Update vite.config.ts** - Change to:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:8000',
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/api/, '')
     }
   }
   ```

4. **Restart Frontend:**
   - Stop (Ctrl+C)
   - Run: `npm run dev`

5. **Test Backend:**
   - Open: `http://localhost:8000/auth.php`
   - Should see JSON response

**Done!** Try registration again.

## ✅ Which Option Should You Use?

- **Option 1** = Easier, no code changes needed
- **Option 2** = Keep project in current location

## 🔍 Verify It's Working

After setup:

1. **Check backend:**
   - Option 1: `http://localhost/noor/backend/auth.php`
   - Option 2: `http://localhost:8000/auth.php`
   - Should see JSON (not 404)

2. **Check browser console:**
   - Press `F12` → Network tab
   - Try registration
   - Look for `/api/users.php`
   - Should be **200 OK** (not 404)

3. **Try registration again**
   - Should work now!

---

**Recommended: Option 1** - Copy to XAMPP, it's simpler! 🎯

