-- SQL Script to Create Supervisor User
-- Run this in phpMyAdmin or MySQL command line

USE technician_management;

-- Create a new supervisor user
INSERT INTO users (username, password, role, name, email) VALUES
('mysupervisor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 'My Supervisor', 'mysupervisor@company.com');

-- Verify the user was created
SELECT user_id, username, name, role, email FROM users WHERE username = 'mysupervisor';

-- The password hash above corresponds to: password
-- You can login with:
-- Username: mysupervisor
-- Password: password
-- Role: supervisor


