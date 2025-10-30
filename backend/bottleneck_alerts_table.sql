-- Create bottleneck_alerts table for tracking
-- Run this SQL to add the table to your database

USE technician_management;

CREATE TABLE IF NOT EXISTS bottleneck_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sent_by INT NOT NULL,
    bottleneck_tasks TEXT NOT NULL,
    message TEXT,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (sent_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX idx_bottleneck_sent_by ON bottleneck_alerts(sent_by);
CREATE INDEX idx_bottleneck_status ON bottleneck_alerts(status);
CREATE INDEX idx_bottleneck_created ON bottleneck_alerts(created_at);


