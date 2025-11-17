/* eslint-disable no-empty */
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function useAuthEvents({ toast }) {
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    const offExpired = window.authEvents?.onExpired?.(() => {
      try {
        toast?.error?.('Sesi berakhir, silakan login kembali.')
      } catch {}
      const path = loc.pathname + loc.search
      sessionStorage.setItem('postLoginRedirect', path)
      nav('/login', { replace: true })
    })

    const offUpdated = window.authEvents?.onUpdated?.(() => {
      // Optional: tampilkan indikator “Token diperbarui” dsb
      // toast?.success?.('Token diperbarui.')
    })

    return () => {
      offExpired?.()
      offUpdated?.()
    }
  }, [nav, loc, toast])
}
