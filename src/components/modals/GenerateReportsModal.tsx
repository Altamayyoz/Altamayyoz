import React, { useState } from 'react'
import { BarChart3, Calendar, Filter, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface GenerateReportsModalProps {
  isOpen: boolean
  onClose: () => void
}

const GenerateReportsModal: React.FC<GenerateReportsModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    reportType: 'performance',
    period: 'thisMonth',
    customStartDate: '',
    customEndDate: '',
    groupBy: 'technician',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true
  })
  const [isLoading, setIsLoading] = useState(false)

  const reportTypes = [
    { value: 'performance', label: 'Performance Report', description: 'Overall system performance metrics' },
    { value: 'efficiency', label: 'Efficiency Analysis', description: 'Work efficiency and productivity trends' },
    { value: 'utilization', label: 'Resource Utilization', description: 'Equipment and personnel utilization rates' },
    { value: 'quality', label: 'Quality Metrics', description: 'Quality inspection results and trends' }
  ]

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const groupByOptions = [
    { value: 'technician', label: 'Technician' },
    { value: 'task', label: 'Task' },
    { value: 'jobOrder', label: 'Job Order' },
    { value: 'department', label: 'Department' },
    { value: 'date', label: 'Date' }
  ]

  const formats = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'csv', label: 'CSV', icon: '📋' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.period === 'custom' && (!formData.customStartDate || !formData.customEndDate)) {
      toast.error('Please select both start and end dates for custom range')
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Report generated successfully!')
      onClose()
      setFormData({
        reportType: 'performance',
        period: 'thisMonth',
        customStartDate: '',
        customEndDate: '',
        groupBy: 'technician',
        format: 'pdf',
        includeCharts: true,
        includeDetails: true
      })
    }, 2000)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Reports" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Report Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {reportTypes.map((type) => (
              <label key={type.value} className="relative">
                <input
                  type="radio"
                  name="reportType"
                  value={type.value}
                  checked={formData.reportType === type.value}
                  onChange={(e) => handleInputChange('reportType', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.reportType === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Period Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Period *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={formData.period}
              onChange={(e) => handleInputChange('period', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {formData.period === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.customStartDate}
                onChange={(e) => handleInputChange('customStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.customEndDate}
                onChange={(e) => handleInputChange('customEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Group By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Group By *
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={formData.groupBy}
              onChange={(e) => handleInputChange('groupBy', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {groupByOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formats.map((format) => (
              <label key={format.value} className="relative">
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={formData.format === format.value}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.format === format.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
                  <div className="text-center">
                    <div className="text-xl mb-1">{format.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{format.label}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Report Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Report Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeCharts}
                onChange={(e) => handleInputChange('includeCharts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Include charts and graphs
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeDetails}
                onChange={(e) => handleInputChange('includeDetails', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Include detailed breakdowns
              </span>
            </label>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Report Preview
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Report Type: {reportTypes.find(t => t.value === formData.reportType)?.label}</p>
            <p>• Period: {periods.find(p => p.value === formData.period)?.label}</p>
            <p>• Grouped by: {groupByOptions.find(g => g.value === formData.groupBy)?.label}</p>
            <p>• Format: {formats.find(f => f.value === formData.format)?.label}</p>
            <p>• Estimated size: ~1.2 MB</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default GenerateReportsModal
