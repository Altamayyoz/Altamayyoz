# Step-by-Step Setup Guide

Follow these steps to connect and use the backend with the frontend.

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js 18+ installed ([Download](https://nodejs.org/))
- ✅ PHP 7.4+ installed ([Download](https://www.php.net/downloads))
- ✅ MySQL/MariaDB installed ([Download](https://www.mysql.com/downloads/))
- ✅ A code editor (VS Code recommended)

## Step 1: Database Setup

### 1.1 Start MySQL Server
- **Windows**: Start MySQL service from Services or XAMPP/WAMP
- **Mac**: `brew services start mysql` or use MAMP
- **Linux**: `sudo systemctl start mysql`

### 1.2 Create Database
1. Open MySQL command line or phpMyAdmin
2. Create a new database:
   ```sql
   CREATE DATABASE technician_management;
   ```

### 1.3 Import Database Schema
1. Open `backend/database.sql` file
2. Execute the SQL file in phpMyAdmin or MySQL command line:
   ```bash
   mysql -u root -p technician_management < backend/database.sql
   ```
   Or copy-paste the SQL content in phpMyAdmin's SQL tab

### 1.4 Verify Database
- Check that tables are created: `users`, `job_orders`, `tasks`, `technicians`, etc.
- You can verify in phpMyAdmin

## Step 2: Backend Configuration

### 2.1 Update Database Credentials
1. Open `backend/config.php`
2. Update these lines if your MySQL credentials are different:
   ```php
   private $host = 'localhost';        // Change if needed
   private $db_name = 'technician_management';
   private $username = 'root';        // Change if needed
   private $password = '';            // Change if needed
   ```

### 2.2 Create Test Users (Optional)
Insert test users into the database:
```sql
INSERT INTO users (name, username, email, password, role) VALUES
('Admin User', 'admin', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Supervisor', 'supervisor', 'supervisor@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor'),
('Engineer', 'engineer', 'engineer@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'engineer'),
('Technician', 'technician', 'technician@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician');
```
**Password for all users**: `password`

## Step 3: Start Backend Server

### Option A: Using XAMPP/WAMP (Windows)
1. Start XAMPP/WAMP control panel
2. Start Apache and MySQL services
3. Copy your project folder to `htdocs` (for XAMPP) or `www` (for WAMP)
4. Backend will be accessible at: `http://localhost/noor/backend/`

### Option B: Using PHP Built-in Server
1. Open terminal/command prompt
2. Navigate to project root:
   ```bash
   cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor
   ```
3. Start PHP server:
   ```bash
   php -S localhost:8000 -t backend
   ```
4. Backend will be accessible at: `http://localhost:8000/`

### Option C: Using Separate PHP Server
1. Configure Apache/Nginx to serve PHP files
2. Point document root to your `backend` folder
3. Access at your configured URL

### 3.1 Test Backend
1. Open browser and go to: `http://localhost/backend/auth.php` (or your server URL)
2. You should see a JSON response (may show error if no POST data, that's normal)
3. Test login endpoint with a tool like Postman or curl:
   ```bash
   curl -X POST http://localhost/backend/auth.php \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password","role":"admin"}'
   ```

## Step 4: Frontend Configuration

### 4.1 Install Dependencies
1. Open terminal in project root:
   ```bash
   cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
   Wait for installation to complete (may take a few minutes)

### 4.2 Create Environment File
1. Create a new file named `.env` in the project root
2. Add these lines:
   ```env
   VITE_API_BASE_URL=/api
   VITE_USE_MOCK=false
   ```
3. Save the file

### 4.3 Update Vite Proxy (if using different backend URL)
If your backend is NOT at `http://localhost/backend/`, update `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // Change to your backend URL
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## Step 5: Start Frontend Development Server

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Verify Frontend Started
- You should see: `VITE v4.x.x ready in XXX ms`
- Local URL: `http://localhost:5173`
- Open this URL in your browser

## Step 6: Test the Connection

### 6.1 Test Login
1. Open browser to `http://localhost:5173`
2. You should see the login page
3. Try logging in with:
   - **Username**: `admin` (or any user from database)
   - **Password**: `password`
   - **Role**: Select appropriate role
4. Click "Login"

### 6.2 Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - ✅ API calls being made
   - ✅ Successful responses
   - ❌ Any errors (CORS, connection, etc.)

### 6.3 Check Network Tab
1. Open DevTools → Network tab
2. Try logging in again
3. Look for:
   - `/api/auth.php` request
   - Status should be `200 OK`
   - Response should contain user data

## Step 7: Verify Features Are Working

### 7.1 Test Different Features
1. **Login**: Should authenticate against database
2. **Dashboard**: Should load user-specific dashboard
3. **Job Orders**: Navigate to Job Orders page, should load from database
4. **Tasks**: Should show tasks from database
5. **Users**: Admin can view users from database

### 7.2 Check Data Flow
1. Make a change in the database (e.g., add a user)
2. Refresh frontend page
3. Changes should appear in the UI

## Troubleshooting

### Problem: CORS Errors
**Solution**: 
- Ensure CORS headers are in PHP files
- Check `vite.config.ts` proxy configuration
- Restart both frontend and backend servers

### Problem: Connection Refused
**Solution**:
- Verify backend is running: `http://localhost/backend/auth.php`
- Check backend URL in `vite.config.ts`
- Verify firewall is not blocking connections

### Problem: Database Connection Error
**Solution**:
- Check MySQL is running
- Verify credentials in `backend/config.php`
- Test database connection: `mysql -u root -p`

### Problem: 404 Errors on API Calls
**Solution**:
- Check proxy configuration in `vite.config.ts`
- Verify backend file paths are correct
- Ensure backend server is running

### Problem: Login Not Working
**Solution**:
- Check users exist in database
- Verify password hash matches (use `password_hash()`)
- Check browser console for error messages
- Verify session is being created

### Problem: Data Not Loading
**Solution**:
- Set `VITE_USE_MOCK=true` temporarily to test frontend
- Check database has data
- Verify API endpoints return correct JSON format
- Check browser console for API errors

## Quick Commands Reference

```bash
# Start backend (PHP built-in server)
php -S localhost:8000 -t backend

# Start frontend
npm run dev

# Install dependencies
npm install

# Build for production
npm run build

# Test backend endpoint
curl http://localhost/backend/auth.php
```

## Production Deployment

### 1. Build Frontend
```bash
npm run build
```

### 2. Configure Web Server
- Serve `dist/` folder as static files
- Configure reverse proxy for `/api/*` to PHP backend
- Set up SSL certificate
- Update `.env` with production API URL

### 3. Database
- Use production database credentials
- Update `backend/config.php` with production DB settings
- Ensure database backups are configured

## Need Help?

- Check `BACKEND_INTEGRATION.md` for technical details
- Review browser console for error messages
- Check backend logs for PHP errors
- Verify all prerequisites are installed correctly

---

**You're all set!** The frontend should now be connected to your PHP backend. 🎉

