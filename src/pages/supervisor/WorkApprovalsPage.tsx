import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import type { ProductionWorkLog } from '../../types'

const WorkApprovalsPage: React.FC = () => {
  const [workLogs, setWorkLogs] = useState<ProductionWorkLog[]>([])
  const [loading, setLoading] = useState(true)
  
  // Confirmation dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ProductionWorkLog | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadWorkLogs()
  }, [])

  const loadWorkLogs = async () => {
    try {
      const logs = await api.getProductionWorkLogs({ last: 50 })
      setWorkLogs(logs.filter(log => log.status === 'submitted'))
    } catch (error) {
      toast.error('Failed to load work logs')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (logId: string) => {
    const log = workLogs.find(l => l.id === logId)
    if (log) {
      setSelectedLog(log)
      setShowApproveDialog(true)
    }
  }

  const confirmApprove = async () => {
    if (!selectedLog) return
    
    try {
      // In a real app, this would call an API to approve the work log
      toast.success('Work log approved successfully!')
      loadWorkLogs() // Reload to update the list
      setShowApproveDialog(false)
      setSelectedLog(null)
    } catch (error) {
      toast.error('Failed to approve work log')
    }
  }

  const handleReject = async (logId: string) => {
    const log = workLogs.find(l => l.id === logId)
    if (log) {
      setSelectedLog(log)
      setRejectReason('')
      setShowRejectDialog(true)
    }
  }

  const confirmReject = async () => {
    if (!selectedLog || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    try {
      // In a real app, this would call an API to reject the work log
      toast.success('Work log rejected')
      loadWorkLogs() // Reload to update the list
      setShowRejectDialog(false)
      setSelectedLog(null)
      setRejectReason('')
    } catch (error) {
      toast.error('Failed to reject work log')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ✅ Work Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve production work logs
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pending Approvals ({workLogs.length})
          </h2>
        </div>
        <div className="p-6">
          {workLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{log.taskName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.stage.replace('_', ' ')} • {log.serialNumber} • {log.actualTime} min
                      </p>
                      {log.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Notes: {log.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(log.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(log.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={confirmApprove}
        title="Approve Work Log"
        message={`Approve work log by ${selectedLog?.technicianName}?`}
        type="success"
        confirmText="Approve"
        cancelText="Cancel"
      />

      {/* Custom Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowRejectDialog(false)}
            />
            
            {/* Dialog */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 text-red-600">⚠️</div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Reject Work Log
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Rejecting work log by {selectedLog?.technicianName}
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reason for rejection *
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Please provide a reason for rejection..."
                      />
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowRejectDialog(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmReject}
                        disabled={!rejectReason.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkApprovalsPage
