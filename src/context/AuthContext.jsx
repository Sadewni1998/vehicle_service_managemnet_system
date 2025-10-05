import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, staffAPI } from '../utils/api'
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
  const [tokenExpiryWarning, setTokenExpiryWarning] = useState(false)
  const [userType, setUserType] = useState(localStorage.getItem('userType') || 'customer') // 'customer' or 'staff'

  useEffect(() => {
    if (token) {
      // Get user data from localStorage first
      const storedUser = localStorage.getItem('user')
      const storedUserType = localStorage.getItem('userType')
      
      if (storedUser && storedUserType) {
        setUser(JSON.parse(storedUser))
        setUserType(storedUserType)
        setLoading(false)
      } else {
        // If no stored user data, try to verify token
        if (userType === 'customer') {
          authAPI.getProfile()
            .then(response => {
              setUser(response.data.user)
            })
            .catch(error => {
              console.error('Token verification failed:', error)
              if (error.response?.status === 401) {
                logout()
              } else {
                console.warn('Network error during token verification, keeping user logged in')
                setLoading(false)
              }
            })
            .finally(() => {
              setLoading(false)
            })
        } else {
          // For staff, we don't have a profile endpoint yet, so just use stored data
          setLoading(false)
        }
      }
    } else {
      setLoading(false)
    }
  }, [token, userType])

  const login = async (credentials) => {
    try {
      // First try customer login
      try {
        const response = await authAPI.login(credentials)
        const { user: userData, token: authToken } = response.data
        
        localStorage.setItem('token', authToken)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('userType', 'customer')
        setToken(authToken)
        setUser(userData)
        setUserType('customer')
        
        toast.success('Customer login successful!')
        return { success: true, userType: 'customer' }
      } catch (customerError) {
        // If customer login fails, try staff login
        try {
          const staffResponse = await staffAPI.login(credentials)
          const { token: authToken } = staffResponse.data
          
          // Decode token to get staff info
          const payload = JSON.parse(atob(authToken.split('.')[1]))
          const staffData = {
            staffId: payload.staffId,
            email: payload.email,
            name: payload.name,
            role: payload.role
          }
          
          localStorage.setItem('token', authToken)
          localStorage.setItem('user', JSON.stringify(staffData))
          localStorage.setItem('userType', 'staff')
          setToken(authToken)
          setUser(staffData)
          setUserType('staff')
          
          toast.success('Staff login successful!')
          return { success: true, userType: 'staff', role: payload.role }
        } catch (staffError) {
          // Both logins failed
          const message = 'Invalid credentials. Please check your email and password.'
          toast.error(message)
          return { success: false, error: message }
        }
      }
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
      localStorage.setItem('userType', 'customer')
      setToken(authToken)
      setUser(newUser)
      setUserType('customer')
      
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
    localStorage.removeItem('userType')
    setToken(null)
    setUser(null)
    setUserType('customer')
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
      localStorage.setItem('userType', 'customer')
      setToken(authToken)
      setUser(userData)
      setUserType('customer')
      
      toast.success('Google sign-in successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Google sign-in failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const staffLogin = async (credentials) => {
    try {
      const response = await staffAPI.login(credentials)
      const { token: authToken } = response.data
      
      // Decode token to get staff info
      const payload = JSON.parse(atob(authToken.split('.')[1]))
      const staffData = {
        staffId: payload.staffId,
        email: payload.email,
        name: payload.name,
        role: payload.role
      }
      
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(staffData))
      localStorage.setItem('userType', 'staff')
      setToken(authToken)
      setUser(staffData)
      setUserType('staff')
      
      toast.success('Staff login successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Staff login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const staffRegister = async (staffData) => {
    try {
      const response = await staffAPI.register(staffData)
      toast.success('Staff registration successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Staff registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const refreshToken = async () => {
    try {
      // Try to get profile to refresh token validation
      const response = await authAPI.getProfile()
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      console.error('Token refresh failed:', error)
      if (error.response?.status === 401) {
        logout()
        return { success: false, needsLogin: true }
      }
      return { success: false, needsLogin: false }
    }
  }

  // Check token expiry and show warning
  const checkTokenExpiry = () => {
    if (!token) return

    try {
      // Decode JWT token to check expiry
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = payload.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime
      
      // Show warning if token expires in less than 30 minutes
      if (timeUntilExpiry < 30 * 60 * 1000 && timeUntilExpiry > 0) {
        setTokenExpiryWarning(true)
        toast.error('Your session will expire soon. Please save your work.')
      }
    } catch (error) {
      console.error('Error checking token expiry:', error)
    }
  }

  // Check token expiry every 5 minutes
  useEffect(() => {
    if (token) {
      checkTokenExpiry()
      const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000) // 5 minutes
      return () => clearInterval(interval)
    }
  }, [token])

  const value = {
    user,
    token,
    loading,
    tokenExpiryWarning,
    userType,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    googleSignIn,
    staffLogin,
    staffRegister,
    refreshToken,
    isAuthenticated: !!user,
    isStaff: userType === 'staff',
    isCustomer: userType === 'customer'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}




