// src/renderer/src/components/IncompleteFormModal.jsx
/* eslint-disable react/prop-types */
import { AiFillWarning } from 'react-icons/ai'
import Modal from './Modal'

export default function IncompleteFormModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Incomplete Form"
      size="md"
      // kita override footer bawaan modal
      footer={
        <div className="w-full flex justify-center">
          <button
            type="button"
            onClick={onClose}
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
            Please complete required fields
            <br />
            before submitting
          </p>
        </div>
      </div>
    </Modal>
  )
}
