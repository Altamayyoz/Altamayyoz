import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Moon, Sun, Eye, EyeOff, LogIn, User, Lock, Activity } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { login } = useAuth()
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const loc = useLocation() as any

  useEffect(() => {
    if (loc?.state?.username) setUsername(loc.state.username)
  }, [loc?.state?.username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Basic validation
    if (!username.trim()) {
      setError('Please enter a username.')
      setLoading(false)
      return
    }
    
    if (!password.trim()) {
      setError('Please enter a password.')
      setLoading(false)
      return
    }
    
    // Login - authenticate against database only (role comes from database)
    try {
      const result = await login(username, password)
      
      if (result) {
        nav('/')
      } else {
        setError('Invalid credentials. Please check your username and password.')
      }
    } catch (err) {
      console.error('❌ Login error:', err)
      setError('Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ivory dark:bg-deep-navy relative overflow-hidden transition-colors duration-500">
      {/* Dark Mode Toggle - Always Visible */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_DARK' })}
        className="fixed top-4 right-4 z-50 p-3 rounded-medical bg-white dark:bg-slate-surface shadow-medical hover:shadow-medical-lg border border-light-cyan dark:border-muted-steel transition-all duration-500 hover:scale-105 active:scale-95 group"
        aria-label="Toggle dark mode"
      >
        {state.darkMode ? (
          <Sun className="w-5 h-5 text-steel-blue dark:text-sky-accent group-hover:rotate-180 transition-transform duration-500" />
        ) : (
          <Moon className="w-5 h-5 text-steel-blue dark:text-sky-accent group-hover:rotate-12 transition-transform duration-500" />
        )}
      </button>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-aqua-mist dark:bg-sky-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-sky-blue/30 dark:bg-sky-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000"></div>
      </div>

      {/* Medical grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0fbfc08_1px,transparent_1px),linear-gradient(to_bottom,#e0fbfc08_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#8ebcca08_1px,transparent_1px),linear-gradient(to_bottom,#8ebcca08_1px,transparent_1px)]"></div>

      <form onSubmit={handleSubmit} className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="backdrop-glass rounded-medical shadow-medical-lg p-8 border border-light-cyan/50 dark:border-muted-steel/50">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-medical bg-gradient-to-br from-steel-blue to-sky-blue mb-4 shadow-medical transform hover:scale-105 transition-transform duration-500">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-steel-blue dark:text-sky-accent mb-2">
              Welcome Back
            </h1>
            <p className="text-steel-blue/70 dark:text-cool-gray">Sign in to your Task Manager account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-medical-red dark:border-red-accent rounded-medical text-sm text-medical-red dark:text-red-accent flex items-center gap-2 animate-slide-in">
              <div className="w-4 h-4 rounded-full bg-medical-red flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4 mb-5">
            {/* Username */}
            <div className="group">
              <label className="block text-sm font-semibold text-steel-blue dark:text-sky-accent mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-blue" />
                Username
              </label>
              <div className="relative">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 pl-11 rounded-medical bg-white dark:bg-slate-surface border-2 border-light-cyan dark:border-muted-steel text-steel-blue dark:text-sky-accent placeholder-cool-gray focus:border-sky-blue dark:focus:border-sky-accent focus:ring-2 focus:ring-sky-blue/20 dark:focus:ring-sky-accent/20 transition-all duration-500 shadow-medical focus:shadow-medical-lg"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-gray pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-steel-blue dark:text-sky-accent mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-blue" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-medical bg-white dark:bg-slate-surface border-2 border-light-cyan dark:border-muted-steel text-steel-blue dark:text-sky-accent placeholder-cool-gray focus:border-sky-blue dark:focus:border-sky-accent focus:ring-2 focus:ring-sky-blue/20 dark:focus:ring-sky-accent/20 transition-all duration-500 shadow-medical focus:shadow-medical-lg"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-gray pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cool-gray hover:text-sky-blue dark:hover:text-sky-accent transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-sky-blue/20 rounded-medical p-1.5 hover:bg-light-cyan/50 dark:hover:bg-muted-steel password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between mb-5">
            <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer group">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((v) => !v)}
                className="w-4 h-4 rounded-medical border-2 border-light-cyan dark:border-muted-steel bg-white dark:bg-slate-surface text-sky-blue focus:ring-2 focus:ring-sky-blue/20 transition-all duration-500 cursor-pointer checked:border-sky-blue dark:checked:border-sky-accent"
              />
              <span className="text-sm text-steel-blue dark:text-sky-accent group-hover:text-sky-blue transition-colors duration-500">
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-sky-blue hover:text-steel-blue dark:text-sky-accent dark:hover:text-light-cyan transition-colors duration-500"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 bg-gradient-to-r from-steel-blue to-sky-blue dark:from-sky-accent dark:to-steel-blue text-white font-semibold rounded-medical shadow-medical-lg hover:shadow-medical-lg transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-500 flex items-center justify-center gap-2 mb-5"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign in</span>
              </>
            )}
          </button>

        </div>
      </form>
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}

export default LoginPage
