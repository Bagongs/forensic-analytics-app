// src/renderer/src/utils/safeTextValidators.js

// Keyword-keyword SQL berbahaya
const SQL_KEYWORD_REGEX =
  /\b(select|update|delete|insert|drop|alter|create|replace|truncate|exec|union|into|from|where)\b/i

// Hanya izinkan: huruf (multi-bahasa), angka, spasi, titik, koma, strip,
// underscore, kurung, dan slash.
// NOTE: butuh dukungan unicode flag "u"
const DEFAULT_ALLOWED_PATTERN = /^[\p{L}0-9 .,_\-()/]*$/u

function baseValidate(value, options = {}) {
  const {
    label = 'Value',
    required = true,
    maxLength = 120,
    allowedPattern = DEFAULT_ALLOWED_PATTERN,
    blockSqlKeyword = true
  } = options

  const v = (value ?? '').trim()

  if (required && !v) {
    return { ok: false, error: `${label} is required.` }
  }

  if (v && v.length > maxLength) {
    return {
      ok: false,
      error: `${label} is too long (max ${maxLength} characters).`
    }
  }

  if (v && !allowedPattern.test(v)) {
    return {
      ok: false,
      error: `${label} contains forbidden characters. Only letters, numbers, spaces, ".", ",", "-", "_", "(", ")", "/" are allowed.`
    }
  }

  if (blockSqlKeyword && v && SQL_KEYWORD_REGEX.test(v)) {
    return {
      ok: false,
      error: `${label} contains forbidden SQL-like keywords (SELECT, DROP, etc.).`
    }
  }

  return { ok: true, error: '' }
}

// Untuk nama pemilik / human name
export function validateSafeHumanName(value, label = 'Name') {
  return baseValidate(value, {
    label,
    required: true,
    maxLength: 80
  })
}

// Untuk nama file (boleh sedikit lebih panjang)
export function validateSafeFileName(value, label = 'File name') {
  return baseValidate(value, {
    label,
    required: true,
    maxLength: 120
  })
}
