import React, { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validation
    if (!username.trim()) {
      setError('Please enter your username')
      return
    }
    
    if (!newPassword.trim()) {
      setError('Please enter a new password')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    
    try {
      const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true'
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '' // Empty because endpoints include /api
      
      if (USE_MOCK) {
        setSuccess('Password reset successful! (Mock mode)')
        setTimeout(() => {
          onClose()
          setUsername('')
          setNewPassword('')
          setConfirmPassword('')
        }, 2000)
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'forgot_password',
          username: username.trim(),
          new_password: newPassword,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess('Password reset successfully! You can now login with your new password.')
        setTimeout(() => {
          onClose()
          setUsername('')
          setNewPassword('')
          setConfirmPassword('')
        }, 3000)
      } else {
        setError(data.message || 'Failed to reset password')
      }
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-surface rounded-medical shadow-medical-lg w-full max-w-md border border-light-cyan dark:border-muted-steel animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-steel-blue dark:text-sky-accent">
              Reset Password
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-light-cyan dark:hover:bg-muted-steel rounded-medical transition-colors duration-200 text-cool-gray hover:text-steel-blue dark:hover:text-sky-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-medical-red dark:border-red-accent rounded-medical text-sm text-medical-red dark:text-red-accent">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 rounded-medical text-sm text-green-700 dark:text-green-300">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-steel-blue dark:text-sky-accent mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-medical bg-white dark:bg-slate-surface border-2 border-light-cyan dark:border-muted-steel text-steel-blue dark:text-sky-accent placeholder-cool-gray focus:border-sky-blue dark:focus:border-sky-accent focus:ring-2 focus:ring-sky-blue/20 dark:focus:ring-sky-accent/20 transition-all duration-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-steel-blue dark:text-sky-accent mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-11 rounded-medical bg-white dark:bg-slate-surface border-2 border-light-cyan dark:border-muted-steel text-steel-blue dark:text-sky-accent placeholder-cool-gray focus:border-sky-blue dark:focus:border-sky-accent focus:ring-2 focus:ring-sky-blue/20 dark:focus:ring-sky-accent/20 transition-all duration-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cool-gray hover:text-sky-blue dark:hover:text-sky-accent transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-steel-blue dark:text-sky-accent mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 pr-11 rounded-medical bg-white dark:bg-slate-surface border-2 border-light-cyan dark:border-muted-steel text-steel-blue dark:text-sky-accent placeholder-cool-gray focus:border-sky-blue dark:focus:border-sky-accent focus:ring-2 focus:ring-sky-blue/20 dark:focus:ring-sky-accent/20 transition-all duration-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cool-gray hover:text-sky-blue dark:hover:text-sky-accent transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-medical bg-light-cyan dark:bg-muted-steel text-steel-blue dark:text-sky-accent font-semibold hover:bg-light-cyan/80 dark:hover:bg-muted-steel/80 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-medical bg-gradient-to-r from-steel-blue to-sky-blue dark:from-sky-accent dark:to-steel-blue text-white font-semibold hover:shadow-medical-lg transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordModal

