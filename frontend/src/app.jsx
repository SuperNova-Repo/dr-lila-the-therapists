import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authstore'

import Login from './components/auth/login'
import Register from './components/auth/register'
import ChatInterface from './components/chat/chatinterface'
import SettingsPanel from './components/settings/settingspanel'
import Layout from './components/layout/layout'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<ChatInterface />} />
          <Route path="chat/:chatId" element={<ChatInterface />} />
          <Route path="settings" element={<SettingsPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App