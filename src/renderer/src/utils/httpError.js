// src/renderer/src/utils/httpError.js
export const extractHttpMessage = (err, fallback = 'An error occurred') =>
  err?.response?.data?.message || err?.payload?.message || err?.message || fallback
