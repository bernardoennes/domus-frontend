import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { needsAdminSetup } from '../services/authService.js'

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function AdminRegistrationRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated || !needsAdminSetup()) {
    return <Navigate to={isAuthenticated ? '/home' : '/login'} replace />
  }

  return children
}

export function LoginRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return children
}