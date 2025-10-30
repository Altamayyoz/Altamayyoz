import React, { useEffect, useState } from 'react'
import { Activity, Search, Filter, RefreshCw, Download, Trash2 } from 'lucide-react'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { toast } from 'react-hot-toast'

// Role icons with creative designs
const RoleIcons = {
  Supervisor: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#supervisorGradient)" opacity="0.2"/>
      <path d="M32 12L28 22L32 32L36 22L32 12Z" fill="url(#supervisorGradient)"/>
      <rect x="22" y="32" width="20" height="16" rx="3" fill="url(#supervisorGradient)"/>
      <circle cx="24" cy="42" r="2" fill="white"/>
      <circle cx="40" cy="42" r="2" fill="white"/>
      <rect x="26" y="44" width="12" height="2" rx="1" fill="white"/>
      <defs>
        <linearGradient id="supervisorGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6"/>
          <stop offset="1" stopColor="#6366F1"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Technician: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#technicianGradient)" opacity="0.2"/>
      <rect x="20" y="14" width="24" height="12" rx="3" fill="url(#technicianGradient)"/>
      <rect x="14" y="26" width="36" height="24" rx="4" fill="url(#technicianGradient)"/>
      <circle cx="24" cy="38" r="2" fill="white"/>
      <circle cx="40" cy="38" r="2" fill="white"/>
      <rect x="22" y="44" width="20" height="2" rx="1" fill="white"/>
      <path d="M32 16L28 26L32 36L36 26L32 16Z" fill="white" opacity="0.8"/>
      <defs>
        <linearGradient id="technicianGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981"/>
          <stop offset="1" stopColor="#059669"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  PlanningEngineer: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#plannerGradient)" opacity="0.2"/>
      <rect x="16" y="18" width="32" height="28" rx="3" fill="url(#plannerGradient)"/>
      <circle cx="22" cy="26" r="1.5" fill="white"/>
      <circle cx="32" cy="26" r="1.5" fill="white"/>
      <circle cx="22" cy="34" r="1.5" fill="white"/>
      <circle cx="32" cy="34" r="1.5" fill="white"/>
      <circle cx="42" cy="34" r="1.5" fill="white"/>
      <circle cx="22" cy="42" r="1.5" fill="white"/>
      <circle cx="32" cy="42" r="1.5" fill="white"/>
      <circle cx="42" cy="42" r="1.5" fill="white"/>
      <path d="M28 16L36 16M28 48L36 48" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="plannerGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B"/>
          <stop offset="1" stopColor="#D97706"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Admin: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#adminGradient)" opacity="0.2"/>
      <circle cx="32" cy="20" r="8" fill="url(#adminGradient)"/>
      <path d="M16 44C16 36 20 30 32 30C44 30 48 36 48 44" stroke="url(#adminGradient)" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="28" cy="20" r="1.5" fill="white"/>
      <circle cx="36" cy="20" r="1.5" fill="white"/>
      <path d="M28 24L32 28L36 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="adminGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EF4444"/>
          <stop offset="1" stopColor="#DC2626"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  ProductionWorker: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#workerGradient)" opacity="0.2"/>
      <rect x="20" y="14" width="24" height="14" rx="3" fill="url(#workerGradient)"/>
      <rect x="14" y="28" width="36" height="20" rx="4" fill="url(#workerGradient)"/>
      <circle cx="24" cy="38" r="2" fill="white"/>
      <circle cx="40" cy="38" r="2" fill="white"/>
      <rect x="22" y="42" width="20" height="2" rx="1" fill="white"/>
      <circle cx="32" cy="18" r="3" fill="white" opacity="0.9"/>
      <defs>
        <linearGradient id="workerGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6"/>
          <stop offset="1" stopColor="#2563EB"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  QualityInspector: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#inspectorGradient)" opacity="0.2"/>
      <path d="M20 32L28 40L44 24" stroke="url(#inspectorGradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="32" cy="32" r="14" stroke="url(#inspectorGradient)" strokeWidth="3" fill="none"/>
      <defs>
        <linearGradient id="inspectorGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6"/>
          <stop offset="1" stopColor="#0D9488"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

interface ActivityLog {
  action: string
  user: string
  time: string
  type: string
  details?: string
  userRole?: string
}

const ActivityHistory: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await api.getRecentActivity(1000) // Get large amount
      setActivities(data)
    } catch (error) {
      console.error('Failed to load activities:', error)
      toast.error('Failed to load activity history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [])

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || activity.userRole === filterRole
    const matchesType = filterType === 'all' || activity.type === filterType
    
    return matchesSearch && matchesRole && matchesType
  })

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage)

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Unknown'
    const date = new Date(timeStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 7) {
      return date.toLocaleDateString()
    } else if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else if (diffMins > 0) {
      return `${diffMins}m ago`
    }
    return 'Just now'
  }

  const getRoleIcon = (role?: string) => {
    if (!role) return RoleIcons.Admin
    const roleMap: Record<string, keyof typeof RoleIcons> = {
      'Supervisor': 'Supervisor',
      'Technician': 'Technician',
      'PlanningEngineer': 'PlanningEngineer',
      'engineer': 'PlanningEngineer',
      'Admin': 'Admin',
      'admin': 'Admin',
      'ProductionWorker': 'ProductionWorker',
      'technician': 'ProductionWorker',
      'QualityInspector': 'QualityInspector',
      'quality_inspector': 'QualityInspector'
    }
    return RoleIcons[roleMap[role] || 'Admin']
  }

  const getRoleBadgeColor = (role?: string) => {
    const roleColors: Record<string, string> = {
      'Supervisor': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      'Technician': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
      'PlanningEngineer': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      'engineer': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      'Admin': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
      'ProductionWorker': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      'technician': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      'QualityInspector': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
    }
    return roleColors[role || 'Admin'] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }

  const exportActivities = () => {
    const csvContent = [
      ['Action', 'User', 'Role', 'Type', 'Time', 'Details'],
      ...filteredActivities.map(activity => [
        activity.action,
        activity.user,
        activity.userRole || 'Unknown',
        activity.type,
        activity.time,
        activity.details || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Activity history exported successfully')
  }

  const handleClearOldLogs = async () => {
    if (!confirm('Are you sure you want to clear logs older than 90 days?')) return
    
    try {
      await api.clearOldLogs(90)
      toast.success('Old logs cleared successfully')
      loadActivities()
    } catch (error) {
      toast.error('Failed to clear logs')
    }
  }

  // Get unique roles and types for filter
  const uniqueRoles = [...new Set(activities.map(a => a.userRole).filter(Boolean))]
  const uniqueTypes = [...new Set(activities.map(a => a.type).filter(Boolean))]

  return (
    <div className="flex h-[calc(100vh-120px)] bg-light-bg dark:bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-80 bg-white dark:bg-[#1e293b] border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-light-primary dark:text-dark-primary" />
          <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Activity History</h2>
        </div>

        {/* Statistics */}
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Total Activities</div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{activities.length}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Filtered Results</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{filteredActivities.length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-light-text dark:text-dark-text placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          <button
            onClick={loadActivities}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-lg hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportActivities}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleClearOldLogs}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear Old Logs
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Activity List */}
              <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-neutral-200 dark:border-neutral-700">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
                    Activity Log ({filteredActivities.length} {filteredActivities.length === 1 ? 'entry' : 'entries'})
                  </h3>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {paginatedActivities.length > 0 ? (
                    paginatedActivities.map((activity, index) => {
                      const IconComponent = getRoleIcon(activity.userRole)
                      return (
                        <div key={index} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                <IconComponent className="w-8 h-8" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <div className="text-sm font-medium text-light-text dark:text-dark-text mb-1">
                                    {activity.action}
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                      {activity.user}
                                    </span>
                                    {activity.userRole && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(activity.userRole)}`}>
                                        {activity.userRole}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                  {formatTime(activity.time)}
                                </div>
                              </div>
                              {activity.details && (
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded p-2">
                                  {activity.details}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                      No activities found
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-neutral-200 dark:border-neutral-700 rounded-lg text-light-text dark:text-dark-text hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-neutral-200 dark:border-neutral-700 rounded-lg text-light-text dark:text-dark-text hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityHistory

