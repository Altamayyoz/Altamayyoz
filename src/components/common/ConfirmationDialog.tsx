import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: 'danger' | 'success' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  confirmButtonStyle?: string
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  confirmButtonStyle
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
    }
  }

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      default:
        return 'bg-red-600 hover:bg-red-700 text-white'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-gray-900 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        
        {/* Dialog */}
        <div className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-gray-700 ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-95'
        }`}>
          <div className="p-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  type === 'danger' ? 'bg-red-100 dark:bg-red-900/20' :
                  type === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                  type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  type === 'info' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {getIcon()}
                </div>
              </div>
              <div className="ml-5 flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {title}
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {message}
                </p>
                
                {/* Actions */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 border border-gray-300 dark:border-gray-600"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${confirmButtonStyle || getButtonClass()}`}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </div>
                    ) : (
                      confirmText
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog
