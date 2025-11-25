/* eslint-disable no-empty */
// src/renderer/src/shared/handleRedirectContract.js

export function handleRedirectContract(server, { nav, toast, ctx = {}, delayMs = 1200 } = {}) {
  if (!server || !nav) return false

  let payload = null

  // 1) Axios-like error (kalau suatu hari kamu lempar axios error langsung)
  if (server?.response?.data?.status) {
    payload = server.response.data
  }

  // 2) Error dari IPC yang dibungkus di .data
  if (!payload && server?.data?.status && server?.data?.data) {
    payload = server.data
  }

  // 3) Payload sudah flat sesuai kontrak
  if (!payload && (server?.status === 400 || server?.status === 404)) {
    payload = server
  }

  // 4) Parse dari message (toleran prefix Electron)
  if (!payload && typeof server?.message === 'string') {
    try {
      let msg = server.message.trim()

      // kasus: "Error: {...json...}"
      if (msg.startsWith('Error:')) {
        msg = msg.replace(/^Error:\s*/, '')
      }

      // ✅ kasus Electron:
      // "Error invoking remote method 'x': Error: {...json...}"
      // ambil substring dari "{" pertama sampai akhir
      const firstBrace = msg.indexOf('{')
      if (firstBrace !== -1) {
        const jsonPart = msg.slice(firstBrace)
        const maybe = JSON.parse(jsonPart)
        if (maybe?.status && maybe?.data) payload = maybe
      } else {
        // fallback: coba parse full message
        const maybe = JSON.parse(msg)
        if (maybe?.status && maybe?.data) payload = maybe
      }
    } catch {}
  }

  if (!payload) return false

  const status = payload.status
  if (status !== 400 && status !== 404) return false

  const data = payload.data || {}
  const nextAction = data.next_action
  const redirectTo = data.redirect_to
  const instruction = data.instruction
  const analyticInfoId = data?.analytic_info?.analytic_id

  if (!nextAction || !redirectTo) return false

  const analysisId = ctx.analysisId ?? analyticInfoId
  const navState = {
    analysisId,
    method: ctx.method,
    analysisName: ctx.analysisName
  }

  if (toast) {
    const msg = instruction
      ? `${payload.message} — ${instruction}`
      : payload.message || 'Action required'
    toast(msg, { icon: '⚠️', duration: Math.max(1500, delayMs) })
  }

  setTimeout(() => {
    if (nextAction === 'add_device') {
      nav(redirectTo || '/analytics/devices', { state: navState })
      return
    }
    if (nextAction === 'create_analytic') {
      nav(redirectTo || '/analytics/start-analyzing', { state: navState })
      return
    }
    nav(redirectTo, { state: navState })
  }, delayMs)

  return true
}
