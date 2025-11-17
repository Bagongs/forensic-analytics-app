const map = {
  // images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  // video
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  // audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  // docs
  pdf: 'application/pdf',
  // office (preview via iframe tidak native, biasanya download / open external)
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  // apk (fallback info)
  apk: 'application/vnd.android.package-archive'
}

export function guessMimeByName(name = '') {
  const ext = String(name).split('.').pop()?.toLowerCase()
  return map[ext] || ''
}

export function guessKind(name = '') {
  const ext = String(name).split('.').pop()?.toLowerCase()
  if (!ext) return 'unknown'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'ogv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
  if (['pdf'].includes(ext)) return 'pdf'
  return 'other'
}
