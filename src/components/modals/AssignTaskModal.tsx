import React, { useEffect, useState } from 'react'
import { Calendar, User, Clock, AlertCircle, CheckSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'
import api from '../../services/api'

interface AssignTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    task: '',
    assignTo: '', // user_id
    jobOrder: '', // job_order_id
    role: 'Technician',
    deadline: '',
    priority: 'Medium',
    instructions: '',
    estimatedHours: '',
    notifyAssignee: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const availableTasks = [
    'Assembly of A300 components',
    'Quality inspection of A340 batch',
    'Testing of SKGB devices',
    'Packaging and labeling',
    'Device calibration',
    'Final quality check',
    'Documentation review',
    'Equipment maintenance'
  ]

  const [availableWorkers, setAvailableWorkers] = useState<{ id: string; name: string }[]>([])

  const [availableJobOrders, setAvailableJobOrders] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const workers = await api.getUsersByRole('Technician')
        if (!workers.length) {
          // Seed defaults if no workers exist for this role
          await api.seedDefaultWorkers()
          const seeded = await api.getUsersByRole('Technician')
          setAvailableWorkers(seeded.map(w => ({ id: w.id, name: w.name })))
        } else {
          setAvailableWorkers(workers.map(w => ({ id: w.id, name: w.name })))
        }
      } catch (e) {}
      try {
        const jos = await api.getJobOrders()
        setAvailableJobOrders(jos.map(j => j.id))
      } catch (e) {}
    })()
  }, [isOpen])

  // Ensure workers present on open
  useEffect(() => {
    if (!isOpen) return
    setFormData(prev => ({ ...prev, role: 'Technician' }))
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.task.trim()) {
      newErrors.task = 'Task is required'
    }

    // role is fixed to Technician

    if (!formData.assignTo) {
      newErrors.assignTo = 'Please select a worker to assign the task to'
    }

    if (!formData.jobOrder) {
      newErrors.jobOrder = 'Job Order is required'
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required'
    } else {
      const selectedDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.deadline = 'Deadline cannot be in the past'
      }
    }

    if (!formData.estimatedHours) {
      newErrors.estimatedHours = 'Estimated hours is required'
    } else if (parseInt(formData.estimatedHours) < 1) {
      newErrors.estimatedHours = 'Estimated hours must be at least 1'
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
      const ok = await api.createAssignment({
        jobOrderId: formData.jobOrder,
        assignedToUserId: formData.assignTo,
        assignedRole: 'Technician',
        notes: formData.instructions
      })
      if (ok) {
        const assigneeName = availableWorkers.find(w => w.id === formData.assignTo)?.name || 'Unknown'
        toast.success(`Task assigned to ${assigneeName} successfully!`)
        onClose()
        setFormData({
          task: '',
          assignTo: '',
          jobOrder: '',
          role: 'Technician',
          deadline: '',
          priority: 'Medium',
          instructions: '',
          estimatedHours: '',
          notifyAssignee: true
        })
        setErrors({})
      } else {
        toast.error('Failed to assign task')
      }
    } catch (error) {
      toast.error('Failed to assign task')
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Task *
          </label>
          <select
            value={formData.task}
            onChange={(e) => handleInputChange('task', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.task ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select a task</option>
            {availableTasks.map((task) => (
              <option key={task} value={task}>{task}</option>
            ))}
          </select>
          {errors.task && <p className="mt-1 text-sm text-red-600">{errors.task}</p>}
        </div>

        {/* Assign To and Job Order */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
              Technician
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Worker *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.assignTo}
                  onChange={(e) => handleInputChange('assignTo', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.assignTo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select worker</option>
                  {availableWorkers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.assignTo && <p className="mt-1 text-sm text-red-600">{errors.assignTo}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Order *
            </label>
            <select
              value={formData.jobOrder}
              onChange={(e) => handleInputChange('jobOrder', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.jobOrder ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select job order</option>
              {availableJobOrders.map((jobOrder) => (
                <option key={jobOrder} value={jobOrder}>{jobOrder}</option>
              ))}
            </select>
            {errors.jobOrder && <p className="mt-1 text-sm text-red-600">{errors.jobOrder}</p>}
          </div>
        </div>

        {/* Deadline and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deadline *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.deadline ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
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

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estimated Hours *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              min="1"
              max="24"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.estimatedHours ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter estimated hours"
            />
          </div>
          {errors.estimatedHours && <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instructions
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => handleInputChange('instructions', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter detailed instructions for the task..."
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

        {/* Notification Options */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notifyAssignee}
              onChange={(e) => handleInputChange('notifyAssignee', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Notify assignee via email about the new task
            </span>
          </label>
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
                Assigning...
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                Assign Task
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AssignTaskModal
