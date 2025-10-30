import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  Calendar,
  Target,
  Activity,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  Bell,
  X,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Send
} from 'lucide-react'
import api from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import CreateJobOrderModal from '../../components/modals/CreateJobOrderModal'
import ImportTemplateModal from '../../components/modals/ImportTemplateModal'
import GenerateReportsModal from '../../components/modals/GenerateReportsModal'
import CustomReportModal from '../../components/modals/CustomReportModal'
import FilterModal from '../../components/modals/FilterModal'
import WarehouseContactModal from '../../components/modals/WarehouseContactModal'
import AddTemplateModal from '../../components/modals/AddTemplateModal'
import ViewTemplateModal from '../../components/modals/ViewTemplateModal'
import EditTemplateModal from '../../components/modals/EditTemplateModal'
import MetricDetailsModal from '../../components/modals/MetricDetailsModal'
import EditJobOrderModal from '../../components/modals/EditJobOrderModal'
import Modal from '../../components/common/Modal'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import { toast } from 'react-hot-toast'
import type { JobOrder } from '../../types'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PerformanceMetrics {
  averageEfficiency: number
  totalProductivity: number
  utilizationRate: number
  onTimeDelivery: number
  bottleneckTasks: string[]
  topPerformers: string[]
}

interface TaskTemplate {
  id: string
  name: string
  category: string
  standardTime: number
  description: string
}

const PlanningEngineerDashboard: React.FC = () => {
  const [orders, setOrders] = useState<JobOrder[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [metricsData, setMetricsData] = useState<any>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState(30)
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null)
  
  // Modal states
  const [showCreateJobOrderModal, setShowCreateJobOrderModal] = useState(false)
  const [showImportTemplateModal, setShowImportTemplateModal] = useState(false)
  const [showGenerateReportsModal, setShowGenerateReportsModal] = useState(false)
  const [showCustomReportModal, setShowCustomReportModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false)
  const [showViewTemplateModal, setShowViewTemplateModal] = useState(false)
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false)
  const [viewingTemplate, setViewingTemplate] = useState<TaskTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [showMetricDetailsModal, setShowMetricDetailsModal] = useState(false)
  const [metricDetailsType, setMetricDetailsType] = useState<'efficiency' | 'productivity'>('efficiency')
  
  // Job Order action modal states
  const [showViewJobOrderModal, setShowViewJobOrderModal] = useState(false)
  const [showEditJobOrderModal, setShowEditJobOrderModal] = useState(false)
  const [viewingJobOrder, setViewingJobOrder] = useState<JobOrder | null>(null)
  const [editingJobOrder, setEditingJobOrder] = useState<JobOrder | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingJobOrder, setDeletingJobOrder] = useState<JobOrder | null>(null)
  const [showDeleteTemplateConfirm, setShowDeleteTemplateConfirm] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<{ id: string; name: string } | null>(null)
  const [sendingBottleneckAlert, setSendingBottleneckAlert] = useState(false)
  const [showBottleneckSendConfirm, setShowBottleneckSendConfirm] = useState(false)
  
  // Filter and warehouse state
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [templateFilters, setTemplateFilters] = useState<Record<string, any>>({})
  const [templateSearchTerm, setTemplateSearchTerm] = useState('')
  const [warehouseNotifications, setWarehouseNotifications] = useState<Array<{
    id: string
    message: string
    timestamp: string
    read: boolean
  }>>([])
  
  // Alerts state
  const [alerts, setAlerts] = useState<Array<{
    id: string
    type: string
    message: string
    severity: string
    date: string
    createdAt: string
    read: boolean
    senderName: string
    senderRole: string
  }>>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadDashboardData()
    }
  }, [analyticsPeriod])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [jobOrdersData, operationsData, metricsData, alertsData] = await Promise.all([
        api.getJobOrders(),
        api.getOperations(),
        api.getPlanningMetrics(analyticsPeriod),
        api.getPlanningAlerts()
      ])
      
      // Transform job orders data with actual progress
      const transformedOrders = jobOrdersData.map(j => {
        const progress = j.total_devices > 0 && j.completed_devices 
          ? Math.round((j.completed_devices / j.total_devices) * 100) 
          : 0
        
        return {
          ...j,
          id: j.job_order_id || j.id,
          title: `Job Order ${j.job_order_id || j.id}`,
          assignedSupervisor: j.assignedSupervisor || 'Unassigned',
          totalDevices: j.total_devices || j.totalDevices || 0,
          completedDevices: j.completed_devices || j.completedDevices || 0,
          progress: progress,
          createdAt: j.created_date || j.createdAt || new Date().toISOString(),
          dueDate: j.due_date || j.dueDate,
          status: j.status || 'active',
          priority: (j.priority || ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 4)]) as 'Critical' | 'High' | 'Medium' | 'Low'
        }
      })

      // Use real metrics if available, otherwise use defaults
      const realMetrics: PerformanceMetrics = metricsData?.currentMetrics ? {
        averageEfficiency: metricsData.currentMetrics.averageEfficiency || 75,
        totalProductivity: metricsData.currentMetrics.totalProductivity || 85,
        utilizationRate: metricsData.currentMetrics.utilizationRate || 70,
        onTimeDelivery: metricsData.currentMetrics.onTimeDelivery || 80,
        bottleneckTasks: metricsData.bottleneckTasks || [],
        topPerformers: metricsData.topPerformers || []
      } : {
        averageEfficiency: 75,
        totalProductivity: 85,
        utilizationRate: 70,
        onTimeDelivery: 80,
        bottleneckTasks: [],
        topPerformers: []
      }

      // Transform operations to templates
      const transformedTemplates: TaskTemplate[] = operationsData.map((op: any) => ({
        id: String(op.operation_id || op.id),
        name: op.operation_name || op.name,
        category: op.category || 'Production',
        standardTime: op.standard_time_minutes || op.standard_time || 30,
        description: op.description || `${op.operation_name || op.name} operation`
      }))

      setOrders(transformedOrders)
      setMetrics(realMetrics)
      setTemplates(transformedTemplates)
      setMetricsData(metricsData)
      setAlerts(alertsData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading planning engineer dashboard:', error)
      toast.error('Failed to load dashboard data')
      setLoading(false)
    }
  }
  
  const handleMarkAlertRead = async (alertId: string) => {
    const success = await api.markAlertRead(alertId, true)
    if (success) {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ))
    }
  }
  
  const handleSendBottleneckAlert = () => {
    setShowBottleneckSendConfirm(true)
  }
  
  const confirmSendBottleneckAlert = async () => {
    if (!metrics?.bottleneckTasks || metrics.bottleneckTasks.length === 0) {
      toast.error('No bottleneck tasks to send')
      return
    }
    
    setSendingBottleneckAlert(true)
    try {
      // Format the bottleneck tasks for the alert message
      const tasksList = metrics.bottleneckTasks.join(', ')
      const alertMessage = `Bottleneck Tasks identified requiring attention and resource allocation: ${tasksList}`
      
      // Make API call using fetch with proper path
      const response = await fetch('/api/admin_alerts.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          alert_type: 'bottleneck_warning',
          message: alertMessage,
          severity: 'Warning',
          technician_id: null
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP error:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Alert API response:', result)
      
      if (result.success) {
        toast.success('Bottleneck alert sent to admin successfully!')
        setShowBottleneckSendConfirm(false)
        // Reload dashboard to refresh alerts if needed
        setTimeout(() => {
          loadDashboardData()
        }, 500)
      } else {
        console.error('Failed to send alert:', result.message)
        toast.error(result.message || 'Failed to send bottleneck alert')
      }
    } catch (error) {
      console.error('Error sending bottleneck alert:', error)
      if (error instanceof Error) {
        toast.error(`Failed: ${error.message}`)
      } else {
        toast.error('Failed to send bottleneck alert. Please check console for details.')
      }
    } finally {
      setSendingBottleneckAlert(false)
    }
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700'
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
    }
  }

  if (loading) return <LoadingSpinner />

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-200 dark:text-red-300 dark:bg-red-900/40 border border-red-400'
      case 'High': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'Low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'in_progress':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'on_hold':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'delayed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getEfficiencyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500 dark:bg-green-500'
    if (percentage >= 75) return 'bg-blue-500 dark:bg-blue-500'
    if (percentage >= 60) return 'bg-yellow-500 dark:bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500 dark:bg-orange-500'
    return 'bg-red-500 dark:bg-red-500'
  }

  const getProductivityColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500 dark:bg-green-500'
    if (percentage >= 75) return 'bg-blue-500 dark:bg-blue-500'
    if (percentage >= 60) return 'bg-yellow-500 dark:bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500 dark:bg-orange-500'
    return 'bg-red-500 dark:bg-red-500'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500 dark:bg-green-500'
    if (percentage >= 60) return 'bg-blue-500 dark:bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500 dark:bg-yellow-500'
    if (percentage >= 20) return 'bg-orange-500 dark:bg-orange-500'
    return 'bg-red-500 dark:bg-red-500'
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatusFilter = filterStatus === 'all' || order.status === filterStatus
    const matchesEnhancedFilters = 
      (!filters.status || filters.status === '' || order.status === filters.status) &&
      (!filters.priority || filters.priority === '' || order.priority === filters.priority) &&
      (!filters.productModel || filters.productModel === '' || order.productModel === filters.productModel)
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

  const resetTemplateFilters = () => {
    setTemplateFilters({})
    setTemplateSearchTerm('')
  }

  const applyTemplateFilters = (newFilters: Record<string, any>) => {
    setTemplateFilters(newFilters)
  }

  const handleWarehouseContact = (message: { problemType: string; details: string; urgency: string; itemName: string; quantityAffected: string }) => {
    // Simulate sending to warehouse and receiving a notification
    const notification = {
      id: Date.now().toString(),
      message: `Warehouse Response: We've received your request about "${message.itemName}". ${message.urgency === 'critical' ? 'Urgent action taken!' : 'We will process this soon.'}`,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    // Add notification after a delay (simulating warehouse response)
    setTimeout(() => {
      setWarehouseNotifications(prev => [notification, ...prev])
      toast.success('Warehouse has been notified and will respond soon!')
    }, 2000)
  }

  const markNotificationRead = (id: string) => {
    setWarehouseNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    )
  }

  const unreadCount = warehouseNotifications.filter(n => !n.read).length

  // Calculate trend indicators
  const calculateTrend = (data: any[]) => {
    if (!data || data.length < 2) return { change: 0, direction: 'neutral' }
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))
    const firstAvg = firstHalf.reduce((sum, item) => sum + (item.value || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, item) => sum + (item.value || 0), 0) / secondHalf.length
    const change = ((secondAvg - firstAvg) / firstAvg) * 100
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: change.toFixed(1)
    }
  }

  const efficiencyTrend = calculateTrend(metricsData?.efficiencyTrends || [])
  const productivityTrend = calculateTrend(metricsData?.productivityTrends || [])
  const utilizationTrend = calculateTrend(metricsData?.utilizationTrends || [])

  // Format chart data for Recharts
  const formatChartData = (trends: any[]) => {
    if (!trends || trends.length === 0) return []
    return trends.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      value: parseFloat(item.value) || 0,
      count: item.count || 0
    }))
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label, name, unit }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      const value = payload[0]?.value
      return (
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-xl p-4 backdrop-blur-sm animate-fadeIn">
          <p className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-sm">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0]?.color }} />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {name && <span className="text-gray-500 dark:text-gray-400 mr-1">{name}:</span>}
                {typeof value === 'number' ? value.toFixed(name === 'Productivity' ? 2 : 1) : value}{unit || ''}
              </span>
            </div>
            {data?.count && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {data.count} data point{data.count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(templateSearchTerm.toLowerCase())
    const matchesCategory = !templateFilters.category || templateFilters.category === '' || template.category === templateFilters.category
    const matchesTimeRange = !templateFilters.timeRange || templateFilters.timeRange === '' || 
      (templateFilters.timeRange === 'short' && template.standardTime <= 15) ||
      (templateFilters.timeRange === 'medium' && template.standardTime > 15 && template.standardTime <= 30) ||
      (templateFilters.timeRange === 'long' && template.standardTime > 30)
    return matchesSearch && matchesCategory && matchesTimeRange
  })

  const handleSaveTemplate = async (templateData: { name: string; category: string; standardTime: string; description: string }) => {
    try {
      await api.createOperation({
        operation_name: templateData.name,
        standard_time_minutes: parseInt(templateData.standardTime),
        description: templateData.description,
        category: templateData.category
      })
      toast.success(`Template "${templateData.name}" created successfully!`)
      loadDashboardData() // Reload to get updated templates
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast.error(error.message || 'Failed to create template')
    }
  }

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setShowEditTemplateModal(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setDeletingTemplate({ id: templateId, name: template.name })
      setShowDeleteTemplateConfirm(true)
    }
  }

  const handleConfirmDeleteTemplate = async () => {
    if (!deletingTemplate) return
    try {
      await api.deleteOperation(deletingTemplate.id)
      toast.success('Template deleted successfully!')
      loadDashboardData() // Reload to get updated templates
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error(error.message || 'Failed to delete template')
    } finally {
      setShowDeleteTemplateConfirm(false)
      setDeletingTemplate(null)
    }
  }

  const handleViewTemplate = (template: TaskTemplate) => {
    setViewingTemplate(template)
    setShowViewTemplateModal(true)
  }

  // Category color mapping function
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'Assembly': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Quality Inspection': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Testing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Packaging': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'Calibration': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Maintenance': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Documentation': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'Production': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400'
    }
    return categoryColors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  // Job Order action handlers
  const handleViewJobOrder = (order: JobOrder) => {
    setViewingJobOrder(order)
    setShowViewJobOrderModal(true)
  }

  const handleEditJobOrder = (order: JobOrder) => {
    setEditingJobOrder(order)
    setShowEditJobOrderModal(true)
  }

  const handleDeleteJobOrderClick = (order: JobOrder) => {
    setDeletingJobOrder(order)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDeleteJobOrder = async () => {
    if (!deletingJobOrder) return

    try {
      await api.deleteJobOrder(deletingJobOrder.id)
      toast.success('Job Order deleted successfully!')
      setShowDeleteConfirm(false)
      setDeletingJobOrder(null)
      loadDashboardData() // Reload to get updated job orders
    } catch (error: any) {
      console.error('Error deleting job order:', error)
      toast.error(error.message || 'Failed to delete job order')
      setShowDeleteConfirm(false)
      setDeletingJobOrder(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent bg-clip-text text-transparent">
            Planning Engineer Dashboard
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Create job orders, analyze performance, and optimize production</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowWarehouseModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 relative"
          >
            <Package className="w-4 h-4" />
            Contact Warehouse
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setShowCreateJobOrderModal(true)}
            className="px-4 py-2 bg-blue-600 dark:bg-light-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-light-primary/90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Job Order
          </button>
          <button 
            onClick={() => setShowImportTemplateModal(true)}
            className="px-4 py-2 bg-green-600 dark:bg-light-accent text-white rounded-lg hover:bg-green-700 dark:hover:bg-light-accent/90 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Template
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Active Job Orders</div>
              <div className="text-3xl font-bold text-light-primary dark:text-dark-primary mt-2">
                {orders.filter(o => o.status === 'in_progress').length}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">In production</div>
            </div>
            <Activity className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Average Efficiency</div>
              <div className="text-3xl font-bold text-light-accent dark:text-dark-accent mt-2">
                {metrics?.averageEfficiency}%
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Across all tasks</div>
            </div>
            <TrendingUp className="w-8 h-8 text-light-accent dark:text-dark-accent" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">On-Time Delivery</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {metrics?.onTimeDelivery}%
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">This month</div>
            </div>
            <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg p-6 shadow border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Utilization Rate</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {metrics?.utilizationRate}%
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Resource usage</div>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Warehouse Notifications */}
      {warehouseNotifications.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Warehouse Messages ({unreadCount} unread)
            </h3>
            <button
              onClick={() => setWarehouseNotifications([])}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {warehouseNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markNotificationRead(notification.id)}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  notification.read 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'bg-white dark:bg-blue-800 border border-blue-300 dark:border-blue-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className={`text-sm ${notification.read ? 'text-blue-700 dark:text-blue-300' : 'text-blue-900 dark:text-blue-100 font-medium'}`}>
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0 ml-2"></span>
                  )}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'joborders', label: 'Job Orders', icon: FileText },
            { id: 'templates', label: 'Task Templates', icon: Calendar },
            { id: 'alerts', label: 'Alerts & Communications', icon: Bell },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'reports', label: 'Reports', icon: Download }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 relative ${
                activeTab === id
                  ? 'border-light-primary text-light-primary dark:border-dark-primary dark:text-dark-primary scale-105'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-t-lg'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === id ? 'scale-110' : ''}`} />
              <span className="transition-all duration-300">{label}</span>
              {activeTab === id && (
                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-500 ease-in-out">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Performance Overview */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Overview
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Efficiency</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-light-primary dark:text-dark-primary">{metrics?.averageEfficiency}%</span>
                    <button 
                      onClick={() => {
                        setMetricDetailsType('efficiency')
                        setShowMetricDetailsModal(true)
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getEfficiencyColor(metrics?.averageEfficiency || 0)}`}
                    style={{ width: `${metrics?.averageEfficiency}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Productivity</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-light-accent dark:text-dark-accent">{metrics?.totalProductivity}%</span>
                    <button 
                      onClick={() => {
                        setMetricDetailsType('productivity')
                        setShowMetricDetailsModal(true)
                      }}
                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProductivityColor(metrics?.totalProductivity || 0)}`}
                    style={{ width: `${metrics?.totalProductivity}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Utilization</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{metrics?.utilizationRate}%</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metrics?.utilizationRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottlenecks & Top Performers */}
          <div className="space-y-6">
            {/* Bottlenecks */}
            <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Bottleneck Tasks
                  </h3>
                  {metrics?.bottleneckTasks && metrics.bottleneckTasks.length > 0 && (
                    <button
                      onClick={handleSendBottleneckAlert}
                      disabled={sendingBottleneckAlert}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {sendingBottleneckAlert ? 'Sending...' : 'Send to Admin'}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {metrics?.bottleneckTasks && metrics.bottleneckTasks.length > 0 ? (
                    metrics.bottleneckTasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">{task}</span>
                        <span className="text-xs text-orange-600 dark:text-orange-400">+15% avg delay</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No bottleneck tasks identified</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  Top Performers
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {metrics?.topPerformers && metrics.topPerformers.length > 0 ? (
                    metrics.topPerformers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                            {performer.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">{performer}</span>
                        </div>
                        <span className="text-xs text-green-600 dark:text-green-400">95%+ efficiency</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No top performers identified</p>
                      <p className="text-xs mt-1">Technicians with 90%+ efficiency</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'joborders' && (
          <div className="space-y-4 animate-fadeIn">
          {/* Search and Filter */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search job orders..."
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
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="delayed">Delayed</option>
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

          {/* Job Orders Table */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h3 className="font-semibold text-light-text dark:text-dark-text">Job Orders</h3>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {filteredOrders.length} of {orders.length} orders
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Job Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-light-text dark:text-dark-text">{order.title}</div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">{order.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority || 'Medium')}`}>
                          {order.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${getProgressColor(order.progress)}`}
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">{order.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {order.assignedSupervisor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewJobOrder(order)}
                            className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80 transition-all duration-200 hover:scale-110 active:scale-95"
                            title="View job order"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditJobOrder(order)}
                            className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-all duration-200 hover:scale-110 active:scale-95"
                            title="Edit job order"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteJobOrderClick(order)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-all duration-200 hover:scale-110 active:scale-95"
                            title="Delete job order"
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
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-light-text dark:text-dark-text">
              Task Templates
            </h3>
            <button
              onClick={() => setShowAddTemplateModal(true)}
              className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Template
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearchTerm}
                    onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilterModal(true)}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  {Object.keys(templateFilters).length > 0 && (
                    <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">
                      {Object.keys(templateFilters).length}
                    </span>
                  )}
                </button>
                {(Object.keys(templateFilters).length > 0 || templateSearchTerm) && (
                  <button
                    onClick={resetTemplateFilters}
                    className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Templates Table */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-light-text dark:text-dark-text">Templates</h3>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {filteredTemplates.length} of {templates.length} templates
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Task Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Standard Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-light-text dark:text-dark-text">{template.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {template.standardTime} min
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {template.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewTemplate(template)}
                          className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80 transition-all duration-200 hover:scale-110 active:scale-95"
                          title="View template"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditTemplate(template)}
                          className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        </div>
                      </td>
                    </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="text-neutral-500 dark:text-neutral-400">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No templates found</p>
                            <p className="text-sm">
                              {templateSearchTerm || Object.keys(templateFilters).length > 0 
                                ? 'Try adjusting your search or filters'
                                : 'Create your first template to get started'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-light-text dark:text-dark-text">
              Alerts & Communications
            </h3>
          </div>

          {/* Incoming Alerts from Supervisors */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alerts from Supervisors
                {alerts.filter(a => !a.read && a.senderRole === 'supervisor').length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {alerts.filter(a => !a.read && a.senderRole === 'supervisor').length}
                  </span>
                )}
              </h3>
            </div>
            <div className="p-6">
              {alerts.filter(a => a.senderRole === 'supervisor').length > 0 ? (
                <div className="space-y-3">
                  {alerts
                    .filter(a => a.senderRole === 'supervisor')
                    .map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => !alert.read && handleMarkAlertRead(alert.id)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          alert.read
                            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                            : getSeverityColor(alert.severity) + ' cursor-pointer hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-5 h-5 ${
                              alert.severity === 'critical' ? 'text-red-600' :
                              alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            {!alert.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-sm ${alert.read ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-900 dark:text-neutral-100 font-medium'}`}>
                          {alert.message}
                        </p>
                        {alert.senderName !== 'System' && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            From: {alert.senderName} (Supervisor)
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts from supervisors</p>
                </div>
              )}
            </div>
          </div>

          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Period Selector */}
            <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-light-primary dark:text-dark-primary" />
                  <h3 className="font-semibold text-light-text dark:text-dark-text">Analytics Dashboard</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Period:</span>
                  {[7, 14, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => {
                        setAnalyticsPeriod(days)
                        loadDashboardData()
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        analyticsPeriod === days
                          ? 'bg-light-primary dark:bg-dark-primary text-white shadow-lg scale-105'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                  <button
                    onClick={() => loadDashboardData()}
                    className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graph 1: Efficiency Trends */}
              <div 
                className="bg-gradient-to-br from-white to-yellow-50 dark:from-[#1e293b] dark:to-yellow-900/10 rounded-xl shadow-lg border-2 border-yellow-200 dark:border-yellow-800/50 p-6 hover:shadow-2xl transition-all duration-300"
                onMouseEnter={() => setHoveredMetric('efficiency')}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      Efficiency Trends
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {metricsData?.currentMetrics?.averageEfficiency?.toFixed(1) || '0.0'}% Average
                    </p>
                  </div>
                  <div className="text-right">
                    {efficiencyTrend.direction !== 'neutral' && (
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        efficiencyTrend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {efficiencyTrend.direction === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        {efficiencyTrend.percentage}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-72">
                  {metricsData?.efficiencyTrends && metricsData.efficiencyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formatChartData(metricsData.efficiencyTrends)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#9ca3af"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#9ca3af"
                          label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                        />
                        <Tooltip content={<CustomTooltip name="Efficiency" unit="%" />} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#eab308" 
                          strokeWidth={3}
                          fill="url(#efficiencyGradient)"
                          dot={{ fill: '#eab308', r: 4 }}
                          activeDot={{ r: 6, fill: '#fbbf24' }}
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No efficiency data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Graph 2: Productivity Trends */}
              <div 
                className="bg-gradient-to-br from-white to-red-50 dark:from-[#1e293b] dark:to-red-900/10 rounded-xl shadow-lg border-2 border-red-200 dark:border-red-800/50 p-6 hover:shadow-2xl transition-all duration-300"
                onMouseEnter={() => setHoveredMetric('productivity')}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
                      Productivity Trends
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {metricsData?.currentMetrics?.totalProductivity?.toFixed(2) || '0.00'} units/hr Average
                    </p>
                  </div>
                  <div className="text-right">
                    {productivityTrend.direction !== 'neutral' && (
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        productivityTrend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {productivityTrend.direction === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        {productivityTrend.percentage}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-72">
                  {metricsData?.productivityTrends && metricsData.productivityTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(metricsData.productivityTrends)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#9ca3af"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#9ca3af"
                          label={{ value: 'Productivity', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                        />
                        <Tooltip content={<CustomTooltip name="Productivity" unit=" units/hr" />} />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          dot={{ fill: '#ef4444', r: 4 }}
                          activeDot={{ r: 6, fill: '#f87171' }}
                          animationDuration={1000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No productivity data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Graph 3: Utilization Rate Trends */}
              <div 
                className="bg-gradient-to-br from-white to-blue-50 dark:from-[#1e293b] dark:to-blue-900/10 rounded-xl shadow-lg border-2 border-blue-200 dark:border-blue-800/50 p-6 hover:shadow-2xl transition-all duration-300"
                onMouseEnter={() => setHoveredMetric('utilization')}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Utilization Rate Trends
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {metricsData?.currentMetrics?.utilizationRate?.toFixed(1) || '0.0'}% Average
                    </p>
                  </div>
                  <div className="text-right">
                    {utilizationTrend.direction !== 'neutral' && (
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        utilizationTrend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {utilizationTrend.direction === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        {utilizationTrend.percentage}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-72">
                  {metricsData?.utilizationTrends && metricsData.utilizationTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formatChartData(metricsData.utilizationTrends)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#9ca3af"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#9ca3af"
                          label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                        />
                        <Tooltip content={<CustomTooltip name="Utilization" unit="%" />} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fill="url(#utilizationGradient)"
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6, fill: '#60a5fa' }}
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No utilization data available</p>
                        <p className="text-xs mt-1">Current: {metrics?.utilizationRate || 0}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Graph 4: Task Performance Overview */}
              <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border-2 border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-2xl transition-all duration-300">
                <h3 className="font-bold text-lg text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Task Performance Overview
                </h3>
                <div className="h-72 space-y-6">
                  {metricsData?.bottleneckTasks && metricsData.bottleneckTasks.length > 0 ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Bottleneck Tasks</h4>
                          <span className="text-xs text-red-600 dark:text-red-400">{metricsData.bottleneckTasks.length} tasks</span>
                        </div>
                        <div className="space-y-3">
                          {metricsData.bottleneckTasks.slice(0, 5).map((task: string, index: number) => {
                            const percentage = 100 - (index * 15)
                            return (
                              <div key={index} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate flex-1">{task}</span>
                                  <span className="text-xs text-red-600 dark:text-red-400 font-semibold ml-2">{percentage}%</span>
                                </div>
                                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 group-hover:from-red-400 group-hover:to-red-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">On-Time Delivery</h4>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">{metrics?.onTimeDelivery || 0}%</span>
                        </div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 via-green-400 to-green-500 transition-all duration-700 animate-pulse"
                            style={{ width: `${metrics?.onTimeDelivery || 0}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white drop-shadow-lg">
                              {metrics?.onTimeDelivery >= 80 ? 'Excellent' : metrics?.onTimeDelivery >= 60 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No task performance data available</p>
                        <div className="mt-4 space-y-2">
                          <div className="text-xs">
                            <span className="font-semibold">On-Time Delivery:</span> {metrics?.onTimeDelivery || 0}%
                          </div>
                          {metrics?.bottleneckTasks && metrics.bottleneckTasks.length > 0 && (
                            <div className="text-xs">
                              <span className="font-semibold">Bottlenecks:</span> {metrics.bottleneckTasks.length} tasks
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Performers Section */}
            {metricsData?.topPerformers && metricsData.topPerformers.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg border-2 border-green-200 dark:border-green-800/50 p-6">
                <h3 className="font-bold text-lg text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Top Performers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {metricsData.topPerformers.slice(0, 6).map((performer: string, index: number) => (
                    <div key={index} className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-green-200 dark:border-green-800/50 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{performer}</p>
                          <p className="text-xs text-green-600 dark:text-green-400">Top Performer</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Performance Report</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Comprehensive performance analysis across all technicians and job orders.
            </p>
            <button 
              onClick={() => setShowGenerateReportsModal(true)}
              className="w-full px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Efficiency Report</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Detailed efficiency metrics and bottleneck analysis.
            </p>
            <button 
              onClick={() => setShowGenerateReportsModal(true)}
              className="w-full px-4 py-2 bg-light-accent text-white rounded-lg hover:bg-light-accent/90 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Custom Report</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Create custom reports with specific date ranges and filters.
            </p>
            <button 
              onClick={() => setShowCustomReportModal(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Create Custom
            </button>
          </div>
      </div>
      )}
      </div>

      {/* Modals */}
      <CreateJobOrderModal 
        isOpen={showCreateJobOrderModal} 
        onClose={() => setShowCreateJobOrderModal(false)}
        onJobOrderCreated={() => {
          loadDashboardData()
          setShowCreateJobOrderModal(false)
        }}
      />
      
      <ImportTemplateModal 
        isOpen={showImportTemplateModal} 
        onClose={() => setShowImportTemplateModal(false)} 
      />
      
      <GenerateReportsModal 
        isOpen={showGenerateReportsModal} 
        onClose={() => setShowGenerateReportsModal(false)} 
      />
      
      <CustomReportModal 
        isOpen={showCustomReportModal} 
        onClose={() => setShowCustomReportModal(false)} 
      />
      
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={activeTab === 'templates' ? applyTemplateFilters : applyFilters}
        onReset={activeTab === 'templates' ? resetTemplateFilters : resetFilters}
        title={activeTab === 'templates' ? "Filter Templates" : "Filter Job Orders"}
        fields={activeTab === 'templates' ? [
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: [
              { value: '', label: 'All Categories' },
              { value: 'Assembly', label: 'Assembly' },
              { value: 'Quality Inspection', label: 'Quality Inspection' },
              { value: 'Testing', label: 'Testing' },
              { value: 'Packaging', label: 'Packaging' },
              { value: 'Calibration', label: 'Calibration' },
              { value: 'Maintenance', label: 'Maintenance' },
              { value: 'Documentation', label: 'Documentation' },
              { value: 'Other', label: 'Other' },
              { value: 'Production', label: 'Production' }
            ]
          },
          {
            name: 'timeRange',
            label: 'Time Range',
            type: 'select',
            options: [
              { value: '', label: 'All Times' },
              { value: 'short', label: 'Short (≤ 15 min)' },
              { value: 'medium', label: 'Medium (16-30 min)' },
              { value: 'long', label: 'Long (> 30 min)' }
            ]
          }
        ] : [
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
              { label: 'On Hold', value: 'on_hold' },
              { label: 'Delayed', value: 'delayed' }
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
            name: 'productModel',
            label: 'Product Model',
            type: 'select',
            options: [
              { label: 'A100', value: 'A100' },
              { label: 'A300', value: 'A300' },
              { label: 'A340', value: 'A340' },
              { label: 'SKGB', value: 'SKGB' }
            ]
          }
        ]}
      />
      
      <WarehouseContactModal
        isOpen={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        onSend={handleWarehouseContact}
      />
      
      <AddTemplateModal
        isOpen={showAddTemplateModal}
        onClose={() => setShowAddTemplateModal(false)}
        onSave={handleSaveTemplate}
      />

      {/* View Template Modal */}
      {viewingTemplate && (
        <ViewTemplateModal
          isOpen={showViewTemplateModal}
          onClose={() => {
            setShowViewTemplateModal(false)
            setViewingTemplate(null)
          }}
          template={viewingTemplate}
          getCategoryColor={getCategoryColor}
        />
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <EditTemplateModal
          isOpen={showEditTemplateModal}
          onClose={() => {
            setShowEditTemplateModal(false)
            setEditingTemplate(null)
          }}
          template={editingTemplate}
          onTemplateUpdated={() => {
            loadDashboardData()
          }}
          getCategoryColor={getCategoryColor}
        />
      )}

      <MetricDetailsModal
        isOpen={showMetricDetailsModal}
        onClose={() => setShowMetricDetailsModal(false)}
        metricType={metricDetailsType}
        currentValue={metricDetailsType === 'efficiency' 
          ? (metrics?.averageEfficiency || 0)
          : (metrics?.totalProductivity || 0)
        }
      />

      {/* View Job Order Modal */}
      {viewingJobOrder && (
        <Modal 
          isOpen={showViewJobOrderModal} 
          onClose={() => {
            setShowViewJobOrderModal(false)
            setViewingJobOrder(null)
          }} 
          title={`Job Order Details: ${viewingJobOrder.id}`}
          size="lg"
        >
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <p className="mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(viewingJobOrder.priority || 'Medium')}`}>
                  {viewingJobOrder.priority || 'Medium'}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Supervisor</label>
              <p className="mt-1 text-gray-900 dark:text-white">{viewingJobOrder.assignedSupervisor || 'Unassigned'}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Job Order Modal */}
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

      {/* Delete Job Order Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeletingJobOrder(null)
        }}
        onConfirm={handleConfirmDeleteJobOrder}
        title="Delete Job Order"
        message={`Are you sure you want to delete job order "${deletingJobOrder?.id}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="bg-red-600 hover:bg-red-700 text-white"
      />

      {/* Delete Template Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteTemplateConfirm}
        onClose={() => {
          setShowDeleteTemplateConfirm(false)
          setDeletingTemplate(null)
        }}
        onConfirm={handleConfirmDeleteTemplate}
        title="Delete Template"
        message={`Are you sure you want to delete the template "${deletingTemplate?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Send Bottleneck Alert Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showBottleneckSendConfirm}
        onClose={() => setShowBottleneckSendConfirm(false)}
        onConfirm={confirmSendBottleneckAlert}
        title="Send Bottleneck Alert to Admin"
        message={`Are you sure you want to send an alert about ${metrics?.bottleneckTasks?.length || 0} bottleneck task(s) to the admin?`}
        confirmText="Send Alert"
        cancelText="Cancel"
        type="warning"
      />

    </div>
  )
}

export default PlanningEngineerDashboard
