// src/shared/analyticsMethods.js
export const ANALYTICS_METHODS = [
  'Deep Communication Analytics',
  'Social Media Correlation',
  'Contact Correlation',
  'Hashfile Analytics',
  'APK Analytics'
]

export function isValidMethod(m) {
  return ANALYTICS_METHODS.includes(String(m || ''))
}

/** Normalisasi nilai yang datang dari SelectField */
export function coerceMethod(val) {
  if (!val) return ''
  // kalau SelectField mengirim object {value,label}
  if (typeof val === 'object' && val !== null) return val.value || ''
  return String(val)
}
