/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'

const MAX_XLSX_BYTES = 16 * 1024 * 1024 // naikkan sedikit

export default function ExcelViewerMulti({ path }) {
  const [wb, setWb] = useState(null) // workbook SheetJS
  const [sheetNames, setSheetNames] = useState([])
  const [active, setActive] = useState(0)
  const [rows, setRows] = useState([]) // data [ [c00,c01,...], [c10,c11,...], ... ]
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)

  // load workbook once
  useEffect(() => {
    let ok = true
    ;(async () => {
      try {
        setLoading(true)
        setErr(null)
        const buf = await window.api.files.readBuffer({ path, maxBytes: MAX_XLSX_BYTES })
        const XLSX = await import('xlsx')
        const _wb = XLSX.read(buf, { type: 'array' })
        if (!ok) return
        setWb(_wb)
        setSheetNames(_wb.SheetNames || [])
        setActive(0)
      } catch (e) {
        if (!ok) return
        setErr('Gagal membaca file Excel.')
      } finally {
        if (ok) setLoading(false)
      }
    })()
    return () => {
      ok = false
    }
  }, [path])

  // parse active sheet → rows[][] (header + body)
  useEffect(() => {
    if (!wb || !sheetNames.length) return
    const name = sheetNames[active]
    const ws = wb.Sheets[name]
    if (!ws) {
      setRows([])
      return
    }
    // header:1 => array-of-arrays; defval:'' agar sel kosong tak jadi undefined
    const XLSX = wb.SSF ? require('xlsx') : null // guard saat HMR; tak akan dipanggil di prod
    const arr = (XLSX || window.XLSX)?.utils?.sheet_to_json(ws, { header: 1, defval: '' }) || []
    setRows(arr)
    setPage(1) // reset ke halaman 1 saat ganti sheet
  }, [wb, sheetNames, active])

  // header & body (anggap baris pertama adalah header)
  const header = useMemo(() => (rows[0] || []).map((v, i) => String(v || `Col ${i + 1}`)), [rows])
  const body = useMemo(() => rows.slice(1), [rows])

  // paging slice
  const total = body.length
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  const curPage = Math.min(page, maxPage)
  const slice = useMemo(() => {
    const start = (curPage - 1) * pageSize
    return body.slice(start, start + pageSize)
  }, [body, curPage, pageSize])

  return (
    <div className="w-[min(95vw,1200px)] h-[85vh] rounded-md overflow-hidden bg-[#0b0f17] border border-white/10 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="text-sm opacity-80">
          {loading ? (
            'Memuat…'
          ) : err ? (
            <span className="text-red-400">{err}</span>
          ) : (
            `Sheets: ${sheetNames.length}`
          )}
        </div>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <label>Rows / page</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="bg-transparent border border-white/20 px-2 py-1 rounded"
          >
            {[50, 100, 200, 500].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs (sheet names) */}
      <div className="flex gap-2 overflow-x-auto px-2 py-2 border-b border-white/10 bg-[#0E1624]/60">
        {sheetNames.map((nm, i) => (
          <button
            key={nm + i}
            onClick={() => setActive(i)}
            className={`px-3 py-1 rounded-full text-xs shrink-0 border ${i === active ? 'border-[#EDC702] text-[#EDC702] bg-[#EDC702]/10' : 'border-white/15 text-white/85 hover:bg-white/10'}`}
            title={nm}
          >
            {nm}
          </button>
        ))}
        {!sheetNames.length && <div className="text-white/60 text-xs px-1">Tidak ada sheet</div>}
      </div>

      {/* Table */}
      <div className="h-[calc(85vh-108px)] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0e1624] sticky top-0 z-10">
            <tr>
              {header.map((h, i) => (
                <th key={i} className="text-left font-semibold border-b border-white/10 px-3 py-2">
                  {String(h)}
                </th>
              ))}
              {!header.length && (
                <th className="text-left font-semibold border-b border-white/10 px-3 py-2">
                  No columns
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-white/60" colSpan={Math.max(1, header.length)}>
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              slice.map((r, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-[#0f1520]' : 'bg-transparent'}>
                  {(header.length ? r : [r]).map((c, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-2 border-b border-white/5 whitespace-pre-wrap wrap-break-word"
                    >
                      {c === null || c === undefined ? '' : String(c)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 bg-[#0E1624]/60 text-xs">
        <div className="opacity-80">
          {total ? `Rows: ${total.toLocaleString()} • Page ${curPage}/${maxPage}` : 'Rows: 0'}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 border border-white/15 rounded disabled:opacity-40"
            onClick={() => setPage(1)}
            disabled={curPage <= 1}
          >
            ⟪
          </button>
          <button
            className="px-2 py-1 border border-white/15 rounded disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={curPage <= 1}
          >
            ‹ Prev
          </button>
          <button
            className="px-2 py-1 border border-white/15 rounded disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={curPage >= maxPage}
          >
            Next ›
          </button>
          <button
            className="px-2 py-1 border border-white/15 rounded disabled:opacity-40"
            onClick={() => setPage(maxPage)}
            disabled={curPage >= maxPage}
          >
            ⟫
          </button>
        </div>
      </div>
    </div>
  )
}
