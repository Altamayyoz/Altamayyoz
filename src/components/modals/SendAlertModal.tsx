import React, { useState, useEffect } from 'react'
import { Send, AlertTriangle, Users, Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'
import api from '../../services/api'

interface SendAlertModalProps {
  isOpen: boolean
  onClose: () => void
  jobOrderId?: string
  defaultTarget?: 'supervisor' | 'admin'
  onAlertSent?: () => void
}

interface Supervisor {
  id: string
  name: string
  username: string
}

const SendAlertModal: React.FC<SendAlertModalProps> = ({ 
  isOpen, 
  onClose, 
  jobOrderId,
  defaultTarget,
  onAlertSent 
}) => {
  const [formData, setFormData] = useState({
    target: 'supervisor' as 'supervisor' | 'admin',
    alertType: 'instruction',
    message: '',
    severity: 'info' as 'info' | 'warning' | 'critical',
    selectedSupervisor: '' as string
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loadingSupervisors, setLoadingSupervisors] = useState(false)
  const [targetSelected, setTargetSelected] = useState(false)

  // Load supervisors when modal opens and target is supervisor
  useEffect(() => {
    if (isOpen && formData.target === 'supervisor') {
      loadSupervisors()
    }
  }, [isOpen, formData.target])

  // Set default target when modal opens
  useEffect(() => {
    if (isOpen && defaultTarget) {
      setFormData(prev => ({ ...prev, target: defaultTarget, selectedSupervisor: '' }))
      setTargetSelected(true) // If defaultTarget is provided, selection is already made
    } else if (isOpen) {
      setTargetSelected(false) // No default target, show both options
    }
  }, [isOpen, defaultTarget])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        target: 'supervisor',
        alertType: 'instruction',
        message: '',
        severity: 'info',
        selectedSupervisor: ''
      })
      setErrors({})
      setTargetSelected(false)
    }
  }, [isOpen])

  const loadSupervisors = async () => {
    setLoadingSupervisors(true)
    try {
      const allUsers = await api.getUsers()
      const supervisorUsers = allUsers.filter(u => u.role === 'supervisor').map(u => ({
        id: u.id,
        name: u.name,
        username: u.username
      }))
      setSupervisors(supervisorUsers)
    } catch (error) {
      console.error('Error loading supervisors:', error)
      toast.error('Failed to load supervisors')
    } finally {
      setLoadingSupervisors(false)
    }
  }

  const alertTypes = {
    supervisor: [
      { value: 'instruction', label: 'New Plan/Instruction' },
      { value: 'schedule_update', label: 'Schedule Update' },
      { value: 'priority_change', label: 'Priority Change' },
      { value: 'resource_allocation', label: 'Resource Allocation' }
    ],
    admin: [
      { value: 'resource_need', label: 'Resource Need' },
      { value: 'bottleneck', label: 'Project Bottleneck' },
      { value: 'escalation', label: 'Escalation Request' },
      { value: 'target_issue', label: 'Target/KPI Issue' }
    ]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate message
    if (!formData.message.trim()) {
      setErrors({ message: 'Message is required' })
      return
    }

    // Validate supervisor selection if target is supervisor
    if (formData.target === 'supervisor' && !formData.selectedSupervisor) {
      setErrors({ selectedSupervisor: 'Please select a supervisor' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Build message with supervisor name if applicable
      let finalMessage = formData.message
      if (formData.target === 'supervisor' && formData.selectedSupervisor) {
        const selectedSupervisor = supervisors.find(s => s.id === formData.selectedSupervisor)
        if (selectedSupervisor) {
          finalMessage = `To ${selectedSupervisor.name}: ${formData.message}`
        }
      }

      await api.sendAlert(
        formData.target,
        finalMessage,
        formData.alertType,
        formData.severity,
        jobOrderId
      )
      
      toast.success(`Alert sent to ${formData.target === 'supervisor' ? 'Supervisor' : 'Admin'} successfully!`)
      setFormData({
        target: 'supervisor',
        alertType: 'instruction',
        message: '',
        severity: 'info',
        selectedSupervisor: ''
      })
      onClose()
      if (onAlertSent) {
        onAlertSent()
      }
    } catch (error: any) {
      console.error('Send alert error:', error)
      const errorMessage = error?.message || 'Failed to send alert. Please try again.'
      toast.error(errorMessage)
      // Show specific field errors if available
      if (errorMessage.includes('Missing required fields')) {
        setErrors({ message: 'Please fill in all required fields' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      // When changing target, reset supervisor selection if switching to admin
      if (field === 'target' && value === 'admin') {
        return { ...prev, [field]: value, selectedSupervisor: '' }
      }
      return { ...prev, [field]: value }
    })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear supervisor error when switching to admin
    if (field === 'target' && value === 'admin' && errors.selectedSupervisor) {
      setErrors(prev => ({ ...prev, selectedSupervisor: '' }))
    }
    // Mark target as selected when user clicks on a target
    if (field === 'target') {
      setTargetSelected(true)
    }
  }

  const handleChangeTarget = () => {
    setTargetSelected(false)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Send Alert / Instruction" 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Send To *
            </label>
            {targetSelected && (
              <button
                type="button"
                onClick={handleChangeTarget}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change
              </button>
            )}
          </div>
          {!targetSelected ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange('target', 'supervisor')}
                className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <div className="font-medium">Supervisor</div>
                <div className="text-xs text-gray-500 mt-1">Instructions & Schedule Updates</div>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('target', 'admin')}
                className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <div className="font-medium">Admin</div>
                <div className="text-xs text-gray-500 mt-1">Resource Needs & Bottlenecks</div>
              </button>
            </div>
          ) : (
            <div className="p-4 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              {formData.target === 'supervisor' ? (
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 dark:text-blue-100">Supervisor</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Instructions & Schedule Updates</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 dark:text-blue-100">Admin</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Resource Needs & Bottlenecks</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Supervisor Selection (only for supervisor target) */}
        {formData.target === 'supervisor' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Supervisor *
            </label>
            {loadingSupervisors ? (
              <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Loading supervisors...
              </div>
            ) : supervisors.length > 0 ? (
              <select
                value={formData.selectedSupervisor}
                onChange={(e) => handleInputChange('selectedSupervisor', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.selectedSupervisor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">-- Select Supervisor --</option>
                {supervisors.map(supervisor => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name} ({supervisor.username})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                No supervisors available
              </div>
            )}
            {errors.selectedSupervisor && (
              <p className="mt-1 text-sm text-red-600">{errors.selectedSupervisor}</p>
            )}
          </div>
        )}

        {/* Alert Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Alert Type *
          </label>
          <select
            value={formData.alertType}
            onChange={(e) => handleInputChange('alertType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {alertTypes[formData.target].map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Severity *
          </label>
          <select
            value={formData.severity}
            onChange={(e) => handleInputChange('severity', e.target.value as 'info' | 'warning' | 'critical')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={`Enter your message to ${formData.target === 'supervisor' ? 'the supervisor' : 'admin'}...`}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message}</p>
          )}
        </div>

        {/* Job Order Context (if provided) */}
        {jobOrderId && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Related to Job Order: <strong>{jobOrderId}</strong></span>
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
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Alert
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default SendAlertModal

