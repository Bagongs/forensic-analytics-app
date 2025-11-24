// src/renderer/src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'

import LoginPage from './pages/LoginPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage'
import DeviceSelectionPage from '@renderer/pages/DeviceSelectionPage'
import ContactCorrelationPage from '@renderer/pages/detail/ContactCorrelationPage'
import DeepCommunicationPage from '@renderer/pages/detail/DeepCommunicationPage'
import HashfileAnalyticsPage from '@renderer/pages/detail/HashfileAnalyticsPage'
import ApkAnalysisPage from './pages/detail/ApkAnalysisPage.jsx'
import ApkResultPage from '@renderer/pages/detail/ApkResultPage'
import SocialMediaCorrelationPage from '@renderer/pages/detail/SocialMediaCorrelationPage'
import UserManagement from '@renderer/pages/UserManagement.jsx'
import AboutPage from './pages/AboutPage.jsx'

import RequireAuth from '@renderer/components/RequireAuth'
import RequireAnalysis from '@renderer/components/guards/RequireAnalysis'

import useAuthEvents from './hooks/useAuthEvents'
import { useAuth } from './store/auth'

// Pakai flag dari Vite/Electron Vite:
// true saat `npm run dev`, false saat build (packaged)
const isDev = import.meta.env.DEV
const Router = isDev ? BrowserRouter : HashRouter

function RouterRoot() {
  useAuthEvents({ toast })

  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<LoginPage />} />

      {/* redirect root → analytics */}
      <Route path="/" element={<Navigate to="/analytics" replace />} />

      {/* guarded */}
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <AnalyticsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/analytics/devices"
        element={
          <RequireAuth>
            <DeviceSelectionPage />
          </RequireAuth>
        }
      />

      <Route
        path="/user-management"
        element={
          <RequireAuth>
            <UserManagement />
          </RequireAuth>
        }
      />

      <Route
        path="/about"
        element={
          <RequireAuth>
            <AboutPage />
          </RequireAuth>
        }
      />

      {/* detail pages */}
      <Route
        path="/detail/contact-correlation"
        element={
          <RequireAuth>
            <RequireAnalysis>
              <ContactCorrelationPage />
            </RequireAnalysis>
          </RequireAuth>
        }
      />
      <Route
        path="/detail/deep-communication"
        element={
          <RequireAuth>
            <RequireAnalysis>
              <DeepCommunicationPage />
            </RequireAnalysis>
          </RequireAuth>
        }
      />
      <Route
        path="/detail/hashfile-analytics"
        element={
          <RequireAuth>
            <RequireAnalysis>
              <HashfileAnalyticsPage />
            </RequireAnalysis>
          </RequireAuth>
        }
      />
      <Route
        path="/detail/apk-analytics"
        element={
          <RequireAuth>
            <RequireAnalysis>
              <ApkAnalysisPage />
            </RequireAnalysis>
          </RequireAuth>
        }
      />
      <Route
        path="/detail/apk-analytics/result"
        element={
          <RequireAuth>
            <RequireAnalysis>
              <ApkResultPage />
            </RequireAnalysis>
          </RequireAuth>
        }
      />
      <Route
        path="/detail/social-media-correlation"
        element={
          <RequireAuth>
            <RequireAnalysis>
              <SocialMediaCorrelationPage />
            </RequireAnalysis>
          </RequireAuth>
        }
      />

      {/* fallback agar tidak "No routes matched" */}
      <Route path="*" element={<Navigate to="/analytics" replace />} />
    </Routes>
  )
}

export default function App() {
  const initAuth = useAuth((s) => s.init)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <Router>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#172133',
            color: '#E7E9EE',
            border: '1px solid #394F6F',
            fontFamily: 'Noto Sans'
          },
          success: { iconTheme: { primary: '#EDC702', secondary: '#172133' } },
          error: { iconTheme: { primary: '#E55353', secondary: '#172133' } }
        }}
      />
      <RouterRoot />
    </Router>
  )
}
