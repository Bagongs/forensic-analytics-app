// src/renderer/src/utils/httpError.js
export const extractHttpMessage = (err, fallback = 'Terjadi kesalahan') =>
  err?.response?.data?.message || err?.payload?.message || err?.message || fallback
