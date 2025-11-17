/* eslint-disable react/prop-types */
import Modal from './Modal'
import { AiFillWarning } from 'react-icons/ai'

export default function ConfirmDeleteModal({ open, onClose, onConfirm, name, colorIcon = 'red' }) {
  return (
    <Modal
      open={open}
      title="Confirm Delete"
      onCancel={onClose}
      confirmText="Delete"
      onConfirm={onConfirm}
    >
      <div className="flex gap-5 flex-col items-center">
        <AiFillWarning color={colorIcon} size={40} />
        <p className="text-lg">
          Are you sure you want to delete <span className="font-semibold">{name}</span>?
        </p>
      </div>
    </Modal>
  )
}
