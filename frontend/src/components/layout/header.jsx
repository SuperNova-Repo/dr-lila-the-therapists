import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiSettings, FiLogOut } from 'react-icons/fi'
import { useAuthStore } from '../../stores/authStore'

function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-dark-card border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-primary-400">
            💜 Dr. Lila
          </h1>
          <span className="text-sm text-dark-text opacity-50">
            The Therapist
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-dark-text">
            {user?.display_name || user?.username}
          </span>
          
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-dark-border rounded-lg transition-colors"
            title={t('settings')}
          >
            <FiSettings size={20} />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-dark-border rounded-lg transition-colors"
            title={t('logout')}
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header 