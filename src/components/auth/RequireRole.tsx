import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { Role } from '../../types'

const RequireRole: React.FC<{ roles: Role[]; children: React.ReactElement }> = ({ roles, children }) => {
  const { user } = useAuth()
  const loc = useLocation()
  
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc }} />
  }
  
  if (!roles.includes(user.role)) {
    return <Navigate to="/access-denied" replace state={{ attemptedPath: loc.pathname }} />
  }
  
  return children
}

export default RequireRole
