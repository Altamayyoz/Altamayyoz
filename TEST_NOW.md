# Testing Registration - Quick Guide

## ✅ Frontend is Running!
Your frontend is ready at: `http://localhost:5173/`

(Note: CSS warnings are not critical - app will work fine)

## 🔧 Final Setup Steps:

### Step 1: Start XAMPP Apache

1. **Open XAMPP Control Panel**
2. **Click "Start"** next to **Apache**
3. **Click "Start"** next to **MySQL**
4. **Both should show green status**

### Step 2: Test Backend (Important!)

**Open these URLs in browser:**

**Test 1 - Auth Endpoint:**
```
http://localhost/noor/backend/auth.php
```
**Expected:** JSON response (may show error - that's normal if no POST data)

**Test 2 - Users API:**
```
http://localhost/noor/backend/api/users.php
```
**Expected:** JSON with users array from database

**If you see 404:**
- Apache might not be running
- Files might not be in correct location
- Check XAMPP Control Panel

### Step 3: Test Registration

1. **Open browser:** `http://localhost:5173/register`
2. **Fill registration form:**
   - Full Name: `Test User`
   - Username: `testuser123` (choose unique username)
   - Role: Select any (Technician, Supervisor, or Planning Engineer)
   - Password: `password123`
   - Confirm Password: `password123`
3. **Click "Create Account"**

### Step 4: Check Results

**Success indicators:**
- ✅ Success message appears
- ✅ Automatically logs in
- ✅ Redirects to dashboard
- ✅ No 404 errors in browser console

**If still seeing 404:**
1. Press `F12` in browser
2. Go to **Network** tab
3. Try registration again
4. Look for `/api/users.php` request
5. Click on it to see error details
6. Check the **Response** tab

## 🔍 Debugging

**Open Browser DevTools (F12):**

1. **Console Tab:**
   - Look for red error messages
   - Should see API call logs

2. **Network Tab:**
   - Clear previous requests
   - Try registration
   - Check `/api/users.php` request
   - Status should be **200 OK** (not 404)

**Common Issues:**

1. **Apache not running:**
   - Check XAMPP Control Panel
   - Apache should be green

2. **Wrong URL:**
   - Backend should be: `http://localhost/noor/backend/`
   - Check Network tab to see what URL it's calling

3. **Files not copied:**
   - Verify: `C:\xampp\htdocs\noor\backend\auth.php` exists

## ✅ Verification Checklist

- [ ] Apache is running (green in XAMPP)
- [ ] MySQL is running (green in XAMPP)
- [ ] Backend accessible: `http://localhost/noor/backend/auth.php` shows JSON
- [ ] Frontend running: `http://localhost:5173/` shows login page
- [ ] Can access registration page
- [ ] No 404 errors when submitting form

---

**Ready to test!** 

1. Make sure Apache is running in XAMPP
2. Test backend URL: `http://localhost/noor/backend/auth.php`
3. Then try registration!

Let me know what happens! 🚀

