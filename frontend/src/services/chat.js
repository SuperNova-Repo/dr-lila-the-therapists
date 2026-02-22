import api from './api'

export const chatService = {
  async createChat(title = 'Neue Konversation') {
    const response = await api.post('/chat/create', { title })
    return response.data
  },

  async listChats() {
    const response = await api.get('/chat/list')
    return response.data
  },

  async getChat(chatId) {
    const response = await api.get(`/chat/${chatId}`)
    return response.data
  },

  async deleteChat(chatId) {
    await api.delete(`/chat/${chatId}`)
  },

  async sendMessage(chatId, content) {
    const response = await api.post('/chat/message', {
      chat_id: chatId,
      content,
    })
    return response.data
  },

  async deleteMessage(messageId) {
    await api.delete(`/chat/message/${messageId}`)
  },

  async regenerateMessage(messageId) {
    const response = await api.post(`/chat/regenerate/${messageId}`)
    return response.data
  },
}