// components/FileTypePicker.jsx
/* eslint-disable react/prop-types */
import Modal from './Modal'
import ApkIcon from '../assets/icons/icon-apk.svg'
import XlsIcon from '../assets/icons/icon-xls.svg'

export default function FileTypePicker({ open, onClose, onPickXLS, onPickAPK }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Upload File"
      size="lg"
      confirmText={null}
      footer={null}
    >
      <p className="text-center text-lg mb-8">Choose type of file you want to upload.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-6">
        {/* XLS */}
        <button
          onClick={() => {
            onClose?.()
            onPickXLS?.()
          }}
          className="h-[220px] rounded-xl border hover:border-[--gold] transition flex flex-col items-center justify-center gap-6 bg-[--panel]"
          style={{ borderColor: '#293240' }}
        >
          <img src={XlsIcon} alt="XLS Icon" className="w-20 h-20 object-contain" />
          <span className="app-title text-xl">XLS</span>
        </button>

        {/* APK */}
        <button
          onClick={() => {
            onClose?.()
            onPickAPK?.()
          }}
          className="h-[220px] rounded-xl border hover:border-[--gold] transition flex flex-col items-center justify-center gap-6 bg-[--panel]"
          style={{ borderColor: '#293240' }}
        >
          <img src={ApkIcon} alt="APK Icon" className="w-20 h-20 object-contain" />
          <span className="app-title text-xl">APK</span>
        </button>
      </div>
    </Modal>
  )
}
