import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/auth'

function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authService.login(username, password)
      const user = await authService.getMe()
      
      login(data.access_token, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-400 mb-2">
            💜 Dr. Lila
          </h1>
          <p className="text-dark-text opacity-75">{t('welcome')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-primary-400 hover:text-primary-300">
            {t('register')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login