/* eslint-disable react/prop-types */
import bgTop from '@renderer/assets/image/bg-device-top.svg'
import deviceIcon from '@renderer/assets/icons/device-icon.svg'
import iconApk from '@renderer/assets/icons/icon_apk.svg'

export default function APKCard({ fileName = '', fileSize = '', footerId = '' }) {
  return (
    <div
      className="overflow-hidden text-white flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300"
      style={{
        width: '100%',
        maxWidth: '369px',
        aspectRatio: '369 / 636',
        background: 'rgba(17,23,32,0.7)', // #111720B2
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid',
        borderImageSlice: 1,
        borderImageSource: 'linear-gradient(139.22deg, #282F46 24.01%, #666666 77.43%)'
      }}
    >
      {/* ===== TOP BANNER ===== */}
      <div className="relative h-[250px]">
        <img
          src={bgTop}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none select-none"
          draggable="false"
        />

        {/* Container ikon device + iconApk overlay */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[15px]">
          <div className="relative w-[110px] h-[159px]">
            {/* Base device icon */}
            <img
              src={deviceIcon}
              alt="Device"
              className="absolute inset-0 w-full h-full object-contain opacity-95"
              draggable="false"
            />

            {/* Overlay iconApk menggantikan teks huruf */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <img
                src={iconApk}
                alt="APK Icon"
                className="w-16 h-16 object-contain"
                draggable="false"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== INFO SECTION ===== */}
      <div className="px-5 pt-24 pb-5 flex-1">
        <div className="grid grid-cols-2 gap-y-5">
          <div className="mt-12">
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#89A4D6]/80">
              File Name
            </div>
            <div className="mt-1 max-w-[150px] truncate text-[18px] leading-tight">{fileName}</div>
          </div>

          <div className="mt-12 text-right">
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#89A4D6]/80">
              File Size
            </div>
            <div className="mt-1 text-[18px] leading-none">{fileSize}</div>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        className="px-4 py-3 text-center text-[16px] font-semibold tracking-wide"
        style={{
          background: 'rgba(56,73,99,0.9)',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {footerId}
      </div>
    </div>
  )
}
