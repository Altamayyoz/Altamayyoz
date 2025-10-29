import React, { useState } from 'react'
import { Upload, FileText, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface ImportTemplateModalProps {
  isOpen: boolean
  onClose: () => void
}

const ImportTemplateModal: React.FC<ImportTemplateModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    templateType: 'workLog',
    file: null as File | null,
    mappingOptions: {
      skipFirstRow: true,
      autoDetectColumns: true,
      customMapping: false
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const templateTypes = [
    { value: 'workLog', label: 'Work Log Template', description: 'Import work log entries' },
    { value: 'jobOrder', label: 'Job Order Template', description: 'Import job order data' },
    { value: 'tasks', label: 'Tasks Template', description: 'Import task assignments' },
    { value: 'users', label: 'Users Template', description: 'Import user accounts' },
    { value: 'devices', label: 'Devices Template', description: 'Import device information' }
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFormData(prev => ({ ...prev, file }))
      } else {
        toast.error('Please select a CSV or Excel file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData(prev => ({ ...prev, file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.file) {
      toast.error('Please select a file to upload')
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Template imported successfully!')
      onClose()
      setFormData({
        templateType: 'workLog',
        file: null,
        mappingOptions: {
          skipFirstRow: true,
          autoDetectColumns: true,
          customMapping: false
        }
      })
    }, 2000)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMappingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      mappingOptions: { ...prev.mappingOptions, [field]: value }
    }))
  }

  const downloadSample = () => {
    // Simulate download
    const templateType = templateTypes.find(t => t.value === formData.templateType)?.label || 'Template'
    toast.success(`${templateType} sample downloaded!`)
  }

  const getSampleColumns = () => {
    switch (formData.templateType) {
      case 'workLog':
        return ['Technician Name', 'Job Order', 'Task Description', 'Hours Worked', 'Date', 'Status']
      case 'jobOrder':
        return ['Job Order Number', 'Product Model', 'Total Devices', 'Due Date', 'Priority', 'Assigned Supervisor']
      case 'tasks':
        return ['Task Name', 'Assigned To', 'Job Order', 'Deadline', 'Priority', 'Instructions']
      case 'users':
        return ['Username', 'Email', 'Full Name', 'Role', 'Department', 'Password']
      case 'devices':
        return ['Device ID', 'Model', 'Serial Number', 'Status', 'Location', 'Last Updated']
      default:
        return []
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Template" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Template Type *
          </label>
          <div className="space-y-2">
            {templateTypes.map((type) => (
              <label key={type.value} className="relative">
                <input
                  type="radio"
                  name="templateType"
                  value={type.value}
                  checked={formData.templateType === type.value}
                  onChange={(e) => handleInputChange('templateType', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.templateType === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
                  <div className="flex items-start space-x-3">
                    <FileSpreadsheet className="w-5 h-5 text-gray-400 mt-0.5" />
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

        {/* Sample Template Download */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Need a sample template?</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Download our sample template to see the required format
              </p>
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Required columns: {getSampleColumns().join(', ')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadSample}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Sample
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File *
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop your file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
          </div>
          
          {formData.file && (
            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 mr-2" />
              {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Mapping Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Import Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.mappingOptions.skipFirstRow}
                onChange={(e) => handleMappingChange('skipFirstRow', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Skip first row (header row)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.mappingOptions.autoDetectColumns}
                onChange={(e) => handleMappingChange('autoDetectColumns', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-detect column mapping
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.mappingOptions.customMapping}
                onChange={(e) => handleMappingChange('customMapping', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Use custom column mapping
              </span>
            </label>
          </div>
        </div>

        {/* Import Preview */}
        {formData.file && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Import Preview
            </h4>
            <div className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
              <p>• Template Type: {templateTypes.find(t => t.value === formData.templateType)?.label}</p>
              <p>• File: {formData.file.name}</p>
              <p>• Expected columns: {getSampleColumns().length}</p>
              <p>• Auto-detection: {formData.mappingOptions.autoDetectColumns ? 'Enabled' : 'Disabled'}</p>
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
            disabled={isLoading || !formData.file}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import Template
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ImportTemplateModal
