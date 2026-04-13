/** localStorage + 自定义事件：与导航栏看板娘开关、client.js 同步 */
export const LIVE2D_PREF_KEY = 'lk-live2d-enabled'
export const LIVE2D_PREF_EVENT = 'lk-live2d-pref-changed'

export function readLive2dPref() {
  if (typeof window === 'undefined') return true
  try {
    const v = window.localStorage.getItem(LIVE2D_PREF_KEY)
    if (v === null) return true
    return v !== '0'
  } catch {
    return true
  }
}

export function writeLive2dPref(enabled) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LIVE2D_PREF_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(LIVE2D_PREF_EVENT, { detail: { enabled } }),
  )
}
