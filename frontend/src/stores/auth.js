import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', () => {
  const toast = useToast()
  
  // State
  const user = ref(null)
  const token = ref(null)
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.isAdmin || false)

  // Actions
  const initializeAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  const setAuth = (authData) => {
    token.value = authData.token
    user.value = authData.user
    
    localStorage.setItem('token', authData.token)
    localStorage.setItem('user', JSON.stringify(authData.user))
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const register = async (userData) => {
    try {
      isLoading.value = true
      const response = await authService.register(userData)
      
      if (response.success) {
        setAuth(response)
        toast.success('Registration successful! Welcome to Skill Swap!')
        return response
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const login = async (credentials) => {
    try {
      isLoading.value = true
      const response = await authService.login(credentials)
      
      if (response.success) {
        setAuth(response)
        toast.success(`Welcome back, ${response.user.name}!`)
        return response
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    clearAuth()
    authService.logout()
    toast.info('You have been logged out successfully')
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const refreshUser = async () => {
    try {
      const response = await authService.getMe()
      if (response.success) {
        updateUser(response.user)
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      // If refresh fails due to invalid token, logout user
      if (error.response?.status === 401) {
        logout()
      }
    }
  }

  const updatePassword = async (passwordData) => {
    try {
      isLoading.value = true
      const response = await authService.updatePassword(passwordData)
      
      if (response.success) {
        toast.success('Password updated successfully')
        return response
      }
    } catch (error) {
      console.error('Password update error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Initialize auth on store creation
  initializeAuth()

  return {
    // State
    user,
    token,
    isLoading,
    
    // Getters
    isAuthenticated,
    isAdmin,
    
    // Actions
    register,
    login,
    logout,
    updateUser,
    refreshUser,
    updatePassword,
    initializeAuth
  }
})
