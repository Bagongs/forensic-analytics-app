// src/renderer/src/components/LoadingModal.jsx
/* eslint-disable react/prop-types */
import Modal from './Modal'
import loadingGif from '@renderer/assets/image/loading.gif'

export default function LoadingModal({
  open,
  onClose,
  title = 'Data Extractions',
  text = 'Analyzing...'
}) {
  if (!open) return null

  return (
    <Modal
      open={open}
      onCancel={onClose}
      size="xl"
      title={title}
      closable
      // biar look & feel mirip screenshot (garis emas tipis di header bawaan Modal kamu)
      className="select-none"
    >
      <div className="py-10 flex flex-col items-center justify-center">
        <img
          src={loadingGif}
          alt="Loading"
          className="w-[260px] h-[260px] object-contain mb-8"
          draggable="false"
        />
        <div
          className="text-[24px] font-extrabold tracking-wide"
          style={{ color: '#E7E9EE', textShadow: '0 1px 0 rgba(0,0,0,.3)' }}
        >
          {text}
        </div>
      </div>
    </Modal>
  )
}
