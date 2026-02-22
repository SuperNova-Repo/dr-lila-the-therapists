import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi'
import { useChatStore } from '../../stores/chatStore'
import { chatService } from '../../services/chat'
import { voiceService } from '../../services/voice'
import MessageBubble from './MessageBubble'

function ChatInterface() {
  const { t } = useTranslation()
  const { chatId } = useParams()
  const { currentChat, messages, setMessages, addMessage, isLoading, setLoading } = useChatStore()
  
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const messagesEndRef = useRef(null)
  const audioChunks = useRef([])

  useEffect(() => {
    if (chatId) {
      loadChat()
    } else {
      setMessages([])
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChat = async () => {
    try {
      const chat = await chatService.getChat(chatId)
      setMessages(chat.messages || [])
    } catch (err) {
      console.error('Error loading chat:', err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || !chatId) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    try {
      const response = await chatService.sendMessage(chatId, userMessage)
      
      // Add user message (it's already in the response from backend)
      // But we add it optimistically for better UX
      const tempUserMsg = {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      }
      addMessage(tempUserMsg)
      
      // Add bot response
      addMessage(response)
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      audioChunks.current = []
      
      recorder.ondataavailable = (e) => {
        audioChunks.current.push(e.data)
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
        await handleAudioTranscription(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Mikrofon-Zugriff wurde verweigert')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const handleAudioTranscription = async (audioBlob) => {
    setLoading(true)
    try {
      const result = await voiceService.speechToText(audioBlob)
      setInput(result.text)
    } catch (err) {
      console.error('Error transcribing audio:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-400 mb-4">
            💜 Willkommen bei Dr. Lila
          </h2>
          <p className="text-dark-text opacity-75">
            Erstelle einen neuen Chat oder wähle einen bestehenden aus
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💜</div>
              <h3 className="text-xl font-semibold text-primary-400 mb-2">
                Hallo! Ich bin Dr. Lila
              </h3>
              <p className="text-dark-text opacity-75">
                Wie kann ich dir heute helfen?
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-primary-400">
            <div className="animate-pulse">●</div>
            <div className="animate-pulse animation-delay-200">●</div>
            <div className="animate-pulse animation-delay-400">●</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-dark-border p-4 bg-dark-card">
        <div className="flex items-end space-x-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              p-3 rounded-lg transition-colors flex-shrink-0
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-dark-border hover:bg-primary-600'
              }
            `}
            title={isRecording ? t('stop_recording') : t('voice_input')}
          >
            {isRecording ? <FiMicOff size={20} /> : <FiMic size={20} />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('type_message')}
            className="input flex-1 resize-none"
            rows="1"
            style={{ maxHeight: '120px' }}
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-primary p-3 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('send')}
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface