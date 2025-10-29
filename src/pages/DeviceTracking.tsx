import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertTriangle, X, RefreshCw, LayoutGrid, Rows } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import type { Device, ProductionWorkLog, TestLog, QualityInspection } from '../types'
import FilterModal from '../components/modals/FilterModal'

interface FilterState {
  stage?: string
  operation?: string
  technician?: string
  qualityStatus?: string
  dateFrom?: string
  dateTo?: string
}

const DeviceTrackingPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [operations, setOperations] = useState<any[]>([])
  const [workLogs, setWorkLogs] = useState<ProductionWorkLog[]>([])
  const [testLogs, setTestLogs] = useState<TestLog[]>([])
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showDeviceDetails, setShowDeviceDetails] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load all data in parallel, but handle errors individually
      const results = await Promise.allSettled([
        api.getDevices(),
        api.getOperations(),
        api.getProductionWorkLogs(),
        api.getTestLogs(),
        api.getQualityInspections()
      ])
      
      // Extract successful results
      const devicesData = results[0].status === 'fulfilled' ? results[0].value : []
      const operationsData = results[1].status === 'fulfilled' ? results[1].value : []
      const workLogsData = results[2].status === 'fulfilled' ? results[2].value : []
      const testLogsData = results[3].status === 'fulfilled' ? results[3].value : []
      const inspectionsData = results[4].status === 'fulfilled' ? results[4].value : []
      
      setDevices(devicesData as Device[])
      setOperations(operationsData)
      setWorkLogs(workLogsData as ProductionWorkLog[])
      setTestLogs(testLogsData as TestLog[])
      setInspections(inspectionsData as QualityInspection[])
      
      // Log any errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['Devices', 'Operations', 'Work Logs', 'Test Logs', 'Inspections']
          console.warn(`Failed to load ${apiNames[index]}:`, result.reason)
        }
      })
    } catch (error) {
      console.error('Load data error:', error)
      toast.error('Failed to load some data. Please refresh the page.')
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

  // Visual styles for operation cards
  const opGradients = [
    'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10',
    'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10',
    'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10',
    'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10',
    'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/10',
    'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10'
  ]
  const pickGradient = (idx: number) => opGradients[idx % opGradients.length]

  // Get unique values for filter options
  const uniqueTechnicians = useMemo(() => {
    const techs = new Set<string>()
    devices.forEach(d => {
      const techName = (d as any).technicianName
      if (techName && techName !== 'Unassigned') techs.add(techName)
    })
    return Array.from(techs).sort()
  }, [devices])

  const uniqueOperations = useMemo(() => {
    const ops = new Set<string>()
    devices.forEach(d => {
      const opName = (d as any).operationName
      if (opName) ops.add(opName)
    })
    return Array.from(ops).sort()
  }, [devices])

  // Filter devices based on search term and filters
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.jobOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((device as any).operationName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((device as any).technicianName?.toLowerCase().includes(searchTerm.toLowerCase()))

      // Stage filter
      const matchesStage = !filters.stage || device.currentStage === filters.stage

      // Operation filter
      const matchesOperation = !filters.operation || 
        (device as any).operationName === filters.operation

      // Technician filter
      const matchesTechnician = !filters.technician || 
        (device as any).technicianName === filters.technician

      // Quality status filter
      const matchesQuality = !filters.qualityStatus || 
        device.qualityStatus === filters.qualityStatus

      // Date range filter
      const deviceDate = new Date(device.createdAt)
      const matchesDateFrom = !filters.dateFrom || deviceDate >= new Date(filters.dateFrom)
      const matchesDateTo = !filters.dateTo || deviceDate <= new Date(filters.dateTo)

      return matchesSearch && matchesStage && matchesOperation && 
             matchesTechnician && matchesQuality && matchesDateFrom && matchesDateTo
    })
  }, [devices, searchTerm, filters])

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== undefined && v !== '').length
  }, [filters])

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters({
      stage: newFilters.stage || undefined,
      operation: newFilters.operation || undefined,
      technician: newFilters.technician || undefined,
      qualityStatus: newFilters.qualityStatus || undefined,
      dateFrom: newFilters.createdAt_from || undefined,
      dateTo: newFilters.createdAt_to || undefined,
    })
  }

  const handleResetFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const removeFilter = (key: keyof FilterState) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
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

      {/* Search / Filters / View Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search devices by serial number, job order, operation, or technician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all relative"
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            )}

            {/* View toggle */}
            <div className="hidden md:flex items-center gap-2 pl-2 ml-2 border-l border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Table view"
              >
                <Rows className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {filters.stage && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  Stage: {filters.stage.replace('_', ' ')}
                  <button onClick={() => removeFilter('stage')} className="hover:text-blue-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.operation && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                  Operation: {filters.operation}
                  <button onClick={() => removeFilter('operation')} className="hover:text-purple-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.technician && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                  Technician: {filters.technician}
                  <button onClick={() => removeFilter('technician')} className="hover:text-green-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.qualityStatus && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                  Quality: {filters.qualityStatus}
                  <button onClick={() => removeFilter('qualityStatus')} className="hover:text-yellow-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                  Date: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
                  <button onClick={() => { removeFilter('dateFrom'); removeFilter('dateTo') }} className="hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Workflow Stages Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Production Operations Overview</h2>
          <div className="flex items-center gap-2">
            {filters.operation && (
              <button
                onClick={() => removeFilter('operation')}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="Clear operation filter"
              >
                Clear operation
              </button>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">{operations.length} ops</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {operations.length > 0 ? (
            operations.map((operation, idx) => {
              const operationDevices = devices.filter(d => {
                const deviceOp = (d as any).operationName?.toLowerCase() || ''
                const opName = operation.operation_name?.toLowerCase() || ''
                return deviceOp.includes(opName) || opName.includes(deviceOp)
              }).length
              
              const filteredCount = filteredDevices.filter(d => {
                const deviceOp = (d as any).operationName?.toLowerCase() || ''
                const opName = operation.operation_name?.toLowerCase() || ''
                return deviceOp.includes(opName) || opName.includes(deviceOp)
              }).length

              const isActive = filters.operation === operation.operation_name
              const devPerHour = operation.standard_time > 0 ? Math.round(60 / operation.standard_time) : 0
              
              return (
                <div 
                  key={operation.operation_id} 
                  className={`group relative overflow-hidden flex flex-col gap-3 p-5 bg-gradient-to-br ${pickGradient(idx)} rounded-xl border ${isActive ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-300/40 dark:ring-blue-500/30' : 'border-gray-200 dark:border-gray-600'} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, operation: operation.operation_name }))
                    setShowFilterModal(false)
                  }}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-10 h-10 rounded-lg bg-white/70 dark:bg-black/20 border border-white/60 dark:border-white/10 backdrop-blur flex items-center justify-center text-xl">🔧</div>
                    {isActive && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-600 text-white">Active</span>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{operation.operation_name}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Devices</div>
                        <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                          {filteredCount > 0 ? filteredCount : operationDevices}
                          {filteredCount > 0 && filteredCount !== operationDevices && (
                            <span className="ml-2 text-sm font-medium text-gray-400 line-through">{operationDevices}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Throughput</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{devPerHour} / hr</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">{operation.standard_time} min/op</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute right-3 top-3 px-2 py-1 text-[10px] rounded-md bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-black/10 dark:border-white/10">Click to filter</div>
                  </div>
                </div>
              )
            })
          ) : (
            // Fallback to default stages if no operations
            [
              { stage: 'sub_assembly', label: 'Sub-Assembly', icon: '🔧', colorClass: 'text-blue-600 dark:text-blue-400' },
              { stage: 'installation', label: 'Installation', icon: '⚙️', colorClass: 'text-purple-600 dark:text-purple-400' },
              { stage: 'testing', label: 'Testing', icon: '🧪', colorClass: 'text-yellow-600 dark:text-yellow-400' },
              { stage: 'final_touch', label: 'Final Touch', icon: '✨', colorClass: 'text-orange-600 dark:text-orange-400' },
              { stage: 'packing', label: 'Packing', icon: '📦', colorClass: 'text-indigo-600 dark:text-indigo-400' },
              { stage: 'completed', label: 'Completed', icon: '✅', colorClass: 'text-green-600 dark:text-green-400' }
            ].map((stage) => {
              const count = devices.filter(d => d.currentStage === stage.stage).length
              const filteredCount = filteredDevices.filter(d => d.currentStage === stage.stage).length
              return (
                <div 
                  key={stage.stage} 
                  className="flex flex-col items-center p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, stage: stage.stage }))
                    setShowFilterModal(false)
                  }}
                >
                  <div className="text-3xl mb-2">{stage.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{stage.label}</div>
                  <div className={`text-2xl font-bold ${stage.colorClass}`}>
                    {filteredCount > 0 ? filteredCount : count}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredCount > 0 && filteredCount !== count && (
                      <span className="text-gray-400 line-through mr-1">{count}</span>
                    )}
                    devices
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Devices - grid or table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Devices 
              <span className="ml-2 text-lg font-normal text-gray-600 dark:text-gray-400">
                ({filteredDevices.length} {filteredDevices.length !== devices.length ? `of ${devices.length}` : ''})
              </span>
            </h2>
            {filteredDevices.length === 0 && devices.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Clear filters to see all devices
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredDevices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No devices found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || activeFiltersCount > 0 
                  ? 'Try adjusting your search or filters' 
                  : 'No devices available in the system'}
              </p>
              {(searchTerm || activeFiltersCount > 0) && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Serial Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Job Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Operation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quality Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDevices.map((device) => (
                  <tr 
                    key={device.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                    onClick={() => handleViewDevice(device)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {device.serialNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {device.jobOrderId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(device.currentStage)} transition-all`}>
                          {getStageIcon(device.currentStage)} {device.currentStage.replace('_', ' ')}
                        </span>
                        {(device as any).operationName && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {(device as any).operationName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {(device as any).technicianName || (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getQualityStatusIcon(device.qualityStatus)}
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {device.qualityStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(device.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDevice(device)
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => handleViewDevice(device)}
                  className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/60 p-4 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">{device.jobOrderId}</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {device.serialNumber}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(device.currentStage)}`}>
                      {getStageIcon(device.currentStage)} {device.currentStage.replace('_',' ')}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Operation</div>
                      <div className="truncate text-gray-900 dark:text-white">{(device as any).operationName || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Technician</div>
                      <div className="truncate text-gray-900 dark:text-white">{(device as any).technicianName || 'Unassigned'}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getQualityStatusIcon(device.qualityStatus)}
                      <span className="text-sm capitalize text-gray-900 dark:text-white">{device.qualityStatus.replace('_',' ')}</span>
                    </div>
                    <button
                      onClick={(e)=>{ e.stopPropagation(); handleViewDevice(device) }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title="Filter Devices"
        fields={[
          {
            name: 'stage',
            label: 'Production Stage',
            type: 'select',
            options: [
              { value: 'sub_assembly', label: 'Sub-Assembly' },
              { value: 'installation', label: 'Installation' },
              { value: 'testing', label: 'Testing' },
              { value: 'final_touch', label: 'Final Touch' },
              { value: 'packing', label: 'Packing' },
              { value: 'completed', label: 'Completed' }
            ]
          },
          {
            name: 'operation',
            label: 'Operation',
            type: 'select',
            options: uniqueOperations.map(op => ({ value: op, label: op }))
          },
          {
            name: 'technician',
            label: 'Technician',
            type: 'select',
            options: uniqueTechnicians.map(tech => ({ value: tech, label: tech }))
          },
          {
            name: 'qualityStatus',
            label: 'Quality Status',
            type: 'select',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'pass', label: 'Pass' },
              { value: 'fail', label: 'Fail' },
              { value: 'under_review', label: 'Under Review' }
            ]
          },
          {
            name: 'createdAt',
            label: 'Created Date Range',
            type: 'dateRange'
          }
        ]}
      />

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Stage</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStageColor(device.currentStage)}`}>
              {getStageIcon(device.currentStage)} {device.currentStage.replace('_', ' ')}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Operation</h4>
            <p className="text-gray-600 dark:text-gray-400">
              {(device as any).operationName || 'No operation assigned'}
            </p>
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
