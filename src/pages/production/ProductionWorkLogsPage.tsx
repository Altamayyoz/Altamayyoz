import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import type { ProductionWorkLog } from '../../types'

const ProductionWorkLogsPage: React.FC = () => {
  const [workLogs, setWorkLogs] = useState<ProductionWorkLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkLogs()
  }, [])

  const loadWorkLogs = async () => {
    try {
      const logs = await api.getProductionWorkLogs({ last: 50 })
      setWorkLogs(logs)
    } catch (error) {
      toast.error('Failed to load work logs')
    } finally {
      setLoading(false)
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
          📝 My Work Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage your production work logs
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Work Logs ({workLogs.length})
          </h2>
        </div>
        <div className="p-6">
          {workLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No work logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <span className="text-blue-600 dark:text-blue-400">🔧</span>
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
    </div>
  )
}

export default ProductionWorkLogsPage
