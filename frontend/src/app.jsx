import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ChatInterface from './components/Chat/ChatInterface'
import SettingsPanel from './components/Settings/SettingsPanel'
import Layout from './components/Layout/Layout'

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