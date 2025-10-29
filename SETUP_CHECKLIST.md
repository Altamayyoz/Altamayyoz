# Setup Checklist - Complete These Steps

## Step 1: Copy Project to XAMPP ✅

**Check if already copied:**
- Look for: `C:\xampp\htdocs\noor\backend\auth.php`

**If NOT copied yet:**

1. Open **File Explorer**
2. Navigate to: `C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor`
3. **Select all files** (Ctrl+A)
4. **Copy** (Ctrl+C)
5. Navigate to: `C:\xampp\htdocs`
6. Create folder `noor` if it doesn't exist
7. **Paste** all files (Ctrl+V)

**Verify:**
- You should see: `C:\xampp\htdocs\noor\backend\auth.php`
- You should see: `C:\xampp\htdocs\noor\src\`
- You should see: `C:\xampp\htdocs\noor\package.json`

## Step 2: Start XAMPP Services ✅

1. Open **XAMPP Control Panel**
2. Make sure these are **green/running**:
   - ✅ **Apache** (should be running)
   - ✅ **MySQL** (should be running)

**If not running:**
- Click **Start** button next to each service
- Wait until status turns green

## Step 3: Test Backend ✅

Open browser and test:

**Test 1: Backend Auth**
- URL: `http://localhost/noor/backend/auth.php`
- Should see: JSON response (may show error if no POST data - that's normal)

**Test 2: Backend Users API**
- URL: `http://localhost/noor/backend/api/users.php`
- Should see: JSON with users array

**If you see 404:**
- Check Apache is running
- Verify files are in correct location
- Check URL path is correct

## Step 4: Start Frontend ✅

**In PowerShell (from project folder):**

```powershell
# Make sure you're in the project folder
cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor

# Start frontend
npm run dev
```

**Wait for:**
```
VITE v4.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
```

## Step 5: Test Registration ✅

1. Open browser: `http://localhost:5173`
2. Go to: `/register` page
3. Fill form:
   - Full Name: `Test User`
   - Username: `testuser123`
   - Role: Select any
   - Password: `password123`
   - Confirm Password: `password123`
4. Click **"Create Account"**

**Expected:**
- ✅ Success message
- ✅ Auto-login
- ✅ Redirect to dashboard

**If still 404:**
- Open browser DevTools (F12)
- Go to **Network** tab
- Try registration
- Check what URL it's calling
- Share error details

## Step 6: Verify in Database ✅

1. Open: `http://localhost/phpmyadmin`
2. Click: `technician_management` database
3. Click: `users` table
4. Click: **Browse** tab
5. **Look for your new user** at the bottom

## 🔧 Current Configuration

**vite.config.ts:** Configured for `http://localhost/backend/`
- This works if project is in `C:\xampp\htdocs\noor\`

**Backend Location:** Should be at `C:\xampp\htdocs\noor\backend\`

**Frontend:** Can stay in original location
- `C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor\`

## ✅ Quick Verification Commands

**Check if backend files exist:**
```powershell
Test-Path "C:\xampp\htdocs\noor\backend\auth.php"
Test-Path "C:\xampp\htdocs\noor\backend\api\users.php"
```

**Check Apache status:**
- Look at XAMPP Control Panel
- Apache should be green

**Test backend in browser:**
- `http://localhost/noor/backend/auth.php`
- Should return JSON

---

**Let me know:**
1. Have you copied files to XAMPP?
2. Is Apache running?
3. Does `http://localhost/noor/backend/auth.php` work?

Then we can test registration! 🚀

