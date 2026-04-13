import { computed, ref } from 'vue'

export const STORAGE_KEY = 'lk_private_ok'

export function normPath(p) {
  let x = (p || '/').replace(/\/+$/, '') || '/'
  x = x.replace(/\.html$/i, '')
  return x
}

/**
 * Public: `/`, About, Projects (`/tech/`), Articles (`/article/`).
 * Protected: `/home`, Study, Album, etc.
 */
export function isPublicPath(path) {
  const p = normPath(path)
  if (p === '/' || p === '/index') return true
  if (p === '/about' || p.startsWith('/about/')) return true
  if (p === '/tech' || p.startsWith('/tech/')) return true
  if (p === '/article' || p.startsWith('/article/')) return true
  return false
}

export function readAuthed() {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export const authedRef = ref(readAuthed())

export function syncAuthedFromStorage() {
  authedRef.value = readAuthed()
}

/** Persist session and refresh reactive login flag (for components). */
export function setAuthed(flag) {
  try {
    if (flag) sessionStorage.setItem(STORAGE_KEY, '1')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore quota / private mode */
  }
  authedRef.value = readAuthed()
}

/** Use in Vue components; router guard should call readAuthed() directly. */
export function useIsLoggedIn() {
  return computed(() => authedRef.value)
}
