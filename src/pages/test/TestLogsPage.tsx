import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import type { TestLog } from '../../types'

const TestLogsPage: React.FC = () => {
  const [testLogs, setTestLogs] = useState<TestLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTestLogs()
  }, [])

  const loadTestLogs = async () => {
    try {
      const logs = await api.getTestLogs({ last: 50 })
      setTestLogs(logs)
    } catch (error) {
      toast.error('Failed to load test logs')
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
          📊 My Test Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage your test results
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Test Logs ({testLogs.length})
          </h2>
        </div>
        <div className="p-6">
          {testLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No test logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      log.testResult === 'pass' ? 'bg-green-100 dark:bg-green-900' :
                      log.testResult === 'fail' ? 'bg-red-100 dark:bg-red-900' :
                      'bg-yellow-100 dark:bg-yellow-900'
                    }`}>
                      <span className={`${
                        log.testResult === 'pass' ? 'text-green-600 dark:text-green-400' :
                        log.testResult === 'fail' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {log.testResult === 'pass' ? '✅' : log.testResult === 'fail' ? '❌' : '⚠️'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {log.testType.replace('_', ' ').toUpperCase()} Test
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.serialNumber} • {log.testResult.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.testResult === 'pass' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      log.testResult === 'fail' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {log.testResult}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(log.testDate).toLocaleDateString()}
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

export default TestLogsPage
