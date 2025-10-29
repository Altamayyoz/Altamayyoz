import React, { useState } from 'react'
import { AlertTriangle, Package, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface WarehouseContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (message: { problemType: string; details: string; urgency: string; itemName: string; quantityAffected: string }) => void
}

const WarehouseContactModal: React.FC<WarehouseContactModalProps> = ({ isOpen, onClose, onSend }) => {
  const [formData, setFormData] = useState({
    problemType: '',
    details: '',
    urgency: 'medium',
    quantityAffected: '',
    itemName: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const problemTypes = [
    { value: 'insufficient_supplies', label: 'Insufficient Supplies', icon: '📦', description: 'Not enough materials in stock' },
    { value: 'damaged_supplies', label: 'Damaged Supplies', icon: '⚠️', description: 'Items received are damaged or defective' },
    { value: 'wrong_items', label: 'Wrong Items Delivered', icon: '❌', description: 'Received incorrect materials' },
    { value: 'quality_issue', label: 'Quality Issue', icon: '🔍', description: 'Materials do not meet quality standards' },
    { value: 'delay', label: 'Delivery Delay', icon: '⏰', description: 'Expected shipment is delayed' },
    { value: 'missing_items', label: 'Missing Items', icon: '📋', description: 'Items are missing from order' },
    { value: 'urgent_request', label: 'Urgent Request', icon: '🚨', description: 'Need immediate supplies for critical job' }
  ]

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.problemType) {
      newErrors.problemType = 'Please select a problem type'
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Please provide details about the issue'
    } else if (formData.details.trim().length < 10) {
      newErrors.details = 'Please provide more details (at least 10 characters)'
    }

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Please specify the item/material name'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const message = {
      problemType: formData.problemType,
      details: formData.details,
      urgency: formData.urgency,
      itemName: formData.itemName,
      quantityAffected: formData.quantityAffected
    }

    onSend(message)
    
    // Reset form
    setFormData({
      problemType: '',
      details: '',
      urgency: 'medium',
      quantityAffected: '',
      itemName: ''
    })
    setErrors({})
    onClose()
    toast.success('Message sent to warehouse!')
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const selectedProblem = problemTypes.find(p => p.value === formData.problemType)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Warehouse" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Problem Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Problem Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {problemTypes.map((type) => (
              <label key={type.value} className="relative">
                <input
                  type="radio"
                  name="problemType"
                  value={type.value}
                  checked={formData.problemType === type.value}
                  onChange={(e) => handleInputChange('problemType', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.problemType === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{type.icon}</span>
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
          {errors.problemType && <p className="mt-1 text-sm text-red-600">{errors.problemType}</p>}
        </div>

        {/* Item Name and Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Item/Material Name *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.itemName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Screws, Components, Raw Materials"
              />
            </div>
            {errors.itemName && <p className="mt-1 text-sm text-red-600">{errors.itemName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity Affected
            </label>
            <input
              type="text"
              value={formData.quantityAffected}
              onChange={(e) => handleInputChange('quantityAffected', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 50 units, 2 boxes"
            />
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Urgency Level *
          </label>
          <div className="grid grid-cols-4 gap-3">
            {urgencyLevels.map((level) => (
              <label key={level.value} className="relative">
                <input
                  type="radio"
                  name="urgency"
                  value={level.value}
                  checked={formData.urgency === level.value}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-3 border-2 rounded-lg cursor-pointer transition-colors text-center ${
                  formData.urgency === level.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
                  <div className={`text-sm font-medium ${level.color}`}>
                    {level.label}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Details *
          </label>
          <textarea
            value={formData.details}
            onChange={(e) => handleInputChange('details', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.details ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Provide detailed information about the problem..."
          />
          {errors.details && <p className="mt-1 text-sm text-red-600">{errors.details}</p>}
        </div>

        {/* Summary */}
        {selectedProblem && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Message Summary
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Problem:</strong> {selectedProblem.label}</p>
              {formData.itemName && <p><strong>Item:</strong> {formData.itemName}</p>}
              {formData.quantityAffected && <p><strong>Quantity:</strong> {formData.quantityAffected}</p>}
              <p><strong>Urgency:</strong> {urgencyLevels.find(u => u.value === formData.urgency)?.label}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Send to Warehouse
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default WarehouseContactModal
