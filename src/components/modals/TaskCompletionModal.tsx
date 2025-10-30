import React, { useState, useEffect } from 'react'
import { X, Upload, FileText, Clock, Wrench, Hash, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

interface TaskCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  jobOrder: any
  onSuccess: (jobOrderId: string) => void
}

interface TaskCompletionData {
  jobOrderId: string
  operation: string
  actualTimeMinutes: number
  serialNumbers: string[]
  notes: string
  files: File[]
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  onClose,
  jobOrder,
  onSuccess
}) => {
  const [formData, setFormData] = useState<TaskCompletionData>({
    jobOrderId: jobOrder?.id || '',
    operation: '',
    actualTimeMinutes: 0,
    serialNumbers: [],
    notes: '',
    files: []
  })
  const [operations, setOperations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [serialNumberInput, setSerialNumberInput] = useState('')

  useEffect(() => {
    if (isOpen && jobOrder) {
      setFormData({
        jobOrderId: jobOrder.id,
        operation: '',
        actualTimeMinutes: 0,
        serialNumbers: [],
        notes: '',
        files: []
      })
      loadOperations()
    }
  }, [isOpen, jobOrder])

  const loadOperations = async () => {
    try {
      const ops = await api.getOperations()
      setOperations(ops)
    } catch (error) {
      console.error('Error loading operations:', error)
      toast.error('Failed to load operations')
    }
  }

  const handleInputChange = (field: keyof TaskCompletionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSerialNumber = () => {
    if (serialNumberInput.trim()) {
      setFormData(prev => ({
        ...prev,
        serialNumbers: [...prev.serialNumbers, serialNumberInput.trim()]
      }))
      setSerialNumberInput('')
    }
  }

  const removeSerialNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      serialNumbers: prev.serialNumbers.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.operation || formData.actualTimeMinutes <= 0 || formData.serialNumbers.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('job_order_id', formData.jobOrderId)
      submitData.append('operation', formData.operation)
      submitData.append('actual_time_minutes', formData.actualTimeMinutes.toString())
      submitData.append('serial_numbers', JSON.stringify(formData.serialNumbers))
      submitData.append('notes', formData.notes)
      
      // Append files
      formData.files.forEach((file, index) => {
        submitData.append(`file_${index}`, file)
      })

      // Submit to API
      const response = await fetch('/api/task_completion.php', {
        method: 'POST',
        credentials: 'include',
        body: submitData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Task completion submitted successfully! Data sent to supervisor.')
        onSuccess(formData.jobOrderId)
        onClose()
      } else {
        toast.error(result.message || 'Failed to submit task completion')
      }
    } catch (error) {
      console.error('Error submitting task completion:', error)
      toast.error('Failed to submit task completion. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Submit Task Completion</h3>
                  <p className="text-blue-100 text-sm">Job Order: {jobOrder?.title || jobOrder?.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>

                {/* Operation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Wrench className="w-4 h-4 inline mr-2" />
                    Operation *
                  </label>
                  <select
                    value={formData.operation}
                    onChange={(e) => handleInputChange('operation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Operation</option>
                    {operations.map((op) => (
                      <option key={op.operation_id} value={op.operation_name}>
                        {op.operation_name} ({op.standard_time_minutes || op.standard_time} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actual Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Actual Time (minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.actualTimeMinutes}
                    onChange={(e) => handleInputChange('actualTimeMinutes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter time in minutes"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter any additional notes..."
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Job Order ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Job Order ID
                  </label>
                  <input
                    type="text"
                    value={formData.jobOrderId}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>

                {/* Serial Numbers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Serial Numbers *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={serialNumberInput}
                        onChange={(e) => setSerialNumberInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSerialNumber())}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter serial number"
                      />
                      <button
                        type="button"
                        onClick={addSerialNumber}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {formData.serialNumbers.map((sn, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-900 dark:text-white">{sn}</span>
                          <button
                            type="button"
                            onClick={() => removeSerialNumber(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Attach Files
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {formData.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-900 dark:text-white truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Submit Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TaskCompletionModal
