import React, { useState, useEffect } from 'react'
import { Save, Calendar, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'
import api from '../../services/api'
import type { JobOrder } from '../../types'

interface EditJobOrderModalProps {
  isOpen: boolean
  onClose: () => void
  jobOrder: JobOrder
  onJobOrderUpdated?: () => void
}

// Map frontend status to backend status
const mapStatusToBackend = (status: string): string => {
  if (status === 'in_progress' || status === 'open') return 'active'
  if (status === 'on_hold') return 'on_hold'
  if (status === 'completed') return 'completed'
  return 'active'
}

// Map backend status to frontend status
const mapStatusToFrontend = (status: string): string => {
  if (status === 'active') return 'in_progress'
  if (status === 'on_hold' || status === 'completed') return status
  return 'in_progress'
}

const EditJobOrderModal: React.FC<EditJobOrderModalProps> = ({ isOpen, onClose, jobOrder, onJobOrderUpdated }) => {
  const [formData, setFormData] = useState({
    totalDevices: 0,
    dueDate: '',
    status: 'in_progress'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (jobOrder && isOpen) {
      setFormData({
        totalDevices: jobOrder.totalDevices || 0,
        dueDate: jobOrder.dueDate ? new Date(jobOrder.dueDate).toISOString().split('T')[0] : '',
        status: mapStatusToFrontend(jobOrder.status)
      })
      setErrors({})
      setIsLoading(false)
    }
  }, [jobOrder, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.totalDevices || formData.totalDevices < 1) {
      newErrors.totalDevices = 'Total Devices must be at least 1'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due Date is required'
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
      await api.updateJobOrder(jobOrder.id, {
        total_devices: formData.totalDevices,
        due_date: formData.dueDate,
        status: mapStatusToBackend(formData.status)
      })
      
      toast.success('Job Order updated successfully!')
      onClose()
      
      if (onJobOrderUpdated) {
        onJobOrderUpdated()
      }
    } catch (error: any) {
      console.error('Update job order error:', error)
      toast.error(error.message || 'Failed to update job order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!jobOrder) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Job Order: ${jobOrder.id || 'Order'}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Order ID (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Order ID
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={jobOrder.id}
              disabled
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Total Devices */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Devices *
          </label>
          <input
            type="number"
            min="1"
            value={formData.totalDevices}
            onChange={(e) => handleInputChange('totalDevices', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.totalDevices ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter number of devices"
          />
          {errors.totalDevices && <p className="mt-1 text-sm text-red-600">{errors.totalDevices}</p>}
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Due Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>
          {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="in_progress">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {/* Progress Info */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Progress: <span className="font-semibold">{jobOrder.progress}%</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Completed Devices: <span className="font-semibold">{jobOrder.completedDevices || 0}</span> / {jobOrder.totalDevices || 0}
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

export default EditJobOrderModal

