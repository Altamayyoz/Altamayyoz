import React, { useState } from 'react'
import { FileText, Calendar, AlertCircle, CheckSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface CreateJobOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onJobOrderCreated?: () => void
}

const CreateJobOrderModal: React.FC<CreateJobOrderModalProps> = ({ isOpen, onClose, onJobOrderCreated }) => {
  const [formData, setFormData] = useState({
    jobOrderNumber: '',
    autoGenerate: true,
    productModel: 'A300',
    totalDevices: '',
    dueDate: '',
    priority: 'Medium',
    notes: '',
    assignedSupervisor: '',
    assignedTechnicians: [] as string[]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.autoGenerate && !formData.jobOrderNumber.trim()) {
      newErrors.jobOrderNumber = 'Job Order Number is required'
    }

    if (!formData.totalDevices) {
      newErrors.totalDevices = 'Total Devices is required'
    } else if (parseInt(formData.totalDevices) < 1) {
      newErrors.totalDevices = 'Total Devices must be at least 1'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due Date is required'
    } else {
      const selectedDate = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.dueDate = 'Due Date cannot be in the past'
      }
    }

    if (!formData.assignedSupervisor || formData.assignedSupervisor.trim() === '') {
      newErrors.assignedSupervisor = 'Assigned Supervisor is required'
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
      // Call real API
      const jobOrderData = {
        job_order_id: formData.jobOrderNumber,
        total_devices: parseInt(formData.totalDevices),
        due_date: formData.dueDate
      }
      
      const api = (await import('../../services/api')).default
      await api.createJobOrder(jobOrderData)
      
      toast.success('Job Order created successfully!')
      if (onJobOrderCreated) {
        onJobOrderCreated()
      }
      onClose()
      setFormData({
        jobOrderNumber: '',
        autoGenerate: true,
        productModel: 'A300',
        totalDevices: '',
        dueDate: '',
        priority: 'Medium',
        notes: '',
        assignedSupervisor: '',
        assignedTechnicians: []
      })
      setErrors({})
    } catch (error: any) {
      console.error('Create job order error:', error)
      toast.error(error.message || 'Failed to create job order')
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

  const generateJobOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `JO-${timestamp}-${random}`
  }

  React.useEffect(() => {
    if (formData.autoGenerate) {
      setFormData(prev => ({ ...prev, jobOrderNumber: generateJobOrderNumber() }))
    }
  }, [formData.autoGenerate])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Job Order" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Order Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Order Number *
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoGenerate}
                onChange={(e) => handleInputChange('autoGenerate', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-generate
              </label>
            </div>
            {!formData.autoGenerate && (
              <div className="flex-1">
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.jobOrderNumber}
                    onChange={(e) => handleInputChange('jobOrderNumber', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.jobOrderNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter job order number"
                  />
                </div>
                {errors.jobOrderNumber && <p className="mt-1 text-sm text-red-600">{errors.jobOrderNumber}</p>}
              </div>
            )}
          </div>
          {formData.autoGenerate && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Auto-generated number: <span className="font-mono font-semibold">{formData.jobOrderNumber}</span>
              </p>
            </div>
          )}
        </div>

        {/* Product Model and Total Devices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Model *
            </label>
            <select
              value={formData.productModel}
              onChange={(e) => handleInputChange('productModel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="A100">A100</option>
              <option value="A300">A300</option>
              <option value="A340">A340</option>
              <option value="SKGB">SKGB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Devices *
            </label>
            <input
              type="number"
              min="1"
              value={formData.totalDevices}
              onChange={(e) => handleInputChange('totalDevices', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.totalDevices ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter number of devices"
            />
            {errors.totalDevices && <p className="mt-1 text-sm text-red-600">{errors.totalDevices}</p>}
          </div>
        </div>

        {/* Due Date and Priority */}
        <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Assigned Supervisor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assigned Supervisor *
          </label>
          <select
            value={formData.assignedSupervisor}
            onChange={(e) => handleInputChange('assignedSupervisor', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.assignedSupervisor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select Supervisor</option>
            <option value="fiona.l">Fiona Li</option>
            <option value="george.h">George Hall</option>
            <option value="tess.o">Tess O'Neil</option>
          </select>
          {errors.assignedSupervisor && <p className="mt-1 text-sm text-red-600">{errors.assignedSupervisor}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter any additional notes or special instructions..."
          />
        </div>

        {/* Priority Indicator */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <AlertCircle className={`w-5 h-5 ${
            formData.priority === 'Critical' ? 'text-red-600' :
            formData.priority === 'High' ? 'text-orange-600' :
            formData.priority === 'Medium' ? 'text-yellow-600' :
            'text-green-600'
          }`} />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Priority Level: <span className={`font-semibold ${
              formData.priority === 'Critical' ? 'text-red-600' :
              formData.priority === 'High' ? 'text-orange-600' :
              formData.priority === 'Medium' ? 'text-yellow-600' :
              'text-green-600'
            }`}>{formData.priority}</span>
          </span>
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
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Create Job Order
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateJobOrderModal
