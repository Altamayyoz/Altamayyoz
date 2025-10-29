import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import type { QualityInspection } from '../../types'

const QualityReportsPage: React.FC = () => {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInspections()
  }, [])

  const loadInspections = async () => {
    try {
      const data = await api.getQualityInspections({ last: 100 })
      setInspections(data)
    } catch (error) {
      toast.error('Failed to load quality reports')
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

  const passRate = inspections.length > 0 
    ? Math.round((inspections.filter(i => i.result === 'pass').length / inspections.length) * 100)
    : 0

  const defectRate = inspections.length > 0 
    ? Math.round((inspections.filter(i => i.result === 'fail').length / inspections.length) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📈 Quality Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Quality metrics and inspection reports
        </p>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-green-600 dark:text-green-400">✅</span>
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
              <span className="text-red-600 dark:text-red-400">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{defectRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400">🔍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Inspections</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inspections.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Inspections
          </h2>
        </div>
        <div className="p-6">
          {inspections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No inspections found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.slice(0, 10).map((inspection) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      inspection.result === 'pass' ? 'bg-green-100 dark:bg-green-900' :
                      inspection.result === 'fail' ? 'bg-red-100 dark:bg-red-900' :
                      'bg-yellow-100 dark:bg-yellow-900'
                    }`}>
                      <span className={`${
                        inspection.result === 'pass' ? 'text-green-600 dark:text-green-400' :
                        inspection.result === 'fail' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {inspection.result === 'pass' ? '✅' : inspection.result === 'fail' ? '❌' : '⚠️'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{inspection.serialNumber}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {inspection.inspectionPoint.replace('_', ' ')} • {inspection.result.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inspection.result === 'pass' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      inspection.result === 'fail' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {inspection.result}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(inspection.inspectionDate).toLocaleDateString()}
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

export default QualityReportsPage
