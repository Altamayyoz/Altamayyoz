import React, { useState } from 'react'
import { Download, Calendar, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface ExportReportModalProps {
  isOpen: boolean
  onClose: () => void
}

const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    reportType: 'performance',
    dateRange: 'thisMonth',
    customStartDate: '',
    customEndDate: '',
    format: 'pdf',
    includeFilters: false,
    filters: {
      role: '',
      status: '',
      priority: ''
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Report downloaded successfully!')
      onClose()
      setFormData({
        reportType: 'performance',
        dateRange: 'thisMonth',
        customStartDate: '',
        customEndDate: '',
        format: 'pdf',
        includeFilters: false,
        filters: { role: '', status: '', priority: '' }
      })
    }, 2000)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Report" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Report Type *
          </label>
          <select
            value={formData.reportType}
            onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="performance">Performance Report</option>
            <option value="jobOrders">Job Orders Report</option>
            <option value="devices">Device Tracking Report</option>
            <option value="quality">Quality Inspection Report</option>
            <option value="efficiency">Efficiency Analysis</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range *
          </label>
          <select
            value={formData.dateRange}
            onChange={(e) => setFormData(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {formData.dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.customStartDate}
                onChange={(e) => setFormData(prev => ({ ...prev, customStartDate: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, customEndDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'pdf', label: 'PDF', icon: '📄' },
              { value: 'excel', label: 'Excel', icon: '📊' },
              { value: 'csv', label: 'CSV', icon: '📋' }
            ].map((format) => (
              <label key={format.value} className="relative">
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={formData.format === format.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.format === format.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">{format.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{format.label}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.includeFilters}
              onChange={(e) => setFormData(prev => ({ ...prev, includeFilters: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Include Additional Filters
            </span>
          </label>
        </div>

        {formData.includeFilters && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Filter
              </label>
              <select
                value={formData.filters.role}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, role: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="ProductionWorker">Production Worker</option>
                <option value="TestPersonnel">Test Personnel</option>
                <option value="QualityInspector">Quality Inspector</option>
                <option value="Supervisor">Supervisor</option>
                <option value="PlanningEngineer">Planning Engineer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Filter
              </label>
              <select
                value={formData.filters.status}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, status: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority Filter
              </label>
              <select
                value={formData.filters.priority}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, priority: e.target.value }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        )}

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
                Export Report
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ExportReportModal
