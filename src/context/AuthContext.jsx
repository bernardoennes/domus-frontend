import { createContext, useContext, useState } from 'react'
import { getCurrentSession, loginUser, logoutUser } from '../services/authService.js'

const AuthContext = createContext(null)

function loadStoredSession() {
  try {
    return getCurrentSession()
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadStoredSession)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const signIn = async (credentials) => {
    setIsLoading(true)
    setError('')

    try {
      const loginData = await loginUser({
        cpf: credentials.cpf,
        password: credentials.password,
      })

      setSession(loginData)
      return loginData
    } catch (loginError) {
      setError(loginError.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setError('')
    logoutUser()
    setSession(null)
  }

  const user = session?.user ?? null
  const membership = session?.membership ?? null

  const contextValue = {
    user,
    membership,
    error,
    isLoading,
    isAuthenticated: Boolean(user && membership),
    signIn,
    signOut,
    clearError: () => setError(''),
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }

  return context
}
