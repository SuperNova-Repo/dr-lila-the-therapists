import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiTrash2, FiMessageSquare } from 'react-icons/fi'
import { useChatStore } from '../../stores/authStore'
import { chatService } from '../../services/chat'

function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { chatId } = useParams()
  const { chats, setChats, currentChat, setCurrentChat } = useChatStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const data = await chatService.listChats()
      setChats(data)
    } catch (err) {
      console.error('Error loading chats:', err)
    }
  }

  const handleNewChat = async () => {
    setLoading(true)
    try {
      const newChat = await chatService.createChat()
      setChats([newChat, ...chats])
      setCurrentChat(newChat)
      navigate(`/chat/${newChat.id}`)
    } catch (err) {
      console.error('Error creating chat:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async (chatIdToDelete, e) => {
    e.stopPropagation()
    
    if (!confirm(t('are_you_sure'))) return

    try {
      await chatService.deleteChat(chatIdToDelete)
      setChats(chats.filter(c => c.id !== chatIdToDelete))
      
      if (currentChat?.id === chatIdToDelete) {
        setCurrentChat(null)
        navigate('/')
      }
    } catch (err) {
      console.error('Error deleting chat:', err)
    }
  }

  const handleSelectChat = (chat) => {
    setCurrentChat(chat)
    navigate(`/chat/${chat.id}`)
  }

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
      <div className="p-4 border-b border-dark-border">
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          <FiPlus size={20} />
          <span>{t('new_chat')}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-dark-text opacity-50">
            {t('no_chats')}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`
                  group flex items-center justify-between p-3 rounded-lg cursor-pointer
                  transition-colors duration-200
                  ${chat.id === parseInt(chatId) 
                    ? 'bg-primary-600/20 border border-primary-500' 
                    : 'hover:bg-dark-border'
                  }
                `}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FiMessageSquare size={18} className="text-primary-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-dark-text opacity-50">
                      {new Date(chat.updated_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                  title={t('delete_chat')}
                >
                  <FiTrash2 size={16} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar