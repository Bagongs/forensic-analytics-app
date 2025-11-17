/* eslint-disable react/prop-types */
import { useState } from 'react'
import Modal from '../Modal'
import apkDevice from '@renderer/assets/image/apk-device.svg'
import iconApk from '@renderer/assets/icons/icon_apk.svg'

const BORDER = '#394F6F'

export default function AnalyticsCampaignModal({
  open,
  onClose, // cancel
  onNext, // dipanggil saat klik Next
  fileName,
  fileSize
}) {
  const [campaign, setCampaign] = useState('')

  const handleNext = () => {
    if (!campaign) return
    onNext?.({ campaign })
    // tidak auto-close di sini, parent yang menentukan (supaya bisa reset state)
  }

  return (
    <Modal
      open={open}
      onCancel={() => onClose?.()}
      title="Analytics"
      onConfirm={handleNext}
      disableConfirm={!campaign}
      size="lg"
    >
      <div className="mb-6">
        <div className="text-white/80 mb-2">Analytics Name</div>
        <input
          className="w-full h-11 rounded bg-transparent px-3 border"
          style={{ borderColor: BORDER }}
          placeholder="Mis. APK Malware Detection - SampleApp"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
        />
      </div>

      <div
        className="rounded-xl p-5 md:p-6 flex justify-center"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div
          className="rounded-[14px] flex items-stretch gap-6 w-full max-w-[460px]"
          style={{
            aspectRatio: '3.05 / 1',
            background: 'rgba(17,23,32,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid',
            borderImageSlice: 1,
            borderImageSource: 'linear-gradient(139.22deg, #282F46 24.01%, #666666 77.43%)'
          }}
        >
          <div className="relative shrink-0 w-[42%] min-w-[150px] h-full overflow-hidden">
            <img
              src={apkDevice}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-left"
              draggable="false"
            />
            <img
              src={iconApk}
              alt="APK"
              className="absolute top-11 left-6 w-20 h-11 object-contain"
              draggable="false"
            />
          </div>

          <div className="flex-1 p-5 md:p-6 text-white flex flex-col justify-center">
            <div>
              <div className="text-[12px] uppercase tracking-[0.14em] text-[#89A4D6]/80">
                File Name
              </div>
              <div className="mt-1 text-[17px] font-semibold leading-tight truncate">
                {fileName}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[12px] uppercase tracking-[0.14em] text-[#89A4D6]/80">
                File Size
              </div>
              <div className="mt-1 text-[18px] font-bold leading-none">{fileSize}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
