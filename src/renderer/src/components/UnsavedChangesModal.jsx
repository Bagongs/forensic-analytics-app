// src/renderer/src/components/UnsavedChangesModal.jsx
/* eslint-disable react/prop-types */
import { AiFillWarning } from 'react-icons/ai'
import Modal from './Modal'

export default function UnsavedChangesModal({ open, onLeave, onStay }) {
  return (
    <Modal
      open={open}
      onCancel={onStay} // klik backdrop / X = tetap di form
      title="Unsaved Changes"
      size="md"
      footer={
        <div className="w-full flex justify-center gap-4">
          {/* Leave Anyway */}
          <button
            type="button"
            onClick={onLeave}
            className="px-6 h-10 rounded-md text-[14px] font-medium"
            style={{
              background: 'transparent',
              border: '1.5px solid #89080B',
              color: '#E7E9EE'
            }}
          >
            Leave Anyway
          </button>

          {/* Continue Editing */}
          <button
            type="button"
            onClick={onStay}
            className="px-6 h-10 rounded-md text-[14px] font-medium"
            style={{
              background: 'radial-gradient(50% 50% at 50% 50%, #2A3A51 0%, #2A3A51 100%)',
              border: '1px solid #C3CFE0',
              color: '#E7E9EE'
            }}
          >
            Continue Editing
          </button>
        </div>
      }
    >
      <div className="py-4">
        <div className="flex flex-col items-center text-center gap-4">
          <AiFillWarning size={64} color="#F3D600" />
          <p className="text-[22px] leading-8 text-white/95">
            If you leave this form, your data will
            <br />
            not be saved
          </p>
        </div>
      </div>
    </Modal>
  )
}
