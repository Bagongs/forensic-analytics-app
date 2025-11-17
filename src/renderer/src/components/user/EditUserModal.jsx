// src/renderer/src/components/user/EditUserModal.jsx
/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import Modal from '../Modal'
import UnsavedChangesModal from '../UnsavedChangesModal'
import IncompleteFormModal from '../IncompleteFormModal'

export default function EditUserModal({ open, onClose, onSave, user }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tag, setTag] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // snapshot nilai awal (untuk deteksi dirty)
  const [initialForm, setInitialForm] = useState({
    name: '',
    email: '',
    tag: ''
  })

  // popup guard
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showIncomplete, setShowIncomplete] = useState(false)

  useEffect(() => {
    if (open && user) {
      const base = {
        name: user.name || '',
        email: user.email || '',
        tag: user.tag || ''
      }
      setName(base.name)
      setEmail(base.email)
      setTag(base.tag)
      setPassword('')
      setConfirmPassword('')
      setShowPass(false)
      setShowConfirm(false)
      setInitialForm(base)
      setShowUnsaved(false)
      setShowIncomplete(false)
    }
  }, [open, user])

  // form dianggap "dirty" kalau beda dengan initial atau password field terisi
  const isDirty = useMemo(() => {
    return (
      name !== initialForm.name ||
      email !== initialForm.email ||
      tag !== initialForm.tag ||
      password.trim() !== '' ||
      confirmPassword.trim() !== ''
    )
  }, [name, email, tag, password, confirmPassword, initialForm])

  // validasi:
  // - name & email wajib
  // - password optional, tapi kalau diisi harus cocok dengan confirm
  const isValid = useMemo(() => {
    if (!name.trim() || !email.trim()) return false
    if (password || confirmPassword) {
      if (!password.trim() || !confirmPassword.trim()) return false
      if (password !== confirmPassword) return false
    }
    return true
  }, [name, email, password, confirmPassword])

  // klik Cancel / X
  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsaved(true)
    } else {
      onClose?.()
    }
  }

  // klik Save Changes
  const handleSave = () => {
    if (!isValid) {
      setShowIncomplete(true)
      return
    }

    const patch = { name, email, tag }
    if (password) {
      patch.password = password
    }

    onSave(user.id, patch)
    onClose?.()
  }

  return (
    <>
      {/* ========= MODAL UTAMA: EDIT USER ========= */}
      <Modal
        open={open}
        title="Edit User"
        onCancel={handleRequestClose}
        confirmText="Save Changes"
        onConfirm={handleSave}
      >
        <div className="grid gap-4">
          <FormLabel>Name *</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

          <FormLabel>Email *</FormLabel>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />

          <FormLabel>Password</FormLabel>
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (optional)"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
            >
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <FormLabel>Confirm Password</FormLabel>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

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
          onClose?.()
        }}
        onStay={() => {
          setShowUnsaved(false)
        }}
      />

      {/* ========= MODAL INCOMPLETE FORM ========= */}
      <IncompleteFormModal open={showIncomplete} onClose={() => setShowIncomplete(false)} />
    </>
  )
}

/* Helpers sama seperti versi kamu */
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
      style={{ borderColor: 'var(--border)' }}
    />
  )
}
