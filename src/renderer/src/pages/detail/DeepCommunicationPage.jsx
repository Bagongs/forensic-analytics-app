/* eslint-disable react/prop-types */
// src/renderer/src/pages/detail/DeepCommunicationPage.jsx
import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import useAnalysisContext from '@renderer/hooks/useAnalysisContext'
import HeaderBar from '@renderer/components/HeaderBar'
import DeviceTabsInteractive from '@renderer/components/analytics/DeviceTabsInteractive'
import SummaryBox from '@renderer/components/common/SummaryBox'
import { exportPdfWithToast } from '@renderer/shared/exportPdfWithToast'
import { extractHttpMessage } from '@renderer/utils/httpError'

import { TbFileExport } from 'react-icons/tb'
import { LiaEditSolid } from 'react-icons/lia'
import { FaRegSave } from 'react-icons/fa'
import { IoIosArrowRoundBack } from 'react-icons/io'

import exportBg from '@renderer/assets/image/export.svg'
import editBg from '@renderer/assets/icons/edit.svg'

/* ===== ICONS ===== */
import iconWhatsapp from '@renderer/assets/icons/icon_whatsapp.svg'
import iconInstagram from '@renderer/assets/icons/icon_instagram.svg'
import iconFacebook from '@renderer/assets/icons/icon_facebook.svg'
import iconTelegram from '@renderer/assets/icons/icon_telegram.svg'
import iconTiktok from '@renderer/assets/icons/icon_tiktok.svg'
import iconX from '@renderer/assets/icons/icon_x.svg'

/* ================= UI CONST ================= */
const COLORS = {
  gold: '#EDC702',
  border: '#394F6F',
  panel: '#202C3C',
  panelChat: '#161E2A',
  tableBg: '#0B0F17',
  headerBg: '#395070',
  text: '#E7E9EE'
}

const COLORS_NAME = ['#68A2FF', '#43BE21', '#B783FC', '#F49E4F', '#F65B54', '#F87EBA', '#50D4E4']

const senderColorMap = {}

function getSenderColor(senderId) {
  if (senderColorMap[senderId]) return senderColorMap[senderId]

  const index = Object.keys(senderColorMap).length % COLORS_NAME.length
  senderColorMap[senderId] = COLORS_NAME[index]

  return senderColorMap[senderId]
}
// Kontrak API pakai label platform Title Case: Instagram, Telegram, WhatsApp, Facebook, X, TikTok
const CHANNELS = [
  { name: 'WhatsApp', icon: iconWhatsapp },
  { name: 'Instagram', icon: iconInstagram },
  { name: 'Facebook', icon: iconFacebook },
  { name: 'Telegram', icon: iconTelegram },
  { name: 'X', icon: iconX },
  { name: 'TikTok', icon: iconTiktok }
]

/* ================= Small helpers ================= */
function toArray(x) {
  if (Array.isArray(x)) return x
  if (x === null || x === undefined) return []
  return [x]
}
function s(v) {
  if (v === null || v === undefined) return ''
  return String(v)
}

/* ========= Skeletons & Empty ========= */
function ListSkeleton({ rows = 10 }) {
  return (
    <div className="max-h-[410px] overflow-y-auto">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3 border-b animate-pulse"
          style={{ borderColor: COLORS.border }}
        >
          <div className="h-3 w-[60%] rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}
function ChatSkeleton() {
  return (
    <div className="mt-3 max-h-[480px] overflow-y-auto space-y-3 px-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
          <div
            className="px-4 py-3 rounded-2xl max-w-[70%] border animate-pulse"
            style={{
              borderColor: COLORS.border,
              background: i % 2 ? COLORS.headerBg : 'transparent'
            }}
          >
            <div className="h-3 w-48 rounded bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/10 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
function CenterNote({ children }) {
  return (
    <div className="h-full min-h-[420px] grid place-items-center text-[18px] opacity-70">
      {children}
    </div>
  )
}

/* ================= PAGE ================= */
export default function DeepCommunicationPage() {
  const nav = useNavigate()
  const { analysisId } = useAnalysisContext()

  /* ----- STATE ----- */
  const [devices, setDevices] = useState([]) // [{id, name, phone, platformCards: [...] }]
  const [activeDeviceId, setActiveDeviceId] = useState(null)

  // pilihan UI
  const [selectedChannel, setSelectedChannel] = useState(null) // 'Telegram', ...
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [query, setQuery] = useState('')

  // data detail dinamis
  const [people, setPeople] = useState([]) // hasil getPlatformCardsIntensity
  const [messages, setMessages] = useState([]) // hasil chat-detail untuk (person, platform, device)

  // ringkasan
  const [summary, setSummary] = useState('')
  const [editing, setEditing] = useState(false)
  const actionLabel = editing ? 'Save' : summary?.trim() ? 'Edit' : 'Add'
  const actionIcon = editing ? (
    <FaRegSave className="text-[16px]" />
  ) : (
    <LiaEditSolid className="text-[18px]" />
  )

  // status
  const [loading, setLoading] = useState(true) // loading data awal (devices + platform cards)
  const [loadingPeople, setLoadingPeople] = useState(false) // loading intensity list
  const [loadingChat, setLoadingChat] = useState(false) // loading chat-detail
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const savingRef = useRef(false)

  // cache untuk hemat hit BE
  // keyPeople: `${deviceId}|${platform}`
  const peopleCache = useRef(new Map())
  // keyChat: `${deviceId}|${platform}|${person}|${q}`  (cache termasuk query agar konsisten)
  const chatCache = useRef(new Map())

  // debounce simple untuk search
  const searchTimer = useRef(null)

  /* ----- FETCH: initial deep-communication-analytics ----- */
  useEffect(() => {
    let mounted = true
    async function fetchInitial() {
      setLoading(true)
      setError('')
      try {
        const res = await window.api.analytics.getDeepCommunication({ analytic_id: analysisId })
        if (!mounted) return
        const data = res?.data || {}

        const devs = toArray(data?.devices).map((d) => ({
          id: s(d?.device_id || d?.id),
          device_name: s(d?.device_name || d?.owner_name || '—'),
          phone_number: s(d?.phone_number || '—'),
          platform_cards: toArray(d?.platform_cards || [])
        }))

        setDevices(devs)
        setSummary(s(data?.summary || ''))
        setActiveDeviceId((prev) => prev ?? devs[0]?.id ?? null)
      } catch (e) {
        if (!mounted) return
        setError(extractHttpMessage(e, 'Gagal memuat Deep Communication Analytics'))
        console.warn('[DeepComm] initial fetch error:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchInitial()
    return () => {
      mounted = false
    }
  }, [analysisId])

  /* ----- DERIVED ----- */
  const device = useMemo(() => {
    if (!activeDeviceId) return null
    return devices.find((x) => s(x.id) === s(activeDeviceId)) || null
  }, [devices, activeDeviceId])

  // apakah platform tersedia (has_data/message_count>0) di device aktif
  const platformAvailability = useMemo(() => {
    const map = new Map()
    const cards = toArray(device?.platform_cards)
    for (const c of cards) {
      const label = s(c?.platform) // Title Case
      const has = !!c?.has_data && Number(c?.message_count || 0) > 0
      map.set(label, has)
    }
    return map
  }, [device])

  const nothingToExport = !error && !loading && devices.length === 0
  const disableExport = isExporting || loading || nothingToExport

  /* ----- HANDLERS: device / channel / person ----- */
  const onChangeDevice = (id) => {
    setActiveDeviceId(id)
    setSelectedChannel(null)
    setSelectedPerson(null)
    setPeople([])
    setMessages([])
    setQuery('')
  }

  const loadPeople = async (platformLabel) => {
    if (!analysisId || !device?.id || !platformLabel) return
    const key = `${device.id}|${platformLabel}`
    if (peopleCache.current.has(key)) {
      setPeople(peopleCache.current.get(key))
      return
    }
    setLoadingPeople(true)
    try {
      const res = await window.api.analytics.getPlatformIntensity({
        analytic_id: analysisId,
        platform: platformLabel, // sesuai kontrak: Instagram, Telegram, WhatsApp, Facebook, X, TikTok
        device_id: device.id
      })
      const arr = toArray(res?.data?.intensity_list).map((p) => ({
        person: s(p?.person),
        intensity: Number(p?.intensity || 0)
      }))
      peopleCache.current.set(key, arr)
      setPeople(arr)
    } catch (e) {
      setPeople([])
      console.warn('[DeepComm] getPlatformIntensity error:', e)
    } finally {
      setLoadingPeople(false)
    }
  }

  const onSelectChannel = async (label) => {
    setSelectedChannel(label)
    setSelectedPerson(null)
    setMessages([])
    setQuery('')
    await loadPeople(label)
  }
  const [chatType, setChatType] = useState(null)
  const loadChat = async ({ person, q }) => {
    if (!analysisId || !device?.id || !selectedChannel || (!person && !q)) return

    const key = `${device.id}|${selectedChannel}|${person || ''}|${(q || '').trim()}`
    if (chatCache.current.has(key)) {
      const cached = chatCache.current.get(key)
      setMessages(cached.messages)
      setChatType(cached.chat_type)
      return
    }

    setLoadingChat(true)
    try {
      const res = await window.api.analytics.getChatDetail({
        analytic_id: analysisId,
        person_name: person || undefined,
        platform: selectedChannel,
        device_id: device.id,
        search: (q || '').trim() || undefined
      })

      console.log('chat detail (updated parsing): ', res)

      // simpan tipe chat (One On One, Group, Broadcast)
      const chatTypeRes = res?.data?.chat_type || ''
      setChatType(chatTypeRes)

      // conversation_history adalah ARRAY, tiap block punya .messages[]
      const blocks = toArray(res?.data?.conversation_history)

      const msgs = blocks.flatMap((block) =>
        toArray(block?.messages).map((m) => ({
          sender: s(m?.sender),
          sender_id: s(m?.sender_id),
          text: s(m?.message_text || ''),
          from: s(m?.direction) === 'Outgoing' ? 'Device' : 'Other',

          // Time: ambil dari block timestamp atau block.times
          time: block?.times
            ? s(block?.times)
            : block?.timestamp
              ? new Date(block.timestamp).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : ''
        }))
      )

      chatCache.current.set(key, {
        messages: msgs,
        chat_type: chatTypeRes
      })

      setMessages(msgs)
    } catch (e) {
      setMessages([])
      console.warn('[DeepComm] getChatDetail error:', e)
    } finally {
      setLoadingChat(false)
    }
  }

  const onSelectPerson = async (person) => {
    setSelectedPerson(person)
    setMessages([])
    await loadChat({ person, q: '' })
  }

  // live search (debounce 300ms) → panggil chat-detail lagi dengan parameter search
  useEffect(() => {
    if (!selectedPerson && !query.trim()) return
    if (!selectedChannel || !device?.id) return

    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      loadChat({ person: selectedPerson || '', q: query })
    }, 300)

    return () => clearTimeout(searchTimer.current)
  }, [query, selectedPerson, selectedChannel, device?.id]) // eslint-disable-line

  /* ----- EXPORT PDF ----- */
  const onExportPdf = async () => {
    if (disableExport) return
    // Kontrak: untuk DC bisa kirim device_id, person_name, source (nama platform)
    await exportPdfWithToast({
      analytic_id: analysisId,
      fileName: 'deep-communication-report',
      setIsExporting,
      // tambahan khusus DC:
      person_name: selectedPerson || undefined,
      device_id: device?.id || undefined,
      source: selectedChannel || undefined
    })
  }

  /* ----- SUMMARY ----- */
  const onSummaryAction = async () => {
    if (!editing) {
      setEditing(true)
      return
    }
    if (savingRef.current) return
    savingRef.current = true
    try {
      await window.api.report.saveSummary({ analytic_id: analysisId, summary: summary })
      setEditing(false)
    } catch (e) {
      alert(extractHttpMessage(e, 'Gagal menyimpan ringkasan'))
    } finally {
      savingRef.current = false
    }
  }

  /* ================= RENDER ================= */
  const totalPeopleThisChannel = people.length
  const filteredMessages = messages // (server-side sudah difilter via search)

  return (
    <div className="min-h-screen text-[#E7E9EE] font-[Noto Sans]">
      <HeaderBar />

      {/* TITLE + EXPORT */}
      <div className="flex items-center justify-between px-8 2xl:pt-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => nav('/analytics', { replace: true })}
            className="flex items-center justify-center w-[46px] h-[46px] hover:opacity-80 transition"
            aria-label="Back"
          >
            <IoIosArrowRoundBack
              color="#EDC702"
              size={46} // ukuran icon
              style={{ marginLeft: '-4px' }}
            />
          </button>
          <h1 className="font-[Aldrich] text-[22px] tracking-wide text-white">
            DEEP COMMUNICATION ANALYTICS{selectedChannel ? ` — ${selectedChannel}` : ''}
          </h1>
        </div>

        {/* Export PDF */}
        <button
          onClick={onExportPdf}
          disabled={disableExport}
          className={`relative flex items-center gap-2 h-10 px-5 font-[Aldrich] text-[#172C48] text-[14px] overflow-hidden transition
            ${disableExport ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 hover:shadow-[0_0_12px_#EDC702]'}`}
          title={
            loading
              ? 'Loading…'
              : isExporting
                ? 'Exporting PDF…'
                : nothingToExport
                  ? 'Nothing to export'
                  : 'Export PDF'
          }
        >
          <img
            src={exportBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
          <TbFileExport
            className={`text-[18px] relative z-10 ${isExporting ? 'animate-pulse' : ''}`}
          />
          <span className="relative z-10">{isExporting ? 'Exporting…' : 'Export PDF'}</span>
        </button>
      </div>

      {/* MAIN TWO-PANEL LAYOUT */}
      <div className="px-8 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: device tabs + grid / person table */}
        <div className="border" style={{ borderColor: COLORS.border, background: COLORS.tableBg }}>
          {/* Device Tabs */}
          <div className="p-4 border-b" style={{ borderColor: COLORS.border }}>
            {devices.length > 0 ? (
              <DeviceTabsInteractive
                devices={devices.map((d, idx) => ({
                  id: d.id,
                  owner_name: d.device_name,
                  phone_number: d.phone_number,
                  label: `Device ${String.fromCharCode(65 + idx)}`
                }))}
                activeId={activeDeviceId}
                onChange={onChangeDevice}
              />
            ) : loading ? (
              <div className="h-10 flex items-center gap-3">
                <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
                <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
              </div>
            ) : (
              <div
                className="h-10 flex items-center px-3 rounded border"
                style={{ borderColor: COLORS.border }}
              >
                <span className="opacity-70 text-sm">No devices</span>
              </div>
            )}
          </div>

          {/* Content area */}
          {error && !loading ? (
            <CenterNote>
              <div className="text-red-300">
                {error}
                <div className="mt-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </CenterNote>
          ) : !selectedChannel ? (
            // GRID SOSMED — tampilan awal: enable/disable berdasarkan has_data di platform_cards
            <div className="p-6 grid grid-cols-3 gap-6">
              {CHANNELS.map((ch) => {
                const available = platformAvailability.get(ch.name) ?? false
                return (
                  <button
                    key={ch.name}
                    onClick={() => onSelectChannel(ch.name)}
                    className={`flex flex-col items-center justify-center gap-3 h-[150px] border transition
                      ${available ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'}`}
                    style={{ borderColor: COLORS.border }}
                    disabled={loading || !available}
                    title={available ? ch.name : `${ch.name} (no data)`}
                  >
                    <img src={ch.icon} alt={ch.name} className="w-12 h-12 opacity-90" />
                    <span className="font-[Aldrich] text-[18px]">{ch.name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            // TABEL PERSON + INTENSITY
            <div className="p-4">
              {/* Header kiri */}
              <div
                className="w-full h-11 flex items-center justify-between px-4 border"
                style={{ borderColor: COLORS.border, background: COLORS.panel }}
              >
                <span className="opacity-90">{selectedChannel}</span>
                <button
                  onClick={() => {
                    setSelectedChannel(null)
                    setSelectedPerson(null)
                    setPeople([])
                    setMessages([])
                    setQuery('')
                  }}
                  className="text-sm p-0.5 btn-upload text-[#0B0F17] hover:bg-[#EDC702] transition"
                >
                  Change
                </button>
              </div>

              {/* Header tabel */}
              <div className="mt-4 border flex text-[14px]" style={{ borderColor: COLORS.border }}>
                <div
                  className="flex-1 px-4 py-2 font-[Aldrich] font-bold"
                  style={{ background: COLORS.headerBg, color: COLORS.gold }}
                >
                  Person / Groups
                </div>
                <div
                  className="w-32 px-4 py-2 font-[Aldrich] text-right font-bold"
                  style={{ background: COLORS.headerBg, color: COLORS.gold }}
                >
                  Intensity
                </div>
              </div>

              {/* Body tabel */}
              {loadingPeople ? (
                <ListSkeleton rows={10} />
              ) : totalPeopleThisChannel === 0 ? (
                <CenterNote>No data for {selectedChannel}.</CenterNote>
              ) : (
                <div className="max-h-[410px] overflow-y-auto">
                  {people.map((p) => {
                    const active = p.person === selectedPerson
                    return (
                      <button
                        key={p.person}
                        onClick={() => onSelectPerson(p.person)}
                        className={`w-full flex items-center justify-between px-4 py-3 border-b text-left transition
                          ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        style={{ borderColor: COLORS.border }}
                      >
                        <span className={`${active ? 'font-semibold' : ''}`}>{p.person}</span>
                        <span className={`${active ? 'font-semibold' : ''}`}>{p.intensity}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: chat panel */}
        <div
          className="border p-4"
          style={{ borderColor: COLORS.border, background: COLORS.tableBg }}
        >
          {!selectedChannel ? (
            <CenterNote>No information.</CenterNote>
          ) : !selectedPerson ? (
            <CenterNote>Select a person to view messages.</CenterNote>
          ) : (
            <>
              {/* Header chat */}
              <div
                className="flex items-center gap-3 px-3 py-2 border"
                style={{ background: COLORS.panelChat }}
              >
                <span className="font-[Aldrich] text-[#F4F6F8] text-[14px] bg-[#223147] border border-white p-2">
                  {selectedPerson} &nbsp;{' '}
                  {people.find((p) => p.person === selectedPerson)?.intensity ?? ''}
                </span>

                <div
                  className="ml-auto flex items-center gap-2 px-2 py-1 border"
                  style={{ borderColor: COLORS.border }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#FFFFFF" strokeWidth="2" />
                    <path d="M20 20l-3-3" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="bg-transparent outline-none text-sm"
                  />
                </div>
              </div>

              {/* Chat bubble */}
              {loadingChat ? (
                <ChatSkeleton />
              ) : (
                <div className="mt-3 max-h-[550px] overflow-y-auto space-y-3 px-1">
                  {filteredMessages.length === 0 && (
                    <div className="text-sm opacity-60 px-2">Tidak ada chat history.</div>
                  )}
                  {filteredMessages.map((m, i) => {
                    const fromValue = s(m.from || '').toLowerCase()
                    const isDevice = fromValue === 'device'

                    const typeGroup = ['group', 'broadcast', 'channel'] // dijadikan lowercase semua
                    const chatTypeLower = s(chatType || '').toLowerCase() // chatType lowercase

                    return (
                      <div key={i} className={`flex ${isDevice ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="px-4 py-2 rounded-2xl max-w-[70%] border"
                          style={{
                            borderColor: COLORS.border,
                            background: isDevice ? COLORS.headerBg : '#2B394E'
                          }}
                        >
                          {chatTypeLower && typeGroup.includes(chatTypeLower) && (
                            <div
                              style={{ color: getSenderColor(m?.sender_id) }}
                              className="flex justify-between text-[12px] mb-1 gap-5"
                            >
                              <span>{m?.sender ?? 'Unknown'}</span>
                              <span>{m?.sender_id ?? ''}</span>
                            </div>
                          )}

                          <div className="text-[14px] leading-snug whitespace-normal wrap-break-word">
                            {s(m.text)}
                          </div>

                          <div className="text-[11px] opacity-60 mt-1 text-right">{s(m.time)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="px-8 mt-8 pb-12">
        <SummaryBox
          title="Summary"
          value={summary}
          onChange={setSummary}
          placeholder="Click Add to write summary"
          editable={editing}
          actionLabel={actionLabel}
          actionIcon={actionIcon}
          actionBgImage={editBg}
          actionOffset={{ top: 15, right: 24 }}
          onAction={onSummaryAction}
          maxBodyHeight={240}
          autoGrow={false}
        />
      </div>
    </div>
  )
}
