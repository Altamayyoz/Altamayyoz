# Supervisor Role - Complete Functionality

## Overview
The Supervisor is responsible for managing technicians, reviewing work logs, and serving as the communication bridge between technicians and the planning engineer.

## 📋 Main Responsibilities

### 1. **Assigns Work** ✅
- Assign tasks to technicians
- Create and distribute work schedules
- Monitor task distribution across the team
- Manage job order assignments

**Location**: `Supervisor Dashboard → Overview → Assign Task Button`
- Opens `AssignTaskModal` to create new task assignments
- Specify technician, task type, deadline, and priority

### 2. **Reviews Technician Logs** ✅
- View work entries submitted by technicians
- Review completed tasks with timestamps
- Check device serial numbers and quantities
- Validate work completion data

**Location**: `Supervisor Dashboard → Pending Approvals Tab`
- See all pending work logs awaiting approval
- View efficiency calculations
- Check actual time vs standard time
- Read technician notes and comments

### 3. **Approves/Rejects Entries** ✅
- Approve work logs submitted by technicians
- Reject entries that don't meet quality standards
- Bulk approve multiple entries at once
- Provide feedback or rejection reasons

**Location**: `Supervisor Dashboard → Pending Approvals Tab`
- Individual approve/reject buttons on each entry
- Bulk approve modal for batch processing
- Confirmation dialogs for rejections
- Success/error notifications

### 4. **Receives Alerts From Technicians** 🔔

#### Alert Types:
- **Low Efficiency Alerts** - Technician efficiency below 80%
- **Low Utilization Alerts** - Technician utilization below 60%
- **Quality Issues** - Reports of defects or quality concerns
- **Faults & Errors** - Technical issues requiring attention

**How It Works**:
- Alerts are automatically generated based on technician performance metrics
- Stored in the `alerts` table in the database
- Displayed in the `Alerts` tab of the supervisor dashboard

**Location**: `Supervisor Dashboard → Alerts Tab`
```typescript
// Automatic alert generation (backend)
if ($metrics['efficiency'] < 80) {
    $alerts[] = [
        'technician_id' => $technician_id,
        'alert_type' => 'low_efficiency',
        'message' => "Low efficiency detected: {$metrics['efficiency']}%",
        'severity' => 'warning',
        'date' => $date
    ];
}
```

**Alert Display**:
- Technician name and alert message
- Alert severity level (critical, warning, info)
- Timestamp of when the alert was created
- Actions: View Details, Resolve

### 5. **Sends Alerts To Planning Engineer** 📢

#### Alert Types:
- **Job Delays** - Production delays affecting schedule
- **Resource Needs** - Additional resources required
- **Quality Concerns** - Quality issues requiring engineering review
- **Bottlenecks** - Production bottlenecks affecting workflow
- **Schedule Updates** - Changes to production schedule

**How It Works**:
- Use the alert system to communicate with Planning Engineer
- Alerts are sent via `POST /api/supervisor_alerts.php`
- Planning Engineer receives alerts in their dashboard

**Implementation**:
```typescript
// Send alert to Planning Engineer
const response = await fetch('/api/supervisor_alerts.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    alert_type: 'job_delay',
    message: 'Job Order JO-2024-001 delayed due to material shortage',
    severity: 'warning',
    job_order_id: 'JO-2024-001'
  })
})
```

## 🎯 Dashboard Sections

### 1. Overview Tab
- Team Performance Summary
- Active Alerts count
- Pending Approvals summary
- Job Orders summary

### 2. Pending Approvals Tab
- List of all pending work logs
- Details: Technician name, task, devices completed, efficiency
- Actions: Approve, Reject, Bulk Approve

### 3. Team Performance Tab
- Individual technician performance metrics
- Efficiency, productivity, utilization rates
- Filter and search functionality
- Sort by performance metrics

### 4. Job Orders Tab
- View all assigned job orders
- Track job order progress
- Filter by status, priority
- Assign technicians to job orders

### 5. Alerts Tab
- **Receives Alerts From Technicians**:
  - Low efficiency warnings
  - Low utilization alerts
  - Quality concerns
  - Technical issues

- **Display Options**:
  - View all active alerts
  - Filter by severity
  - View alert details
  - Resolve alerts

## 🔄 Alert Flow

### Technician → Supervisor
```
Technician submits work log
         ↓
Backend calculates metrics
         ↓
If metrics < threshold:
         ↓
Alert created automatically
         ↓
Supervisor sees alert in dashboard
```

### Supervisor → Planning Engineer
```
Supervisor identifies issue
         ↓
Supervisor sends alert via dashboard
         ↓
Alert stored in database
         ↓
Planning Engineer sees alert
```

## 💾 Database Tables Used

### Alerts Table
```sql
CREATE TABLE alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    date DATE NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Approvals Flow
- Technician submits work log → `tasks` table
- Supervisor reviews → `approvals` table
- Approved logs update metrics → `performance_metrics` table

## 🛠️ API Endpoints

### Supervisor Alerts
- `POST /api/supervisor_alerts.php` - Send alert to Planning Engineer
- `GET /api/supervisor_alerts.php` - Get alerts for supervisor

### Approvals
- `GET /api/approvals.php` - Get pending approvals
- `POST /api/approvals.php` - Approve task
- `PUT /api/approvals.php` - Reject task with reason

### Task Assignments
- Supervisor assigns via UI
- Assignments stored in job orders and tasks tables

## 📊 Key Metrics Tracked

1. **Efficiency**: (Standard Time / Actual Time) × 100
2. **Productivity**: Devices completed per hour
3. **Utilization**: (Work Hours / Available Hours) × 100
4. **Alert Thresholds**:
   - Efficiency < 80% → Warning
   - Utilization < 60% → Info
   - Quality issues → Critical

## 🔐 Permissions

- ✅ View all technicians and their work
- ✅ Approve/reject work logs
- ✅ Assign tasks to technicians
- ✅ Send alerts to Planning Engineer
- ✅ Receive alerts from technicians
- ✅ View job orders and progress
- ❌ Cannot modify system settings
- ❌ Cannot create job orders (Planning Engineer only)
- ❌ Cannot modify user accounts

## 🎨 UI Components

### Modals
1. **BulkApproveModal** - Approve multiple entries
2. **AssignTaskModal** - Assign new tasks
3. **FilterModal** - Filter technicians/approvals

### Notifications
- Toast notifications for approve/reject actions
- Alert badges for unread alerts
- Success/error messages for all actions

## 📝 Usage Example

### Scenario: Technician has low efficiency
1. Technician submits work log with 70% efficiency
2. Backend automatically creates alert
3. Supervisor sees alert in "Alerts" tab
4. Supervisor views technician details
5. Supervisor can send alert to Planning Engineer if needed
6. Alert is resolved when efficiency improves

### Scenario: Job order is delayed
1. Supervisor identifies delay in production
2. Supervisor clicks "Send Alert" in job orders section
3. Alert sent to Planning Engineer
4. Planning Engineer receives alert in their dashboard
5. Planning Engineer takes appropriate action

## 🚀 Getting Started

### Login as Supervisor
- Username: `supervisor1`
- Password: `password`
- Role: `supervisor`

### Dashboard Access
1. Navigate to `/supervisor-dashboard`
2. View overview metrics
3. Review pending approvals
4. Monitor team performance
5. Manage alerts

## 📈 Future Enhancements
- Email notifications for critical alerts
- SMS notifications for urgent issues
- Alert escalation rules
- Custom alert thresholds per technician
- Alert history and analytics
- Integration with scheduling system
- Mobile app for on-the-go monitoring


