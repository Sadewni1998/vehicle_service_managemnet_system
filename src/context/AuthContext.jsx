import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      // Verify token and get user data
      authAPI.getProfile()
        .then(response => {
          setUser(response.data.user)
        })
        .catch(error => {
          console.error('Token verification failed:', error)
          logout()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { user: userData, token: authToken } = response.data
      
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(authToken)
      setUser(userData)
      
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { user: newUser, token: authToken } = response.data
      
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(newUser))
      setToken(authToken)
      setUser(newUser)
      
      toast.success('Registration successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = (navigate) => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
    
    // Redirect to home page if navigate function is provided
    if (navigate) {
      navigate('/')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      const updatedUser = { ...user, ...profileData }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      toast.success('Profile updated successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      toast.success('Password changed successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const googleSignIn = async (googleToken) => {
    try {
      const response = await authAPI.googleSignIn(googleToken)
      const { user: userData, token: authToken } = response.data
      
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(authToken)
      setUser(userData)
      
      toast.success('Google sign-in successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Google sign-in failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    googleSignIn,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}




