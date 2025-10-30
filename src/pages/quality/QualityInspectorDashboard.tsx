import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Eye, ClipboardCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import type { QualityInspection, JobOrder, Device } from '../../types'

const QualityInspectorDashboard: React.FC = () => {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [pendingInspections, setPendingInspections] = useState<QualityInspection[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showInspectionForm, setShowInspectionForm] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [inspectionsData, pendingData, devicesData] = await Promise.all([
        api.getQualityInspections({ last: 10 }),
        api.getPendingInspections(),
        api.getDevices()
      ])
      setInspections(inspectionsData)
      setPendingInspections(pendingData)
      setDevices(devicesData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitInspection = async (inspection: Omit<QualityInspection, 'id' | 'createdAt'>) => {
    try {
      await api.submitQualityInspection(inspection)
      toast.success('Quality inspection submitted successfully!')
      setShowInspectionForm(false)
      setSelectedDevice(null)
      loadData()
    } catch (error) {
      toast.error('Failed to submit inspection')
    }
  }

  const handleStartInspection = (device: Device) => {
    setSelectedDevice(device)
    setShowInspectionForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const todayInspections = inspections.filter(inspection => 
    new Date(inspection.inspectionDate).toDateString() === new Date().toDateString()
  )

  const passRate = inspections.length > 0 
    ? Math.round((inspections.filter(inspection => inspection.result === 'pass').length / inspections.length) * 100)
    : 0

  const defectRate = inspections.length > 0 
    ? Math.round((inspections.filter(inspection => inspection.result === 'fail').length / inspections.length) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔧 Technician Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Perform quality inspections and ensure product standards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Pending: {pendingInspections.length}
          </span>
          <button
            onClick={() => setShowInspectionForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            New Inspection
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Inspections</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayInspections.length}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{defectRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingInspections.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Inspections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Inspections</h2>
        </div>
        <div className="p-6">
          {devices.filter(device => device.qualityStatus === 'pending').length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No pending inspections</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                All devices have been inspected
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.filter(device => device.qualityStatus === 'pending').slice(0, 5).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{device.serialNumber}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Stage: {device.currentStage.replace('_', ' ')} • Job Order: {device.jobOrderId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartInspection(device)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Inspections</h2>
        </div>
        <div className="p-6">
          {inspections.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No inspections yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Start by performing your first quality inspection
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.slice(0, 5).map((inspection) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      inspection.result === 'pass' ? 'bg-green-100 dark:bg-green-900' :
                      inspection.result === 'fail' ? 'bg-red-100 dark:bg-red-900' :
                      'bg-yellow-100 dark:bg-yellow-900'
                    }`}>
                      {inspection.result === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : inspection.result === 'fail' ? (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      )}
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

      {/* Inspection Form Modal */}
      {showInspectionForm && (
        <InspectionForm
          device={selectedDevice}
          onSubmit={handleSubmitInspection}
          onClose={() => {
            setShowInspectionForm(false)
            setSelectedDevice(null)
          }}
        />
      )}
    </div>
  )
}

// Inspection Form Component
interface InspectionFormProps {
  device: Device | null
  onSubmit: (inspection: Omit<QualityInspection, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const InspectionForm: React.FC<InspectionFormProps> = ({ device, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    jobOrderId: device?.jobOrderId || '',
    deviceId: device?.id || '',
    serialNumber: device?.serialNumber || '',
    inspectionPoint: 'after_sub_assembly' as const,
    result: 'pass' as 'pass' | 'fail' | 'rework_required',
    defectsFound: [] as string[],
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      inspectorId: 'u13', // This would come from auth context
      inspectionDate: new Date().toISOString()
    })
  }

  const addDefect = () => {
    setFormData({
      ...formData,
      defectsFound: [...formData.defectsFound, '']
    })
  }

  const updateDefect = (index: number, value: string) => {
    const newDefects = [...formData.defectsFound]
    newDefects[index] = value
    setFormData({ ...formData, defectsFound: newDefects })
  }

  const removeDefect = (index: number) => {
    const newDefects = formData.defectsFound.filter((_, i) => i !== index)
    setFormData({ ...formData, defectsFound: newDefects })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quality Inspection
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Inspection Point
            </label>
            <select
              value={formData.inspectionPoint}
              onChange={(e) => setFormData({ ...formData, inspectionPoint: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="after_sub_assembly">After Sub-Assembly</option>
              <option value="after_installation">After Installation</option>
              <option value="after_test">After Test</option>
              <option value="final">Final Inspection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Inspection Result
            </label>
            <select
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="rework_required">Rework Required</option>
            </select>
          </div>

          {formData.result === 'fail' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Defects Found
              </label>
              {formData.defectsFound.map((defect, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={defect}
                    onChange={(e) => updateDefect(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe the defect..."
                  />
                  <button
                    type="button"
                    onClick={() => removeDefect(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDefect}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Defect
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Additional inspection notes..."
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
              Submit Inspection
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QualityInspectorDashboard
