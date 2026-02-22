import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiUpload, FiSave } from 'react-icons/fi'
import { settingsService } from '../../services/settings'

function ProfileSettings({ profile, onSave, loading }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    persona: profile.persona || '',
  })
  const [uploading, setUploading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      await settingsService.uploadProfilePicture(file)
      window.location.reload() // Reload to show new image
    } catch (err) {
      console.error('Error uploading file:', err)
      alert('Fehler beim Hochladen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center space-x-6">
        <div className="w-24 h-24 rounded-full bg-dark-border flex items-center justify-center overflow-hidden">
          {profile.profile_picture ? (
            <img 
              src={profile.profile_picture} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </div>
        
        <div>
          <label className="btn-secondary cursor-pointer inline-flex items-center space-x-2">
            <FiUpload size={18} />
            <span>{uploading ? 'Lädt...' : 'Foto hochladen'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-dark-text opacity-50 mt-2">
            JPG, PNG oder WEBP (max. 5MB)
          </p>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('display_name')}
        </label>
        <input
          type="text"
          name="display_name"
          value={formData.display_name}
          onChange={handleChange}
          className="input w-full"
          placeholder="Wie soll Dr. Lila dich nennen?"
        />
      </div>

      {/* Persona */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('persona')}
        </label>
        <textarea
          name="persona"
          value={formData.persona}
          onChange={handleChange}
          className="input w-full resize-none"
          rows="4"
          placeholder="Erzähle Dr. Lila etwas über dich (optional)..."
        />
        <p className="text-xs text-dark-text opacity-50 mt-2">
          Diese Informationen helfen Dr. Lila, dich besser zu verstehen
        </p>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary flex items-center space-x-2"
      >
        <FiSave size={18} />
        <span>{loading ? t('loading') : t('save')}</span>
      </button>
    </form>
  )
}

export default ProfileSettings 