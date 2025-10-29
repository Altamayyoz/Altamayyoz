import React, { useState } from 'react'
import { Database, Download, Calendar, CheckSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'

interface BackupDBModalProps {
  isOpen: boolean
  onClose: () => void
}

const BackupDBModal: React.FC<BackupDBModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    backupName: '',
    includeUserData: true,
    includeJobOrders: true,
    includeDeviceHistory: true,
    includeTestLogs: false,
    includeQualityReports: false
  })
  const [isLoading, setIsLoading] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      // Auto-generate backup name with current date
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, backupName: `backup_${dateStr}` }))
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.backupName.trim()) {
      toast.error('Please enter a backup name')
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Backup created successfully!')
      onClose()
      setFormData({
        backupName: '',
        includeUserData: true,
        includeJobOrders: true,
        includeDeviceHistory: true,
        includeTestLogs: false,
        includeQualityReports: false
      })
    }, 2000)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Database Backup" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Backup Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Backup Name *
          </label>
          <div className="relative">
            <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={formData.backupName}
              onChange={(e) => handleInputChange('backupName', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter backup name"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Backup will be saved as: {formData.backupName}.sql
          </p>
        </div>

        {/* Data Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Data to Include
          </label>
          <div className="space-y-3">
            {[
              { key: 'includeUserData', label: 'User Data', description: 'User accounts, roles, and permissions' },
              { key: 'includeJobOrders', label: 'Job Orders', description: 'All job orders and their details' },
              { key: 'includeDeviceHistory', label: 'Device History', description: 'Device tracking and status changes' },
              { key: 'includeTestLogs', label: 'Test Logs', description: 'Test results and quality data' },
              { key: 'includeQualityReports', label: 'Quality Reports', description: 'Inspection reports and quality metrics' }
            ].map((option) => (
              <label key={option.key} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={formData[option.key as keyof typeof formData] as boolean}
                  onChange={(e) => handleInputChange(option.key, e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Backup Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Backup Information
              </h4>
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-200 space-y-1">
                <p>• Backup will be created at: {new Date().toLocaleString()}</p>
                <p>• Estimated size: ~2.5 MB</p>
                <p>• Backup will be stored for 30 days</p>
                <p>• You can restore from this backup anytime</p>
              </div>
            </div>
          </div>
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
            disabled={isLoading || !formData.backupName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Create Backup
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default BackupDBModal
