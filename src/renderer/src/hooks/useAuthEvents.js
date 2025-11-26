/* eslint-disable no-empty */
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function useAuthEvents({ toast }) {
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    const offExpired = window.authEvents?.onExpired?.(() => {
      try {
        toast?.error?.('Session has ended. Please sign in again.')
      } catch {}
      const path = loc.pathname + loc.search
      sessionStorage.setItem('postLoginRedirect', path)
      nav('/login', { replace: true })
    })

    const offUpdated = window.authEvents?.onUpdated?.(() => {
      // Optional: tampilkan indikator “Token diperbarui” dsb
      toast?.success?.('The token has been updated.')
    })

    return () => {
      offExpired?.()
      offUpdated?.()
    }
  }, [nav, loc, toast])
}
