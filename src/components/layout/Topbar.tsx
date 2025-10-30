import React from 'react'
import { Menu, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useApp } from '../../contexts/AppContext'

const Topbar: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { state, dispatch } = useApp()

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-[#1e293b] border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-300 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </button>
        <div className="text-lg font-bold text-light-primary dark:text-dark-primary">TTM</div>
      </div>
      <div className="flex items-center gap-6">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_DARK' })}
          className="dark-mode-toggle p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
          aria-label="Toggle dark mode"
        >
          {state.darkMode ? (
            <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          ) : (
            <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          )}
        </button>

        <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-600"></div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-light-text dark:text-dark-text">{user?.name}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{user?.role}</div>
          </div>
          <button 
            onClick={logout} 
            className="px-3 py-1.5 text-sm font-medium text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Topbar
