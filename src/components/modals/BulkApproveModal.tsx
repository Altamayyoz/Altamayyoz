import React, { useState } from 'react'
import { CheckCircle, User, Clock, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface WorkLog {
  id: string
  technicianName: string
  jobOrderNumber: string
  taskDescription: string
  hoursWorked: number
  date: string
  status: 'pending' | 'approved' | 'rejected'
}

interface BulkApproveModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItems?: WorkLog[]
}

const BulkApproveModal: React.FC<BulkApproveModalProps> = ({ isOpen, onClose, selectedItems = [] }) => {
  const [formData, setFormData] = useState({
    comment: '',
    notifyTechnicians: true
  })
  const [isLoading, setIsLoading] = useState(false)

  // Mock selected work logs if none provided
  const mockSelectedItems: WorkLog[] = selectedItems.length > 0 ? selectedItems : [
    {
      id: '1',
      technicianName: 'John Smith',
      jobOrderNumber: 'JO-001234',
      taskDescription: 'Assembly of A300 components',
      hoursWorked: 8,
      date: '2024-01-15',
      status: 'pending'
    },
    {
      id: '2',
      technicianName: 'Sarah Johnson',
      jobOrderNumber: 'JO-001235',
      taskDescription: 'Quality inspection of A340 batch',
      hoursWorked: 6,
      date: '2024-01-15',
      status: 'pending'
    },
    {
      id: '3',
      technicianName: 'Mike Wilson',
      jobOrderNumber: 'JO-001236',
      taskDescription: 'Testing of SKGB devices',
      hoursWorked: 7,
      date: '2024-01-15',
      status: 'pending'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success(`${mockSelectedItems.length} work logs approved successfully!`)
      onClose()
      setFormData({
        comment: '',
        notifyTechnicians: true
      })
    }, 2000)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Approve Work Logs" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selected Items Summary */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                {mockSelectedItems.length} Work Logs Selected for Approval
              </h4>
              <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                All selected work logs will be approved with the same comment
              </p>
            </div>
          </div>
        </div>

        {/* Selected Work Logs Table */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Selected Work Logs
          </label>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Job Order
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {mockSelectedItems.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {log.technicianName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white font-mono">
                        {log.jobOrderNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {log.taskDescription}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {log.hoursWorked}h
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {log.date}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Approval Comment (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={3}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a comment that will be applied to all approved work logs..."
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This comment will be added to all {mockSelectedItems.length} work logs
          </p>
        </div>

        {/* Notification Options */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notifyTechnicians}
              onChange={(e) => handleInputChange('notifyTechnicians', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Notify technicians via email about the approval
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Approve All ({mockSelectedItems.length})
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default BulkApproveModal
