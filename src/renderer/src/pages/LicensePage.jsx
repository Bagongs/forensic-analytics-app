import { useEffect, useState } from 'react'
import { useLocation, Navigate, Outlet } from 'react-router-dom'

export default function LicenseGate() {
  const [licenseData, setLicenseData] = useState(null)
  const [error, setError] = useState(false)
  const location = useLocation()

  const FRONTEND_EXPIRED_DATE = '2028-01-01'
  const frontendExpired = new Date() >= new Date(FRONTEND_EXPIRED_DATE)

  if (frontendExpired) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold uppercase">License Expired</h1>
      </div>
    )
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setError(false)
    let timeoutId

    async function checkLicense() {
      try {
        timeoutId = setTimeout(() => {
          console.warn('License check timeout')
          setError(true) // anggap backend mati
        }, 20000)

        const res = await window.license.getInfo()
        console.log('License info:', res)

        clearTimeout(timeoutId)

        if (!res || !res.data) {
          setError(true)
          return
        }

        setLicenseData(res)
      } catch (e) {
        clearTimeout(timeoutId)
        console.error('Failed to load license:', e)
        setError(true)
      }
    }

    checkLicense()
    return () => clearTimeout(timeoutId)
  }, [location.pathname])

  if (error) return <Navigate to="/login" replace />

  if (!licenseData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-white text-xl uppercase">Connecting...</h1>
      </div>
    )
  }

  const { now, end_date } = licenseData.data
  const expired = new Date(now) >= new Date(end_date)

  if (expired) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold uppercase">License Expired</h1>
      </div>
    )
  }

  return <Outlet />
}
