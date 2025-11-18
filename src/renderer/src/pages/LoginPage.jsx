import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import iconApp from '@renderer/assets/icons/icon_app.svg'
import { useAuth } from '@renderer/store/auth'

export default function LoginPage() {
  const nav = useNavigate()
  const location = useLocation()
  const { login, busy: storeBusy, error: storeError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const busy = storeBusy

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { ok, error: errMsg } = await login({ email, password })
    if (!ok) {
      setError(errMsg || 'Login gagal')
      return
    }
    // kalau ada rute asal (ketika guard me-redirect), balikin ke sana; else → /analytics
    const to = location.state?.from?.pathname || '/analytics'
    nav(to, { replace: true })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
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
            <h2 className="text-center text-xl font-semibold mb-8" style={{ color: 'var(--text)' }}>
              STAFF LOG IN
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--dim)' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none border-b pb-2"
                  style={{ borderColor: '#394F6F', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--dim)' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none border-b pb-2"
                  style={{ borderColor: '#394F6F', color: 'var(--text)' }}
                />
              </div>

              {(error || storeError) && (
                <p className="text-sm" style={{ color: '#ff6b6b' }}>
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
                    {busy ? 'SIGNING IN…' : 'LOGIN'}
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
