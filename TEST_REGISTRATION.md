# Testing User Registration - Step by Step Guide

Follow these steps to test that user registration is working correctly and saving to the database.

## ✅ Prerequisites Check

Before testing, make sure:

- [ ] Backend server is running (`php -S localhost:8000 -t backend`)
- [ ] Frontend server is running (`npm run dev`)
- [ ] MySQL/phpMyAdmin is accessible
- [ ] Database `technician_management` exists
- [ ] Tables are imported (especially `users` table)

## 🧪 Test Steps

### Step 1: Open Registration Page

1. Open your browser
2. Go to: `http://localhost:5173/register`
   - Or click "Register" / "Sign up" link from login page
3. You should see the registration form

### Step 2: Fill Out Registration Form

Fill in the form with test data:

**Form Fields:**
- **Full Name**: `Test User`
- **Username**: `testuser123` (choose a unique username)
- **Role**: Select any role (e.g., "Technician")
- **Password**: `password123` (or any password)
- **Confirm Password**: Same password

### Step 3: Submit Registration

1. Click **"Create Account"** button
2. You should see:
   - Loading state: "Creating Account..."
   - Then success message: "Account created successfully! Logging you in..."
   - Automatic redirect to dashboard

### Step 4: Verify in Database

**Method 1: Using phpMyAdmin**

1. Open: `http://localhost/phpmyadmin`
2. Click `technician_management` database (left sidebar)
3. Click `users` table
4. Click **Browse** tab (or just click the table)
5. **Look for your new user at the bottom** (most recent entries are at the bottom)
6. Verify:
   - ✅ `name` = "Test User"
   - ✅ `username` = "testuser123"
   - ✅ `role` = "technician" (or "supervisor"/"engineer" depending on selection)
   - ✅ `email` = "testuser123@example.com" (auto-generated)
   - ✅ `password` = Hashed value (not plain text!)
   - ✅ `created_at` = Current timestamp

**Method 2: Using SQL Query**

In phpMyAdmin SQL tab, run:
```sql
SELECT * FROM users ORDER BY user_id DESC LIMIT 5;
```

This shows the 5 most recent users.

### Step 5: Test Login with New Account

1. Logout (if you're logged in)
2. Go to login page: `http://localhost:5173/login`
3. Enter:
   - **Username**: `testuser123`
   - **Password**: `password123` (the password you used)
   - **Role**: Select the role you chose during registration
4. Click **Login**
5. Should successfully log in and redirect to dashboard

### Step 6: Check Browser Console

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Look for:
   - ✅ Success messages
   - ❌ Any error messages (red text)

**Expected Console Output:**
```
🔧 AuthContext login called with: {username: "testuser123", password: "password123"}
API request error [/api/users.php]: ...
✅ User logged in: {id: "5", name: "Test User", ...}
```

### Step 7: Check Network Tab

1. In DevTools, go to **Network** tab
2. Clear previous requests (trash icon)
3. Try registering again (or refresh page)
4. Look for API calls:
   - `POST /api/users.php` - Should show status `200 OK`
   - `POST /api/auth.php` - Should show status `200 OK`

**Click on each request to see:**
- **Request Payload**: The data sent to backend
- **Response**: The data returned from backend

## ✅ Success Indicators

You'll know registration is working when:

1. ✅ Form submits without errors
2. ✅ Success message appears
3. ✅ User automatically logged in
4. ✅ User appears in database (`users` table)
5. ✅ Password is hashed (not plain text)
6. ✅ Can login with new credentials
7. ✅ No console errors

## 🐛 Troubleshooting

### Problem: "Registration failed" Error

**Check:**
1. Is backend server running?
   ```powershell
   # Should see: php -S localhost:8000
   ```

2. Check browser console for errors
   - Press `F12` → Console tab

3. Check Network tab
   - Look for failed API calls (red)
   - Check error message in response

4. Verify database connection
   - Check `backend/config.php` credentials
   - Test MySQL connection in phpMyAdmin

### Problem: "Username already exists"

**Solution:**
- Choose a different username
- Or delete the existing user from database first

### Problem: User Created but Can't Login

**Check:**
1. Are you using the correct role?
   - Must match the role selected during registration

2. Check password
   - Make sure you're using the exact password from registration

3. Check browser console
   - Look for login errors

4. Verify user exists in database
   - Check `users` table in phpMyAdmin

### Problem: User Not Appearing in Database

**Check:**
1. Refresh phpMyAdmin table view
   - Click Refresh button or press `F5`

2. Check for errors in browser console
   - Registration might have failed silently

3. Check Network tab
   - Verify API call succeeded (status 200)

4. Check backend PHP errors
   - Backend server console might show errors

### Problem: CORS Errors

**Solution:**
1. Verify CORS headers in PHP files
2. Check `vite.config.ts` proxy configuration
3. Restart both frontend and backend servers

## 📋 Quick Test Checklist

Use this checklist to verify everything works:

- [ ] Registration form loads
- [ ] Can fill out all fields
- [ ] Form validation works (try empty fields)
- [ ] Password confirmation works (try mismatched passwords)
- [ ] Submit button works
- [ ] Success message appears
- [ ] User appears in database
- [ ] Password is hashed in database
- [ ] Can login with new account
- [ ] Dashboard loads after login
- [ ] No console errors
- [ ] API calls succeed (Network tab)

## 🎯 Test Multiple Scenarios

### Test Case 1: Valid Registration
- Fill all fields correctly
- ✅ Should succeed

### Test Case 2: Duplicate Username
- Try registering with existing username
- ❌ Should show "Username already exists"

### Test Case 3: Invalid Password
- Try password less than 6 characters
- ❌ Should show validation error

### Test Case 4: Mismatched Passwords
- Different password and confirm password
- ❌ Should show "Passwords do not match"

### Test Case 5: Empty Fields
- Leave required fields empty
- ❌ Should show validation errors

### Test Case 6: Different Roles
- Register as Technician
- Register as Supervisor
- Register as Planning Engineer
- ✅ All should work and save correct role

## 🔍 Verify Database Changes

**SQL Query to Check Recent Users:**
```sql
-- See latest 10 users
SELECT user_id, username, name, role, email, created_at 
FROM users 
ORDER BY user_id DESC 
LIMIT 10;

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- Check specific user
SELECT * FROM users WHERE username = 'testuser123';
```

## 📊 Expected Database State

After successful registration, your `users` table should have:

| user_id | username | name | role | email | password | created_at |
|---------|----------|------|------|-------|----------|------------|
| ... | ... | ... | ... | ... | ... | ... |
| 5 | testuser123 | Test User | technician | testuser123@example.com | $2y$10$... | 2025-01-29 14:30:00 |

**Note:** Password should be a long hash starting with `$2y$10$...`

## 🎉 Success!

If all tests pass, your registration is working correctly! Users are being saved to the database and can log in immediately.

---

**Need help?** Check browser console (`F12`) and Network tab for detailed error messages!

