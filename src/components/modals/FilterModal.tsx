import React, { useState } from 'react'
import { Filter, X } from 'lucide-react'
import Modal from '../common/Modal'

interface FilterOption {
  label: string
  value: string
}

interface FilterField {
  name: string
  label: string
  type: 'select' | 'date' | 'dateRange' | 'text'
  options?: FilterOption[]
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: Record<string, any>) => void
  onReset: () => void
  fields: FilterField[]
  title?: string
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  fields,
  title = 'Filter Options'
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})

  const handleFieldChange = (fieldName: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleApply = () => {
    onApply(filterValues)
    onClose()
  }

  const handleReset = () => {
    setFilterValues({})
    onReset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.label}
            </label>
            {field.type === 'select' && field.options && (
              <select
                value={filterValues[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {field.type === 'text' && (
              <input
                type="text"
                value={filterValues[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            {field.type === 'date' && (
              <input
                type="date"
                value={filterValues[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            {field.type === 'dateRange' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                  <input
                    type="date"
                    value={filterValues[`${field.name}_from`] || ''}
                    onChange={(e) => handleFieldChange(`${field.name}_from`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                  <input
                    type="date"
                    value={filterValues[`${field.name}_to`] || ''}
                    onChange={(e) => handleFieldChange(`${field.name}_to`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default FilterModal
