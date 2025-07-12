import api from './api'

export const authService = {
  // Register new user
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Get current user
  async getMe() {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Update password
  async updatePassword(passwordData) {
    const response = await api.put('/auth/password', passwordData)
    return response.data
  },

  // Logout (client-side only)
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}
