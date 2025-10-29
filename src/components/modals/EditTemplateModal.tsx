import React, { useState, useEffect } from 'react'
import { Save, Tag, Clock, FileText, Info } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'
import api from '../../services/api'

interface TaskTemplateLocal {
  id: string
  name: string
  category: string
  standardTime: number
  description: string
}

interface EditTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  template: TaskTemplateLocal
  onTemplateUpdated?: () => void
  getCategoryColor: (category: string) => string
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  template, 
  onTemplateUpdated,
  getCategoryColor 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    standardTime: 0,
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    'Assembly',
    'Quality Inspection',
    'Testing',
    'Packaging',
    'Calibration',
    'Maintenance',
    'Documentation',
    'Other'
  ]

  useEffect(() => {
    if (template && isOpen) {
      setFormData({
        name: template.name || '',
        category: template.category || '',
        standardTime: template.standardTime || 0,
        description: template.description || ''
      })
      setErrors({})
      setIsLoading(false)
    }
  }, [template, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.standardTime || formData.standardTime < 1) {
      newErrors.standardTime = 'Standard time must be at least 1 minute'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      await api.updateOperation(template.id, {
        operation_name: formData.name,
        standard_time_minutes: formData.standardTime,
        description: formData.description
      })
      
      toast.success('Template updated successfully!')
      onClose()
      
      if (onTemplateUpdated) {
        onTemplateUpdated()
      }
    } catch (error: any) {
      console.error('Update template error:', error)
      toast.error(error.message || 'Failed to update template. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!template) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Template: ${template.name || 'Template'}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template ID (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template ID
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={template.id}
              disabled
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Task Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Task Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter task name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Category and Standard Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            {formData.category && (
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(formData.category)}`}>
                  {formData.category}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Standard Time (minutes) *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="1"
                value={formData.standardTime}
                onChange={(e) => handleInputChange('standardTime', parseInt(e.target.value) || 0)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.standardTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter time in minutes"
              />
            </div>
            {errors.standardTime && <p className="mt-1 text-sm text-red-600">{errors.standardTime}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <div className="relative">
            <Info className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter detailed description (minimum 10 characters)"
            />
          </div>
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.description.length} characters
          </p>
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
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditTemplateModal

