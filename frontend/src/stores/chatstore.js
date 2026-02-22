import { create } from 'zustand'

export const useChatStore = create((set) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  
  setChats: (chats) => set({ chats }),
  
  setCurrentChat: (chat) => set({ currentChat: chat }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  deleteMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(m => m.id !== messageId)
  })),
  
  setLoading: (isLoading) => set({ isLoading })
}))