-- SQL Script to Create Admin User
-- Run this in phpMyAdmin or MySQL command line

-- Check if admin exists and delete if needed (optional)
DELETE FROM users WHERE username = 'admin';

-- Insert admin user
INSERT INTO users (username, password, role, name, email) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'engineer', 'System Administrator', 'admin@company.com');

-- The password hash above corresponds to: password
-- You can login with:
-- Username: admin
-- Password: password

