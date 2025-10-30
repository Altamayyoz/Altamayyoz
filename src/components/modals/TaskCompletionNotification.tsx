import React, { useState } from 'react'
import { X, CheckCircle, XCircle, Clock, User, Hash, FileText, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

interface TaskCompletionNotificationProps {
  isOpen: boolean
  onClose: () => void
  notification: any
  onAction: () => void
}

const TaskCompletionNotification: React.FC<TaskCompletionNotificationProps> = ({
  isOpen,
  onClose,
  notification,
  onAction
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAction = async (actionType: 'approve' | 'reject') => {
    setAction(actionType)
    setLoading(true)
    
    try {
      const success = await api.updateSupervisorNotification(
        notification.id,
        actionType,
        comments
      )
      
      if (success) {
        toast.success(`Task ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`)
        onAction()
        onClose()
      } else {
        toast.error(`Failed to ${actionType} task`)
      }
    } catch (error) {
      console.error(`Error ${actionType}ing task:`, error)
      toast.error(`Failed to ${actionType} task`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !notification) return null

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600 dark:text-green-400'
    if (efficiency >= 80) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
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
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Task Completion Review</h3>
                  <p className="text-blue-100 text-sm">Job Order: {notification.jobOrderId}</p>
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
            {/* Technician Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {notification.technicianName}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  submitted {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
            </div>

            {/* Task Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Operation
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {notification.operationName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time Details
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Actual Time:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {notification.actualTimeMinutes} min
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                      <span className={`font-medium ${getEfficiencyColor(notification.efficiencyPercentage)}`}>
                        {notification.efficiencyPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Devices Completed
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {notification.devicesCompleted} device(s)
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Serial Numbers
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {notification.serialNumbers?.map((sn: string, index: number) => (
                      <div key={index} className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
                        {sn}
                      </div>
                    ))}
                  </div>
                </div>

                {notification.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Notes
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white text-sm">
                      {notification.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
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

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && action === 'reject' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </>
                )}
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && action === 'approve' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Approving...
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
    </div>
  )
}

export default TaskCompletionNotification
