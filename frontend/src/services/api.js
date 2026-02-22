import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  // Versuche Token aus mehreren Quellen zu holen
  const token = localStorage.getItem('auth-token') || 
                localStorage.getItem('token')
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('🔑 API: Adding token to request', config.url)
  } else {
    console.warn('⚠️ API: No token found for request', config.url)
  }
  
  return config
}, (error) => {
  console.error('❌ API Request Error:', error)
  return Promise.reject(error)
})

// Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, error.response?.status)
    
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized - clearing auth')
      localStorage.removeItem('auth-token')
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
