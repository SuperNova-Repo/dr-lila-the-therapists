import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiTrash2, FiRefreshCw, FiVolume2, FiCopy, FiCheck } from 'react-icons/fi'
import { chatService } from '../../services/chat'
import { voiceService } from '../../services/voice'
import { useChatStore } from '../../stores/chatstore'

function MessageBubble({ message }) {
  const { t } = useTranslation()
  const { deleteMessage: removeMessage, setMessages, messages } = useChatStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)

  const isBot = message.role === 'assistant'

  const handleDelete = async () => {
    if (!confirm(t('are_you_sure'))) return

    try {
      await chatService.deleteMessage(message.id)
      removeMessage(message.id)
    } catch (err) {
      console.error('Error deleting message:', err)
    }
  }

  const handleRegenerate = async () => {
    try {
      const newMessage = await chatService.regenerateMessage(message.id)
      const updatedMessages = messages.map(m => 
        m.id === message.id ? newMessage : m
      )
      setMessages(updatedMessages)
    } catch (err) {
      console.error('Error regenerating message:', err)
    }
  }

  const handlePlayAudio = async () => {
    if (isPlaying) return

    setIsPlaying(true)
    try {
      let url = audioUrl
      
      if (!url) {
        const result = await voiceService.textToSpeech(message.content)
        url = result.audio_url
        setAudioUrl(url)
      }

      const audio = new Audio(url)
      audio.onended = () => setIsPlaying(false)
      audio.onerror = () => setIsPlaying(false)
      await audio.play()
    } catch (err) {
      console.error('Error playing audio:', err)
      setIsPlaying(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} fade-in`}>
      <div className={`
        max-w-[70%] rounded-lg p-4 
        ${isBot 
          ? 'bg-dark-card border border-dark-border' 
          : 'bg-primary-600'
        }
      `}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold opacity-75">
            {isBot ? '💜 Dr. Lila' : 'Du'}
          </span>
          <span className="text-xs opacity-50">
            {new Date(message.created_at).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-dark-border/30">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-dark-border rounded transition-colors"
            title={t('copy')}
          >
            {copied ? <FiCheck size={16} className="text-green-400" /> : <FiCopy size={16} />}
          </button>

          {isBot && (
            <>
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className="p-1.5 hover:bg-dark-border rounded transition-colors disabled:opacity-50"
                title={t('voice_output')}
              >
                <FiVolume2 size={16} className={isPlaying ? 'animate-pulse' : ''} />
              </button>

              <button
                onClick={handleRegenerate}
                className="p-1.5 hover:bg-dark-border rounded transition-colors"
                title={t('regenerate')}
              >
                <FiRefreshCw size={16} />
              </button>
            </>
          )}

          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-500/20 rounded transition-colors ml-auto"
            title={t('delete_message')}
          >
            <FiTrash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble