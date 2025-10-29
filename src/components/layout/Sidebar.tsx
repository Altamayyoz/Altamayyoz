import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { Role } from '../../types'

const NAV_BY_ROLE: Record<Role, Array<{ to: string; label: string }>> = {
  Admin: [
    { to: '/admin-dashboard', label: '🛠️ Admin Dashboard' },
    { to: '/job-orders', label: '📋 Job Orders' },
    { to: '/device-tracking', label: '📱 Device Tracking' }
  ],
  ProductionWorker: [
    { to: '/production-dashboard', label: '🔧 Production Dashboard' },
    { to: '/production-work-logs', label: '📝 My Work Logs' },
    { to: '/job-orders', label: '📋 Job Orders' }
  ],
  Supervisor: [
    { to: '/supervisor-dashboard', label: '👔 Supervisor Dashboard' },
    { to: '/work-approvals', label: '✅ Work Approvals' },
    { to: '/job-orders', label: '📋 Job Orders' }
  ],
  PlanningEngineer: [
    { to: '/planner-dashboard', label: '🗓️ Planner Dashboard' },
    { to: '/job-orders', label: '📋 Job Orders' },
    { to: '/device-tracking', label: '📱 Device Tracking' }
  ],
  TestPersonnel: [
    { to: '/test-dashboard', label: '🧪 Test Dashboard' },
    { to: '/test-logs', label: '📊 My Test Logs' },
    { to: '/job-orders', label: '📋 Job Orders' }
  ],
  QualityInspector: [
    { to: '/quality-dashboard', label: '🔍 Quality Dashboard' },
    { to: '/pending-inspections', label: '⏳ Pending Inspections' },
    { to: '/quality-reports', label: '📈 Quality Reports' },
    { to: '/job-orders', label: '📋 Job Orders' }
  ]
}

const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { user } = useAuth()
  const links = user ? NAV_BY_ROLE[user.role] : []
  return (
    <aside className="w-64 h-full bg-white dark:bg-[#1e293b] border-r border-neutral-200 dark:border-neutral-700 transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent bg-clip-text text-transparent">
              TTM
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Task Manager</p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
          >
            ✕
          </button>
        </div>
      </div>
      <nav className="px-4 pb-4">
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-light-primary dark:bg-dark-primary text-white shadow-md'
                      : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-neutral-700'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
