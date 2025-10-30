-- Technician Management System Database Schema
-- Complete database structure with sample data

-- Create database
CREATE DATABASE IF NOT EXISTS technician_management;
USE technician_management;

-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('technician', 'supervisor', 'engineer') NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Technicians table
CREATE TABLE technicians (
    technician_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    station_assigned VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Operations table with standard times
CREATE TABLE operations (
    operation_id INT AUTO_INCREMENT PRIMARY KEY,
    operation_name VARCHAR(100) NOT NULL,
    standard_time INT NOT NULL COMMENT 'Standard time in minutes',
    standard_time_minutes INT NOT NULL COMMENT 'Standard time in minutes (alias)',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Orders table
CREATE TABLE job_orders (
    job_order_id VARCHAR(50) PRIMARY KEY,
    total_devices INT NOT NULL,
    due_date DATE NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    description TEXT,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0
);

-- Tasks table
CREATE TABLE tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL,
    job_order_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    operation_name VARCHAR(100) NOT NULL,
    devices_completed INT NOT NULL,
    actual_time_minutes INT NOT NULL,
    standard_time_minutes INT NOT NULL,
    efficiency_percentage DECIMAL(5,2) NOT NULL,
    notes TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE CASCADE,
    FOREIGN KEY (job_order_id) REFERENCES job_orders(job_order_id) ON DELETE CASCADE
);

-- Device Serial Numbers table
CREATE TABLE device_serial_numbers (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    completion_date DATE NOT NULL,
    completion_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

-- Performance Metrics table
CREATE TABLE performance_metrics (
    metric_id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL,
    date DATE NOT NULL,
    productivity DECIMAL(8,4) NOT NULL COMMENT 'Devices per minute',
    efficiency DECIMAL(5,2) NOT NULL COMMENT 'Percentage',
    utilization DECIMAL(5,2) NOT NULL COMMENT 'Percentage',
    job_order_progress DECIMAL(5,2) DEFAULT 0 COMMENT 'Percentage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE CASCADE,
    UNIQUE KEY unique_technician_date (technician_id, date)
);

-- Approvals table
CREATE TABLE approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('approved', 'rejected') NOT NULL,
    comments TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Alerts table
CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    date DATE NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE CASCADE
);

-- Activity Log table
CREATE TABLE activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert sample operations
INSERT INTO operations (operation_name, standard_time, standard_time_minutes, description) VALUES
('Assemblage I', 32, 32, 'Primary assembly operation'),
('Assemblage II', 30, 30, 'Secondary assembly operation'),
('Assemblage II Tubeless', 13, 13, 'Tubeless assembly variant'),
('Final Touch - Cleaning&Packing', 10, 10, 'Final cleaning and packing'),
('Final Touch - Paint&Labeling', 15, 15, 'Painting and labeling'),
('Quality Test', 18, 18, 'Quality control testing'),
('Troubleshooting', 25, 25, 'Problem diagnosis and repair'),
('Calibration', 20, 20, 'Device calibration'),
('Inspection', 12, 12, 'Visual inspection'),
('Packaging', 8, 8, 'Final packaging'),
('Testing', 22, 22, 'Functional testing'),
('Assembly III', 28, 28, 'Third assembly stage'),
('Quality Control', 16, 16, 'Quality control check'),
('Final Assembly', 35, 35, 'Final assembly stage'),
('Pre-inspection', 14, 14, 'Pre-inspection check');

-- Insert sample users
INSERT INTO users (username, password, role, name, email) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'engineer', 'System Administrator', 'admin@company.com'),
('supervisor1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 'John Supervisor', 'supervisor@company.com'),
('tech001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Alice Johnson', 'alice@company.com'),
('tech002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Bob Smith', 'bob@company.com'),
('tech003', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Carol Davis', 'carol@company.com'),
('tech004', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'David Wilson', 'david@company.com'),
('tech005', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Eva Brown', 'eva@company.com'),
('tech006', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Frank Miller', 'frank@company.com'),
('tech007', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Grace Lee', 'grace@company.com'),
('tech008', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Henry Taylor', 'henry@company.com'),
('tech009', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Ivy Anderson', 'ivy@company.com'),
('tech010', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Jack Thomas', 'jack@company.com'),
('tech011', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Kate Jackson', 'kate@company.com'),
('tech012', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Leo White', 'leo@company.com'),
('tech013', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Maya Harris', 'maya@company.com'),
('tech014', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'Noah Martin', 'noah@company.com');

-- Insert sample technicians
INSERT INTO technicians (user_id, station_assigned, status) VALUES
(3, 'Station A1', 'active'),
(4, 'Station A2', 'active'),
(5, 'Station A3', 'active'),
(6, 'Station A4', 'active'),
(7, 'Station B1', 'active'),
(8, 'Station B2', 'active'),
(9, 'Station B3', 'active'),
(10, 'Station B4', 'active'),
(11, 'Station C1', 'active'),
(12, 'Station C2', 'active'),
(13, 'Station C3', 'active'),
(14, 'Station C4', 'active'),
(15, 'Station D1', 'active'),
(16, 'Station D2', 'active');

-- Insert sample job orders
INSERT INTO job_orders (job_order_id, total_devices, due_date, status, priority, description) VALUES
('JO-2024-001', 100, '2024-12-31', 'active', 'high', 'Priority assembly order for Q4'),
('JO-2024-002', 75, '2024-12-28', 'active', 'medium', 'Standard assembly order'),
('JO-2024-003', 50, '2024-12-25', 'active', 'low', 'Small batch order'),
('JO-2024-004', 200, '2025-01-15', 'active', 'high', 'Large production order'),
('JO-2024-005', 150, '2025-01-10', 'active', 'medium', 'Mid-size production order');

-- Insert sample tasks (for demonstration)
INSERT INTO tasks (technician_id, job_order_id, date, operation_name, devices_completed, actual_time_minutes, standard_time_minutes, efficiency_percentage, notes, status) VALUES
(1, 'JO-2024-001', CURDATE(), 'Assemblage I', 5, 60, 32, 53.33, 'No issues encountered', 'pending'),
(2, 'JO-2024-001', CURDATE(), 'Quality Test', 3, 45, 18, 40.00, 'Some devices needed rework', 'pending'),
(3, 'JO-2024-002', CURDATE(), 'Assemblage II', 4, 35, 30, 85.71, 'Smooth operation', 'pending'),
(1, 'JO-2024-001', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Assemblage I', 6, 55, 32, 58.18, 'Completed on time', 'approved'),
(2, 'JO-2024-001', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Quality Test', 4, 40, 18, 45.00, 'All tests passed', 'approved');

-- Insert sample device serial numbers
INSERT INTO device_serial_numbers (task_id, serial_number, completion_date, completion_time) VALUES
(1, 'SN001', CURDATE(), CURTIME()),
(1, 'SN002', CURDATE(), CURTIME()),
(1, 'SN003', CURDATE(), CURTIME()),
(1, 'SN004', CURDATE(), CURTIME()),
(1, 'SN005', CURDATE(), CURTIME()),
(2, 'SN006', CURDATE(), CURTIME()),
(2, 'SN007', CURDATE(), CURTIME()),
(2, 'SN008', CURDATE(), CURTIME()),
(3, 'SN009', CURDATE(), CURTIME()),
(3, 'SN010', CURDATE(), CURTIME()),
(3, 'SN011', CURDATE(), CURTIME()),
(3, 'SN012', CURDATE(), CURTIME());

-- Insert sample performance metrics
INSERT INTO performance_metrics (technician_id, date, productivity, efficiency, utilization, job_order_progress) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 0.109, 58.18, 10.19, 5.0),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 0.100, 45.00, 7.41, 4.0),
(3, CURDATE(), 0.114, 85.71, 6.48, 5.33);

-- Insert sample alerts
INSERT INTO alerts (technician_id, alert_type, message, severity, date) VALUES
(1, 'low_efficiency', 'Low efficiency detected: 53.3%', 'warning', CURDATE()),
(2, 'low_efficiency', 'Low efficiency detected: 40.0%', 'warning', CURDATE()),
(3, 'low_utilization', 'Low utilization detected: 6.5%', 'info', CURDATE());

-- Create indexes for better performance
CREATE INDEX idx_tasks_technician_date ON tasks(technician_id, date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_job_order ON tasks(job_order_id);
CREATE INDEX idx_metrics_technician_date ON performance_metrics(technician_id, date);
CREATE INDEX idx_alerts_technician ON alerts(technician_id);
CREATE INDEX idx_alerts_date ON alerts(date);
CREATE INDEX idx_device_serial ON device_serial_numbers(serial_number);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_date ON activity_log(created_at);

-- Create views for common queries
CREATE VIEW technician_performance AS
SELECT 
    t.technician_id,
    u.name as technician_name,
    t.station_assigned,
    pm.date,
    pm.productivity,
    pm.efficiency,
    pm.utilization,
    pm.job_order_progress
FROM technicians t
JOIN users u ON t.user_id = u.user_id
LEFT JOIN performance_metrics pm ON t.technician_id = pm.technician_id
WHERE t.status = 'active';

CREATE VIEW job_order_progress AS
SELECT 
    jo.job_order_id,
    jo.total_devices,
    jo.due_date,
    jo.status,
    COALESCE(SUM(t.devices_completed), 0) as completed_devices,
    CASE 
        WHEN jo.total_devices > 0 THEN 
            ROUND((COALESCE(SUM(t.devices_completed), 0) / jo.total_devices) * 100, 1)
        ELSE 0 
    END as progress_percentage
FROM job_orders jo
LEFT JOIN tasks t ON jo.job_order_id = t.job_order_id AND t.status = 'approved'
GROUP BY jo.job_order_id, jo.total_devices, jo.due_date, jo.status;

-- Approval history table (used by backend/api/approvals.php)
CREATE TABLE IF NOT EXISTS approval_history (
    approval_history_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    technician_id INT NULL,
    action_type ENUM('approved', 'rejected') NOT NULL,
    comments TEXT,
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE SET NULL
);

-- Ensure at least one supervisor user exists for FK on approvals.supervisor_id
INSERT INTO users (username, password, role, name, email)
SELECT 'supervisor1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 'John Supervisor', 'supervisor@company.com'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'supervisor'
);

-- Supervisor notifications table
CREATE TABLE supervisor_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    job_order_id VARCHAR(50) NOT NULL,
    technician_id INT NOT NULL,
    task_id INT,
    notification_type ENUM('task_completion', 'approval_request', 'alert') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'read', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (job_order_id) REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

-- Supervisor notifications table
CREATE TABLE supervisor_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    job_order_id VARCHAR(50) NOT NULL,
    technician_id INT NOT NULL,
    task_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'read', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_order_id) REFERENCES job_orders(job_order_id),
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- Insert sample activity log entries
INSERT INTO activity_log (user_id, action, details, created_at) VALUES
(1, 'login', 'System administrator logged in', NOW()),
(2, 'login', 'Supervisor logged in', NOW()),
(3, 'create_task', 'Created task for JO-2024-001', NOW()),
(4, 'create_task', 'Created task for JO-2024-001', NOW()),
(5, 'create_task', 'Created task for JO-2024-002', NOW());

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON technician_management.* TO 'your_user'@'localhost';
-- FLUSH PRIVILEGES;