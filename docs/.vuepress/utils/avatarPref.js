import { computed, ref } from 'vue'

export const AVATAR_PREF_KEY = 'lk-avatar-src'
export const AVATAR_PREF_EVENT = 'lk-avatar-changed'
export const DEFAULT_AVATAR = '/gallery/avatar-bread.svg'

export const avatarChoices = [
  { src: '/gallery/avatar-bread.svg', label: '深色三角形' },
  { src: '/gallery/avatar-bread-backup.svg', label: '动漫面包(备份)' },
  { src: '/avatar.png', label: '当前动漫头像' },
  { src: '/gallery/avatar-2026-04-14.png', label: '历史头像 1' },
  { src: '/gallery/avatar-old-backup.jpg', label: '历史头像 2' },
]

function normalizeAvatar(src) {
  return avatarChoices.some((item) => item.src === src) ? src : DEFAULT_AVATAR
}

export function readAvatar() {
  if (typeof window === 'undefined') return DEFAULT_AVATAR
  try {
    const raw = window.localStorage.getItem(AVATAR_PREF_KEY)
    return normalizeAvatar(raw || DEFAULT_AVATAR)
  } catch {
    return DEFAULT_AVATAR
  }
}

export function writeAvatar(src) {
  if (typeof window === 'undefined') return
  const next = normalizeAvatar(src)
  try {
    window.localStorage.setItem(AVATAR_PREF_KEY, next)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(AVATAR_PREF_EVENT, { detail: { src: next } }))
}

export const avatarSrcRef = ref(DEFAULT_AVATAR)

export function syncAvatarFromStorage() {
  avatarSrcRef.value = readAvatar()
}

export function useAvatarSrc() {
  return computed(() => avatarSrcRef.value)
}
