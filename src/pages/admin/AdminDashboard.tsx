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
  
  // Modal states
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null)
  
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
      // Load system statistics
      const [usersData, jobOrdersData] = await Promise.all([
        api.getUsers(),
        api.getJobOrders()
      ])

      // Calculate system stats
      const systemStats: SystemStats = {
        totalUsers: usersData.length,
        activeJobOrders: jobOrdersData.filter(j => j.status === 'in_progress').length,
        completedJobOrders: jobOrdersData.filter(j => j.status === 'completed').length,
        pendingApprovals: Math.floor(Math.random() * 15) + 5, // Mock data
        systemAlerts: Math.floor(Math.random() * 8) + 2, // Mock data
        totalDevices: jobOrdersData.reduce((sum, j) => sum + (j.totalDevices || 0), 0),
        completedDevices: jobOrdersData.reduce((sum, j) => sum + (j.completedDevices || 0), 0),
        averageEfficiency: Math.floor(Math.random() * 20) + 75 // Mock data
      }

      // Mock alerts data
      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'Low Performance',
          severity: 'High',
          message: 'Technician Alex Turner efficiency below 70% for 3 consecutive days',
          timestamp: '2024-01-15T10:30:00Z',
          resolved: false
        },
        {
          id: '2',
          type: 'Approaching Deadline',
          severity: 'Medium',
          message: 'Job Order JO-00125 due in 2 days with 65% completion',
          timestamp: '2024-01-15T09:15:00Z',
          resolved: false
        },
        {
          id: '3',
          type: 'System Maintenance',
          severity: 'Low',
          message: 'Scheduled maintenance window tonight 11 PM - 1 AM',
          timestamp: '2024-01-15T08:00:00Z',
          resolved: false
        }
      ]

      setStats(systemStats)
      setUsers(usersData.map(u => ({
        ...u,
        email: `${u.username}@company.com`,
        status: 'Active' as const,
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      })))
      setJobOrders(jobOrdersData.map(j => ({
        ...j,
        assignedSupervisor: j.assignedSupervisor || 'Unassigned',
        totalDevices: j.totalDevices || Math.floor(Math.random() * 50) + 10,
        completedDevices: j.completedDevices || Math.floor(Math.random() * 30) + 5,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })))
      setAlerts(mockAlerts)
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('All data exported successfully!')
      setShowExportAllDialog(false)
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const handleClearOldLogs = () => {
    setShowClearLogsDialog(true)
  }

  const confirmClearLogs = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Old logs cleared successfully!')
      setShowClearLogsDialog(false)
    } catch (error) {
      toast.error('Failed to clear logs')
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
            className="px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-light-accent text-white rounded-lg hover:bg-light-accent/90 transition flex items-center gap-2"
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
                  className="bg-gradient-to-r from-light-primary to-light-accent h-2 rounded-full transition-all duration-500"
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
                {[
                  { action: 'New user created', user: 'John Doe', time: '2 hours ago', type: 'user' },
                  { action: 'Job order completed', user: 'JO-00123', time: '4 hours ago', type: 'job' },
                  { action: 'System alert resolved', user: 'Performance Issue', time: '6 hours ago', type: 'alert' },
                  { action: 'Data export generated', user: 'Monthly Report', time: '8 hours ago', type: 'report' }
                ].map((activity, index) => (
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
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{activity.time}</div>
                  </div>
                ))}
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
                        <button className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete('User', user.id, user.name)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
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
                            className="h-full bg-gradient-to-r from-light-primary to-light-accent transition-all duration-500"
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
                        <button className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
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
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
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
                  defaultValue="8" 
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Alert Threshold (Efficiency %)
                </label>
                <input 
                  type="number" 
                  defaultValue="70" 
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <button className="w-full px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition">
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