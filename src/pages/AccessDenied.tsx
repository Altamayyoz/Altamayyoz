import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ShieldX, ArrowLeft } from 'lucide-react'

const AccessDenied: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <ShieldX className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-light-text dark:text-dark-text mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
            You don't have permission to access this page. Your current role ({user?.role}) 
            doesn't match the required permissions for this area.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </Link>
            
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Need different access? Contact your administrator.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccessDenied
