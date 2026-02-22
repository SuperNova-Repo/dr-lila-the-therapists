import api from './api'

export const authService = {
  async register(username, email, password) {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
    })
    return response.data
  },

  async login(username, password) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    
    console.log('🔑 authService.login response:', response.data)
    return response.data
  },

  async getMe() {
    const response = await api.get('/auth/me')
    console.log('👤 authService.getMe response:', response.data)
    return response.data
  },

  async deleteAccount() {
    await api.delete('/auth/delete-account')
  },
}
