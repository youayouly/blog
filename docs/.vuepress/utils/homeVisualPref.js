import { computed, ref } from 'vue'

export const HOME_BG_PREF_KEY = 'lk-home-bg-src'
export const HOME_BG_HISTORY_KEY = 'lk-home-bg-history'
export const HOME_PORTRAIT_PREF_KEY = 'lk-home-portrait-src'
export const HOME_PORTRAIT_HISTORY_KEY = 'lk-home-portrait-history'
export const HOME_VISUAL_PREF_EVENT = 'lk-home-visual-changed'

/**
 * 一次性清理标记：当默认背景 / 访客卡 / 不蒜子等有破坏性改动时递增这个值，
 * 每个用户的浏览器首次加载到新版本就会把旧 localStorage 抹干净，回到默认态。
 */
const VISUAL_RESET_KEY = 'lk-visual-reset-v'
const VISUAL_RESET_VERSION = '2026-04-25'
/** 需要在迁移时清掉的历史键（不会影响 authedRef / navPrefs 等其他功能） */
const LEGACY_KEYS_TO_CLEAR = [
  HOME_BG_PREF_KEY,
  HOME_BG_HISTORY_KEY,
  HOME_PORTRAIT_PREF_KEY,
  HOME_PORTRAIT_HISTORY_KEY,
  'busuanzi_value_site_uv',
  'busuanzi_value_site_pv',
]

function runVisualPrefMigrationOnce() {
  if (typeof window === 'undefined') return
  try {
    const stored = window.localStorage.getItem(VISUAL_RESET_KEY)
    if (stored === VISUAL_RESET_VERSION) return
    for (const k of LEGACY_KEYS_TO_CLEAR) {
      window.localStorage.removeItem(k)
    }
    window.localStorage.setItem(VISUAL_RESET_KEY, VISUAL_RESET_VERSION)
  } catch {
    /* localStorage blocked — worst case: user sees old cached preferences */
  }
}

runVisualPrefMigrationOnce()

export const DEFAULT_HOME_BG = '/gallery/home-bg-anime-landscape.png'
export const DEFAULT_HOME_PORTRAIT = ''

export const homeBackgroundChoices = [
  { src: DEFAULT_HOME_BG, label: '动漫自然风景（默认）' },
  { src: '/gallery/home-bg-abstract-gradient.svg', label: '淡色抽象底' },
  { src: '/gallery/about-bg-bright-starfield.svg', label: '亮星空' },
  {
    src: '/gallery/about-hero-sf.png',
    label: '硅基群像（本地 npm run gen:about-hero）',
  },
  {
    src: 'https://cdn.jsdelivr.net/gh/Dreamer-Paul/Anime-Wallpaper@master/1.jpg',
    label: 'Anime Wallpaper（外链）',
  },
]

export const homePortraitChoices = [
  { src: '', label: 'Hide Portrait' },
  { src: '/avatar.png', label: 'Current Avatar Portrait' },
  { src: '/gallery/avatar-2026-04-14.png', label: 'Portrait History 1' },
]

function readJsonArray(key) {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function writeJsonArray(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore storage failures */
  }
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/')
}

function normalizeSelection(src, defaults, history, fallback) {
  if (!src) return fallback
  const known = [...defaults.map((item) => item.src), ...history.map((item) => item.src)]
  if (known.includes(src) || isDataUrl(src)) return src
  return fallback
}

function createLabel(prefix) {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return `${prefix} ${stamp}`
}

export function readHomeBackgroundHistory() {
  return readJsonArray(HOME_BG_HISTORY_KEY)
}

export function readHomePortraitHistory() {
  return readJsonArray(HOME_PORTRAIT_HISTORY_KEY)
}

export function readHomeBackground() {
  if (typeof window === 'undefined') return DEFAULT_HOME_BG
  try {
    const raw = window.localStorage.getItem(HOME_BG_PREF_KEY) || DEFAULT_HOME_BG
    return normalizeSelection(
      raw,
      homeBackgroundChoices,
      readHomeBackgroundHistory(),
      DEFAULT_HOME_BG,
    )
  } catch {
    return DEFAULT_HOME_BG
  }
}

export function readHomePortrait() {
  if (typeof window === 'undefined') return DEFAULT_HOME_PORTRAIT
  try {
    const raw = window.localStorage.getItem(HOME_PORTRAIT_PREF_KEY) || DEFAULT_HOME_PORTRAIT
    return normalizeSelection(
      raw,
      homePortraitChoices,
      readHomePortraitHistory(),
      DEFAULT_HOME_PORTRAIT,
    )
  } catch {
    return DEFAULT_HOME_PORTRAIT
  }
}

function notifyHomeVisualChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(HOME_VISUAL_PREF_EVENT))
}

export function writeHomeBackground(src) {
  if (typeof window === 'undefined') return
  const next = normalizeSelection(
    src,
    homeBackgroundChoices,
    readHomeBackgroundHistory(),
    DEFAULT_HOME_BG,
  )
  try {
    window.localStorage.setItem(HOME_BG_PREF_KEY, next)
  } catch {
    /* ignore */
  }
  notifyHomeVisualChange()
}

export function writeHomePortrait(src) {
  if (typeof window === 'undefined') return
  const next = normalizeSelection(
    src,
    homePortraitChoices,
    readHomePortraitHistory(),
    DEFAULT_HOME_PORTRAIT,
  )
  try {
    window.localStorage.setItem(HOME_PORTRAIT_PREF_KEY, next)
  } catch {
    /* ignore */
  }
  notifyHomeVisualChange()
}

function appendHistoryItem(historyKey, currentKey, src, labelPrefix) {
  const history = readJsonArray(historyKey)
  const nextItem = {
    src,
    label: createLabel(labelPrefix),
  }
  const next = [
    nextItem,
    ...history.filter((item) => item && item.src && item.src !== src),
  ].slice(0, 8)
  writeJsonArray(historyKey, next)
  try {
    window.localStorage.setItem(currentKey, src)
  } catch {
    /* ignore */
  }
  notifyHomeVisualChange()
}

export function addHomeBackgroundUpload(src) {
  if (!isDataUrl(src) || typeof window === 'undefined') return
  appendHistoryItem(HOME_BG_HISTORY_KEY, HOME_BG_PREF_KEY, src, 'Background')
}

export function addHomePortraitUpload(src) {
  if (!isDataUrl(src) || typeof window === 'undefined') return
  appendHistoryItem(HOME_PORTRAIT_HISTORY_KEY, HOME_PORTRAIT_PREF_KEY, src, 'Portrait')
}

export const homeBackgroundRef = ref(DEFAULT_HOME_BG)
export const homePortraitRef = ref(DEFAULT_HOME_PORTRAIT)
export const homeBackgroundHistoryRef = ref([])
export const homePortraitHistoryRef = ref([])

export function syncHomeVisualsFromStorage() {
  homeBackgroundRef.value = readHomeBackground()
  homePortraitRef.value = readHomePortrait()
  homeBackgroundHistoryRef.value = readHomeBackgroundHistory()
  homePortraitHistoryRef.value = readHomePortraitHistory()
}

export function useHomeBackgroundSrc() {
  return computed(() => homeBackgroundRef.value)
}

export function useHomePortraitSrc() {
  return computed(() => homePortraitRef.value)
}

export function useHomeBackgroundOptions() {
  return computed(() => [...homeBackgroundChoices, ...homeBackgroundHistoryRef.value])
}

export function useHomePortraitOptions() {
  return computed(() => [...homePortraitChoices, ...homePortraitHistoryRef.value])
}
