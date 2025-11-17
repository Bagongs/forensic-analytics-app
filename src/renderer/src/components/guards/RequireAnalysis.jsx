/* eslint-disable no-empty */
/* eslint-disable react/prop-types */
// src/renderer/src/components/guards/RequireAnalysis.jsx
import { Navigate, useLocation } from 'react-router-dom'

export default function RequireAnalysis({ children }) {
  const { state } = useLocation()

  // 1) dari location.state
  const idFromState = state?.analysisId ?? state?.analyticId

  // 2) fallback dari sessionStorage (kalau kamu set sebelumnya)
  let idFromSS = null
  try {
    const a = JSON.parse(sessionStorage.getItem('analysis.context') || '{}')
    const b = JSON.parse(sessionStorage.getItem('apk.ctx') || '{}')
    idFromSS = a?.analysisId ?? a?.analyticId ?? b?.analyticId ?? b?.analysisId ?? null
  } catch {}

  const ok = idFromState ?? idFromSS
  if (!ok) return <Navigate to="/analytics" replace />

  return children
}
