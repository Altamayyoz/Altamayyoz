import React, { useState } from 'react'
import { FileText, Filter, Download, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface CustomReportModalProps {
  isOpen: boolean
  onClose: () => void
}

const CustomReportModal: React.FC<CustomReportModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    selectedFields: [] as string[],
    dateRange: 'thisMonth',
    customStartDate: '',
    customEndDate: '',
    roleFilter: '',
    statusFilter: '',
    modelFilter: '',
    grouping: 'none',
    sorting: 'date',
    sortOrder: 'desc',
    format: 'pdf',
    templateName: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [saveTemplate, setSaveTemplate] = useState(false)

  const availableFields = [
    { id: 'technician', label: 'Technician Name', category: 'Personnel' },
    { id: 'jobOrder', label: 'Job Order Number', category: 'Orders' },
    { id: 'task', label: 'Task Description', category: 'Tasks' },
    { id: 'hoursWorked', label: 'Hours Worked', category: 'Time' },
    { id: 'date', label: 'Date', category: 'Time' },
    { id: 'status', label: 'Status', category: 'Status' },
    { id: 'priority', label: 'Priority', category: 'Status' },
    { id: 'productModel', label: 'Product Model', category: 'Products' },
    { id: 'qualityScore', label: 'Quality Score', category: 'Quality' },
    { id: 'defects', label: 'Defects Found', category: 'Quality' },
    { id: 'department', label: 'Department', category: 'Personnel' },
    { id: 'equipment', label: 'Equipment Used', category: 'Resources' }
  ]

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const roles = ['Admin', 'ProductionWorker', 'TestPersonnel', 'QualityInspector', 'Supervisor', 'PlanningEngineer']
  const statuses = ['Open', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
  const models = ['A100', 'A300', 'A340', 'SKGB']
  const groupingOptions = [
    { value: 'none', label: 'No Grouping' },
    { value: 'technician', label: 'By Technician' },
    { value: 'department', label: 'By Department' },
    { value: 'date', label: 'By Date' },
    { value: 'status', label: 'By Status' }
  ]
  const sortingOptions = [
    { value: 'date', label: 'Date' },
    { value: 'technician', label: 'Technician' },
    { value: 'hoursWorked', label: 'Hours Worked' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.selectedFields.length === 0) {
      toast.error('Please select at least one field to include')
      return
    }

    if (formData.dateRange === 'custom' && (!formData.customStartDate || !formData.customEndDate)) {
      toast.error('Please select both start and end dates for custom range')
      return
    }

    if (saveTemplate && !formData.templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      if (saveTemplate) {
        toast.success(`Custom report generated and template "${formData.templateName}" saved!`)
      } else {
        toast.success('Custom report generated successfully!')
      }
      onClose()
      setFormData({
        selectedFields: [],
        dateRange: 'thisMonth',
        customStartDate: '',
        customEndDate: '',
        roleFilter: '',
        statusFilter: '',
        modelFilter: '',
        grouping: 'none',
        sorting: 'date',
        sortOrder: 'desc',
        format: 'pdf',
        templateName: ''
      })
      setSaveTemplate(false)
    }, 2000)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFieldToggle = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldId)
        ? prev.selectedFields.filter(id => id !== fieldId)
        : [...prev.selectedFields, fieldId]
    }))
  }

  const groupedFields = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, typeof availableFields>)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom Report Builder" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Fields to Include *
          </label>
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="mb-4 last:mb-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {category}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {fields.map((field) => (
                    <label key={field.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selectedFields.includes(field.id)}
                        onChange={() => handleFieldToggle(field.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {field.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {formData.selectedFields.length} field(s) selected
          </p>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range *
          </label>
          <select
            value={formData.dateRange}
            onChange={(e) => handleInputChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
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

        {/* Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filters
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role Filter
              </label>
              <select
                value={formData.roleFilter}
                onChange={(e) => handleInputChange('roleFilter', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Filter
              </label>
              <select
                value={formData.statusFilter}
                onChange={(e) => handleInputChange('statusFilter', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model Filter
              </label>
              <select
                value={formData.modelFilter}
                onChange={(e) => handleInputChange('modelFilter', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">All Models</option>
                {models.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grouping and Sorting */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grouping
            </label>
            <select
              value={formData.grouping}
              onChange={(e) => handleInputChange('grouping', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {groupingOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sorting
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.sorting}
                onChange={(e) => handleInputChange('sorting', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortingOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={formData.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format *
          </label>
          <div className="grid grid-cols-3 gap-3">
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

        {/* Save Template */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={saveTemplate}
              onChange={(e) => setSaveTemplate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Save as template for future use
            </span>
          </label>
          {saveTemplate && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.templateName}
                onChange={(e) => handleInputChange('templateName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter template name"
              />
            </div>
          )}
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
            disabled={isLoading || formData.selectedFields.length === 0}
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
                Generate Custom Report
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CustomReportModal
