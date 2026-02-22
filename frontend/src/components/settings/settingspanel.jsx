import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiGlobe, FiVolume2, FiTrash2, FiSave } from 'react-icons/fi'
import { useAuthStore } from '../../stores/authStore'
import { settingsService } from '../../services/settings'
import { authService } from '../../services/auth'
import ProfileSettings from './ProfileSettings'
import VoiceSettings from './VoiceSettings'

function SettingsPanel() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await settingsService.getProfile()
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const handleSave = async (data) => {
    setLoading(true)
    try {
      const updated = await settingsService.updateProfile(data)
      setProfile(updated)
      updateUser(updated)
      alert(t('success'))
    } catch (err) {
      console.error('Error updating profile:', err)
      alert(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Bist du SICHER, dass du dein Konto löschen möchtest? Dies kann nicht rückgängig gemacht werden!')) {
      return
    }

    if (!confirm('Letzte Warnung! Alle deine Daten werden gelöscht!')) {
      return
    }

    try {
      await authService.deleteAccount()
      logout()
      navigate('/login')
    } catch (err) {
      console.error('Error deleting account:', err)
      alert('Fehler beim Löschen des Kontos')
    }
  }

  const tabs = [
    { id: 'profile', icon: FiUser, label: t('profile') },
    { id: 'language', icon: FiGlobe, label: t('app_language') },
    { id: 'voice', icon: FiVolume2, label: t('voice') },
  ]

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-primary-400">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-primary-400 mb-8">
          {t('settings')}
        </h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-dark-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-text hover:text-primary-300'
                }
              `}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {activeTab === 'profile' && (
            <ProfileSettings 
              profile={profile} 
              onSave={handleSave}
              loading={loading}
            />
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('app_language')}
                </label>
                <select
                  value={profile.app_language}
                  onChange={(e) => {
                    const newLang = e.target.value
                    handleSave({ app_language: newLang })
                    i18n.changeLanguage(newLang)
                  }}
                  className="input w-full"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('bot_language')}
                </label>
                <select
                  value={profile.bot_language}
                  onChange={(e) => handleSave({ bot_language: e.target.value })}
                  className="input w-full"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('timezone')}
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e) => handleSave({ timezone: e.target.value })}
                  className="input w-full"
                >
                  <option value="Europe/Berlin">Europe/Berlin (MEZ)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <VoiceSettings
              profile={profile}
              onSave={handleSave}
              loading={loading}
            />
          )}
        </div>

        {/* Danger Zone */}
        <div className="card mt-8 border-red-500/30">
          <h3 className="text-lg font-semibold text-red-400 mb-4">
            Gefahrenzone
          </h3>
          <p className="text-sm text-dark-text opacity-75 mb-4">
            Das Löschen deines Kontos ist permanent und kann nicht rückgängig gemacht werden.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <FiTrash2 size={18} />
            <span>{t('delete_account')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel 