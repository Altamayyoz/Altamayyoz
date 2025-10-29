# PHP Not Found - Windows Solution Guide

If you see `php : The term 'php' is not recognized`, here are solutions:

## 🔍 Quick Check: Do You Have PHP Installed?

### Option A: Check if XAMPP/WAMP is Installed

**For XAMPP:**
1. Check if folder exists: `C:\xampp\php\php.exe`
2. If yes, PHP is installed but not in PATH

**For WAMP:**
1. Check if folder exists: `C:\wamp64\bin\php\`
2. If yes, PHP is installed but not in PATH

**If neither exists:** You need to install PHP first.

## ✅ Solution 1: Use XAMPP (Easiest - Recommended)

### Step 1: Install XAMPP
1. Download XAMPP: https://www.apachefriends.org/
2. Install XAMPP (default location: `C:\xampp`)
3. Start XAMPP Control Panel

### Step 2: Use XAMPP Instead of Command Line

**Instead of:** `php -S localhost:8000 -t backend`

**Do this:**
1. Copy your project to: `C:\xampp\htdocs\noor\`
2. Start **Apache** in XAMPP Control Panel
3. Access backend at: `http://localhost/noor/backend/`

### Step 3: Update Frontend Config

Update `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/noor/backend')
  }
}
```

## ✅ Solution 2: Add PHP to PATH (If XAMPP/WAMP Installed)

### For XAMPP:

1. **Find PHP Path:**
   - Usually: `C:\xampp\php\`

2. **Add to PATH:**
   - Press `Win + X` → **System** → **Advanced system settings**
   - Click **Environment Variables**
   - Under **System Variables**, find **Path**, click **Edit**
   - Click **New**
   - Add: `C:\xampp\php`
   - Click **OK** on all dialogs

3. **Restart PowerShell:**
   - Close PowerShell completely
   - Open new PowerShell window

4. **Test:**
   ```powershell
   php --version
   ```
   Should show PHP version

### For WAMP:

1. **Find PHP Path:**
   - Usually: `C:\wamp64\bin\php\php8.x.x\` (version number varies)

2. **Add to PATH:**
   - Same steps as XAMPP above
   - Add: `C:\wamp64\bin\php\php8.x.x\` (replace x.x with your version)

## ✅ Solution 3: Use XAMPP/WAMP Directly (No Command Line Needed)

### Setup:

1. **Copy Project to XAMPP:**
   ```powershell
   # Create folder
   mkdir C:\xampp\htdocs\noor
   
   # Copy all files (or use File Explorer)
   # Copy entire project folder to C:\xampp\htdocs\noor\
   ```

2. **Start XAMPP:**
   - Open XAMPP Control Panel
   - Start **Apache**
   - Start **MySQL**

3. **Access Backend:**
   - Backend: `http://localhost/noor/backend/auth.php`
   - phpMyAdmin: `http://localhost/phpmyadmin`

4. **Update Frontend:**
   - Update `vite.config.ts` proxy (see Solution 1 above)
   - Or create `.env` file:
     ```env
     VITE_API_BASE_URL=http://localhost/noor/backend
     VITE_USE_MOCK=false
     ```

## ✅ Solution 4: Install PHP Standalone

### Step 1: Download PHP
1. Go to: https://windows.php.net/download/
2. Download **PHP 8.x Thread Safe** ZIP
3. Extract to: `C:\php\`

### Step 2: Add to PATH
1. Add `C:\php\` to PATH (same steps as Solution 2)

### Step 3: Test
```powershell
php --version
```

## 🎯 Recommended Approach for Windows

**Best Option: Use XAMPP**

Why?
- ✅ Includes PHP, MySQL, Apache
- ✅ Easy to use (GUI control panel)
- ✅ No PATH configuration needed
- ✅ Everything in one place

### Quick XAMPP Setup:

1. **Install XAMPP** (if not installed)
2. **Copy project** to `C:\xampp\htdocs\noor\`
3. **Start Apache & MySQL** in XAMPP Control Panel
4. **Access:**
   - Backend: `http://localhost/noor/backend/`
   - phpMyAdmin: `http://localhost/phpmyadmin`
   - Frontend: `http://localhost:5173` (from `npm run dev`)

5. **Update `.env` file:**
   ```env
   VITE_API_BASE_URL=http://localhost/noor/backend
   VITE_USE_MOCK=false
   ```

## 🔧 Check Current Setup

### Check if PHP exists:
```powershell
# Try these paths:
Test-Path "C:\xampp\php\php.exe"
Test-Path "C:\wamp64\bin\php\php8.2.0\php.exe"
Test-Path "C:\php\php.exe"
```

### Find PHP installation:
1. Open **File Explorer**
2. Search for `php.exe` in:
   - `C:\xampp\`
   - `C:\wamp64\`
   - `C:\Program Files\`

## 📝 Quick Reference

### If Using XAMPP:
```powershell
# No need for PHP command line!
# Just use XAMPP Control Panel
```

### If PHP in PATH:
```powershell
# Navigate to project root
cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor

# Start PHP server
php -S localhost:8000 -t backend
```

### Alternative: Use XAMPP Apache
- Copy project to `C:\xampp\htdocs\noor\`
- Start Apache in XAMPP
- Access: `http://localhost/noor/backend/`

## 🆘 Still Having Issues?

1. **Check XAMPP/WAMP is installed:**
   - Look in Start Menu
   - Check `C:\xampp\` or `C:\wamp64\` folders

2. **Install XAMPP if not installed:**
   - Download: https://www.apachefriends.org/
   - Install (takes 5-10 minutes)

3. **Use XAMPP GUI instead:**
   - No command line needed!
   - Start Apache & MySQL
   - Access via browser

---

**TL;DR:** Install XAMPP and use its GUI instead of command line PHP. Much easier on Windows! 🚀

