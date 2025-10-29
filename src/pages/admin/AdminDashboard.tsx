import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Settings, 
  FileText, 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter
} from 'lucide-react'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import ImportDataModal from '../../components/modals/ImportDataModal'
import ExportReportModal from '../../components/modals/ExportReportModal'
import AddUserModal from '../../components/modals/AddUserModal'
import EditUserModal from '../../components/modals/EditUserModal'
import EditJobOrderModal from '../../components/modals/EditJobOrderModal'
import BackupDBModal from '../../components/modals/BackupDBModal'
import FilterModal from '../../components/modals/FilterModal'
import type { JobOrder } from '../../types'
import { toast } from 'react-hot-toast'

interface SystemStats {
  totalUsers: number
  activeJobOrders: number
  completedJobOrders: number
  pendingApprovals: number
  systemAlerts: number
  totalDevices: number
  completedDevices: number
  averageEfficiency: number
}

interface User {
  id: string
  name: string
  username: string
  role: string
  email: string
  status: 'Active' | 'Inactive'
  lastLogin: string
  createdAt: string
}

interface Alert {
  id: string
  type: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  message: string
  timestamp: string
  resolved: boolean
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [settings, setSettings] = useState<{ standard_work_hours: string; alert_threshold_efficiency: string }>({
    standard_work_hours: '8',
    alert_threshold_efficiency: '70'
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  
  // Modal states
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null)
  const [showViewUserModal, setShowViewUserModal] = useState(false)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [showEditJobOrderModal, setShowEditJobOrderModal] = useState(false)
  const [editingJobOrder, setEditingJobOrder] = useState<JobOrder | null>(null)
  const [showViewJobOrderModal, setShowViewJobOrderModal] = useState(false)
  const [viewingJobOrder, setViewingJobOrder] = useState<JobOrder | null>(null)
  
  // Additional action dialog states
  const [showExportAllDialog, setShowExportAllDialog] = useState(false)
  const [showClearLogsDialog, setShowClearLogsDialog] = useState(false)
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterContext, setFilterContext] = useState<'users' | 'joborders'>('users')
  const [userFilters, setUserFilters] = useState<Record<string, any>>({})
  const [jobOrderFilters, setJobOrderFilters] = useState<Record<string, any>>({})

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Load all data in parallel
      const [usersData, jobOrdersData, statsData, alertsData, settingsData, activityData] = await Promise.all([
        api.getUsers(),
        api.getJobOrders(),
        api.getAdminStats(),
        api.getAlerts(false), // Get unresolved alerts
        api.getSettings(),
        api.getRecentActivity(4)
      ])

      // Use stats from API
      setStats(statsData as SystemStats)
      
      // Map users with email if available
      setUsers(usersData.map(u => ({
        ...u,
        email: (u as any).email || `${u.username}@company.com`,
        status: 'Active' as const,
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      })))
      
      // Use job orders from database
      setJobOrders(jobOrdersData.map(j => ({
        ...j,
        assignedSupervisor: j.assignedSupervisor || 'Unassigned',
        totalDevices: j.totalDevices || 0,
        completedDevices: j.completedDevices || 0,
        createdAt: j.createdAt || new Date().toISOString()
      })))
      
      // Map alerts from API
      setAlerts(alertsData.map((a: any) => ({
        id: a.id,
        type: a.type,
        severity: a.severity as 'Critical' | 'High' | 'Medium' | 'Low',
        message: a.message,
        timestamp: a.timestamp,
        resolved: a.resolved || false
      })))
      
      // Set settings
      setSettings(settingsData)
      
      // Set recent activity
      setRecentActivity(activityData)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
      toast.error('Failed to load dashboard data')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const confirmDelete = async () => {
    if (!deleteItem) return
    
    try {
      if (deleteItem.type === 'User') {
        await api.deleteUser(deleteItem.id)
        toast.success('User deleted successfully!')
        // Reload users after deletion
        const usersData = await api.getUsers()
        setUsers(usersData.map(u => ({
          ...u,
          email: `${u.username}@company.com`,
          status: 'Active' as const,
          lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        })))
      }
      setShowDeleteDialog(false)
      setDeleteItem(null)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete. Please try again.')
    }
  }

  // Modal handlers
  const handleDelete = (type: string, id: string, name: string) => {
    setDeleteItem({ type, id, name })
    setShowDeleteDialog(true)
  }

  const handleExportAllData = () => {
    setShowExportAllDialog(true)
  }

  const confirmExportAll = async () => {
    try {
      const exportData = await api.exportAllData()
      
      // Create a downloadable JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `system_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('All data exported successfully!')
      setShowExportAllDialog(false)
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export data')
    }
  }

  const handleClearOldLogs = () => {
    setShowClearLogsDialog(true)
  }

  const confirmClearLogs = async () => {
    try {
      const success = await api.clearOldLogs(90)
      if (success) {
        toast.success('Old logs cleared successfully!')
        // Reload activity logs
        const activityData = await api.getRecentActivity(4)
        setRecentActivity(activityData)
      } else {
        toast.error('Failed to clear logs')
      }
      setShowClearLogsDialog(false)
    } catch (error: any) {
      console.error('Clear logs error:', error)
      toast.error(error.message || 'Failed to clear logs')
    }
  }

  // Filter functions
  const applyUserFilters = (filters: Record<string, any>) => {
    setUserFilters(filters)
  }

  const applyJobOrderFilters = (filters: Record<string, any>) => {
    setJobOrderFilters(filters)
  }

  const resetUserFilters = () => {
    setUserFilters({})
  }

  const resetJobOrderFilters = () => {
    setJobOrderFilters({})
  }

  // Filtered data
  const filteredUsers = users.filter(user => {
    if (userFilters.role && userFilters.role !== '' && user.role !== userFilters.role) return false
    if (userFilters.status && userFilters.status !== '' && user.status !== userFilters.status) return false
    if (userFilters.search && !user.name.toLowerCase().includes(userFilters.search.toLowerCase()) && 
        !user.email.toLowerCase().includes(userFilters.search.toLowerCase())) return false
    return true
  })

  const filteredJobOrders = jobOrders.filter(order => {
    if (jobOrderFilters.status && jobOrderFilters.status !== '' && order.status !== jobOrderFilters.status) return false
    if (jobOrderFilters.priority && jobOrderFilters.priority !== '' && order.priority !== jobOrderFilters.priority) return false
    if (jobOrderFilters.search && !order.title.toLowerCase().includes(jobOrderFilters.search.toLowerCase()) && 
        !order.id.toLowerCase().includes(jobOrderFilters.search.toLowerCase())) return false
    return true
  })


  if (loading) return <LoadingSpinner />

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500 dark:bg-green-500'
    if (percentage >= 60) return 'bg-blue-500 dark:bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500 dark:bg-yellow-500'
    if (percentage >= 20) return 'bg-orange-500 dark:bg-orange-500'
    return 'bg-red-500 dark:bg-red-500'
  }

  const getEfficiencyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500 dark:bg-green-500'
    if (percentage >= 75) return 'bg-blue-500 dark:bg-blue-500'
    if (percentage >= 60) return 'bg-yellow-500 dark:bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500 dark:bg-orange-500'
    return 'bg-red-500 dark:bg-red-500'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'High': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20'
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'Low': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'in_progress':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'inactive':
      case 'on_hold':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'delayed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent bg-clip-text text-transparent">
            Admin Dashboard
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">System administration and oversight</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 dark:bg-light-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-light-primary/90 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-600 dark:bg-light-accent text-white rounded-lg hover:bg-green-700 dark:hover:bg-light-accent/90 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Total Users</div>
              <div className="text-3xl font-bold text-light-primary dark:text-dark-primary mt-2">{stats?.totalUsers}</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">All roles</div>
            </div>
            <Users className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Active Job Orders</div>
              <div className="text-3xl font-bold text-light-accent dark:text-dark-accent mt-2">{stats?.activeJobOrders}</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">In progress</div>
            </div>
            <Activity className="w-8 h-8 text-light-accent dark:text-dark-accent" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Pending Approvals</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats?.pendingApprovals}</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Awaiting review</div>
            </div>
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">System Alerts</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats?.systemAlerts}</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Require attention</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'joborders', label: 'Job Orders', icon: FileText },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'settings', label: 'System Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
                activeTab === id
                  ? 'border-light-primary text-light-primary dark:border-dark-primary dark:text-dark-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Overview */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Overview
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Average Efficiency</span>
                <span className="font-semibold text-light-primary dark:text-dark-primary">{stats?.averageEfficiency}%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getEfficiencyColor(stats?.averageEfficiency || 0)}`}
                  style={{ width: `${stats?.averageEfficiency}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-light-accent dark:text-dark-accent">{stats?.completedDevices}</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">Devices Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-light-primary dark:text-dark-primary">{stats?.totalDevices}</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">Total Devices</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const timeAgo = activity.time ? (() => {
                      const date = new Date(activity.time)
                      const now = new Date()
                      const diffMs = now.getTime() - date.getTime()
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                      const diffDays = Math.floor(diffHours / 24)
                      
                      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
                      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
                      const diffMins = Math.floor(diffMs / (1000 * 60))
                      return diffMins > 0 ? `${diffMins} minute${diffMins > 1 ? 's' : ''} ago` : 'Just now'
                    })() : 'Unknown'
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'user' ? 'bg-blue-500' :
                          activity.type === 'job' ? 'bg-green-500' :
                          activity.type === 'alert' ? 'bg-red-500' : 'bg-purple-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-light-text dark:text-dark-text">{activity.action}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">{activity.user}</div>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo}</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h3 className="font-semibold text-light-text dark:text-dark-text">
              User Management {filteredUsers.length !== users.length && `(${filteredUsers.length} of ${users.length})`}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setFilterContext('users')
                  setShowFilterModal(true)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
                {Object.keys(userFilters).length > 0 && (
                  <span className="bg-white text-gray-600 rounded-full px-2 py-0.5 text-xs">
                    {Object.keys(userFilters).length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-light-text dark:text-dark-text">{user.name}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setViewingUser(user)
                            setShowViewUserModal(true)
                          }}
                          className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80"
                          title="View user details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingUser(user)
                            setShowEditUserModal(true)
                          }}
                          className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete('User', user.id, user.name)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'joborders' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h3 className="font-semibold text-light-text dark:text-dark-text">
              All Job Orders {filteredJobOrders.length !== jobOrders.length && `(${filteredJobOrders.length} of ${jobOrders.length})`}
            </h3>
            <button 
              onClick={() => {
                setFilterContext('joborders')
                setShowFilterModal(true)
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
              {Object.keys(jobOrderFilters).length > 0 && (
                <span className="bg-white text-gray-600 rounded-full px-2 py-0.5 text-xs">
                  {Object.keys(jobOrderFilters).length}
                </span>
              )}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Job Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredJobOrders.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-light-text dark:text-dark-text">{job.title}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{job.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${getProgressColor(job.progress)}`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {job.assignedSupervisor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setViewingJobOrder(job)
                            setShowViewJobOrderModal(true)
                          }}
                          className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80"
                          title="View job order details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingJobOrder(job)
                            setShowEditJobOrderModal(true)
                          }}
                          className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                          title="Edit job order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-light-text dark:text-dark-text">{alert.type}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{alert.message}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!alert.resolved && (
                    <button 
                      onClick={async () => {
                        try {
                          const success = await api.resolveAlert(alert.id)
                          if (success) {
                            toast.success('Alert resolved successfully!')
                            // Reload alerts
                            const alertsData = await api.getAlerts(false)
                            setAlerts(alertsData.map((a: any) => ({
                              id: a.id,
                              type: a.type,
                              severity: a.severity as 'Critical' | 'High' | 'Medium' | 'Low',
                              message: a.message,
                              timestamp: a.timestamp,
                              resolved: a.resolved || false
                            })))
                            // Reload stats to update alert count
                            const statsData = await api.getAdminStats()
                            setStats(statsData as SystemStats)
                          } else {
                            toast.error('Failed to resolve alert')
                          }
                        } catch (error: any) {
                          console.error('Resolve alert error:', error)
                          toast.error(error.message || 'Failed to resolve alert')
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                    >
                      Resolve
                    </button>
                  )}
                  <button className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">System Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Standard Work Hours
                </label>
                <input 
                  type="number" 
                  value={settings.standard_work_hours}
                  onChange={(e) => setSettings({ ...settings, standard_work_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Alert Threshold (Efficiency %)
                </label>
                <input 
                  type="number" 
                  value={settings.alert_threshold_efficiency}
                  onChange={(e) => setSettings({ ...settings, alert_threshold_efficiency: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <button 
                onClick={async () => {
                  try {
                    const success = await api.saveSettings(settings)
                    if (success) {
                      toast.success('Settings saved successfully!')
                    } else {
                      toast.error('Failed to save settings')
                    }
                  } catch (error: any) {
                    console.error('Save settings error:', error)
                    toast.error(error.message || 'Failed to save settings')
                  }
                }}
                className="w-full px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition"
              >
                Save Settings
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Data Management</h3>
            <div className="space-y-4">
              <button 
                onClick={() => setShowBackupModal(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Backup Database
              </button>
              <button 
                onClick={handleExportAllData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export All Data
              </button>
              <button 
                onClick={handleClearOldLogs}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Old Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ImportDataModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
      
      <AddUserModal 
        isOpen={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)}
        onUserCreated={() => {
          // Reload users after creation
          loadDashboardData()
        }}
      />

      {editingUser && (
        <EditUserModal 
          isOpen={showEditUserModal} 
          onClose={() => {
            setShowEditUserModal(false)
            setEditingUser(null)
          }}
          userId={editingUser.id}
          initialUser={{
            name: editingUser.name,
            username: editingUser.username,
            email: (editingUser as any).email || `${editingUser.username}@company.com`,
            role: editingUser.role
          }}
          onUserUpdated={() => {
            loadDashboardData()
          }}
        />
      )}

      {viewingUser && (
        <Modal isOpen={showViewUserModal} onClose={() => {
          setShowViewUserModal(false)
          setViewingUser(null)
        }} title="User Details">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingUser.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingUser.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <p className="mt-1 text-gray-900 dark:text-white">{(viewingUser as any).email || `${viewingUser.username}@company.com`}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingUser.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <p className="mt-1 text-gray-900 dark:text-white">{(viewingUser as any).status || 'Active'}</p>
            </div>
          </div>
        </Modal>
      )}

      {editingJobOrder && (
        <EditJobOrderModal 
          isOpen={showEditJobOrderModal} 
          onClose={() => {
            setShowEditJobOrderModal(false)
            setEditingJobOrder(null)
          }}
          jobOrder={editingJobOrder}
          onJobOrderUpdated={() => {
            loadDashboardData()
          }}
        />
      )}

      {viewingJobOrder && (
        <Modal isOpen={showViewJobOrderModal} onClose={() => {
          setShowViewJobOrderModal(false)
          setViewingJobOrder(null)
        }} title={`Job Order Details: ${viewingJobOrder.id}`}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Order ID</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingJobOrder.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingJobOrder.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <p className="mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingJobOrder.status)}`}>
                  {viewingJobOrder.status.replace('_', ' ')}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getProgressColor(viewingJobOrder.progress)}`}
                    style={{ width: `${viewingJobOrder.progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{viewingJobOrder.progress}%</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Devices</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingJobOrder.totalDevices || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed Devices</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingJobOrder.completedDevices || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {viewingJobOrder.dueDate ? new Date(viewingJobOrder.dueDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Supervisor</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingJobOrder.assignedSupervisor || 'Unassigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {viewingJobOrder.createdAt ? new Date(viewingJobOrder.createdAt).toLocaleString() : 'Unknown'}
              </p>
            </div>
          </div>
        </Modal>
      )}

      <BackupDBModal 
        isOpen={showBackupModal} 
        onClose={() => setShowBackupModal(false)} 
      />

      {/* Filter Modals */}
      {filterContext === 'users' && (
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={applyUserFilters}
          onReset={resetUserFilters}
          title="Filter Users"
          fields={[
            {
              name: 'role',
              label: 'Role',
              type: 'select',
              options: [
                { label: 'Admin', value: 'Admin' },
                { label: 'Production Worker', value: 'ProductionWorker' },
                { label: 'Test Personnel', value: 'TestPersonnel' },
                { label: 'Quality Inspector', value: 'QualityInspector' },
                { label: 'Supervisor', value: 'Supervisor' },
                { label: 'Planning Engineer', value: 'PlanningEngineer' }
              ]
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' }
              ]
            },
            {
              name: 'search',
              label: 'Search (Name or Email)',
              type: 'text'
            }
          ]}
        />
      )}

      {filterContext === 'joborders' && (
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={applyJobOrderFilters}
          onReset={resetJobOrderFilters}
          title="Filter Job Orders"
          fields={[
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { label: 'Open', value: 'open' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Completed', value: 'completed' },
                { label: 'On Hold', value: 'on_hold' }
              ]
            },
            {
              name: 'priority',
              label: 'Priority',
              type: 'select',
              options: [
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Critical', value: 'Critical' }
              ]
            },
            {
              name: 'search',
              label: 'Search (Title or ID)',
              type: 'text'
            }
          ]}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${deleteItem?.name}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Additional Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showExportAllDialog}
        onClose={() => setShowExportAllDialog(false)}
        onConfirm={confirmExportAll}
        title="Export All Data"
        message="This will export all system data including users, job orders, and logs. This may take several minutes."
        type="info"
        confirmText="Export"
        cancelText="Cancel"
      />

      <ConfirmationDialog
        isOpen={showClearLogsDialog}
        onClose={() => setShowClearLogsDialog(false)}
        onConfirm={confirmClearLogs}
        title="Clear Old Logs"
        message="This will permanently delete all logs older than 90 days. This action cannot be undone."
        type="warning"
        confirmText="Clear Logs"
        cancelText="Cancel"
      />
    </div>
  )
}

export default AdminDashboard