import React, { useEffect, useState } from 'react'
import { CheckCircle, Eye, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ConfirmationDialog from '../components/common/ConfirmationDialog'

const JobOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Action dialog states
  const [showMarkCompleteDialog, setShowMarkCompleteDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const j = await api.getJobOrders()
      if (mounted) {
        setOrders(j)
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <LoadingSpinner />

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      on_hold: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    }
    return colors[status] || colors.open
  }

  const handleMarkComplete = (order: any) => {
    setSelectedOrder(order)
    setShowMarkCompleteDialog(true)
  }

  const confirmMarkComplete = async () => {
    if (!selectedOrder) return
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Job order "${selectedOrder.title}" marked as complete!`)
      setShowMarkCompleteDialog(false)
      setSelectedOrder(null)
      // Reload orders
      const updatedOrders = await api.getJobOrders()
      setOrders(updatedOrders)
    } catch (error) {
      toast.error('Failed to mark job order as complete')
    }
  }

  const handleDownload = async (order: any) => {
    setDownloadingId(order.id)
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`Download started for "${order.title}"!`)
    } catch (error) {
      toast.error('Failed to download')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent bg-clip-text text-transparent">
          Job Orders
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage and track all job orders</p>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">Created</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">Devices</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-light-text dark:text-dark-text">{o.title}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">{o.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(o.status)}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${o.progress}%` }}
                          className="h-full bg-gradient-to-r from-light-primary to-light-accent"
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{o.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {o.devices.length} device(s)
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {o.status !== 'completed' && (
                        <button
                          onClick={() => handleMarkComplete(o)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(o)}
                        disabled={downloadingId === o.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingId === o.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showMarkCompleteDialog}
        onClose={() => setShowMarkCompleteDialog(false)}
        onConfirm={confirmMarkComplete}
        title="Mark as Complete"
        message={`Mark job order "${selectedOrder?.title}" as complete? This will update the status to completed.`}
        type="success"
        confirmText="Mark Complete"
        cancelText="Cancel"
      />
    </div>
  )
}

export default JobOrdersPage
