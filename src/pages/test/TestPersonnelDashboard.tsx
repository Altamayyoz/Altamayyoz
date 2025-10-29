import React, { useState, useEffect } from 'react'
import { Plus, FlaskConical, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import type { TestLog, JobOrder } from '../../types'

const TestPersonnelDashboard: React.FC = () => {
  const [testLogs, setTestLogs] = useState<TestLog[]>([])
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showTestLogForm, setShowTestLogForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [logs, orders] = await Promise.all([
        api.getTestLogs({ last: 10 }),
        api.getJobOrders()
      ])
      setTestLogs(logs)
      setJobOrders(orders)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTestLog = async (testLog: Omit<TestLog, 'id' | 'createdAt'>) => {
    try {
      await api.submitTestLog(testLog)
      toast.success('Test log submitted successfully!')
      setShowTestLogForm(false)
      loadData()
    } catch (error) {
      toast.error('Failed to submit test log')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const todayTests = testLogs.filter(log => 
    new Date(log.testDate).toDateString() === new Date().toDateString()
  )

  const passRate = testLogs.length > 0 
    ? Math.round((testLogs.filter(log => log.testResult === 'pass').length / testLogs.length) * 100)
    : 0

  const failedTests = testLogs.filter(log => log.testResult === 'fail').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🧪 Test Personnel Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage testing procedures and record test results
          </p>
        </div>
        <button
          onClick={() => setShowTestLogForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Test Result
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FlaskConical className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Tests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayTests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{passRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Tests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{failedTests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Needs Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {testLogs.filter(log => log.testResult === 'needs_review').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Types Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Test Types Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['nitrogen', 'immersion', 'ess', 'control_unit', 'adjustment'].map((testType) => {
              const count = testLogs.filter(log => log.testType === testType).length
              return (
                <div key={testType} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {testType.replace('_', ' ')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Test Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Test Logs</h2>
        </div>
        <div className="p-6">
          {testLogs.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No test logs yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Start by logging your first test result
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {testLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      log.testResult === 'pass' ? 'bg-green-100 dark:bg-green-900' :
                      log.testResult === 'fail' ? 'bg-red-100 dark:bg-red-900' :
                      'bg-yellow-100 dark:bg-yellow-900'
                    }`}>
                      {log.testResult === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : log.testResult === 'fail' ? (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      )}
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

      {/* Test Log Form Modal */}
      {showTestLogForm && (
        <TestLogForm
          jobOrders={jobOrders}
          onSubmit={handleSubmitTestLog}
          onClose={() => setShowTestLogForm(false)}
        />
      )}
    </div>
  )
}

// Test Log Form Component
interface TestLogFormProps {
  jobOrders: JobOrder[]
  onSubmit: (testLog: Omit<TestLog, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const TestLogForm: React.FC<TestLogFormProps> = ({ jobOrders, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    jobOrderId: '',
    deviceId: '',
    serialNumber: '',
    testType: 'nitrogen' as const,
    testResult: 'pass' as const,
    measurements: { pressure: 0, temperature: 0 },
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      testPersonnelId: 'u9', // This would come from auth context
      testDate: new Date().toISOString()
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Log Test Result
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
              Test Type
            </label>
            <select
              value={formData.testType}
              onChange={(e) => setFormData({ ...formData, testType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="nitrogen">Nitrogen Test</option>
              <option value="immersion">Immersion Test</option>
              <option value="ess">ESS Test</option>
              <option value="control_unit">Control Unit Test</option>
              <option value="adjustment">Adjustment Test</option>
            </select>
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
              Test Result
            </label>
            <select
              value={formData.testResult}
              onChange={(e) => setFormData({ ...formData, testResult: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="needs_review">Needs Review</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pressure (PSI)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.measurements.pressure}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  measurements: { ...formData.measurements, pressure: parseFloat(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.measurements.temperature}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  measurements: { ...formData.measurements, temperature: parseFloat(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.0"
              />
            </div>
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
              placeholder="Test observations, issues, or additional notes..."
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
              Submit Test Log
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TestPersonnelDashboard
