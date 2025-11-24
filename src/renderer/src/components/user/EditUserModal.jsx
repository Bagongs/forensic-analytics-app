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

  const [initialForm, setInitialForm] = useState({
    name: '',
    email: '',
    tag: ''
  })

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

  const isDirty = useMemo(() => {
    return (
      name !== initialForm.name ||
      email !== initialForm.email ||
      tag !== initialForm.tag ||
      password.trim() !== '' ||
      confirmPassword.trim() !== ''
    )
  }, [name, email, tag, password, confirmPassword, initialForm])

  // kontrak: semua field wajib + password wajib min 8 & match
  const isValid = useMemo(() => {
    if (!name.trim() || !email.trim() || !tag.trim()) return false
    if (!password.trim() || !confirmPassword.trim()) return false
    if (password.length < 8) return false
    if (password !== confirmPassword) return false
    return true
  }, [name, email, tag, password, confirmPassword])

  const handleRequestClose = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose?.()
  }

  const handleSave = () => {
    if (!isValid) {
      setShowIncomplete(true)
      return
    }

    const patch = {
      name,
      email,
      tag,
      password,
      confirm_password: confirmPassword
    }

    onSave(user.id, patch)
    onClose?.()
  }

  return (
    <>
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

          <FormLabel>New Password *</FormLabel>
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
            >
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

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

          <FormLabel>Tag *</FormLabel>
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Input tag" />

          <p className="text-xs text-white/60 pt-1">* Required fields</p>
        </div>
      </Modal>

      <UnsavedChangesModal
        open={showUnsaved}
        onLeave={() => {
          setShowUnsaved(false)
          onClose?.()
        }}
        onStay={() => setShowUnsaved(false)}
      />

      <IncompleteFormModal open={showIncomplete} onClose={() => setShowIncomplete(false)} />
    </>
  )
}

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
