# Windows Setup Guide - Step by Step

This guide is specifically for Windows users. Follow these steps carefully.

## Prerequisites Check

### 1. Check if MySQL is Installed

**Option A: Check via XAMPP/WAMP**
- Look for XAMPP or WAMP installed on your system
- If installed, MySQL is included

**Option B: Check MySQL Installation**
- Open File Explorer
- Navigate to: `C:\Program Files\MySQL\MySQL Server X.X\bin`
- If this folder exists, MySQL is installed

**Option C: Check via Services**
- Press `Win + R`, type `services.msc`, press Enter
- Look for "MySQL" service

### 2. Install MySQL (if not installed)

**Easiest Option: Install XAMPP**
1. Download XAMPP from: https://www.apachefriends.org/
2. Install XAMPP (includes MySQL, PHP, Apache)
3. Start XAMPP Control Panel
4. Start Apache and MySQL services

**Alternative: Install MySQL Standalone**
1. Download MySQL from: https://dev.mysql.com/downloads/installer/
2. Choose "MySQL Installer for Windows"
3. Install MySQL Server
4. Note the installation path (usually `C:\Program Files\MySQL\MySQL Server X.X\bin`)

## Step 1: Start MySQL Server

### Using XAMPP:
1. Open **XAMPP Control Panel**
2. Click **Start** button next to MySQL
3. MySQL status should turn green (running)

### Using MySQL Standalone:
1. Open **Services** (`Win + R` → `services.msc`)
2. Find **MySQL** service
3. Right-click → **Start**

## Step 2: Access MySQL Database

### Option A: Using phpMyAdmin (Easiest - Recommended)

**If using XAMPP:**
1. Start Apache and MySQL in XAMPP Control Panel
2. Open browser: `http://localhost/phpmyadmin`
3. You'll see phpMyAdmin interface

**If using WAMP:**
1. Start WAMP services
2. Open browser: `http://localhost/phpmyadmin`

### Option B: Using MySQL Workbench

1. Download MySQL Workbench: https://dev.mysql.com/downloads/workbench/
2. Install and open MySQL Workbench
3. Connect to `localhost` (port 3306)
4. Enter password when prompted

### Option C: Using Command Line (if MySQL is in PATH)

**Add MySQL to PATH:**
1. Press `Win + X` → **System** → **Advanced system settings**
2. Click **Environment Variables**
3. Under **System Variables**, find **Path**, click **Edit**
4. Click **New**, add: `C:\Program Files\MySQL\MySQL Server X.X\bin`
   (Replace X.X with your MySQL version)
5. Click **OK** on all dialogs
6. **Restart PowerShell** or Command Prompt
7. Try: `mysql --version`

## Step 3: Create Database

### Using phpMyAdmin:

1. Open `http://localhost/phpmyadmin`
2. Click **New** in left sidebar
3. Database name: `technician_management`
4. Collation: `utf8mb4_general_ci`
5. Click **Create**

### Using MySQL Workbench:

1. Open MySQL Workbench
2. Connect to localhost
3. Click **File** → **Open SQL Script**
4. Or use SQL tab:
   ```sql
   CREATE DATABASE technician_management;
   ```

## Step 4: Import Database Schema

### Using phpMyAdmin:

1. Select `technician_management` database (left sidebar)
2. Click **Import** tab (top menu)
3. Click **Choose File** button
4. Navigate to: `C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor\backend\database.sql`
5. Scroll down, click **Go** button
6. Wait for import to complete
7. You should see "Import has been successfully finished"

### Using MySQL Workbench:

1. Open MySQL Workbench
2. Connect to localhost
3. Click **File** → **Open SQL Script**
4. Navigate to: `backend\database.sql`
5. Click **Open**
6. Click **Execute** button (lightning bolt icon)
7. Wait for execution to complete

### Alternative: Copy-Paste SQL

1. Open `backend\database.sql` in Notepad or VS Code
2. Copy all content (`Ctrl + A`, then `Ctrl + C`)
3. Open phpMyAdmin → Select `technician_management` database
4. Click **SQL** tab
5. Paste the SQL (`Ctrl + V`)
6. Click **Go**

## Step 5: Verify Database Setup

### Check Tables:

**In phpMyAdmin:**
1. Click `technician_management` database (left sidebar)
2. You should see multiple tables:
   - `users`
   - `job_orders`
   - `tasks`
   - `technicians`
   - `operations`
   - etc.

**In MySQL Workbench:**
1. Refresh database (right-click → Refresh)
2. Expand `technician_management` → `Tables`
3. Should see all tables listed

## Step 6: Create Test Users

### Using phpMyAdmin:

1. Click `users` table
2. Click **Insert** tab
3. Add user manually OR use SQL tab:

**Click SQL tab, paste this:**

```sql
INSERT INTO users (name, username, email, password, role) VALUES
('Admin User', 'admin', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'engineer'),
('Supervisor User', 'supervisor', 'supervisor@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor'),
('Technician User', 'technician', 'technician@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician');
```

4. Click **Go**

**Password for all users**: `password`

**Note**: If you get an error about password hash, you can generate a new one:
```sql
-- This generates password hash for 'password'
SELECT PASSWORD('password');
-- Or use PHP's password_hash function
```

Better approach - use this SQL (generates proper hash):
```sql
UPDATE users SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE username = 'admin';
```

## Step 7: Configure Backend

### Update Database Credentials:

1. Open: `backend\config.php`
2. Update these lines if needed:
   ```php
   private $host = 'localhost';        // Usually 'localhost'
   private $db_name = 'technician_management';  // Your database name
   private $username = 'root';        // Usually 'root' for XAMPP/WAMP
   private $password = '';            // Usually empty for XAMPP/WAMP
   ```

**For XAMPP/WAMP**: Usually `root` with empty password
**For MySQL Standalone**: Use the password you set during installation

## Step 8: Start Backend Server

### Option A: Using XAMPP Apache

1. Start **Apache** in XAMPP Control Panel
2. Place project in: `C:\xampp\htdocs\noor\`
3. Access at: `http://localhost/noor/backend/`

### Option B: Using PHP Built-in Server

1. Open **PowerShell** or **Command Prompt**
2. Navigate to project folder:
   ```powershell
   cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor
   ```
3. Start PHP server:
   ```powershell
   php -S localhost:8000 -t backend
   ```
4. Backend running at: `http://localhost:8000/`

### Option C: Using WAMP

1. Start **Apache** in WAMP
2. Place project in: `C:\wamp64\www\noor\`
3. Access at: `http://localhost/noor/backend/`

## Step 9: Test Backend

1. Open browser
2. Go to: `http://localhost/backend/auth.php` (for XAMPP/WAMP)
   OR: `http://localhost:8000/auth.php` (for PHP built-in server)
3. You should see JSON response (may show error if no POST data - that's normal)

## Step 10: Configure Frontend

### Create .env File:

1. In project root, create new file: `.env`
2. Add these lines:
   ```env
   VITE_API_BASE_URL=/api
   VITE_USE_MOCK=false
   ```
3. Save the file

### If using PHP built-in server on port 8000:

Update `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## Step 11: Install Frontend Dependencies

1. Open PowerShell in project folder
2. Run:
   ```powershell
   npm install
   ```
3. Wait for installation (may take 2-5 minutes)

## Step 12: Start Frontend

1. In PowerShell, run:
   ```powershell
   npm run dev
   ```
2. Wait for message: `VITE v4.x.x ready in XXX ms`
3. Note the URL (usually `http://localhost:5173`)

## Step 13: Test Everything

1. Open browser: `http://localhost:5173`
2. You should see login page
3. Try logging in:
   - Username: `admin`
   - Password: `password`
   - Role: Select appropriate role
4. Click **Login**
5. Should redirect to dashboard

## Troubleshooting for Windows

### MySQL Command Not Found:
- **Solution**: Use phpMyAdmin instead (no command line needed)
- Or add MySQL to PATH (see Step 2, Option C)

### Port Already in Use:
- **Solution**: 
  ```powershell
   # Find process using port
   netstat -ano | findstr :8000
   # Kill process (replace PID with actual number)
   taskkill /PID <PID> /F
   ```

### Permission Denied:
- **Solution**: Run PowerShell as Administrator (Right-click → Run as Administrator)

### Backend Not Accessible:
- Check firewall settings
- Verify Apache/MySQL services are running
- Check port 8000 is not blocked

### CORS Errors:
- Ensure both backend and frontend are running
- Check `vite.config.ts` proxy configuration
- Restart both servers

## Quick Reference Commands

```powershell
# Navigate to project
cd C:\Users\NITRO\OneDrive\Desktop\LastVersionFron\noor

# Start backend (PHP built-in)
php -S localhost:8000 -t backend

# Start frontend
npm run dev

# Check if MySQL is running (via Services)
services.msc

# Check if port is in use
netstat -ano | findstr :8000
```

## Windows-Specific Tips

1. **Use phpMyAdmin** instead of MySQL command line (much easier!)
2. **XAMPP** is recommended for beginners (includes everything)
3. **Run PowerShell as Administrator** if you get permission errors
4. **Check Windows Firewall** if connection fails
5. **Use full paths** if relative paths don't work

---

**Need help?** Check `QUICK_START.md` for quick troubleshooting!

