# Quick Start Checklist

Use this checklist to quickly verify your setup is complete.

## ✅ Pre-Setup Checklist

- [ ] Node.js installed (`node --version`)
- [ ] PHP installed (`php --version`)
- [ ] MySQL installed and running
- [ ] Code editor ready

## ✅ Step 1: Database Setup

- [ ] MySQL server is running (XAMPP/WAMP or standalone)
- [ ] Database `technician_management` created
- [ ] `backend/database.sql` imported successfully
- [ ] Tables visible in phpMyAdmin

**Windows Users**: Use phpMyAdmin (`http://localhost/phpmyadmin`) instead of MySQL command line!

**Check**: In phpMyAdmin, click `technician_management` database - should show multiple tables

## ✅ Step 2: Backend Configuration

- [ ] `backend/config.php` updated with correct credentials
- [ ] Test users created (optional)
- [ ] Backend server started (XAMPP/PHP server)

**Check**: Visit `http://localhost/backend/auth.php` - should see JSON response

## ✅ Step 3: Frontend Setup

- [ ] `npm install` completed successfully
- [ ] `.env` file created with:
  ```env
  VITE_API_BASE_URL=/api
  VITE_USE_MOCK=false
  ```
- [ ] `vite.config.ts` proxy configured correctly

## ✅ Step 4: Test Connection

- [ ] Frontend started (`npm run dev`)
- [ ] Backend running and accessible
- [ ] Login page loads at `http://localhost:5173`
- [ ] Can login with database credentials
- [ ] Dashboard loads after login
- [ ] No CORS errors in browser console
- [ ] API calls visible in Network tab

## ✅ Step 5: Verify Features

- [ ] Users page loads users from database
- [ ] Job Orders page loads from database
- [ ] Tasks page loads from database
- [ ] Can create new tasks (POST requests work)
- [ ] Can approve tasks (if supervisor role)

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Fix**: 
1. Check backend server is running
2. Verify URL in `vite.config.ts`
3. Test backend directly: `http://localhost/backend/auth.php`

### Issue: "CORS error"
**Fix**:
1. Check CORS headers in PHP files
2. Restart both servers
3. Clear browser cache

### Issue: "Database connection failed"
**Fix**:
1. Check MySQL is running
2. Verify credentials in `backend/config.php`
3. Test MySQL connection separately

### Issue: "Login fails"
**Fix**:
1. Check users exist in database
2. Verify password is correctly hashed
3. Check browser console for errors
4. Try with `VITE_USE_MOCK=true` to test frontend

### Issue: "Data not loading"
**Fix**:
1. Check database has data
2. Verify API endpoints return JSON
3. Check browser Network tab for API responses
4. Verify proxy is working

## 📝 Quick Test Commands

### Windows Users - Use phpMyAdmin Instead!

**Don't use MySQL command line on Windows** - Use phpMyAdmin:
1. Open: `http://localhost/phpmyadmin` (if using XAMPP/WAMP)
2. Click `technician_management` database
3. Click **SQL** tab
4. Paste SQL commands there

### Testing Commands:

```powershell
# Check if Node.js is installed
node --version

# Check if PHP is installed
php --version

# Test backend (open in browser)
# http://localhost/backend/auth.php
# OR if using PHP built-in server:
# http://localhost:8000/auth.php
```

**Note**: Windows users should use phpMyAdmin web interface instead of MySQL command line. See `WINDOWS_SETUP.md` for detailed Windows instructions.

## 🎯 Successful Setup Indicators

You'll know everything is working when:

1. ✅ Frontend loads at `http://localhost:5173`
2. ✅ Login form appears
3. ✅ Can login with database user
4. ✅ Dashboard loads with user data
5. ✅ No errors in browser console
6. ✅ Network tab shows successful API calls
7. ✅ Data from database appears in UI

## 📚 Next Steps After Setup

1. Explore different user roles
2. Create job orders
3. Add tasks
4. Test approval workflow
5. Check device tracking

## 🔄 Daily Usage

### To Start Development:

1. **Start Backend**:
   ```bash
   # Option A: XAMPP/WAMP - Start Apache and MySQL
   # Option B: PHP built-in server
   php -S localhost:8000 -t backend
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Access Application**:
   - Open browser: `http://localhost:5173`
   - Login with your credentials

### To Stop:

1. Stop frontend: Press `Ctrl+C` in terminal
2. Stop backend: Stop PHP server or stop Apache/MySQL

---

**Need detailed instructions?** See `SETUP_GUIDE.md` for complete step-by-step guide.

**Having issues?** Check `BACKEND_INTEGRATION.md` for troubleshooting.

