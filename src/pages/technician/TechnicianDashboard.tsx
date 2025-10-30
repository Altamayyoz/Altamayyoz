import React, { useEffect, useState } from 'react'
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Target,
  Activity,
  Save,
  Plus,
  X,
  Edit,
  Eye
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { toast } from 'react-hot-toast'

interface AssignedTask {
  task_id: string
  job_order_id: string
  operation_name: string
  standard_time: number
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string
}

interface DailyLog {
  id: string
  date: string
  task_name: string
  devices_completed: number
  serial_numbers: string[]
  actual_time: number
  standard_time: number
  efficiency: number
  notes: string
  approval_status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

interface PerformanceMetrics {
  efficiency: number
  productivity: number
  utilization: number
  tasks_completed: number
  total_hours: number
}

const TechnicianDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  
  // Log submission modal
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null)
  const [logData, setLogData] = useState({
    devices_completed: 0,
    serial_numbers: [] as string[],
    current_serial: '',
    actual_time: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    
    try {
      // Load assigned tasks
      await loadAssignedTasks()
      
      // Load daily logs
      await loadDailyLogs()
      
      // Load performance metrics
      await loadPerformanceMetrics()
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedTasks = async () => {
    try {
      const response = await fetch('/api/technician_tasks.php', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success && result.data && result.data.assigned_tasks) {
        const myTasks = result.data.assigned_tasks.map((task: any) => ({
          task_id: String(task.task_id),
          job_order_id: task.job_order_id || '',
          operation_name: task.operation_name || 'Task',
          standard_time: task.standard_time_minutes || 0,
          status: task.status || 'pending',
          due_date: task.due_date || new Date().toISOString().split('T')[0]
        }))
        setAssignedTasks(myTasks)
      }
    } catch (error) {
      console.error('Error loading assigned tasks:', error)
      // Use mock data
      setAssignedTasks([
        {
          task_id: '2',
          job_order_id: 'JO-001',
          operation_name: 'Quality Assemblage I',
          standard_time: 18,
          status: 'pending',
          due_date: new Date().toISOString().split('T')[0]
        },
        {
          task_id: '3',
          job_order_id: 'JO-002',
          operation_name: 'Final Touch - Cleaning&Packing',
          standard_time: 10,
          status: 'pending',
          due_date: new Date().toISOString().split('T')[0]
        }
      ])
    }
  }

  const loadDailyLogs = async () => {
    try {
      const response = await fetch('/api/technician_tasks.php', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success && result.data && result.data.daily_logs) {
        setDailyLogs(result.data.daily_logs.map((task: any) => ({
          id: String(task.task_id),
          date: task.date || new Date().toISOString().split('T')[0],
          task_name: task.operation_name || 'Task',
          devices_completed: task.devices_completed || 0,
          serial_numbers: task.serial_numbers || [],
          actual_time: task.actual_time_minutes || 0,
          standard_time: task.standard_time_minutes || 0,
          efficiency: parseFloat(task.efficiency_percentage) || 0,
          notes: task.notes || '',
          approval_status: task.status as 'pending' | 'approved' | 'rejected',
          submitted_at: task.created_at || new Date().toISOString()
        })))
      }
    } catch (error) {
      console.error('Error loading daily logs:', error)
      // Use mock data
      setDailyLogs([])
    }
  }

  const loadPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/metrics.php?technician=true', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success && result.data) {
        setMetrics(result.data)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
      // Use mock data
      setMetrics({
        efficiency: 92.5,
        productivity: 0.85,
        utilization: 88.3,
        tasks_completed: 45,
        total_hours: 180
      })
    }
  }

  const handleStartTask = (task: AssignedTask) => {
    setSelectedTask(task)
    setLogData({
      devices_completed: 0,
      serial_numbers: [],
      current_serial: '',
      actual_time: 0,
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowLogModal(true)
  }

  const handleMarkCompleted = (task: AssignedTask) => {
    setSelectedTask(task)
    setLogData({
      devices_completed: 0,
      serial_numbers: [],
      current_serial: '',
      actual_time: 0,
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowLogModal(true)
  }

  const addSerialNumber = () => {
    if (logData.current_serial.trim()) {
      setLogData({
        ...logData,
        serial_numbers: [...logData.serial_numbers, logData.current_serial.trim()],
        current_serial: '',
        devices_completed: logData.serial_numbers.length + 1
      })
    }
  }

  const removeSerialNumber = (index: number) => {
    const updated = logData.serial_numbers.filter((_, i) => i !== index)
    setLogData({
      ...logData,
      serial_numbers: updated,
      devices_completed: updated.length
    })
  }

  const handleSubmitLog = async () => {
    if (!selectedTask) return
    
    // Validation
    if (logData.devices_completed === 0) {
      toast.error('Please enter at least one device completed')
      return
    }
    
    if (logData.serial_numbers.length === 0) {
      toast.error('Please add device serial numbers')
      return
    }
    
    try {
      console.log('Submitting work log:', {
        operation_name: selectedTask.operation_name,
        devices_completed: logData.devices_completed,
        serial_numbers: logData.serial_numbers,
        actual_time: logData.actual_time
      })
      
      const response = await fetch('/api/technician_tasks.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          operation_name: selectedTask.operation_name,
          job_order_id: selectedTask.job_order_id,
          devices_completed: logData.devices_completed,
          serial_numbers: logData.serial_numbers,
          actual_time_minutes: logData.actual_time || selectedTask.standard_time,
          notes: logData.notes
        })
      })
      
      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)
      
      if (result.success) {
        toast.success('Work log submitted successfully! Awaiting supervisor approval.')
        setShowLogModal(false)
        setSelectedTask(null)
        loadDashboardData()
      } else {
        toast.error(result.message || 'Failed to submit work log')
      }
    } catch (error) {
      console.error('Error submitting log:', error)
      toast.error('Failed to submit work log. Please check your connection.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'rejected': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600 dark:text-green-400'
    if (efficiency >= 90) return 'text-blue-600 dark:text-blue-400'
    if (efficiency >= 85) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Production Dashboard
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Log your daily work and track your performance
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Efficiency</p>
              <p className={`text-2xl font-bold mt-1 ${metrics ? getEfficiencyColor(metrics.efficiency) : 'text-blue-600'}`}>
                {metrics ? `${metrics.efficiency.toFixed(1)}%` : '92.5%'}
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Productivity</p>
              <p className="text-2xl font-bold text-cyan-600 mt-1">
                {metrics ? metrics.productivity.toFixed(2) : '0.85'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-cyan-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Utilization</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {metrics ? `${metrics.utilization.toFixed(1)}%` : '88.3%'}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Tasks Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {metrics ? metrics.tasks_completed : 45}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-2 border-b-2 transition ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Assigned Tasks
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-2 border-b-2 transition ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              My Work Logs
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-2 border-b-2 transition ${
                activeTab === 'performance'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Assigned Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                My Assigned Tasks
              </h3>
              
              {assignedTasks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">No assigned tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedTasks.map((task) => (
                    <div key={task.task_id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                              {task.operation_name}
                            </h4>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {task.job_order_id}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">Standard Time</p>
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {task.standard_time} min
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">Due Date</p>
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">Status</p>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                {task.status === 'pending' ? 'Pending' : task.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => handleStartTask(task)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            Start Task
                          </button>
                          <button
                            onClick={() => handleMarkCompleted(task)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </button>
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleStartTask(task)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Work Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                My Work Logs
              </h3>
              
              {dailyLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">No work logs yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyLogs.map((log) => (
                    <div key={log.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {log.task_name}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {new Date(log.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(log.approval_status)}`}>
                          {log.approval_status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Devices</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {log.devices_completed}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Actual Time</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {log.actual_time} min
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Standard Time</p>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {log.standard_time} min
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Efficiency</p>
                          <p className={`text-sm font-medium ${getEfficiencyColor(log.efficiency)}`}>
                            {log.efficiency.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      {log.serial_numbers.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Serial Numbers:</p>
                          <div className="flex flex-wrap gap-2">
                            {log.serial_numbers.map((serial, idx) => (
                              <span key={idx} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm">
                                {serial}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {log.notes && (
                        <div className="mt-3">
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Notes:</p>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded">
                            {log.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                My Performance Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Efficiency</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {metrics ? `${metrics.efficiency.toFixed(1)}%` : '92.5%'}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    Actual time vs standard time
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 text-cyan-600" />
                    <span className="text-sm text-cyan-600 font-medium">Productivity</span>
                  </div>
                  <p className="text-3xl font-bold text-cyan-600">
                    {metrics ? metrics.productivity.toFixed(2) : '0.85'}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    Output per hour
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="w-8 h-8 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Utilization</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {metrics ? `${metrics.utilization.toFixed(1)}%` : '88.3%'}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    Time utilization rate
                  </p>
                </div>
              </div>
              
              <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Overall Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Tasks Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {metrics ? metrics.tasks_completed : 45}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Hours Worked</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {metrics ? metrics.total_hours : 180}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Submission Modal */}
      {showLogModal && selectedTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowLogModal(false)}
            />
            
            {/* Dialog */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Submit Work Log for Supervisor Approval
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Operation: {selectedTask.operation_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLogModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={logData.date}
                      onChange={(e) => setLogData({ ...logData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Job Order ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Order ID
                    </label>
                    <input
                      type="text"
                      value={selectedTask.job_order_id}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                  </div>

                  {/* Serial Numbers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Device Serial Numbers
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={logData.current_serial}
                        onChange={(e) => setLogData({ ...logData, current_serial: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && addSerialNumber()}
                        placeholder="Enter serial number"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={addSerialNumber}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {logData.serial_numbers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {logData.serial_numbers.map((serial, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
                          >
                            {serial}
                            <button
                              onClick={() => removeSerialNumber(idx)}
                              className="hover:text-blue-900 dark:hover:text-blue-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actual Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Actual Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={logData.actual_time || ''}
                      onChange={(e) => setLogData({ ...logData, actual_time: parseInt(e.target.value) || 0 })}
                      placeholder={`Standard: ${selectedTask.standard_time} min`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Delay reasons, issues, etc.)
                    </label>
                    <textarea
                      value={logData.notes}
                      onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
                      rows={3}
                      placeholder="Add any notes about delays or issues..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowLogModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitLog}
                    disabled={logData.devices_completed === 0 || logData.serial_numbers.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Submit for Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TechnicianDashboard

