/* eslint-disable react/prop-types */
import { IoIosArrowRoundBack } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'

import HeaderBar from '@renderer/components/HeaderBar'

import iconApp from '@renderer/assets/icons/icon_app.svg'

import bgTop from '@renderer/assets/image/bg-license-data-analysis-tools.svg'
import bgApk from '@renderer/assets/image/bg-license-apk-analysis.svg'
import bgMonitor from '@renderer/assets/image/bg-license-monitor.svg?url'
import bgForensic from '@renderer/assets/image/bg-license-forensic-data-analysis.svg'
import bgReport from '@renderer/assets/image/bg-license-report-generator.svg'

console.log({
  bgTop,
  bgApk,
  bgMonitor,
  bgForensic,
  bgReport
})

function LicenseCard({ title, code, bg, className = '' }) {
  return (
    <div
      className={`flex items-center select-none ${className}`}
      style={{
        backgroundImage: `url("${bg}")`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      <div className="flex flex-col justify-center text-left pl-40 pr-8">
        <span className="text-[#EDC702] font-bold text-2xl tracking-tight">{title}</span>

        <span className="text-[#F4F6F8] text-2xl font-medium mt-4 tracking-wide">{code}</span>
      </div>
    </div>
  )
}

export default function AboutPage() {
  const navigate = useNavigate()

  const licensesTop = [
    {
      title: 'Comprehensive Forensic Data Analysis',
      code: 'GS26-CGSF-26FD-X02Q',
      bg: bgForensic
    },
    {
      title: 'Advanced Data Analysis Tools',
      code: 'GS26-AGSA-26DT-Z02W',
      bg: bgTop
    }
  ]

  const licensesBottom = [
    {
      title: 'APK Analysis',
      code: 'GS26-LGSS-26SA-M06U',
      bg: bgApk
    },
    {
      title: 'Dashboard Monitoring',
      code: 'GS26-MGSD-26NT-L06P',
      bg: bgMonitor
    },
    {
      title: 'Report Generator',
      code: 'GS26-RSGT-26PE-H06D',
      bg: bgReport
    }
  ]

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden relative">
      <HeaderBar />

      {/* BACK + TITLE */}
      <div className="flex items-center gap-3 px-[51px] pt-[46px]">
        <button
          onClick={() => navigate(-1)}
          className="text-[#EDC702] hover:text-[#EDC702]/80 transition"
        >
          <IoIosArrowRoundBack size={42} />
        </button>

        <h1 className="text-white text-2xl tracking-wide font-semibold">ABOUT</h1>
      </div>

      {/* MAIN SECTION */}
      <div className="flex-1 w-full flex flex-col items-center justify-start pt-8 pb-10">
        {/* LOGO */}
        <img
          src={iconApp}
          alt="App Logo"
          className="w-[220px] h-[220px] object-contain mb-6 select-none"
          draggable={false}
        />

        {/* TITLE */}
        <h1 className="text-[#EDC702] text-5xl font-bold tracking-wide mb-20 text-center">
          DATA ANALYTICS PLATFORM
        </h1>

        {/* ===== ROW ATAS (2 LICENSES) ===== */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {licensesTop.map((lic, idx) => (
            <LicenseCard
              key={idx}
              title={lic.title}
              code={lic.code}
              bg={lic.bg}
              className="w-[664px] h-[130px]"
            />
          ))}
        </div>

        {/* ===== ROW BAWAH (3 LICENSES) ===== */}
        <div className="flex items-center justify-center gap-8">
          {licensesBottom.map((lic, idx) => (
            <LicenseCard
              key={idx}
              title={lic.title}
              code={lic.code}
              bg={lic.bg}
              className="w-[560px] h-[130px]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
