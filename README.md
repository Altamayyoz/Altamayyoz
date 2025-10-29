# Technician Task Manager (TTM) - Frontend

A modern, role-based task management system for technicians, supervisors, and administrators. Built with React, TypeScript, Vite, and Tailwind CSS.

![Tech Stack](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-4-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue)

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Role-Based Access](#role-based-access)
- [Forms & Modals](#forms--modals)
- [Action Windows](#action-windows)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Dark Mode](#dark-mode)
- [Build & Deploy](#build--deploy)

## ✨ Features

- **Role-Based Dashboards**: Separate dashboards for Admin, Supervisor, Planning Engineer, Production Worker, Test Personnel, and Quality Inspector
- **Comprehensive Forms**: 10+ interactive modals with validation and error handling
- **Action Windows**: Confirmation dialogs for critical actions
- **Real-Time Updates**: Mock API with in-memory data generation
- **Dark Mode**: Full dark mode support with persistent theme
- **Responsive Design**: Mobile-friendly interface
- **Job Order Management**: Track and manage job orders with progress tracking
- **Work Log Approvals**: Supervisors can approve/reject work logs
- **Report Generation**: Generate and export various reports
- **User Management**: Add, edit, and manage users
- **Device Tracking**: Track device status and stages

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate mock data (optional)
npm run generate-mock

# Start development server
npm run dev
```

Visit `http://localhost:5173` (or the port shown in terminal)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm

### Steps

1. Clone the repository
```bash
git clone <repository-url>
cd frontend-main
```

2. Install dependencies
```bash
npm install
```

3. Generate mock data (optional)
```bash
npm run generate-mock
```

4. Start development server
```bash
npm run dev
```

## 🎯 Usage

### Login

- **Demo Password**: `password` (for all users)
- Toggle dark mode on Login/Register pages
- Theme preference persists across sessions

### Demo Users

The system includes pre-seeded users with different roles. Use any username with password `password` to login.

### Navigation

- Use the sidebar to navigate between pages
- Each role has specific dashboard pages
- All roles can access `/job-orders`

## 👥 Role-Based Access

| Role | Dashboard Route | Key Features |
|------|----------------|--------------|
| **Admin** | `/admin-dashboard` | User management, system settings, data import/export, backups |
| **Supervisor** | `/supervisor-dashboard` | Approve work logs, assign tasks, view team performance |
| **Planning Engineer** | `/planner-dashboard` | Create job orders, generate reports, import templates |
| **Production Worker** | `/production-dashboard` | View assigned tasks, log work hours |
| **Test Personnel** | `/test-dashboard` | View test assignments, log test results |
| **Quality Inspector** | `/quality-dashboard` | Inspect devices, generate quality reports |

## 📝 Forms & Modals

### Admin Dashboard Modals

1. **Import Data Modal**
   - File upload (CSV, Excel)
   - Format selection
   - Drag & drop support
   - Sample template download

2. **Export Report Modal**
   - Report type selection (Performance, Job Orders, Devices, Quality, Efficiency)
   - Date range picker (Today, Week, Month, Custom)
   - Format selection (PDF, Excel, CSV)
   - Optional filters (Role, Status, Priority)

3. **Add User Modal**
   - Username, Email, Password inputs
   - Role dropdown (all 6 roles)
   - Full Name and Department fields
   - Form validation
   - Password confirmation

4. **Backup DB Modal**
   - Auto-generated backup name with date
   - Data selection checkboxes:
     - User Data
     - Job Orders
     - Device History
     - Test Logs
     - Quality Reports
   - Backup information display

### Supervisor Dashboard Modals

5. **Bulk Approve Modal**
   - Selected items summary
   - Work logs table display
   - Approval comment (optional)
   - Notification checkbox
   - Batch approval functionality

6. **Assign Task Modal**
   - Task selection dropdown
   - Assign To dropdown (workers list)
   - Job Order selection
   - Deadline date picker
   - Priority selection (Low, Medium, High, Critical)
   - Estimated Hours input
   - Instructions textarea
   - Notification options

### Planning Engineer Dashboard Modals

7. **Create Job Order Modal**
   - Auto-generate job order number option
   - Product Model dropdown (A100, A300, A340, SKGB)
   - Total Devices, Due Date, Priority
   - Notes textarea
   - Assigned Supervisor selection
   - Form validation

8. **Import Template Modal**
   - Template type selection (Work Log, Job Order, Tasks, Users, Devices)
   - File upload dropzone
   - Sample template download
   - Column mapping options
   - Import preview

9. **Generate Reports Modal**
   - Report type selection (Performance, Efficiency, Utilization, Quality)
   - Period selection (Today, Week, Month, Custom)
   - Custom date range picker
   - Group By dropdown (Technician, Task, Job Order, Department, Date)
   - Format selection (PDF, Excel, CSV)
   - Report options (Include charts, Include details)
   - Report preview

10. **Custom Report Modal**
    - Multi-select field selection (12+ fields grouped by category)
    - Date range selection
    - Advanced filters (Role, Status, Model)
    - Grouping options
    - Sorting options (Ascending/Descending)
    - Format selection
    - Save as template option

## 🔔 Action Windows

### Confirmation Dialogs

1. **Delete Confirmation**
   - Location: Admin Dashboard
   - Usage: Delete Users, Job Orders, etc.
   - Features: Danger styling, "Cannot be undone" warning

2. **Approve Work Log**
   - Location: Work Approvals Page
   - Features: Success styling, technician name display

3. **Reject Work Log**
   - Location: Work Approvals Page
   - Features: Required reason textarea, validation

4. **Export All Data**
   - Location: Admin Dashboard → Settings
   - Features: Warning about processing time

5. **Clear Old Logs**
   - Location: Admin Dashboard → Settings
   - Features: Warning type, "Cannot be undone" message

6. **Mark as Complete**
   - Location: Job Orders Page
   - Features: Success confirmation, updates job order status

7. **Download**
   - Location: Job Orders Page
   - Features: Loading state with spinner, success toast

## 📁 Project Structure

```
frontend-main/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── RequireRole.tsx
│   │   ├── common/
│   │   │   ├── ConfirmationDialog.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   └── modals/
│   │       ├── AddUserModal.tsx
│   │       ├── AssignTaskModal.tsx
│   │       ├── BackupDBModal.tsx
│   │       ├── BulkApproveModal.tsx
│   │       ├── CreateJobOrderModal.tsx
│   │       ├── CustomReportModal.tsx
│   │       ├── ExportReportModal.tsx
│   │       ├── GenerateReportsModal.tsx
│   │       ├── ImportDataModal.tsx
│   │       └── ImportTemplateModal.tsx
│   ├── contexts/
│   │   ├── AppContext.tsx
│   │   └── AuthContext.tsx
│   ├── data/
│   │   ├── alerts.json
│   │   ├── devices.json
│   │   ├── jobOrders.json
│   │   ├── notifications.json
│   │   ├── operations.json
│   │   ├── taskEntries.json
│   │   └── users.json
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminDashboard.tsx
│   │   ├── planning/
│   │   │   └── PlanningEngineerDashboard.tsx
│   │   ├── production/
│   │   │   ├── ProductionWorkerDashboard.tsx
│   │   │   └── ProductionWorkLogsPage.tsx
│   │   ├── quality/
│   │   │   ├── QualityInspectorDashboard.tsx
│   │   │   ├── PendingInspectionsPage.tsx
│   │   │   └── QualityReportsPage.tsx
│   │   ├── supervisor/
│   │   │   ├── SupervisorDashboard.tsx
│   │   │   └── WorkApprovalsPage.tsx
│   │   ├── test/
│   │   │   ├── TestLogsPage.tsx
│   │   │   └── TestPersonnelDashboard.tsx
│   │   ├── AccessDenied.tsx
│   │   ├── DeviceTracking.tsx
│   │   ├── JobOrders.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── services/
│   │   └── api.ts
│   ├── styles/
│   │   └── index.css
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.development
├── package.json
├── tailwind.config.cjs
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔧 Environment Variables

### Development (.env.development)

```env
REACT_APP_USE_MOCK_DATA=true
```

### Production (.env.production)

```env
REACT_APP_API_URL=https://api.example.com
REACT_APP_USE_MOCK_DATA=false
```

## 📜 Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production

# Preview
npm run preview      # Preview production build

# Mock Data
npm run generate-mock # Generate mock data files

# Testing
npm test             # Run tests
```

## 🧪 Testing

```bash
npm test
```

## 🌙 Dark Mode

- Toggle dark mode on Login and Register pages
- Theme preference is saved in localStorage
- Persists across sessions
- All components support dark mode

## 🏗️ Build & Deploy

### Build for Production

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deploy

Deploy the `dist/` folder to your hosting service:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop `dist/` folder
- **GitHub Pages**: Use GitHub Actions or manual deployment
- **Traditional Hosting**: Upload `dist/` contents to your server

## 🎨 Features Overview

### Form Features
- ✅ Complete form validation
- ✅ Required field indicators (*)
- ✅ Error messages below fields
- ✅ Loading states on submit
- ✅ Success toast notifications
- ✅ Modal auto-close after success
- ✅ Form reset after submission
- ✅ Responsive design
- ✅ Dark mode support

### Action Window Features
- ✅ Clear titles and messages
- ✅ Appropriate icons
- ✅ Proper button colors (green=success, red=danger, etc.)
- ✅ Cancel button always available
- ✅ Close on backdrop click
- ✅ Close on Escape key
- ✅ Success feedback
- ✅ Loading states

## 📊 Statistics

- **Total Forms Created**: 10
- **Total Action Windows**: 8
- **Total Buttons Connected**: 20+
- **Code Files Created**: 6 new modal components
- **Code Files Modified**: 8 dashboard/page files

## 🔐 Security Notes

- This is a **frontend-only** application
- All API calls are **mocked** for demonstration
- No actual backend or database connections
- Forms collect data but don't persist to a real backend
- All functionality is simulated for UI/UX purposes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license here]

## 👤 Author

[Add author information]

## 🙏 Acknowledgments

- React Team
- Vite Team
- Tailwind CSS Team
- Lucide React for icons

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**