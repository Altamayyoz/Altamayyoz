import React, { useEffect, useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  MessageSquare,
  Filter,
  Search,
  Calendar,
  Target,
  Activity,
  BarChart3,
  UserCheck,
  UserX,
  Timer,
  FileText
} from 'lucide-react'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import BulkApproveModal from '../../components/modals/BulkApproveModal'
import AssignTaskModal from '../../components/modals/AssignTaskModal'
import FilterModal from '../../components/modals/FilterModal'
import TaskCompletionNotification from '../../components/modals/TaskCompletionNotification'
import { toast } from 'react-hot-toast'
import type { JobOrder } from '../../types'

interface PendingApproval {
  id: string
  technicianName: string
  technicianId: string
  taskName: string
  devicesCompleted: number
  deviceSerials: string[]
  actualTime: number
  standardTime: number
  submittedAt: string
  notes?: string
  efficiency: number
}

interface TechnicianPerformance {
  id: string
  name: string
  efficiency: number
  productivity: number
  utilization: number
  tasksCompleted: number
  totalHours: number
  status: 'Active' | 'Idle' | 'On Break'
  currentTask?: string
  alerts: number
}

interface ApprovalHistory {
  approval_id: number
  task_id: number
  supervisor_id: number
  technician_id: number | null
  action_type: 'approved' | 'rejected'
  comments: string | null
  approval_date: string
  operation_name: string
  devices_completed: number
  efficiency_percentage: number
  supervisor_name: string
  technician_name: string | null
  job_order_id: string
}

interface TaskCompletionNotification {
  id: string
  jobOrderId: string
  technicianId: string
  technicianName: string
  taskId: string
  type: string
  message: string
  status: 'pending' | 'read' | 'resolved'
  createdAt: string
  operationName: string
  devicesCompleted: number
  actualTimeMinutes: number
  efficiencyPercentage: number
  serialNumbers: string[]
  notes: string
  totalDevices: number
}

const SupervisorDashboard: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [technicians, setTechnicians] = useState<TechnicianPerformance[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([])
  const [taskCompletionNotifications, setTaskCompletionNotifications] = useState<TaskCompletionNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'rejected'>('all')
  
  // Modal states
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false)
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  // Comment modal states
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [approvalComment, setApprovalComment] = useState('')
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  
  // Task completion notification modal states
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false)
  const [selectedTaskCompletion, setSelectedTaskCompletion] = useState<TaskCompletionNotification | null>(null)
  
  // Enhanced filter state
  const [filters, setFilters] = useState<Record<string, any>>({})

  const loadDashboardData = async () => {
    setLoading(true)
    
    let approvals: PendingApproval[] = []
    let techs: TechnicianPerformance[] = []
    let orders: JobOrder[] = []
    let history: ApprovalHistory[] = []
    let notifications: TaskCompletionNotification[] = []
    
    try {
      // Fetch pending approvals from API
      const response = await fetch('/api/approvals.php', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success && result.data) {
        // Map API data to PendingApproval format
        approvals = result.data.map((task: any) => ({
          id: String(task.task_id),
          technicianName: task.technician_name || 'Unknown',
          technicianId: String(task.technician_id),
          taskName: task.operation_name || 'Task',
          devicesCompleted: task.devices_completed || 0,
          deviceSerials: task.serial_numbers || [],
          actualTime: task.actual_time_minutes || 0,
          standardTime: task.standard_time_minutes || 0,
          submittedAt: task.created_at || new Date().toISOString(),
          notes: task.notes || '',
          efficiency: parseFloat(task.efficiency_percentage) || 0
        }))
      }
    } catch (apiError) {
      console.error('API fetch error, using mock data:', apiError)
      // Use mock data as fallback
      approvals = [
        {
          id: '1',
          technicianName: 'Alex Turner',
          technicianId: 'u1',
          taskName: 'Quality Assemblage I',
          devicesCompleted: 5,
          deviceSerials: ['A340-001', 'A340-002', 'A340-003', 'A340-004', 'A340-005'],
          actualTime: 95,
          standardTime: 90,
          submittedAt: '2024-01-15T14:30:00Z',
          notes: 'Minor delay due to component alignment issue',
          efficiency: 94.7
        },
        {
          id: '2',
          technicianName: 'Bianca Stone',
          technicianId: 'u2',
          taskName: 'Final Inspection',
          devicesCompleted: 3,
          deviceSerials: ['A340-006', 'A340-007', 'A340-008'],
          actualTime: 42,
          standardTime: 39,
          submittedAt: '2024-01-15T15:15:00Z',
          efficiency: 92.9
        },
        {
          id: '3',
          technicianName: 'Carlos Mendez',
          technicianId: 'u3',
          taskName: 'Unit Test',
          devicesCompleted: 4,
          deviceSerials: ['A340-009', 'A340-010', 'A340-011', 'A340-012'],
          actualTime: 85,
          standardTime: 80,
          submittedAt: '2024-01-15T16:00:00Z',
          notes: 'One device required additional calibration',
          efficiency: 94.1
        }
      ]
    }
    
    // Always load technician and job order data
    techs = [
      { id: 'u1', name: 'Alex Turner', efficiency: 94.7, productivity: 88.2, utilization: 92.1, tasksCompleted: 12, totalHours: 8.5, status: 'Active', currentTask: 'Quality Assemblage II', alerts: 0 },
      { id: 'u2', name: 'Bianca Stone', efficiency: 92.9, productivity: 85.7, utilization: 89.3, tasksCompleted: 10, totalHours: 8.2, status: 'Active', currentTask: 'Final Inspection', alerts: 1 },
      { id: 'u3', name: 'Carlos Mendez', efficiency: 94.1, productivity: 87.4, utilization: 91.8, tasksCompleted: 11, totalHours: 8.3, status: 'Active', currentTask: 'Unit Test', alerts: 0 },
      { id: 'u4', name: 'Diana Kim', efficiency: 89.2, productivity: 82.1, utilization: 85.6, tasksCompleted: 9, totalHours: 7.8, status: 'Idle', alerts: 2 },
      { id: 'u5', name: 'Ethan Cole', efficiency: 96.3, productivity: 91.2, utilization: 94.7, tasksCompleted: 13, totalHours: 8.7, status: 'Active', currentTask: 'Packing', alerts: 0 },
      { id: 'u6', name: 'Fiona Li', efficiency: 87.8, productivity: 79.4, utilization: 83.2, tasksCompleted: 8, totalHours: 7.5, status: 'On Break', alerts: 3 },
      { id: 'u7', name: 'George Hall', efficiency: 93.5, productivity: 86.8, utilization: 90.4, tasksCompleted: 11, totalHours: 8.1, status: 'Active', currentTask: 'Adjustment', alerts: 0 },
      { id: 'u8', name: 'Hina Patel', efficiency: 91.7, productivity: 84.3, utilization: 88.9, tasksCompleted: 10, totalHours: 8.0, status: 'Active', currentTask: 'Immersion Test', alerts: 1 },
      { id: 'u9', name: 'Ian Becker', efficiency: 88.4, productivity: 81.6, utilization: 86.1, tasksCompleted: 9, totalHours: 7.9, status: 'Idle', alerts: 2 },
      { id: 'u10', name: 'Jia Chen', efficiency: 95.1, productivity: 89.7, utilization: 93.2, tasksCompleted: 12, totalHours: 8.4, status: 'Active', currentTask: 'Quality Assemblage I', alerts: 0 },
      { id: 'u11', name: 'Kyle Reed', efficiency: 90.6, productivity: 83.5, utilization: 87.8, tasksCompleted: 10, totalHours: 8.0, status: 'Active', currentTask: 'Final Inspection', alerts: 1 },
      { id: 'u12', name: 'Laura Gomez', efficiency: 92.3, productivity: 85.9, utilization: 89.6, tasksCompleted: 11, totalHours: 8.2, status: 'Active', currentTask: 'Unit Test', alerts: 0 },
      { id: 'u13', name: 'Marco Rossi', efficiency: 89.8, productivity: 82.7, utilization: 86.4, tasksCompleted: 9, totalHours: 7.8, status: 'Idle', alerts: 2 },
      { id: 'u14', name: 'Nina Shah', efficiency: 94.6, productivity: 88.1, utilization: 91.9, tasksCompleted: 12, totalHours: 8.5, status: 'Active', currentTask: 'Packing', alerts: 0 }
    ]
    
    try {
      const jobOrdersData = await api.getJobOrders()
      orders = jobOrdersData.map(j => ({
        ...j,
        assignedTechnicians: [`Technician ${Math.floor(Math.random() * 14) + 1}`, `Technician ${Math.floor(Math.random() * 14) + 1}`],
        totalDevices: j.totalDevices || Math.floor(Math.random() * 50) + 10,
        completedDevices: j.completedDevices || Math.floor(Math.random() * 30) + 5,
        priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as 'High' | 'Medium' | 'Low'
      }))
    } catch (error) {
      console.error('Error loading job orders:', error)
    }
    
    // Load approval history
    try {
      const historyResponse = await fetch('/api/approval_history.php?limit=20', {
        credentials: 'include'
      })
      const historyResult = await historyResponse.json()
      
      if (historyResult.success && historyResult.data) {
        history = historyResult.data
      }
    } catch (error) {
      console.error('Error loading approval history:', error)
    }
    
    // Load task completion notifications
    try {
      notifications = await api.getSupervisorNotifications()
    } catch (error) {
      console.error('Error loading task completion notifications:', error)
    }
    
    // Set all state at once
    setPendingApprovals(approvals)
    setTechnicians(techs)
    setJobOrders(orders)
    setApprovalHistory(history)
    setTaskCompletionNotifications(notifications)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) return <LoadingSpinner />

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'idle':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'on break':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'Low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600 dark:text-green-400'
    if (efficiency >= 90) return 'text-blue-600 dark:text-blue-400'
    if (efficiency >= 85) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatusFilter = filterStatus === 'all' || tech.status.toLowerCase() === filterStatus
    const matchesEnhancedFilters = 
      (!filters.status || filters.status === '' || tech.status.toLowerCase() === filters.status.toLowerCase()) &&
      (!filters.efficiency || tech.efficiency >= (filters.efficiency || 0)) &&
      (!filters.productivity || tech.productivity >= (filters.productivity || 0))
    return matchesSearch && matchesStatusFilter && matchesEnhancedFilters
  })

  const applyFilters = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const resetFilters = () => {
    setFilters({})
    setFilterStatus('all')
    setSearchTerm('')
  }

  const handleApproval = (approvalId: string, approved: boolean) => {
    console.log('handleApproval called:', { approvalId, approved })
    setSelectedApprovalId(approvalId)
    setApprovalAction(approved ? 'approve' : 'reject')
    setApprovalComment('')
    setShowCommentModal(true)
    console.log('Modal should be open, showCommentModal:', true)
  }

  const confirmApproval = async () => {
    if (!selectedApprovalId) return
    
    // Validation for reject
    if (approvalAction === 'reject' && !approvalComment.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    try {
      console.log('Sending approval request:', {
        task_id: selectedApprovalId,
        action: approvalAction,
        comments: approvalComment.trim()
      })
      
      // Call API to approve/reject the task
      const response = await fetch('/api/approvals.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          task_id: selectedApprovalId,
          action: approvalAction,
          comments: approvalComment.trim()
        })
      })
      
      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)
      
      if (result.success) {
        const actionText = approvalAction === 'approve' ? 'approved' : 'rejected'
        
        // Remove the approval from the list
        setPendingApprovals(prev => prev.filter(approval => approval.id !== selectedApprovalId))
        
        toast.success(`Work log ${actionText} successfully!`)
        
        // Close modal
        setShowCommentModal(false)
        setSelectedApprovalId(null)
        setApprovalComment('')
        
        // Reload dashboard data to get fresh data from database
        setTimeout(() => {
          loadDashboardData()
        }, 500)
      } else {
        // Show debug info if available
        const errorMsg = result.debug ? 
          `${result.message}\nDebug: ${JSON.stringify(result.debug)}` : 
          result.message
        
        toast.error(errorMsg || `Failed to ${approvalAction} work log`)
        
        // Log full error for debugging
        console.error('Approval failed:', result)
      }
    } catch (error) {
      console.error('Approval error:', error)
      toast.error(`Failed to ${approvalAction} work log. Please check your connection.`)
    }
  }

  const bulkApprove = () => {
    setShowBulkApproveModal(true)
  }

  const handleTaskCompletionAction = () => {
    loadDashboardData() // Reload data after action
  }

  const openTaskCompletionModal = (notification: TaskCompletionNotification) => {
    setSelectedTaskCompletion(notification)
    setShowTaskCompletionModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent bg-clip-text text-transparent">
            Supervisor Dashboard
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage team performance and approve daily work entries</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={bulkApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Bulk Approve
          </button>
          <button 
            onClick={() => setShowAssignTaskModal(true)}
            className="px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Assign Tasks
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Pending Approvals</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{pendingApprovals.length}</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Awaiting review</div>
            </div>
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Active Technicians</div>
              <div className="text-3xl font-bold text-light-primary dark:text-dark-primary mt-2">
                {technicians.filter(t => t.status === 'Active').length}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Currently working</div>
            </div>
            <Users className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Team Efficiency</div>
              <div className="text-3xl font-bold text-light-accent dark:text-dark-accent mt-2">
                {Math.round(technicians.reduce((sum, t) => sum + t.efficiency, 0) / technicians.length)}%
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Average</div>
            </div>
            <TrendingUp className="w-8 h-8 text-light-accent dark:text-dark-accent" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Active Alerts</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {technicians.reduce((sum, t) => sum + t.alerts, 0)}
              </div>
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
            { id: 'approvals', label: 'Pending Approvals', icon: Clock },
            { id: 'taskcompletions', label: 'Task Completions', icon: MessageSquare },
            { id: 'technicians', label: 'Team Performance', icon: Users },
            { id: 'joborders', label: 'Job Orders', icon: FileText },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
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
          {/* Team Performance Summary */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Team Performance Summary
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {technicians.filter(t => t.efficiency >= 90).length}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200">High Performers</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {technicians.filter(t => t.efficiency >= 85 && t.efficiency < 90).length}
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">Good Performers</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {technicians.filter(t => t.efficiency >= 80 && t.efficiency < 85).length}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-200">Needs Improvement</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {technicians.filter(t => t.efficiency < 80).length}
                  </div>
                  <div className="text-sm text-red-800 dark:text-red-200">Underperforming</div>
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
                  { action: 'Work entry submitted', user: 'Alex Turner', time: '2 minutes ago', type: 'submission' },
                  { action: 'Task completed', user: 'Bianca Stone', time: '15 minutes ago', type: 'completion' },
                  { action: 'Alert resolved', user: 'Carlos Mendez', time: '30 minutes ago', type: 'alert' },
                  { action: 'Work entry approved', user: 'Diana Kim', time: '45 minutes ago', type: 'approval' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'submission' ? 'bg-blue-500' :
                      activity.type === 'completion' ? 'bg-green-500' :
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

      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingApprovals.map((approval) => (
            <div key={approval.id} className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-light-text dark:text-dark-text">{approval.technicianName}</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{approval.taskName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEfficiencyColor(approval.efficiency)}`}>
                      {approval.efficiency}% efficiency
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">Devices Completed</div>
                      <div className="font-semibold text-light-text dark:text-dark-text">{approval.devicesCompleted}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">Time Spent</div>
                      <div className="font-semibold text-light-text dark:text-dark-text">{approval.actualTime} min</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">Standard Time</div>
                      <div className="font-semibold text-light-text dark:text-dark-text">{approval.standardTime} min</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Device Serial Numbers:</div>
                    <div className="flex flex-wrap gap-2">
                      {approval.deviceSerials.map((serial, index) => (
                        <span key={index} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm">
                          {serial}
                        </span>
                      ))}
                    </div>
                  </div>

                  {approval.notes && (
                    <div className="mb-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Notes:</div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded">
                        {approval.notes}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Submitted: {new Date(approval.submittedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Approve button clicked for approval:', approval.id)
                      handleApproval(approval.id, true)
                    }}
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Reject button clicked for approval:', approval.id)
                      handleApproval(approval.id, false)
                    }}
                    type="button"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {pendingApprovals.length === 0 && (
            <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">All Caught Up!</h3>
              <p className="text-neutral-600 dark:text-neutral-400">No pending approvals at this time.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'taskcompletions' && (
        <div className="space-y-4">
          {/* Header with notification count */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                Task Completion Notifications
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {taskCompletionNotifications.filter(n => n.status === 'pending').length} pending notifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {taskCompletionNotifications.filter(n => n.status === 'pending').length} new
              </span>
            </div>
          </div>

          {/* Notifications List */}
          {taskCompletionNotifications.length === 0 ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">No Notifications</h3>
              <p className="text-neutral-600 dark:text-neutral-400">No task completion notifications at this time.</p>
            </div>
          ) : (
            taskCompletionNotifications.map((notification) => (
              <div key={notification.id} className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-3 h-3 rounded-full ${notification.status === 'pending' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <div>
                        <h4 className="font-semibold text-light-text dark:text-dark-text">
                          {notification.technicianName}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {notification.operationName} - Job Order {notification.jobOrderId}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Devices:</span>
                        <p className="font-medium text-light-text dark:text-dark-text">
                          {notification.devicesCompleted}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Time:</span>
                        <p className="font-medium text-light-text dark:text-dark-text">
                          {notification.actualTimeMinutes} min
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Efficiency:</span>
                        <p className={`font-medium ${
                          notification.efficiencyPercentage >= 100 ? 'text-green-600 dark:text-green-400' :
                          notification.efficiencyPercentage >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {notification.efficiencyPercentage}%
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Status:</span>
                        <p className={`font-medium ${
                          notification.status === 'pending' ? 'text-red-600 dark:text-red-400' :
                          notification.status === 'read' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                        </p>
                      </div>
                    </div>

                    {notification.notes && (
                      <div className="mb-4">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Notes:</span>
                        <p className="text-sm text-light-text dark:text-dark-text mt-1 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                          {notification.notes}
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Serial Numbers:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {notification.serialNumbers?.map((sn, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                            {sn}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openTaskCompletionModal(notification)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'technicians' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search technicians..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="on break">On Break</option>
                </select>
                <button 
                  onClick={() => setShowFilterModal(true)}
                  className="px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  {Object.keys(filters).length > 0 && (
                    <span className="bg-white text-gray-600 rounded-full px-2 py-0.5 text-xs">
                      {Object.keys(filters).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Technicians Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTechnicians.map((tech) => (
              <div key={tech.id} className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-light-text dark:text-dark-text">{tech.name}</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Technician #{tech.id}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tech.status)}`}>
                    {tech.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Efficiency</span>
                    <span className={`font-semibold ${getEfficiencyColor(tech.efficiency)}`}>
                      {tech.efficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        tech.efficiency >= 95 ? 'bg-green-500' :
                        tech.efficiency >= 90 ? 'bg-blue-500' :
                        tech.efficiency >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${tech.efficiency}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-light-primary dark:text-dark-primary">{tech.tasksCompleted}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-light-accent dark:text-dark-accent">{tech.totalHours}h</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Hours</div>
                  </div>
                </div>

                {tech.currentTask && (
                  <div className="mb-4">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Current Task:</div>
                    <div className="text-sm font-medium text-light-text dark:text-dark-text">{tech.currentTask}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition text-sm">
                    <Eye className="w-4 h-4 inline mr-1" />
                    View Details
                  </button>
                  {tech.alerts > 0 && (
                    <button className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'joborders' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-light-text dark:text-dark-text">Assigned Job Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Job Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Assigned Technicians</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {jobOrders.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-light-text dark:text-dark-text">{job.title}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{job.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(job.priority || 'Medium')}`}>
                        {job.priority || 'Medium'}
                      </span>
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
                      {job.assignedTechnicians?.join(', ') || 'Unassigned'}
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
                          <Users className="w-4 h-4" />
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
          {technicians.filter(t => t.alerts > 0).map((tech) => (
            <div key={tech.id} className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-light-text dark:text-dark-text mb-2">{tech.name}</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Efficiency below 85% for 3 consecutive days. Current efficiency: {tech.efficiency}%
                  </p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                      View Details
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {technicians.filter(t => t.alerts > 0).length === 0 && (
            <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">No Active Alerts</h3>
              <p className="text-neutral-600 dark:text-neutral-400">All technicians are performing within expected parameters.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BulkApproveModal 
        isOpen={showBulkApproveModal} 
        onClose={() => setShowBulkApproveModal(false)}
      />
      
      <AssignTaskModal 
        isOpen={showAssignTaskModal} 
        onClose={() => setShowAssignTaskModal(false)} 
      />
      
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={applyFilters}
        onReset={resetFilters}
        title="Filter Technicians"
        fields={[
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Idle', value: 'idle' },
              { label: 'On Break', value: 'on break' }
            ]
          },
          {
            name: 'efficiency',
            label: 'Minimum Efficiency (%)',
            type: 'text'
          },
          {
            name: 'productivity',
            label: 'Minimum Productivity (%)',
            type: 'text'
          }
        ]}
      />

      {/* Comment Modal for Approve/Reject */}
      {console.log('Modal render check - showCommentModal:', showCommentModal)}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowCommentModal(false)}
            />
            
            {/* Dialog */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 ${approvalAction === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
                      {approvalAction === 'approve' ? '✓' : '⚠️'}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {approvalAction === 'approve' ? 'Approve' : 'Reject'} Work Log
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {approvalAction === 'approve' ? 'Add a comment for approval (optional):' : 'Please provide a reason for rejection:'}
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {approvalAction === 'approve' ? 'Comment' : 'Reason for rejection'} {approvalAction === 'reject' && '*'}
                      </label>
                      <textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={approvalAction === 'approve' ? 'Add your comment here...' : 'Please provide a reason for rejection...'}
                        required={approvalAction === 'reject'}
                      />
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowCommentModal(false)
                          setApprovalComment('')
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmApproval}
                        disabled={approvalAction === 'reject' && !approvalComment.trim()}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          approvalAction === 'approve' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Notification Modal */}
      <TaskCompletionNotification
        isOpen={showTaskCompletionModal}
        onClose={() => {
          setShowTaskCompletionModal(false)
          setSelectedTaskCompletion(null)
        }}
        notification={selectedTaskCompletion}
        onAction={handleTaskCompletionAction}
      />
    </div>
  )
}

export default SupervisorDashboard