import React, { useEffect, useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Eye,
  MessageSquare,
  Filter,
  Search,
  Calendar,
  Target,
  FileText
} from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import { toast } from 'react-hot-toast'

interface PendingQualityApproval {
  approval_id: number
  job_order_id: string
  job_order_title: string
  submitted_by_name: string
  submitted_at: string
  status: 'pending' | 'approved' | 'rejected'
  total_devices: number
  completed_devices: number
  progress: number
}

const QualityEngineerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [pendingApprovals, setPendingApprovals] = useState<PendingQualityApproval[]>([])
  
  // Approval modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<PendingQualityApproval | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalComment, setApprovalComment] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quality_approvals.php?status=pending', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success && result.data) {
        setPendingApprovals(result.data.map((item: any) => ({
          approval_id: item.approval_id,
          job_order_id: item.job_order_id,
          job_order_title: item.job_order_title || item.job_order_id,
          submitted_by_name: item.submitted_by_name || 'Unknown',
          submitted_at: item.submitted_at,
          status: item.status,
          total_devices: item.total_devices || 0,
          completed_devices: item.completed_devices || 0,
          progress: item.progress || 0
        })))
      }
    } catch (error) {
      console.error('Error loading quality approvals:', error)
      toast.error('Failed to load quality approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (approval: PendingQualityApproval) => {
    setSelectedApproval(approval)
    setApprovalAction('approve')
    setApprovalComment('')
    setShowApprovalModal(true)
  }

  const handleReject = (approval: PendingQualityApproval) => {
    setSelectedApproval(approval)
    setApprovalAction('reject')
    setApprovalComment('')
    setShowApprovalModal(true)
  }

  const confirmApproval = async () => {
    if (!selectedApproval) return
    
    // Validation for reject
    if (approvalAction === 'reject' && !approvalComment.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    try {
      console.log('Processing quality approval:', {
        approval_id: selectedApproval.approval_id,
        action: approvalAction,
        comments: approvalComment.trim()
      })
      
      const response = await fetch('/api/quality_approvals.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          approval_id: selectedApproval.approval_id,
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
        setPendingApprovals(prev => prev.filter(approval => approval.approval_id !== selectedApproval.approval_id))
        
        toast.success(`Job order ${actionText} successfully!`)
        
        // Close modal
        setShowApprovalModal(false)
        setSelectedApproval(null)
        setApprovalComment('')
        
        // Reload dashboard data
        setTimeout(() => {
          loadDashboardData()
        }, 500)
      } else {
        toast.error(result.message || `Failed to ${approvalAction} job order`)
      }
    } catch (error) {
      console.error('Approval error:', error)
      toast.error(`Failed to ${approvalAction} job order. Please check your connection.`)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Quality Approval Dashboard
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Review and approve completed job orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-lg font-bold text-purple-600">{pendingApprovals.length}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Pending Quality Approvals
          </h3>
        </div>
        
        {pendingApprovals.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No Pending Approvals
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              All job orders have been reviewed
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {pendingApprovals.map((approval) => (
              <div key={approval.approval_id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {approval.job_order_title}
                      </h4>
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                        {approval.job_order_id}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Submitted By</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {approval.submitted_by_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Submitted At</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {new Date(approval.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Devices</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {approval.completed_devices} / {approval.total_devices}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${approval.progress}%` }}
                              className="h-full bg-gradient-to-r from-purple-600 to-pink-500"
                            />
                          </div>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {approval.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleReject(approval)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(approval)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedApproval && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowApprovalModal(false)}
            />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {approvalAction === 'approve' ? 'Approve' : 'Reject'} Job Order
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedApproval.job_order_id}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {approvalAction === 'approve' 
                      ? 'Are you sure you want to approve this job order as complete?' 
                      : 'Please provide a reason for rejecting this job order:'}
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {approvalAction === 'approve' ? 'Comments (Optional)' : 'Rejection Reason *'}
                    </label>
                    <textarea
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      rows={3}
                      placeholder={approvalAction === 'approve' ? 'Add any notes...' : 'Enter rejection reason...'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required={approvalAction === 'reject'}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApproval}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                      approvalAction === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {approvalAction === 'approve' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
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

export default QualityEngineerDashboard


