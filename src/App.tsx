import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoadingSpinner from './components/common/LoadingSpinner'
import MainLayout from './components/layout/MainLayout'
import { useAuth } from './contexts/AuthContext'
import type { Role } from './types'
import RequireRole from './components/auth/RequireRole'

const LoginPage = lazy(() => import('./pages/Login'))
const ProductionWorkerDashboard = lazy(() => import('./pages/production/ProductionWorkerDashboard'))
const SupervisorDashboard = lazy(() => import('./pages/supervisor/SupervisorDashboard'))
const PlanningEngineerDashboard = lazy(() => import('./pages/planning/PlanningEngineerDashboard'))
const TestPersonnelDashboard = lazy(() => import('./pages/test/TestPersonnelDashboard'))
const QualityInspectorDashboard = lazy(() => import('./pages/quality/QualityInspectorDashboard'))
const JobOrdersPage = lazy(() => import('./pages/JobOrders'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AccessDeniedPage = lazy(() => import('./pages/AccessDenied'))
const DeviceTrackingPage = lazy(() => import('./pages/DeviceTracking'))
const ProductionWorkLogsPage = lazy(() => import('./pages/production/ProductionWorkLogsPage'))
const TestLogsPage = lazy(() => import('./pages/test/TestLogsPage'))
const PendingInspectionsPage = lazy(() => import('./pages/quality/PendingInspectionsPage'))
const QualityReportsPage = lazy(() => import('./pages/quality/QualityReportsPage'))
const WorkApprovalsPage = lazy(() => import('./pages/supervisor/WorkApprovalsPage'))

const App: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route
            path="/"
            element={user ? <MainLayout /> : <Navigate to="/login" replace />}
          >
            <Route
              index
              element={
                <Navigate
                  to={
                    user?.role === 'Admin'
                      ? '/admin-dashboard'
                      : user?.role === 'Supervisor'
                      ? '/supervisor-dashboard'
                      : user?.role === 'PlanningEngineer'
                      ? '/planner-dashboard'
                      : user?.role === 'ProductionWorker'
                      ? '/production-dashboard'
                      : user?.role === 'TestPersonnel'
                      ? '/test-dashboard'
                      : user?.role === 'QualityInspector'
                      ? '/quality-dashboard'
                      : '/login'
                  }
                />
              }
            />
            <Route
              path="admin-dashboard"
              element={
                <RequireRole roles={["Admin"] as Role[]}>
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="production-dashboard"
              element={
                <RequireRole roles={["ProductionWorker"] as Role[]}>
                  <ProductionWorkerDashboard />
                </RequireRole>
              }
            />
            <Route
              path="supervisor-dashboard"
              element={
                <RequireRole roles={["Supervisor"] as Role[]}>
                  <SupervisorDashboard />
                </RequireRole>
              }
            />
            <Route
              path="planner-dashboard"
              element={
                <RequireRole roles={["PlanningEngineer"] as Role[]}>
                  <PlanningEngineerDashboard />
                </RequireRole>
              }
            />
            <Route
              path="test-dashboard"
              element={
                <RequireRole roles={["TestPersonnel"] as Role[]}>
                  <TestPersonnelDashboard />
                </RequireRole>
              }
            />
            <Route
              path="quality-dashboard"
              element={
                <RequireRole roles={["QualityInspector"] as Role[]}>
                  <QualityInspectorDashboard />
                </RequireRole>
              }
            />
            <Route path="job-orders" element={<JobOrdersPage />} />
            <Route path="device-tracking" element={<DeviceTrackingPage />} />
            <Route path="production-work-logs" element={<ProductionWorkLogsPage />} />
            <Route path="test-logs" element={<TestLogsPage />} />
            <Route path="pending-inspections" element={<PendingInspectionsPage />} />
            <Route path="quality-reports" element={<QualityReportsPage />} />
            <Route path="work-approvals" element={<WorkApprovalsPage />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
