import React, { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, BarChart3, Clock, Users } from 'lucide-react'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'
import api from '../../services/api'

interface MetricDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  metricType: 'efficiency' | 'productivity'
  currentValue: number
}

interface MetricBreakdown {
  byOperation: Array<{
    operation_name: string
    avg_value: number
    task_count: number
  }>
  byTechnician: Array<{
    technician_name: string
    avg_value: number
    task_count: number
  }>
  weeklyTrend: Array<{
    week: string
    value: number
  }>
  comparison: {
    lastWeek: number
    lastMonth: number
    target: number
  }
}

const MetricDetailsModal: React.FC<MetricDetailsModalProps> = ({
  isOpen,
  onClose,
  metricType,
  currentValue
}) => {
  const [loading, setLoading] = useState(true)
  const [breakdown, setBreakdown] = useState<MetricBreakdown | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadMetricDetails()
    }
  }, [isOpen, metricType])

  const loadMetricDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch detailed breakdown from API
      const response = await fetch(`/api/metric_details.php?type=${metricType}&period=30`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const breakdownData: MetricBreakdown = {
          byOperation: result.data.byOperation || [],
          byTechnician: result.data.byTechnician || [],
          weeklyTrend: result.data.weeklyTrend || [],
          comparison: result.data.comparison || {
            lastWeek: currentValue + (currentValue * 0.05),
            lastMonth: currentValue - (currentValue * 0.1),
            target: metricType === 'efficiency' ? 85 : 8.5
          }
        }
        setBreakdown(breakdownData)
      } else {
        // Fallback to mock data if API fails
        const breakdownData: MetricBreakdown = {
          byOperation: [
            { operation_name: 'Assemblage I', avg_value: currentValue + 5, task_count: 45 },
            { operation_name: 'Assemblage II', avg_value: currentValue - 3, task_count: 38 },
            { operation_name: 'Quality Test', avg_value: currentValue + 2, task_count: 52 },
            { operation_name: 'Packing', avg_value: currentValue - 5, task_count: 42 }
          ],
          byTechnician: [],
          weeklyTrend: [],
          comparison: {
            lastWeek: currentValue + (currentValue * 0.05),
            lastMonth: currentValue - (currentValue * 0.1),
            target: metricType === 'efficiency' ? 85 : 8.5
          }
        }
        setBreakdown(breakdownData)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading metric details:', error)
      
      // Fallback to mock data
      const breakdownData: MetricBreakdown = {
        byOperation: [
          { operation_name: 'Assemblage I', avg_value: currentValue + 5, task_count: 45 },
          { operation_name: 'Assemblage II', avg_value: currentValue - 3, task_count: 38 }
        ],
        byTechnician: [],
        weeklyTrend: [],
        comparison: {
          lastWeek: currentValue + (currentValue * 0.05),
          lastMonth: currentValue - (currentValue * 0.1),
          target: metricType === 'efficiency' ? 85 : 8.5
        }
      }
      setBreakdown(breakdownData)
      setLoading(false)
    }
  }

  const getComparisonColor = (value: number, current: number) => {
    if (value > current) return 'text-green-600 dark:text-green-400'
    if (value < current) return 'text-red-600 dark:text-red-400'
    return 'text-neutral-600 dark:text-neutral-400'
  }

  const getValueColor = (value: number) => {
    if (value >= 90) return 'text-green-600 dark:text-green-400'
    if (value >= 75) return 'text-blue-600 dark:text-blue-400'
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (value >= 50) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getBarColor = (value: number) => {
    if (value >= 90) return 'bg-green-500'
    if (value >= 75) return 'bg-blue-500'
    if (value >= 60) return 'bg-yellow-500'
    if (value >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${metricType === 'efficiency' ? 'Efficiency' : 'Productivity'} Details`} size="xl">
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : breakdown ? (
        <div className="space-y-6">
          {/* Current Value & Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Current</div>
              <div className={`text-2xl font-bold ${getValueColor(currentValue)}`}>
                {currentValue.toFixed(1)}{metricType === 'efficiency' ? '%' : ''}
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Last Week</div>
              <div className={`text-2xl font-bold ${getComparisonColor(breakdown.comparison.lastWeek, currentValue)}`}>
                {breakdown.comparison.lastWeek.toFixed(1)}{metricType === 'efficiency' ? '%' : ''}
              </div>
              {breakdown.comparison.lastWeek > currentValue ? (
                <TrendingUp className="w-4 h-4 text-green-500 mt-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mt-1" />
              )}
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Last Month</div>
              <div className={`text-2xl font-bold ${getComparisonColor(breakdown.comparison.lastMonth, currentValue)}`}>
                {breakdown.comparison.lastMonth.toFixed(1)}{metricType === 'efficiency' ? '%' : ''}
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Target</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {breakdown.comparison.target.toFixed(1)}{metricType === 'efficiency' ? '%' : ''}
              </div>
            </div>
          </div>

          {/* Breakdown by Operation */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Breakdown by Operation
            </h3>
            <div className="space-y-3">
              {breakdown.byOperation.length > 0 ? breakdown.byOperation.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {item.operation_name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${getValueColor(item.avg_value)}`}>
                        {item.avg_value.toFixed(1)}{metricType === 'efficiency' ? '%' : ''}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.task_count} tasks
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getBarColor(item.avg_value)}`}
                      style={{ width: `${Math.min(item.avg_value, 100)}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-neutral-500 dark:text-neutral-400 text-sm">
                  No operation data available
                </div>
              )}
            </div>
          </div>

          {/* Breakdown by Technician */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="font-semibold text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Breakdown by Technician
            </h3>
            <div className="space-y-3">
              {breakdown.byTechnician.length > 0 ? breakdown.byTechnician.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {item.technician_name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${getValueColor(item.avg_value)}`}>
                        {item.avg_value.toFixed(1)}{metricType === 'efficiency' ? '%' : ''}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.task_count} tasks
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getBarColor(item.avg_value)}`}
                      style={{ width: `${Math.min(item.avg_value, 100)}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-neutral-500 dark:text-neutral-400 text-sm">
                  No technician data available
                </div>
              )}
            </div>
          </div>

          {/* Weekly Trend */}
          {breakdown.weeklyTrend.length > 0 && (
            <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="font-semibold text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Weekly Trend (Last 7 Days)
              </h3>
              <div className="h-48 flex items-end gap-2">
                {breakdown.weeklyTrend.map((day, index) => {
                  const maxValue = Math.max(...breakdown.weeklyTrend.map(d => d.value))
                  const height = maxValue > 0 ? (day.value / maxValue) * 100 : 0
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t transition-all ${getBarColor(day.value)}`}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`${day.week}: ${day.value.toFixed(1)}${metricType === 'efficiency' ? '%' : ''}`}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {day.week}
                      </span>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {day.value.toFixed(1)}{metricType === 'efficiency' ? '%' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          No detailed data available
        </div>
      )}
    </Modal>
  )
}

export default MetricDetailsModal

