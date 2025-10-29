import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'

const RegisterPage: React.FC = () => {
  const { state, dispatch } = useApp()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('Technician')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const nav = useNavigate()

  const validateForm = () => {
    if (!name.trim()) {
      setError('Please enter your full name.')
      return false
    }
    
    if (!username.trim()) {
      setError('Please enter a username.')
      return false
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long.')
      return false
    }
    
    if (!password) {
      setError('Please enter a password.')
      return false
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      // Import API service
      const apiModule = await import('../services/api')
      const api = apiModule.default
      
      // Create user account in database
      const email = `${username}@example.com` // Generate email if needed
      const registeredUser = await api.register(name, username, email, password, role)
      
      if (registeredUser) {
        setSuccess('Account created successfully! Logging you in...')
        
        // Auto-login after successful registration
        // Map role for login (backend expects different role format)
        const loginRole = mapRoleForLogin(role)
        const user = await login(username, password, loginRole)
        
        if (user) {
          setTimeout(() => {
            nav('/')
          }, 1500)
        } else {
          setError('Account created, but login failed. Please try logging in manually.')
          setTimeout(() => {
            nav('/login', { state: { username, role: loginRole } })
          }, 2000)
        }
      } else {
        setError('Failed to create account. Please try again.')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to map role for login
  const mapRoleForLogin = (frontendRole: string): string => {
    const roleMap: Record<string, string> = {
      'PlanningEngineer': 'engineer',
      'ProductionWorker': 'technician',
      'Supervisor': 'supervisor',
      'Admin': 'admin',
      'TestPersonnel': 'test_personnel',
      'QualityInspector': 'quality_inspector',
      'Technician': 'technician',
      'ProductionManager': 'supervisor',
    }
    return roleMap[frontendRole] || 'technician'
  }

  const bgGradient = state.darkMode
    ? 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]'
    : 'bg-gradient-to-br from-[#f9fafb] via-white to-[#f3f4f6]'

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bgGradient} auth-screen relative overflow-hidden`}>
      {/* Animated background */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-light-accent dark:bg-dark-accent rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5 animate-float"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-light-primary dark:bg-dark-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5 animate-float animation-delay-2000"></div>

      <form onSubmit={handleSubmit} className="w-full max-w-md relative z-10">
        <div className="backdrop-glass bg-white/70 dark:bg-[#1e293b]/70 rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-white/5">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent bg-clip-text text-transparent">
              Create account
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Join Task Manager</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Full Name
              </label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-700/50 border-2 border-neutral-200 dark:border-neutral-600 text-light-text dark:text-dark-text placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-light-accent dark:focus:border-dark-accent focus:ring-2 focus:ring-light-accent/10 dark:focus:ring-dark-accent/10 transition-all duration-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Username
              </label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-700/50 border-2 border-neutral-200 dark:border-neutral-600 text-light-text dark:text-dark-text placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-light-accent dark:focus:border-dark-accent focus:ring-2 focus:ring-light-accent/10 dark:focus:ring-dark-accent/10 transition-all duration-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Role
              </label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-700/50 border-2 border-neutral-200 dark:border-neutral-600 text-light-text dark:text-dark-text focus:border-light-accent dark:focus:border-dark-accent focus:ring-2 focus:ring-light-accent/10 dark:focus:ring-dark-accent/10 transition"
              >
                <option value="Technician">Technician</option>
                <option value="Supervisor">Supervisor</option>
                <option value="PlanningEngineer">Planning Engineer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white dark:bg-neutral-700/50 border-2 border-neutral-200 dark:border-neutral-600 text-light-text dark:text-dark-text placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-light-accent dark:focus:border-dark-accent focus:ring-2 focus:ring-light-accent/10 dark:focus:ring-dark-accent/10 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-light-accent dark:hover:text-dark-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-light-accent/20 dark:focus:ring-dark-accent/20 rounded p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white dark:bg-neutral-700/50 border-2 border-neutral-200 dark:border-neutral-600 text-light-text dark:text-dark-text placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-light-accent dark:focus:border-dark-accent focus:ring-2 focus:ring-light-accent/10 dark:focus:ring-dark-accent/10 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-light-accent dark:hover:text-dark-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-light-accent/20 dark:focus:ring-dark-accent/20 rounded p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-light-primary dark:text-dark-primary font-semibold hover:underline transition">
              Sign in
            </Link>
          </p>
          
          <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg border border-neutral-200 dark:border-neutral-600">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-2">
              💡 Demo Information:
            </p>
            <ul className="text-xs text-neutral-500 dark:text-neutral-500 space-y-1">
              <li>• Password for all demo accounts: <code className="bg-white dark:bg-neutral-800 px-1 rounded text-light-primary dark:text-dark-primary">password</code></li>
              <li>• After registration, you'll be automatically logged in</li>
              <li>• Choose your role to access the appropriate dashboard</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}

export default RegisterPage
