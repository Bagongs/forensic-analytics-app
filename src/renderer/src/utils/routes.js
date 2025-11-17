// src/renderer/src/utils/routes.js
export function routeForMethod(method = '') {
  const key = String(method).toLowerCase()
  if (key.includes('contact')) return '/detail/contact-correlation'
  if (key.includes('deep')) return '/detail/deep-communication'
  if (key.includes('hash')) return '/detail/hashfile-analytics'
  if (key.includes('apk')) return '/detail/apk-analytics'
  if (key.includes('social')) return '/detail/social-media-correlation'
  return null
}
