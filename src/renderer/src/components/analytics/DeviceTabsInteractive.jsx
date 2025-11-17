/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react'
import deviceAktif from '@renderer/assets/image/device_aktif.svg'
import deviceNonAktif from '@renderer/assets/image/device_nonaktif.svg'
import deviceIcon from '@renderer/assets/icons/device-icon.svg'

const COLORS = {
  textMain: '#F4F6F8',
  textGold: '#EDC702',
  ringGold: '#EDC702',
  ringDim: 'rgba(237, 199, 2, .25)'
}

export default function DeviceTabsInteractive({ devices = [], activeId, onChange }) {
  const wrapRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      })
    }
  }, [activeId])

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="flex items-center gap-3 overflow-x-auto scrollbar-none scroll-smooth snap-x py-1"
      >
        {devices.map((d, i) => {
          const isActive = String(d.id) === String(activeId)
          return (
            <TabItem
              key={String(d.id ?? i)}
              refProp={isActive ? activeRef : undefined}
              index={i + 1}
              owner={d.owner_name}
              phone={d.phone_number}
              active={isActive}
              onClick={() => onChange?.(d.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

function TabItem({ index, owner, phone, active, onClick, refProp }) {
  return (
    <button
      type="button"
      ref={refProp}
      onClick={onClick}
      className={[
        'relative h-[78px] min-w-[280px] px-5 py-3 text-left select-none snap-center',
        'transition-all duration-200'
      ].join(' ')}
      style={{
        backgroundImage: `url(${active ? deviceAktif : deviceNonAktif})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        outline: 'none'
      }}
      aria-pressed={active}
      title={`${owner || '-'} • ${phone || '-'}`}
    >
      {/* badge kiri */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-[52px] grid place-items-center">
        <img src={deviceIcon} alt="" className="absolute inset-0 m-auto w-12 h-14 select-none" />
        <span className="relative font-[Aldrich] text-[18px] text-[#E7E9EE] leading-none">
          {index}
        </span>
      </div>

      {/* teks */}
      <div className="pl-16 pt-1.5 pr-3 pb-1">
        <div
          className="font-[Aldrich] text-[18px] tracking-wide truncate"
          style={{ color: COLORS.textMain }}
          title={owner}
        >
          {owner || '-'}
        </div>
        <div
          className="text-[14px] mt-0.5 font-[Noto Sans] truncate"
          style={{ color: COLORS.textGold }}
          title={phone}
        >
          {phone || '-'}
        </div>
      </div>
    </button>
  )
}
