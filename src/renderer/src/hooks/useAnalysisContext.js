// src/renderer/src/hooks/useAnalysisContext.js
import { useLocation, useSearchParams } from 'react-router-dom'

export default function useAnalysisContext() {
  const { state } = useLocation()
  const [sp] = useSearchParams()

  const saved = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('analysis.context') || 'null')
    } catch {
      return null
    }
  })()

  const analysisId =
    state?.analysisId || sp.get('analytic_id') || sp.get('analysisId') || saved?.analysisId || null
  const method = state?.method || sp.get('method') || saved?.method || null

  return { analysisId, method }
}
