import api from './api'

export const voiceService = {
  async speechToText(audioBlob) {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    const response = await api.post('/voice/stt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async textToSpeech(text, voiceId = 'default', language = 'de') {
    const response = await api.post('/voice/tts', {
      text,
      voice_id: voiceId,
      language,
    })
    return response.data
  },
}