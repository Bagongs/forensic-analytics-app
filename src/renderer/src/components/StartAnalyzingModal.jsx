// src/renderer/src/components/StartAnalyzingModal.jsx
/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import Modal from './Modal'
import SelectField from './SelectField'
import { ANALYTICS_METHODS, coerceMethod } from '@renderer/shared/analyticsMethods'

const INPUT_BG = '#202C3C'
const INPUT_BORDER = '#394F6F'
const TEXT = '#E7E9EE'

export default function StartAnalyzingModal({ open, onCancel, onNext }) {
  const [name, setName] = useState('')
  const [method, setMethod] = useState('') // SELALU string

  const METHOD_OPTIONS = useMemo(() => ANALYTICS_METHODS.map((v) => ({ value: v, label: v })), [])

  const disableNext = !name.trim() || !method

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
        onClick={() => onNext?.({ name: name.trim(), method: String(method).trim() })}
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
            onChange={(e) => setName(e.target.value)}
            placeholder="Analytics Name"
            className="w-full h-12 px-4 rounded-[10px] outline-none"
            style={{ background: INPUT_BG, border: `1px solid ${INPUT_BORDER}`, color: TEXT }}
          />
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
