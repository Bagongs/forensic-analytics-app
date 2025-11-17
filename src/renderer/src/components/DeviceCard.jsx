/* eslint-disable react/prop-types */
import bgTop from '@renderer/assets/image/bg-device-top.svg'
import deviceIcon from '@renderer/assets/icons/device-icon.svg'

export default function DeviceCard({
  ownerName = '',
  phoneNumber = '',
  fileName = '',
  fileSize = '',
  deviceId = '',
  empty = false,
  index = 0,
  label,
  showLabel = true
}) {
  const isEmpty = empty || (!ownerName && !phoneNumber && !fileName && !fileSize)
  const computedLabel = label ?? indexToLetters(index)

  // ===============================
  // 🟦 EMPTY STATE
  // ===============================
  if (isEmpty) {
    return (
      <div
        className="overflow-hidden text-white flex flex-col"
        style={{
          width: '369px',
          height: '637px',
          background: '#1F293C',
          border: '1px solid #50688D',
          opacity: 1
        }}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-[22px] font-semibold tracking-wide"
              style={{ fontFamily: 'Aldrich, sans-serif' }}
            >
              No Data
            </div>
            <div className="mt-1 text-[18px] opacity-55">Please Add Device</div>
          </div>
        </div>
        <div className="h-[42px] w-full" style={{ background: '#384963' }} />
      </div>
    )
  }

  // ===============================
  // 🟩 FILLED STATE
  // ===============================
  return (
    <div
      className="device-card overflow-hidden text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex flex-col"
      style={{ width: '369px', height: '637px', opacity: 1, transform: 'rotate(0deg)' }}
    >
      {/* Top banner */}
      <div className="relative h-[250px]">
        <img
          src={bgTop}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none select-none"
          draggable="false"
        />

        {/* Container icon + LABEL (label menimpa icon) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[15px]">
          <div className="relative w-[110px] h-[159px]">
            {/* Icon device */}
            <img
              src={deviceIcon}
              alt="Device"
              className="absolute inset-0 w-full h-full object-contain opacity-95"
              draggable="false"
            />
            {/* Label huruf di atas icon */}
            {showLabel && (
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <span
                  style={{
                    fontFamily: 'Aldrich, sans-serif',
                    fontSize: '54px',
                    lineHeight: 1,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textShadow: '0 2px 12px rgba(0,0,0,.45)'
                  }}
                >
                  {computedLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-5 pt-24 pb-5 flex-1">
        <div className="grid grid-cols-2 gap-y-5">
          <div>
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#89A4D6]/80">Name</div>
            <div className="mt-1 text-[20px] font-semibold leading-none">{ownerName}</div>
          </div>

          <div className="text-right">
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#89A4D6]/80">
              Phone Number
            </div>
            <div className="mt-1 text-[20px] font-semibold leading-none tabular-nums">
              {phoneNumber}
            </div>
          </div>

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
            <div className="mt-1 text-[22px] font-bold leading-none">{fileSize}</div>
          </div>
        </div>
      </div>

      {/* Footer ID */}
      <div className="px-4 py-3 text-center text-[16px] font-semibold tracking-wide bg-[#384963]">
        {deviceId}
      </div>
    </div>
  )
}

/** Convert 0-based index to letters: 0->A, 1->B, ..., 26->AA, ... */
function indexToLetters(n) {
  let x = Math.max(0, Math.floor(n || 0))
  let s = ''
  while (x >= 0) {
    s = String.fromCharCode((x % 26) + 65) + s
    x = Math.floor(x / 26) - 1
  }
  return s
}
