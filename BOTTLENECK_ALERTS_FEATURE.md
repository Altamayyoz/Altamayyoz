# Bottleneck Tasks - Send to Admin Feature

## Overview
This feature allows Planning Engineers to send bottleneck task alerts to the Admin for immediate attention and resource allocation.

## What Was Implemented

### 1. Backend API Endpoint (`backend/api/bottleneck_alerts.php`)
- **POST** `/backend/api/bottleneck_alerts.php` - Send bottleneck tasks to admin
- **GET** `/backend/api/bottleneck_alerts.php` - Retrieve sent bottleneck alerts
- Stores alerts in the database's `alerts` table
- Creates entries in `bottleneck_alerts` table for tracking
- Logs all activities for audit purposes

### 2. Database Structure
Created new table: `bottleneck_alerts`
```sql
- id (INT, Primary Key)
- sent_by (INT, Foreign Key to users)
- bottleneck_tasks (TEXT, JSON array of tasks)
- message (TEXT)
- status (ENUM: pending, reviewed, resolved)
- admin_response (TEXT)
- created_at, reviewed_at (TIMESTAMP)
```

### 3. Frontend Changes (`src/pages/planning/PlanningEngineerDashboard.tsx`)
- Added "Send to Admin" button in the Bottleneck Tasks section
- Button only appears when there are bottleneck tasks
- Confirmation dialog before sending
- Loading state while sending
- Success/error toast notifications
- Empty state message when no bottlenecks exist

### 4. Features
- ✅ Interactive with database
- ✅ Real-time bottleneck data from database query
- ✅ Send button with confirmation
- ✅ Activity logging
- ✅ Alert notification system
- ✅ Loading states and error handling

## How It Works

### Data Flow
1. **Bottleneck Detection**: Backend query in `planning_metrics.php` identifies tasks with efficiency < 80%
2. **Display**: Frontend displays identified bottleneck tasks in the dashboard
3. **Send Action**: Planning Engineer clicks "Send to Admin" button
4. **Confirmation**: User confirms the action via dialog
5. **API Call**: Frontend sends POST request to `bottleneck_alerts.php`
6. **Database**: Alert is stored in both `alerts` and `bottleneck_alerts` tables
7. **Notification**: Admin receives alert in their alert system
8. **Activity Log**: The action is logged for audit trail

## Setup Instructions

### 1. Database Setup
Run the SQL file to create the table:
```bash
mysql -u root -p technician_management < backend/bottleneck_alerts_table.sql
```

Or manually execute:
```sql
-- See backend/bottleneck_alerts_table.sql
```

### 2. Backend Configuration
The backend API is already configured to work with the existing database structure. Make sure you have:
- MySQL running with the `technician_management` database
- PHP session support enabled
- Proper CORS configuration (already in `backend/cors.php`)

### 3. Frontend Setup
No additional setup needed. The frontend will automatically:
- Display bottleneck tasks from the database
- Show the "Send to Admin" button when bottlenecks exist
- Handle the send process with proper feedback

## Usage

1. Navigate to Planning Engineer Dashboard
2. View the "Bottleneck Tasks" section
3. If bottlenecks exist, you'll see a "Send to Admin" button
4. Click the button to send an alert to admin
5. Confirm the action in the dialog
6. Success notification will appear when sent
7. Admin will receive the alert in their dashboard

## Database Queries Used

### Bottleneck Detection Query (from planning_metrics.php)
```sql
SELECT 
  t.operation_name,
  AVG(t.efficiency_percentage) as avg_efficiency,
  COUNT(*) as task_count
FROM tasks t
WHERE t.status = 'approved'
  AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY t.operation_name
HAVING AVG(t.efficiency_percentage) < 80
ORDER BY avg_efficiency ASC
LIMIT 5
```

This query identifies operations with efficiency below 80% from approved tasks in the last 30 days.

## Security Notes
- ✅ Authentication required (session-based)
- ✅ Input validation for bottleneck tasks array
- ✅ Error handling and logging
- ✅ Activity tracking
- ✅ No SQL injection vulnerabilities (using prepared statements)

## Files Modified/Created

### New Files
- `backend/api/bottleneck_alerts.php` - API endpoint
- `backend/bottleneck_alerts_table.sql` - Database schema
- `BOTTLENECK_ALERTS_FEATURE.md` - This documentation

### Modified Files
- `src/pages/planning/PlanningEngineerDashboard.tsx` - Added send functionality with proper credentials
- `vite.config.ts` - Added `/backend` proxy configuration for API calls

## Important Configuration

### Vite Proxy Setup
The vite.config.ts now includes a proxy for `/backend` path to properly route API calls:
```typescript
'/backend': {
  target: 'http://localhost',
  changeOrigin: true,
  secure: false,
  rewrite: (path) => path.replace(/^\/backend/, '/noor/backend')
}
```

### Session Handling
The API now properly handles session cookies by including `credentials: 'include'` in fetch requests.

## Restart Required
**IMPORTANT**: After making these changes, you MUST restart the development server for the Vite proxy configuration to take effect:
```bash
npm run dev
```

## Testing

1. Ensure you have bottleneck tasks in the database (tasks with efficiency < 80%)
2. Login as Planning Engineer
3. Navigate to dashboard and check Bottleneck Tasks section
4. Click "Send to Admin" button
5. Verify alert appears in Admin dashboard
6. Check database tables for proper data storage

## Future Enhancements
- Add priority levels for bottleneck tasks
- Add admin response capability
- Track resolution status
- Add email notifications
- Add filter options for bottleneck alerts

