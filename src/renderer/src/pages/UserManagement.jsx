/* eslint-disable no-unused-vars */
// src/renderer/src/pages/user/UserManagement.jsx
/* eslint-disable react/prop-types */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import HeaderBar from '@renderer/components/HeaderBar'
import backIcon from '@renderer/assets/icons/back.svg'

import MiniButton, { MiniButtonContent } from '@renderer/components/MiniButton'
import bgButton from '@renderer/assets/image/bg_button.svg'
import iconSearch from '@renderer/assets/icons/icon-search.svg'

import { LuPencil, LuTrash2 } from 'react-icons/lu'
import { RiExpandUpDownFill } from 'react-icons/ri'

import Pagination from '@renderer/components/common/Pagination'
import AddUserModal from '@renderer/components/user/AddUserModal'
import EditUserModal from '@renderer/components/user/EditUserModal'
import ConfirmDeleteModal from '@renderer/components/ConfirmDeleteModal'
import { useUsers } from '@renderer/store/users'

/* ===== Tokens & Const ===== */
const COLORS = {
  border: 'var(--border)',
  dim: 'var(--dim)',
  theadBg: '#395070',
  tableBodyBg: '#111720',

  pageSizeBg: '#111720',
  pageSizeBorder: '#C3CFE0',
  totalCardBg: '#111720',

  editBg: '#2A3A51',
  editBorder: '#C3CFE0',
  delBg: '#59120C',
  delBorder: '#9D120F',
  gold: '#EDC702'
}

const PAGE_SIZES = [9, 15, 30]

export default function UserManagement() {
  const nav = useNavigate()

  const { users, total, loading, loadUsers, addUser, editUser, removeUser } = useUsers()

  const [q, setQ] = useState('')
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [page, setPage] = useState(1)
  const [openAdd, setOpenAdd] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)

  /* ===== LOAD USERS FROM API ===== */
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  /* ===== FILTERING ===== */
  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        String(u.tag || '')
          .toLowerCase()
          .includes(s)
    )
  }, [users, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)

  useEffect(() => setPage(1), [q, pageSize])

  return (
    <div className="flex flex-col h-full">
      {/* HEADER GLOBAL */}
      <HeaderBar />

      {/* CONTENT */}
      <main className="flex-1 px-8 pt-6 pb-8">
        {/* ===== TITLE + BACK BUTTON ===== */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => nav('/analytics')}
            className="inline-flex items-center gap-2 hover:opacity-90"
          >
            <img src={backIcon} alt="Back" className="w-5 h-5" />
            <span className="font-[Aldrich] text-2xl tracking-[0.15em]">USER MANAGEMENT</span>
          </button>
        </div>

        {/* TOP BAR: SEARCH + ADD USER */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-[420px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-full pl-4 pr-10 py-2.5 rounded-sm outline-none text-sm"
              style={{
                border: '1px solid #C3CFE0',
                background: '#111720',
                color: 'var(--text)'
              }}
            />
            <img
              src={iconSearch}
              alt="search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-80 pointer-events-none"
            />
          </div>

          <MiniButton onClick={() => setOpenAdd(true)}>
            <MiniButtonContent bg={bgButton} text="+ Add User" textColor="text-black" />
          </MiniButton>
        </div>

        {/* TABLE PANEL */}
        <div
          className="relative border rounded-sm overflow-hidden"
          style={{ borderColor: COLORS.border, background: COLORS.tableBodyBg }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ background: COLORS.theadBg }}>
                {['Name', 'Email', 'Tag', 'Action'].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-3 border-b font-medium ${
                      h === 'Action' ? 'text-right' : ''
                    }`}
                    style={{ borderColor: COLORS.border, color: '#F4F4F4' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="py-6 text-center" style={{ color: COLORS.dim }}>
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 border-b" style={{ borderColor: COLORS.border }}>
                      {u.name}
                    </td>
                    <td className="px-6 py-3 border-b" style={{ borderColor: COLORS.border }}>
                      {u.email}
                    </td>
                    <td className="px-6 py-3 border-b" style={{ borderColor: COLORS.border }}>
                      {u.tag || '-'}
                    </td>
                    <td className="px-6 py-3 border-b" style={{ borderColor: COLORS.border }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded"
                          title="Edit"
                          style={{
                            background: COLORS.editBg,
                            border: `1.18px solid ${COLORS.editBorder}`
                          }}
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteUser(u)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded"
                          title="Delete"
                          style={{
                            background: COLORS.delBg,
                            border: `1.18px solid ${COLORS.delBorder}`
                          }}
                        >
                          <LuTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm"
                    style={{ color: COLORS.dim }}
                  >
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* FOOTER */}
          <div
            className="flex items-center justify-between px-6 py-3 border-t"
            style={{ borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-3">
              <PageSizeDropdown value={pageSize} onChange={(v) => setPageSize(v)} />
              <TotalCard label="Total User" total={filtered.length} />
            </div>

            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </main>

      {/* MODALS */}
      {openAdd && (
        <AddUserModal open={openAdd} onClose={() => setOpenAdd(false)} onSave={addUser} />
      )}

      {editingUser && (
        <EditUserModal
          open={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={editUser}
        />
      )}

      {deleteUser && (
        <ConfirmDeleteModal
          open={!!deleteUser}
          name={deleteUser.name}
          onClose={() => setDeleteUser(null)}
          onConfirm={() => {
            removeUser(deleteUser.id)
            setDeleteUser(null)
          }}
        />
      )}
    </div>
  )
}

/* ===== PAGE SIZE DROPDOWN ===== */
function PageSizeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, top: 0, width: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const computePos = () => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ left: r.left, top: r.bottom + 6, width: r.width })
  }

  useLayoutEffect(() => {
    if (open) computePos()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = () => computePos()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-sm min-w-14 text-sm"
        style={{
          background: COLORS.pageSizeBg,
          border: `1.5px solid ${COLORS.pageSizeBorder}`
        }}
      >
        <span className="font-medium">{value}</span>
        <RiExpandUpDownFill
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: COLORS.gold }}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-1000 rounded-sm overflow-hidden shadow-lg text-sm"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              background: COLORS.pageSizeBg,
              border: `1.5px solid ${COLORS.pageSizeBorder}`
            }}
          >
            {PAGE_SIZES.map((s) => (
              <div
                key={s}
                onClick={() => {
                  onChange(s)
                  setOpen(false)
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-white/5 ${
                  s === value ? 'opacity-100' : 'opacity-80'
                }`}
              >
                {s}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

/* ===== TOTAL CARD ===== */
function TotalCard({ total = 0, label = 'Total' }) {
  return (
    <div
      className="px-4 py-2 rounded-sm flex items-center gap-2 text-sm"
      style={{ background: COLORS.totalCardBg, border: `1.5px solid ${COLORS.pageSizeBorder}` }}
    >
      <span className="font-semibold text-base">{total}</span>
      <span className="opacity-90">{label}</span>
    </div>
  )
}
