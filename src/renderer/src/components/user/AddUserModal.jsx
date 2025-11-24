// src/renderer/src/components/user/AddUserModal.jsx
/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import Modal from '../Modal'
import UnsavedChangesModal from '../UnsavedChangesModal'
import IncompleteFormModal from '../IncompleteFormModal'

export default function AddUserModal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tag, setTag] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // error states
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  // popup guard
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showIncomplete, setShowIncomplete] = useState(false)

  /* ====================== RESET FORM ====================== */
  useEffect(() => {
    if (!open) {
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setTag('')
      setShowPass(false)
      setShowConfirm(false)
      setShowUnsaved(false)
      setShowIncomplete(false)
      setPasswordError('')
      setConfirmError('')
    }
  }, [open])

  /* ====================== VALIDASI ====================== */

  // Validasi password minimal 8 karakter
  useEffect(() => {
    if (!password.trim()) {
      setPasswordError('')
    } else if (password.length < 8) {
      setPasswordError('Password must contain at least 8 characters')
    } else {
      setPasswordError('')
    }
  }, [password])

  // Validasi confirm password
  useEffect(() => {
    if (!confirmPassword.trim()) {
      setConfirmError('')
    } else if (password !== confirmPassword) {
      setConfirmError("Passwords don't match")
    } else {
      setConfirmError('')
    }
  }, [confirmPassword, password])

  const isValid = useMemo(() => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) return false
    if (password.length < 8) return false
    if (password !== confirmPassword) return false
    return true
  }, [name, email, password, confirmPassword])

  const isDirty = useMemo(() => {
    return name || email || password || confirmPassword || tag
  }, [name, email, password, confirmPassword, tag])

  const handleRequestClose = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  const handleSave = () => {
    if (!isValid) {
      setShowIncomplete(true)
      return
    }
    onSave({ name, email, password, tag })
    onClose()
  }

  return (
    <>
      {/* ========= MODAL ADD USER ========= */}
      <Modal
        open={open}
        title="Add User"
        onCancel={handleRequestClose}
        confirmText="Add User"
        onConfirm={handleSave}
        disableConfirm={!isValid}
      >
        <div className="grid gap-4">
          {/* Name */}
          <FormLabel>Name *</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

          {/* Email */}
          <FormLabel>Email *</FormLabel>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
          />

          {/* Password */}
          <FormLabel>Password *</FormLabel>
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
            >
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordError && <p className="text-xs text-red-400 -mt-1">{passwordError}</p>}

          {/* Confirm Password */}
          <FormLabel>Confirm Password *</FormLabel>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {confirmError && <p className="text-xs text-red-400 -mt-1">{confirmError}</p>}

          {/* Tag */}
          <FormLabel>Tag</FormLabel>
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Input tag" />

          <p className="text-xs text-white/60 pt-1">* Required fields</p>
        </div>
      </Modal>

      {/* ========= MODAL UNSAVED CHANGES ========= */}
      <UnsavedChangesModal
        open={showUnsaved}
        onLeave={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onStay={() => setShowUnsaved(false)}
      />

      {/* ========= MODAL INCOMPLETE FORM ========= */}
      <IncompleteFormModal open={showIncomplete} onClose={() => setShowIncomplete(false)} />
    </>
  )
}

/* ——— UI helpers ——— */
function FormLabel({ children }) {
  return (
    <div className="text-xs font-semibold" style={{ color: 'var(--dim)' }}>
      {children}
    </div>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded border bg-transparent text-white placeholder-[#9AA3B2] text-sm"
      style={{
        borderColor: 'var(--border)',
        outline: 'none'
      }}
    />
  )
}
