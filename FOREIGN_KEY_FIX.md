# Foreign Key Constraint Fix - Supervisor Approvals

## Problem
When trying to approve or reject work logs, the following error occurs:
```
SQLSTATE[23000]: Integrity constraint violation: 1452 Cannot add or update a child row: a foreign key constraint fails ('technician_management`.`approvals', CONSTRAINT `approvals_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE)
```

## Root Cause
The `approvals` table has a foreign key constraint that requires `supervisor_id` to reference a valid `user_id` in the `users` table. The API was using a hardcoded `user_id = 2` which may not exist or may not match the logged-in supervisor's actual user_id.

## Solution

### 1. Updated Session Handling in `backend/api/approvals.php`
- Moved `session_start()` to the very beginning of the file (before any headers)
- Changed from hardcoded `$user_id = 2` to dynamic session-based `$user_id = $_SESSION['user_id']`
- Added proper session-based role checking

### 2. Added Debug Logging
- Added debug logging to track session data
- Added debug output in error responses to help troubleshoot session issues

### 3. Session-Based Authentication
The API now:
1. Starts the session first
2. Retrieves `user_id` and `role` from the session
3. Validates that the user is logged in
4. Validates that the user has supervisor role
5. Uses the real `user_id` when inserting approval records

## How to Test

1. **Login as a supervisor**
   - Use credentials like: `super` / `password123` (user_id: 23)
   - Or: `test` / `password123` (user_id: 21)
   - Or: `aalmoman` / `password123` (user_id: 18)

2. **Navigate to Supervisor Dashboard**
   - Go to Pending Approvals tab

3. **Try to approve/reject a work log**
   - Click Approve or Reject button
   - Add a comment (required for reject, optional for approve)
   - Click the action button

4. **Verify Success**
   - Should see success toast notification
   - Work log should disappear from pending list
   - Check database to verify approval record was created with correct supervisor_id

## Database Check
To verify supervisors exist:
```sql
USE technician_management;
SELECT user_id, username, role, name FROM users WHERE role='supervisor';
```

Current supervisors:
- user_id: 18, username: aalmoman, name: aboodmomanni
- user_id: 21, username: test, name: test
- user_id: 23, username: super, name: tester

## Important Notes
- Session must be started before any headers are sent
- The supervisor_id in approval records must reference a valid user_id
- All supervisors must have role = 'supervisor' in the users table
- Foreign key constraint ensures data integrity

## Troubleshooting

### If still getting foreign key error:
1. Check that you're logged in (session has user_id)
2. Check that the logged-in user has role = 'supervisor'
3. Check that the user_id exists in the users table
4. Check PHP error logs for session issues

### If getting "Authentication required" error:
1. Make sure you're logged in
2. Check that cookies are being sent with requests
3. Verify session is being maintained between requests
4. Check CORS settings if using different domains

## Files Modified
- `backend/api/approvals.php` - Fixed session handling and authentication


