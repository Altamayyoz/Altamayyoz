import React, { useState, useEffect } from 'react'
import { Plus, Clock, CheckCircle, AlertCircle, Wrench } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import type { ProductionWorkLog, JobOrder } from '../../types'

const ProductionWorkerDashboard: React.FC = () => {
  const [workLogs, setWorkLogs] = useState<ProductionWorkLog[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showWorkLogForm, setShowWorkLogForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [logs, orders] = await Promise.all([
        api.getProductionWorkLogs({ last: 10 }),
        api.getJobOrders()
      ])
      setWorkLogs(logs)
      setJobOrders(orders)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitWorkLog = async (workLog: Omit<ProductionWorkLog, 'id' | 'createdAt'>) => {
    try {
      await api.submitProductionWorkLog(workLog)
      toast.success('Work log submitted successfully!')
      setShowWorkLogForm(false)
      loadData()
    } catch (error) {
      toast.error('Failed to submit work log')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const todayLogs = workLogs.filter(log => 
    new Date(log.createdAt).toDateString() === new Date().toDateString()
  )

  const pendingApprovals = workLogs.filter(log => log.status === 'submitted').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔧 Technician Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your production work and track progress
          </p>
        </div>
        <button
          onClick={() => setShowWorkLogForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Production Work
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Work</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {workLogs.filter(log => log.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {jobOrders.filter(order => order.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Work Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Work Logs</h2>
        </div>
        <div className="p-6">
          {workLogs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No work logs yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Start by logging your first production work
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{log.taskName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.stage.replace('_', ' ')} • {log.serialNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      log.status === 'submitted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {log.status}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Work Log Form Modal */}
      {showWorkLogForm && (
        <WorkLogForm
          jobOrders={jobOrders}
          onSubmit={handleSubmitWorkLog}
          onClose={() => setShowWorkLogForm(false)}
        />
      )}
    </div>
  )
}

// Work Log Form Component
interface WorkLogFormProps {
  jobOrders: JobOrder[]
  onSubmit: (workLog: Omit<ProductionWorkLog, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const WorkLogForm: React.FC<WorkLogFormProps> = ({ jobOrders, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    jobOrderId: '',
    stage: 'sub_assembly' as const,
    taskName: '',
    deviceId: '',
    serialNumber: '',
    standardTime: 180,
    actualTime: 0,
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      workerId: 'u1', // This would come from auth context
      startTime: new Date().toISOString(),
      status: 'draft'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Log Production Work
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Order
            </label>
            <select
              value={formData.jobOrderId}
              onChange={(e) => setFormData({ ...formData, jobOrderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Job Order</option>
              {jobOrders.map(order => (
                <option key={order.id} value={order.id}>{order.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stage
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="sub_assembly">Sub-Assembly</option>
              <option value="installation">Installation</option>
              <option value="final_touch">Final Touch</option>
              <option value="packing">Packing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name
            </label>
            <input
              type="text"
              value={formData.taskName}
              onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Focus Assembly"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., SN-12345"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Actual Time (minutes)
            </label>
            <input
              type="number"
              value={formData.actualTime}
              onChange={(e) => setFormData({ ...formData, actualTime: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="180"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Work Log
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductionWorkerDashboard
