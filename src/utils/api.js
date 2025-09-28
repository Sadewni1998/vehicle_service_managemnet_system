import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
}

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getUserBookings: (params) => api.get('/bookings/user', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, status),
  delete: (id) => api.delete(`/bookings/${id}`),
  getStats: () => api.get('/bookings/stats'),
}

// Contact API
export const contactAPI = {
  submit: (messageData) => api.post('/contact', messageData),
  getAll: (params) => api.get('/contact', { params }),
  getById: (id) => api.get(`/contact/${id}`),
  updateStatus: (id, status) => api.put(`/contact/${id}/status`, status),
  delete: (id) => api.delete(`/contact/${id}`),
  getStats: () => api.get('/contact/stats'),
}

// General API
export const generalAPI = {
  getServices: () => api.get('/users/services'),
  getParts: (params) => api.get('/users/parts', { params }),
  getPartCategories: () => api.get('/users/parts/categories'),
  getPartBrands: () => api.get('/users/parts/brands'),
  getTeam: () => api.get('/users/team'),
  getTestimonials: (params) => api.get('/users/testimonials', { params }),
  getVehicles: () => api.get('/users/vehicles'),
  addVehicle: (vehicleData) => api.post('/users/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/users/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/users/vehicles/${id}`),
  healthCheck: () => api.get('/health'),
}

export default api




