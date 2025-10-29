# Backend-Frontend Integration Guide

This document explains how the backend (PHP) and frontend (React/TypeScript) are connected.

## Configuration

### Environment Variables

Create a `.env` file in the project root (or set environment variables):

```env
VITE_API_BASE_URL=/api
VITE_USE_MOCK=false
```

- `VITE_API_BASE_URL`: Base URL for API requests. Defaults to `/api` which uses Vite proxy
- `VITE_USE_MOCK`: Set to `true` to use mock data instead of backend API

### Vite Proxy Configuration

The `vite.config.ts` includes a proxy configuration that forwards `/api/*` requests to `http://localhost/backend/*`. This allows the frontend to make requests without CORS issues during development.

For production, you'll need to configure your web server (Apache/Nginx) to serve both the frontend and backend, or use a reverse proxy.

## Backend Setup

1. **Database**: Ensure MySQL database `technician_management` is set up
   - Run `backend/database.sql` to create the schema
   - Update `backend/config.php` with your database credentials

2. **PHP Server**: Make sure PHP is running (XAMPP, WAMP, or built-in PHP server)
   - Backend should be accessible at `http://localhost/backend/`
   - Or use PHP built-in server: `php -S localhost:8000 -t backend`

3. **CORS**: CORS headers are configured in each API file:
   - `backend/auth.php`
   - `backend/api/*.php` files

## Frontend Setup

1. **Install Dependencies**: `npm install`

2. **Development**: `npm run dev`
   - Frontend runs on `http://localhost:5173`
   - API requests are proxied to backend

3. **Build**: `npm run build`
   - Outputs to `dist/` directory
   - Configure web server to serve this directory

## API Endpoints

### Authentication
- `POST /api/auth.php` - Login
- `GET /api/auth.php` - Check session

### Resources
- `GET /api/api/users.php` - Get all users
- `GET /api/api/joborders.php` - Get job orders
- `GET /api/api/tasks.php` - Get tasks
- `POST /api/api/tasks.php` - Create task
- `GET /api/api/approvals.php` - Get pending approvals
- `POST /api/api/approvals.php` - Approve/reject task
- `GET /api/api/devices.php` - Get devices

## Data Mapping

The frontend API service (`src/services/api.ts`) maps backend responses to frontend types:

- **Users**: Maps `user_id` → `id`, `role` → frontend Role enum
- **Job Orders**: Maps `job_order_id` → `id`, `status` → frontend status enum
- **Tasks**: Maps `task_id` → `id`, `status` → frontend status enum

## Authentication Flow

1. User enters username/password in frontend
2. Frontend calls `POST /api/auth.php` with credentials
3. Backend validates credentials and creates PHP session
4. Backend returns user data
5. Frontend stores user in localStorage and AuthContext
6. Subsequent API calls include session cookies automatically

## Troubleshooting

### CORS Errors
- Ensure CORS headers are set in PHP files
- Check that `Access-Control-Allow-Credentials: true` is set
- Verify proxy configuration in `vite.config.ts`

### Connection Errors
- Verify backend is running: `http://localhost/backend/auth.php`
- Check browser console for API errors
- Verify database connection in `backend/config.php`

### Mock Data
- Set `VITE_USE_MOCK=true` to use mock data
- Useful for development without backend

## Production Deployment

1. Build frontend: `npm run build`
2. Configure web server to:
   - Serve frontend files from `dist/`
   - Proxy `/api/*` to PHP backend
   - Handle PHP execution
3. Update `.env` with production API URL
4. Ensure database credentials are secure

