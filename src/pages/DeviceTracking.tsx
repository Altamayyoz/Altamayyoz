import React, { useState, useEffect } from 'react'
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import type { Device, ProductionWorkLog, TestLog, QualityInspection } from '../types'

const DeviceTrackingPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [workLogs, setWorkLogs] = useState<ProductionWorkLog[]>([])
  const [testLogs, setTestLogs] = useState<TestLog[]>([])
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showDeviceDetails, setShowDeviceDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [devicesData, workLogsData, testLogsData, inspectionsData] = await Promise.all([
        api.getDevices(),
        api.getProductionWorkLogs(),
        api.getTestLogs(),
        api.getQualityInspections()
      ])
      setDevices(devicesData)
      setWorkLogs(workLogsData)
      setTestLogs(testLogsData)
      setInspections(inspectionsData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDevice = (device: Device) => {
    setSelectedDevice(device)
    setShowDeviceDetails(true)
  }

  const getStageIcon = (stage: Device['currentStage']) => {
    switch (stage) {
      case 'sub_assembly': return '🔧'
      case 'installation': return '⚙️'
      case 'testing': return '🧪'
      case 'final_touch': return '✨'
      case 'packing': return '📦'
      case 'completed': return '✅'
      default: return '📱'
    }
  }

  const getStageColor = (stage: Device['currentStage']) => {
    switch (stage) {
      case 'sub_assembly': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'installation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'testing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'final_touch': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'packing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getQualityStatusIcon = (status: Device['qualityStatus']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'fail': return <XCircle className="w-4 h-4 text-red-600" />
      case 'under_review': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const filteredDevices = devices.filter(device =>
    device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.jobOrderId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📱 Device Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track devices through the production workflow
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by serial number or job order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Workflow Stages Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Production Workflow</h2>
        <div className="flex items-center justify-between">
          {[
            { stage: 'sub_assembly', label: 'Sub-Assembly', icon: '🔧' },
            { stage: 'installation', label: 'Installation', icon: '⚙️' },
            { stage: 'testing', label: 'Testing', icon: '🧪' },
            { stage: 'final_touch', label: 'Final Touch', icon: '✨' },
            { stage: 'packing', label: 'Packing', icon: '📦' },
            { stage: 'completed', label: 'Completed', icon: '✅' }
          ].map((stage, index) => {
            const count = devices.filter(d => d.currentStage === stage.stage).length
            return (
              <div key={stage.stage} className="flex flex-col items-center">
                <div className="text-2xl mb-2">{stage.icon}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{stage.label}</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{count}</div>
                {index < 5 && <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 mt-4"></div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Devices ({filteredDevices.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Job Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quality Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {device.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {device.jobOrderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(device.currentStage)}`}>
                      {getStageIcon(device.currentStage)} {device.currentStage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getQualityStatusIcon(device.qualityStatus)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                        {device.qualityStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(device.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDevice(device)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Details Modal */}
      {showDeviceDetails && selectedDevice && (
        <DeviceDetailsModal
          device={selectedDevice}
          workLogs={workLogs.filter(log => log.deviceId === selectedDevice.id)}
          testLogs={testLogs.filter(log => log.deviceId === selectedDevice.id)}
          inspections={inspections.filter(inspection => inspection.deviceId === selectedDevice.id)}
          onClose={() => {
            setShowDeviceDetails(false)
            setSelectedDevice(null)
          }}
        />
      )}
    </div>
  )
}

// Device Details Modal Component
interface DeviceDetailsModalProps {
  device: Device
  workLogs: ProductionWorkLog[]
  testLogs: TestLog[]
  inspections: QualityInspection[]
  onClose: () => void
}

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({ 
  device, 
  workLogs, 
  testLogs, 
  inspections, 
  onClose 
}) => {
  const getStageIcon = (stage: Device['currentStage']) => {
    switch (stage) {
      case 'sub_assembly': return '🔧'
      case 'installation': return '⚙️'
      case 'testing': return '🧪'
      case 'final_touch': return '✨'
      case 'packing': return '📦'
      case 'completed': return '✅'
      default: return '📱'
    }
  }

  const getStageColor = (stage: Device['currentStage']) => {
    switch (stage) {
      case 'sub_assembly': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'installation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'testing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'final_touch': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'packing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Device Details: {device.serialNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Device Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Stage</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStageColor(device.currentStage)}`}>
              {getStageIcon(device.currentStage)} {device.currentStage.replace('_', ' ')}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Job Order</h4>
            <p className="text-gray-600 dark:text-gray-400">{device.jobOrderId}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quality Status</h4>
            <p className="text-gray-600 dark:text-gray-400 capitalize">{device.qualityStatus.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {/* Production Work Logs */}
          {workLogs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">🔧 Production Work</h4>
              <div className="space-y-2">
                {workLogs.map((log) => (
                  <div key={log.id} className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{log.taskName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.stage.replace('_', ' ')} • {log.actualTime} min
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Logs */}
          {testLogs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">🧪 Test Results</h4>
              <div className="space-y-2">
                {testLogs.map((log) => (
                  <div key={log.id} className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {log.testType.replace('_', ' ').toUpperCase()} Test
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Result: {log.testResult.toUpperCase()}
                        {log.measurements && ` • Pressure: ${log.measurements.pressure} PSI`}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.testDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Inspections */}
          {inspections.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">🔍 Quality Inspections</h4>
              <div className="space-y-2">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {inspection.inspectionPoint.replace('_', ' ')} Inspection
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Result: {inspection.result.toUpperCase()}
                        {inspection.defectsFound && inspection.defectsFound.length > 0 && 
                          ` • ${inspection.defectsFound.length} defects found`
                        }
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(inspection.inspectionDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeviceTrackingPage
