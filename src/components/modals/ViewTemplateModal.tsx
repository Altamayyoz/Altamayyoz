import React from 'react'
import Modal from '../common/Modal'
import { FileText, Clock, Tag, Info } from 'lucide-react'

interface TaskTemplateLocal {
  id: string
  name: string
  category: string
  standardTime: number
  description: string
}

interface ViewTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  template: TaskTemplateLocal
  getCategoryColor: (category: string) => string
}

const ViewTemplateModal: React.FC<ViewTemplateModalProps> = ({ isOpen, onClose, template, getCategoryColor }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Template Details: ${template.name}`} size="lg">
      <div className="space-y-6">
        {/* Template Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Task Name
          </label>
          <p className="mt-1 text-gray-900 dark:text-white text-lg font-semibold">{template.name}</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Category
          </label>
          <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
        </div>

        {/* Standard Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Standard Time
          </label>
          <p className="mt-1 text-gray-900 dark:text-white">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{template.standardTime}</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">minutes</span>
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Description
          </label>
          <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{template.description}</p>
          </div>
        </div>

        {/* Template ID */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Template ID: {template.id}</p>
        </div>
      </div>
    </Modal>
  )
}

export default ViewTemplateModal

