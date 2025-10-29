import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import type { QualityInspection } from '../../types'

const PendingInspectionsPage: React.FC = () => {
  const [pendingInspections, setPendingInspections] = useState<QualityInspection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingInspections()
  }, [])

  const loadPendingInspections = async () => {
    try {
      const inspections = await api.getPendingInspections()
      setPendingInspections(inspections)
    } catch (error) {
      toast.error('Failed to load pending inspections')
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
          ⏳ Pending Inspections
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Devices awaiting quality inspection
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pending Inspections ({pendingInspections.length})
          </h2>
        </div>
        <div className="p-6">
          {pendingInspections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No pending inspections</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInspections.map((inspection) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{inspection.serialNumber}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {inspection.inspectionPoint.replace('_', ' ')} • {inspection.jobOrderId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(inspection.createdAt).toLocaleDateString()}
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

export default PendingInspectionsPage
