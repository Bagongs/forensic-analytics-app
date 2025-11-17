// src/renderer/src/components/RequireAuth.jsx
/* eslint-disable react/prop-types */
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@renderer/store/auth'

export default function RequireAuth({ children }) {
  const location = useLocation()
  const { authed, isLoaded, init } = useAuth()

  // Pastikan init() dipanggil saat pertama kali guard dipakai
  useEffect(() => {
    if (!isLoaded) {
      init()
    }
  }, [isLoaded, init])

  // Selama belum selesai cek session, tampilkan loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ color: 'var(--text)' }}>
        Memeriksa sesi…
      </div>
    )
  }

  // Kalau sudah cek dan belum authed → lempar ke login
  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Kalau sudah authed → render halaman
  return children
}
