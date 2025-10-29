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
  X
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
import { toast } from 'react-hot-toast'
import type { JobOrder } from '../../types'

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
  
  // Modal states
  const [showCreateJobOrderModal, setShowCreateJobOrderModal] = useState(false)
  const [showImportTemplateModal, setShowImportTemplateModal] = useState(false)
  const [showGenerateReportsModal, setShowGenerateReportsModal] = useState(false)
  const [showCustomReportModal, setShowCustomReportModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false)
  
  // Filter and warehouse state
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [warehouseNotifications, setWarehouseNotifications] = useState<Array<{
    id: string
    message: string
    timestamp: string
    read: boolean
  }>>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const jobOrdersData = await api.getJobOrders()
        
        // Transform job orders data
        const transformedOrders = jobOrdersData.map(j => ({
          ...j,
          assignedSupervisor: j.assignedSupervisor || 'Unassigned',
          totalDevices: j.totalDevices || Math.floor(Math.random() * 50) + 10,
          completedDevices: j.completedDevices || Math.floor(Math.random() * 30) + 5,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)] as 'High' | 'Medium' | 'Low'
        }))

        // Mock performance metrics
        const mockMetrics: PerformanceMetrics = {
          averageEfficiency: Math.floor(Math.random() * 20) + 75,
          totalProductivity: Math.floor(Math.random() * 15) + 85,
          utilizationRate: Math.floor(Math.random() * 25) + 70,
          onTimeDelivery: Math.floor(Math.random() * 20) + 80,
          bottleneckTasks: ['Quality Assemblage I', 'Final Inspection', 'Unit Test'],
          topPerformers: ['Alex Turner', 'Bianca Stone', 'Carlos Mendez']
        }

        // Mock task templates
        const mockTemplates: TaskTemplate[] = [
          { id: '1', name: 'Quality Assemblage I', category: 'Production', standardTime: 18, description: 'Initial assembly process' },
          { id: '2', name: 'Quality Assemblage II', category: 'Production', standardTime: 10, description: 'Secondary assembly process' },
          { id: '3', name: 'Final Inspection', category: 'Quality', standardTime: 13, description: 'Final quality check' },
          { id: '4', name: 'Packing', category: 'Production', standardTime: 10, description: 'Product packaging' },
          { id: '5', name: 'Adjustment', category: 'Testing', standardTime: 37, description: 'Device calibration' },
          { id: '6', name: 'Unit Test', category: 'Testing', standardTime: 20, description: 'Individual unit testing' },
          { id: '7', name: 'Immersion', category: 'Testing', standardTime: 3, description: 'Immersion testing' }
        ]

        setOrders(transformedOrders)
        setMetrics(mockMetrics)
        setTemplates(mockTemplates)
        setLoading(false)
      } catch (error) {
        // Error loading planning engineer dashboard
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) return <LoadingSpinner />

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const handleSaveTemplate = (templateData: { name: string; category: string; standardTime: string; description: string }) => {
    const newTemplate: TaskTemplate = {
      id: `template-${Date.now()}`,
      name: templateData.name,
      category: templateData.category,
      standardTime: parseInt(templateData.standardTime),
      description: templateData.description
    }
    setTemplates(prev => [...prev, newTemplate])
    toast.success(`Template "${templateData.name}" created successfully!`)
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
            className="px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Job Order
          </button>
          <button 
            onClick={() => setShowImportTemplateModal(true)}
            className="px-4 py-2 bg-light-accent text-white rounded-lg hover:bg-light-accent/90 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Template
          </button>
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

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'joborders', label: 'Job Orders', icon: FileText },
            { id: 'templates', label: 'Task Templates', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'reports', label: 'Reports', icon: Download }
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
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Efficiency</span>
                  <span className="font-semibold text-light-primary dark:text-dark-primary">{metrics?.averageEfficiency}%</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-light-primary to-light-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metrics?.averageEfficiency}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Productivity</span>
                  <span className="font-semibold text-light-accent dark:text-dark-accent">{metrics?.totalProductivity}%</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-light-accent to-green-500 h-2 rounded-full transition-all duration-500"
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
                <h3 className="font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Bottleneck Tasks
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {metrics?.bottleneckTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">{task}</span>
                      <span className="text-xs text-orange-600 dark:text-orange-400">+15% avg delay</span>
                    </div>
                  ))}
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
                  {metrics?.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">{performer}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">95%+ efficiency</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'joborders' && (
        <div className="space-y-4">
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
                              className="h-full bg-gradient-to-r from-light-primary to-light-accent transition-all duration-500"
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
                          <button className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
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
        <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h3 className="font-semibold text-light-text dark:text-dark-text">Task Templates</h3>
            <button 
              onClick={() => setShowAddTemplateModal(true)}
              className="px-4 py-2 bg-light-primary text-white rounded-lg hover:bg-light-primary/90 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Template
            </button>
                  </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Task Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Standard Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-light-text dark:text-dark-text">{template.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
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
                        <button className="text-light-primary hover:text-light-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
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

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Efficiency Trends</h3>
            <div className="h-64 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Efficiency trend chart would be displayed here</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">Productivity Analysis</h3>
            <div className="h-64 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p>Productivity analysis chart would be displayed here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Modals */}
      <CreateJobOrderModal 
        isOpen={showCreateJobOrderModal} 
        onClose={() => setShowCreateJobOrderModal(false)} 
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
        onApply={applyFilters}
        onReset={resetFilters}
        title="Filter Job Orders"
        fields={[
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
    </div>
  )
}

export default PlanningEngineerDashboard
