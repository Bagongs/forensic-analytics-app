// src/renderer/src/components/StartAnalyzingModal.jsx
/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import Modal from './Modal'
import SelectField from './SelectField'
import { ANALYTICS_METHODS, coerceMethod } from '@renderer/shared/analyticsMethods'
import { validateSafeHumanName } from '../utils/safeTextValidators'

const INPUT_BG = '#202C3C'
const INPUT_BORDER = '#394F6F'
const TEXT = '#E7E9EE'

export default function StartAnalyzingModal({ open, onCancel, onNext }) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [method, setMethod] = useState('') // SELALU string

  const METHOD_OPTIONS = useMemo(
    () =>
      ANALYTICS_METHODS.filter((v) => v !== 'APK Analytics') // <-- exclude disini
        .map((v) => ({ value: v, label: v })),
    []
  )

  const disableNext = !name.trim() || !!nameError || !method

  const handleNext = () => {
    // re-validate sebelum kirim, supaya gak bisa di-bypass
    const { ok, error } = validateSafeHumanName(name, 'Analytics name')
    if (!ok) {
      setNameError(error)
      return
    }

    if (!method) return

    onNext?.({
      name: name.trim(),
      method: String(method).trim()
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 h-10 text-sm rounded-sm"
        style={{ background: 'transparent', border: '1.5px solid #EDC702', color: TEXT }}
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disableNext}
        onClick={handleNext}
        className="px-5 h-10 text-sm rounded-sm disabled:opacity-60"
        style={{ background: 'var(--gold)', color: '#101217', border: 'none' }}
      >
        Next
      </button>
    </div>
  )

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Choose Analytics Type"
      size="lg"
      footer={footer}
      initialFocusSelector="input[name='analytics-name']"
    >
      <div className="space-y-6">
        <div>
          <label className="block mb-2">Analytics Name</label>
          <input
            name="analytics-name"
            value={name}
            onChange={(e) => {
              const v = e.target.value
              setName(v)
              const { ok, error } = validateSafeHumanName(v, 'Analytics name')
              setNameError(ok ? '' : error)
            }}
            placeholder="Analytics Name"
            className="w-full h-12 px-4 rounded-[10px] outline-none"
            style={{
              background: INPUT_BG,
              border: `1px solid ${nameError ? '#f87171' : INPUT_BORDER}`,
              color: TEXT
            }}
          />
          {nameError && <div className="mt-1 text-xs text-red-400">{nameError}</div>}
        </div>

        <SelectField
          label="Methods"
          value={method}
          onChange={(val) => setMethod(coerceMethod(val))}
          options={METHOD_OPTIONS}
          placeholder="Select method"
        />
      </div>
    </Modal>
  )
}
