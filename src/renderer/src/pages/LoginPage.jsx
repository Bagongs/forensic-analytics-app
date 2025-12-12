import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import iconApp from '@renderer/assets/icons/icon_app.svg'
import { useAuth } from '@renderer/store/auth'

function isValidEmail(value) {
  if (!value) return false
  // Regex simple, cukup untuk UI (validasi kuat tetap di backend)
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(value)
}

export default function LoginPage() {
  const nav = useNavigate()
  const location = useLocation()
  const { login, busy: storeBusy, error: storeError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('') // error global (login gagal)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const busy = storeBusy

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setEmailError('')
    setPasswordError('')

    // ====== VALIDASI MANUAL (notif teks) ======
    let hasError = false

    if (!email.trim()) {
      setEmailError('Email is required.')
      hasError = true
    } else if (!isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address.')
      hasError = true
    }

    if (!password.trim()) {
      setPasswordError('Password is required.')
      hasError = true
    }

    if (hasError) return

    // ====== LOGIN KE STORE ======
    const { ok, error: errMsg } = await login({ email: email.trim(), password })
    if (!ok) {
      setError(errMsg || 'Login gagal. Periksa kembali email dan password Anda.')
      return
    }

    const to = location.state?.from?.pathname || '/analytics'
    nav(to, { replace: true })
  }

  const FRONTEND_EXPIRED_DATE = '2028-01-01'
  const frontendExpired = new Date() >= new Date(FRONTEND_EXPIRED_DATE)

  if (frontendExpired) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold uppercase">License Expired</h1>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden px-4">
      {/* CARD UTAMA */}
      <div
        className="relative rounded-[18px] overflow-hidden"
        style={{
          width: 1120,
          height: 520,
          background: '#111720B2',
          border: '1px solid',
          borderImageSource: 'linear-gradient(115.65deg, #000000 32.14%, #666666 119.25%)',
          borderImageSlice: 1,
          display: 'grid',
          gridTemplateColumns: '560px 560px'
        }}
      >
        {/* BRAND PANEL */}
        <div
          className="h-full flex flex-col items-center justify-center gap-8"
          style={{ background: 'linear-gradient(180deg, #2A3A51 0%, #1A2432 100%)' }}
        >
          <img src={iconApp} alt="App Logo" className="w-44 h-44 object-contain select-none" />
          <h1
            className="text-4xl font-bold normal-case"
            style={{
              color: 'var(--gold)',
              fontFamily: 'Aldrich, sans-serif',
              textTransform: 'capitalize'
            }}
          >
            Data Analytics Platform
          </h1>
        </div>

        {/* FORM PANEL */}
        <div className="h-full flex flex-col items-center justify-center">
          <div className="w-[420px]">
            <h2
              className="text-center text-3xl font-semibold mb-8"
              style={{ color: 'var(--text)' }}
            >
              SIGN IN
            </h2>

            {/* noValidate = matikan notif bawaan browser */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* EMAIL */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--dim)' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    // optional live validation ringan
                    if (emailError) {
                      const val = e.target.value
                      if (!val.trim()) setEmailError('Email is required.')
                      else if (!isValidEmail(val.trim()))
                        setEmailError('Please enter a valid email address.')
                      else setEmailError('')
                    }
                  }}
                  className="w-full bg-transparent outline-none border-b pb-2"
                  style={{
                    borderColor: emailError ? '#ff6b6b' : '#394F6F',
                    color: 'var(--text)'
                  }}
                />
                {emailError && (
                  <p className="mt-1 text-xs" style={{ color: '#ff6b6b' }}>
                    {emailError}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--dim)' }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) {
                      const val = e.target.value
                      setPasswordError(val.trim() ? '' : 'Password is required.')
                    }
                  }}
                  className="w-full bg-transparent outline-none border-b pb-2"
                  style={{
                    borderColor: passwordError ? '#ff6b6b' : '#394F6F',
                    color: 'var(--text)'
                  }}
                />
                {passwordError && (
                  <p className="mt-1 text-xs" style={{ color: '#ff6b6b' }}>
                    {passwordError}
                  </p>
                )}
              </div>

              {/* ERROR GLOBAL (login gagal dari backend / store) */}
              {(error || storeError) && (
                <p className="text-sm text-center" style={{ color: '#ff6b6b' }}>
                  {error || storeError}
                </p>
              )}

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="h-11 px-10 rounded-md transition disabled:opacity-60"
                  style={{
                    background: '#1C2635',
                    color: 'var(--text)',
                    borderStyle: 'solid',
                    borderColor: '#394F6F',
                    borderTopWidth: '1.5px',
                    borderBottomWidth: '1.5px',
                    borderLeftWidth: 0,
                    borderRightWidth: 0
                  }}
                >
                  <span className="tracking-wide" style={{ color: 'var(--gold)' }}>
                    {busy ? 'SIGNING IN…' : 'SIGN IN'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
