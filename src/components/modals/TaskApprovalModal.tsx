import React, { useState } from 'react'
import { X, CheckCircle, XCircle, Clock, User, Hash, FileText, Calendar, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

interface TaskApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  task: any
  onApproval: () => void
}

const TaskApprovalModal: React.FC<TaskApprovalModalProps> = ({
  isOpen,
  onClose,
  task,
  onApproval
}) => {
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  if (!isOpen || !task) return null

  const handleApprove = async () => {
    setLoading(true)
    try {
      const success = await api.approveTask(task.task_id.toString(), comments)
      if (success) {
        toast.success('Task approved successfully!')
        onApproval()
        onClose()
      } else {
        toast.error('Failed to approve task')
      }
    } catch (error) {
      console.error('Error approving task:', error)
      toast.error('Failed to approve task')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      const success = await api.rejectTask(task.task_id.toString(), comments)
      if (success) {
        toast.success('Task rejected successfully!')
        onApproval()
        onClose()
      } else {
        toast.error('Failed to reject task')
      }
    } catch (error) {
      console.error('Error rejecting task:', error)
      toast.error('Failed to reject task')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600'
    if (efficiency >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Task Completion Review</h3>
                  <p className="text-blue-100 text-sm">Job Order: {task.job_order_id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Task Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Technician Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {task.technician_name}</div>
                    <div><span className="font-medium">Username:</span> {task.technician_username}</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time & Efficiency
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Actual Time:</span> {task.actual_time_minutes} minutes</div>
                    <div><span className="font-medium">Standard Time:</span> {task.standard_time_minutes} minutes</div>
                    <div>
                      <span className="font-medium">Efficiency:</span> 
                      <span className={`ml-2 font-bold ${getEfficiencyColor(task.efficiency_percentage)}`}>
                        {task.efficiency_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Production Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Operation:</span> {task.operation_name}</div>
                    <div><span className="font-medium">Devices Completed:</span> {task.devices_completed}</div>
                    <div><span className="font-medium">Total Devices:</span> {task.total_devices}</div>
                    <div><span className="font-medium">Due Date:</span> {formatDate(task.due_date)}</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Serial Numbers & Notes */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Serial Numbers
                  </h4>
                  <div className="space-y-1">
                    {task.serial_numbers && task.serial_numbers.length > 0 ? (
                      task.serial_numbers.map((serial: string, index: number) => (
                        <div key={index} className="bg-white dark:bg-gray-600 px-3 py-2 rounded border text-sm">
                          {serial}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">No serial numbers provided</div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {task.notes || 'No notes provided'}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Submission Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Submitted:</span> {formatDate(task.created_at)}</div>
                    <div><span className="font-medium">Date:</span> {formatDate(task.date)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add any comments about this task completion..."
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowRejectDialog(false)} />
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Reject Task Completion
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to reject this task completion? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowRejectDialog(false)}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskApprovalModal
