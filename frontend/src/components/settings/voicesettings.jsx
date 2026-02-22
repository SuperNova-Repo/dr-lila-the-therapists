import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiPlay, FiSave } from 'react-icons/fi'
import { settingsService } from '../../services/settings'
import { voiceService } from '../../services/voice'

function VoiceSettings({ profile, onSave, loading }) {
  const { t } = useTranslation()
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(profile.voice_id)
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    loadVoices()
  }, [])

  const loadVoices = async () => {
    try {
      const data = await settingsService.getVoices()
      setVoices(data.voices || [])
    } catch (err) {
      console.error('Error loading voices:', err)
    }
  }

  const handlePreview = async (voiceId) => {
    if (playing === voiceId) return

    setPlaying(voiceId)
    try {
      const result = await voiceService.textToSpeech(
        'Hallo! Ich bin Dr. Lila.',
        voiceId
      )
      
      const audio = new Audio(result.audio_url)
      audio.onended = () => setPlaying(null)
      audio.onerror = () => setPlaying(null)
      await audio.play()
    } catch (err) {
      console.error('Error playing preview:', err)
      setPlaying(null)
    }
  }

  const handleSave = () => {
    onSave({ voice_id: selectedVoice })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-4">
          {t('voice')}
        </label>
        
        <div className="space-y-3">
          {voices.map((voice) => (
            <div
              key={voice}
              className={`
                flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer
                ${selectedVoice === voice
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-border hover:border-primary-500/50'
                }
              `}
              onClick={() => setSelectedVoice(voice)}
            >
              <p className="font-medium capitalize">
                {voice.replace('_', ' ')}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview(voice)
                }}
                disabled={playing === voice}
                className="btn-secondary p-2"
              >
                <FiPlay size={18} className={playing === voice ? 'animate-pulse' : ''} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading || selectedVoice === profile.voice_id}
        className="btn-primary flex items-center space-x-2"
      >
        <FiSave size={18} />
        <span>{loading ? t('loading') : t('save')}</span>
      </button>
    </div>
  )
}

export default VoiceSettings