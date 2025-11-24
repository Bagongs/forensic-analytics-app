import { useEffect, useRef, useState } from 'react'
import headerImg from '@renderer/assets/image/header.svg'
import userIcon from '@renderer/assets/icons/user.svg'
import { useAuth } from '@renderer/store/auth'
import { useNavigate } from 'react-router-dom'
import { LuEye, LuEyeOff } from 'react-icons/lu'
import { MdOutlineInfo } from 'react-icons/md'

export default function HeaderBar() {
  const nav = useNavigate()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const btnRef = useRef(null)
  const popRef = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  async function doLogout() {
    await logout()
    nav('/login', { replace: true })
  }

  const safeUser = user || { fullname: 'User', email: '-', role: 'user', tag: '' }

  // Admin = role 'admin' + tag 'Admin' (case-insensitive)
  const isAdmin =
    String(safeUser.role).toLowerCase() === 'admin' &&
    String(safeUser.tag || '').toLowerCase() === 'admin'

  // Password display (kalau mau benar2 show password, boleh isi user.password di store)
  const masked = '••••••••••••••••'
  const displayPassword = showPassword ? safeUser.password || masked : masked

  return (
    <>
      <div className="w-full md:h-16 lg:h-32 relative overflow-x-hidden">
        <img
          src={headerImg}
          alt=""
          className="absolute top-0 left-0 w-screen h-auto object-cover -z-10"
        />
        <div className="flex justify-end items-center relative 2xl:mt-5 mt-2 mr-1">
          <button
            ref={btnRef}
            onClick={() => setOpen((v) => !v)}
            className="flex self-end justify-end items-center md:mt-6 mt-5 gap-2 text-white hover:opacity-90 select-none"
          >
            <img src={userIcon} alt="User" className="w-6 h-6" />
            <span className="2xl:text-lg text-sm tracking-tighter">{safeUser.fullname}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-1">
              <path
                d="M7 10l5 5 5-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* ===================== PROFILE DROPDOWN ===================== */}
        </div>
      </div>

      {open && (
        <div
          ref={popRef}
          className="absolute right-4 top-[72px] w-[320px] overflow-hidden text-[#E7E9EE] z-50 mt-2"
          style={{
            background: '#151D28',
            border: '1.5px solid #C3CFE0',
            boxShadow: '0px 4px 4px 0px #00000040',
            borderRadius: '8px'
          }}
        >
          {/* ===== TOP: user info ===== */}
          <div className="px-4 pt-4 pb-3">
            <div className="font-semibold text-sm">{safeUser.fullname || safeUser.email}</div>
            <div className="text-sm opacity-80">{safeUser.email}</div>

            {/* Baris password hanya untuk admin (sesuai desain popup admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="mt-3 flex items-center gap-2 text-xs opacity-80 hover:opacity-100"
              >
                {showPassword ? <LuEye className="w-4 h-4" /> : <LuEyeOff className="w-4 h-4" />}
                <span className="tracking-[0.25em]">{displayPassword}</span>
              </button>
            )}
          </div>

          <div className="h-px" style={{ background: '#C3CFE0' }} />

          {/* ===== MENU: hanya admin yang dapat User management + password row di atas ===== */}
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setOpen(false)
                  nav('/user-management')
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#1C2633]"
              >
                {/* icon group user */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10 10a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7 0a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17 10Zm0 2a4.49 4.49 0 0 0-3.5 1.7 5.47 5.47 0 0 0-3.5-1.7C7.46 12 4 13.12 4 15.75V17h10v-1.25a3.26 3.26 0 0 1 .44-1.65A3.84 3.84 0 0 1 17 13.5 3.5 3.5 0 0 1 20.5 17H22v-.75C22 13.12 18.54 12 17 12Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm">User management</span>
              </button>
              <div className="h-px" style={{ background: '#C3CFE0' }} />
            </>
          )}

          {/* ===== ABOUT (selalu ada) ===== */}
          <button
            onClick={() => {
              setOpen(false)
              nav('/about')
            }}
            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#1C2633]"
          >
            <MdOutlineInfo className="w-[18px] h-[18px] text-white" />
            <span className="text-sm">About</span>
          </button>

          <div className="h-px" style={{ background: '#C3CFE0' }} />

          {/* ===== LOGOUT (selalu ada untuk semua role) ===== */}
          <button
            onClick={doLogout}
            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#1C2633]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-sm">Log out</span>
          </button>
        </div>
      )}
    </>
  )
}
