/* eslint-disable react/prop-types */
import { useMemo } from 'react'
import deviceNonAktif from '@renderer/assets/image/device_nonaktif.svg'
import deviceIcon from '@renderer/assets/icons/device-icon.svg'

// 📦 ikon navigasi dari aset Figma (SVG)
import navLeftA from '@renderer/assets/icons/nav_left_active.svg'
import navLeftD from '@renderer/assets/icons/nav_left_disable.svg'
import navRightA from '@renderer/assets/icons/nav_right_active.svg'
import navRightD from '@renderer/assets/icons/nav_right_disable.svg'

export default function DeviceTabsInfo({
  devices = [],
  windowIndex = 0,
  windowSize = 4,
  onPrev,
  onNext
}) {
  const slice = useMemo(
    () => devices.slice(windowIndex, windowIndex + windowSize),
    [devices, windowIndex, windowSize]
  )

  const canPrev = windowIndex > 0
  const canNext = windowIndex + windowSize < devices.length

  return (
    <div className="flex items-center justify-between w-full">
      {/* kiri: daftar device */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
        {slice.map((d, i) => (
          <TabItemInfo
            key={d.id ?? i}
            index={windowIndex + i + 1}
            owner={d.owner_name}
            phone={d.phone_number}
          />
        ))}
      </div>

      {/* kanan: tombol navigasi */}
      <div className="flex items-center ml-4" style={{ gap: '16px' }}>
        <NavIconButton dir="left" active={canPrev} onClick={onPrev} />
        <NavIconButton dir="right" active={canNext} onClick={onNext} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------- */
/* 📦 Tab item info                                          */
/* --------------------------------------------------------- */
function TabItemInfo({ index, owner, phone }) {
  return (
    <div
      className="relative h-[78px] min-w-[280px] px-5 py-3 text-left select-none"
      style={{
        backgroundImage: `url(${deviceNonAktif})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center'
      }}
    >
      {/* badge kiri */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-[52px] grid place-items-center">
        <img src={deviceIcon} alt="" className="absolute inset-0 m-auto w-12 h-14" />
        <span className="relative font-[Aldrich] text-[18px] text-[#E7E9EE] leading-none">
          {index}
        </span>
      </div>

      {/* teks */}
      <div className="pl-16 pt-1.5 pr-3 pb-1">
        <div className="font-[Aldrich] text-[18px] tracking-wide" style={{ color: '#F4F6F8' }}>
          {owner}
        </div>
        <div className="text-[14px] mt-0.5 font-[Noto Sans]" style={{ color: '#EDC702' }}>
          {phone}
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------- */
/* 🎯 Navigation icon button (responsif)                     */
/* --------------------------------------------------------- */
function NavIconButton({ dir = 'left', active, onClick }) {
  const src = dir === 'left' ? (active ? navLeftA : navLeftD) : active ? navRightA : navRightD

  // Skala responsif: tinggi menyesuaikan layar, rasio 1:2 (W:H)
  const H = 'clamp(40px, 3.5vw, 58.55px)' // tinggi minimum 40px, maksimum 58.55px
  const W = `calc(${H} * 0.5)` // lebar mengikuti rasio 1:2

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!active}
      className="p-0 m-0 bg-transparent border-0 outline-none flex items-center justify-center"
      style={{
        width: W,
        height: H,
        cursor: active ? 'pointer' : 'default',
        opacity: active ? 1 : 0.9
      }}
      aria-label={dir === 'left' ? 'Previous devices' : 'Next devices'}
    >
      <img
        src={src}
        alt=""
        draggable="false"
        className="pointer-events-none select-none"
        style={{
          width: W,
          height: H,
          objectFit: 'contain'
        }}
      />
    </button>
  )
}
