import api from './api'

export const settingsService = {
  async getProfile() {
    const response = await api.get('/settings/profile')
    return response.data
  },

  async updateProfile(data) {
    const response = await api.put('/settings/profile', data)
    return response.data
  },

  async uploadProfilePicture(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/settings/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getVoices() {
    const response = await api.get('/settings/voices')
    return response.data
  },
} 
