import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiPhone, FiPhoneOff } from 'react-icons/fi'
import { voiceService } from '../../services/voice'
import { chatService } from '../../services/chat'
import { useParams } from 'react-router-dom'

function VoiceChat() {
  const { t } = useTranslation()
  const { chatId } = useParams()
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      audioChunksRef.current = []
      
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
      }
      
      mediaRecorderRef.current = recorder
      setIsActive(true)
      startListening()
    } catch (err) {
      console.error('Error starting voice chat:', err)
      alert('Mikrofon-Zugriff verweigert')
    }
  }

  const stopVoiceChat = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    setIsActive(false)
    setIsListening(false)
  }

  const startListening = () => {
    if (mediaRecorderRef.current) {
      audioChunksRef.current = []
      mediaRecorderRef.current.start()
      setIsListening(true)
      
      // Auto-stop after 10 seconds (adjust as needed)
      setTimeout(() => {
        if (isListening) {
          stopListening()
        }
      }, 10000)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }

  const processAudio = async (audioBlob) => {
    try {
      // Convert speech to text
      const sttResult = await voiceService.speechToText(audioBlob)
      const userText = sttResult.text
      setTranscript(userText)

      if (!userText.trim()) {
        // Restart listening if no speech detected
        if (isActive) {
          setTimeout(startListening, 500)
        }
        return
      }

      // Send to LLM
      const response = await chatService.sendMessage(chatId, userText)
      
      // Convert response to speech
      const ttsResult = await voiceService.textToSpeech(response.content)
      
      // Play audio
      const audio = new Audio(ttsResult.audio_url)
      audio.onended = () => {
        // Restart listening after bot finishes speaking
        if (isActive) {
          setTimeout(startListening, 500)
        }
      }
      await audio.play()
      
    } catch (err) {
      console.error('Error processing audio:', err)
      if (isActive) {
        setTimeout(startListening, 500)
      }
    }
  }

  return (
    <div className="fixed bottom-24 right-8 z-50">
      <div className="relative">
        {isActive && (
          <div className="absolute -top-20 right-0 bg-dark-card border border-dark-border rounded-lg p-4 shadow-lg min-w-[200px]">
            <p className="text-xs text-dark-text opacity-75 mb-2">
              {isListening ? 'Zuhören...' : 'Verarbeiten...'}
            </p>
            {transcript && (
              <p className="text-sm">{transcript}</p>
            )}
          </div>
        )}

        <button
          onClick={isActive ? stopVoiceChat : startVoiceChat}
          className={`
            w-16 h-16 rounded-full flex items-center justify-center shadow-lg
            transition-all duration-300
            ${isActive 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-primary-600 hover:bg-primary-700'
            }
          `}
        >
          {isActive ? <FiPhoneOff size={28} /> : <FiPhone size={28} />}
        </button>
      </div>
    </div>
  )
}

export default VoiceChat 