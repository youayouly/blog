import { defineClientConfig } from 'vuepress/client'
import { createApp, h, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeTypewriterTagline from './components/HomeTypewriterTagline.vue'
import HomeSidePanel from './components/HomeSidePanel.vue'
import ProjectNineGrid from './components/ProjectNineGrid.vue'
import ProjectCardsGrid from './components/ProjectCardsGrid.vue'
import SiteFooter from './components/SiteFooter.vue'
import ScrollProgressFab from './components/ScrollProgressFab.vue'
import FloatingShapes from './components/FloatingShapes.vue'

/* ── Hero 背景：禁用失效外�?+ 降级到本地背景色 ─ */
// Note: If external images return 403, we must not trigger requests.
const images = []
const heroWallpaperFallbackBg = 'rgba(198, 212, 232, 0.45)'
const AUTH_USER = 'youayouly'
const AUTH_PASS = 'LUyi@541000'
const AUTH_SESSION_KEY = 'lk-auth-session'
const AUTH_GUARD_KEY = 'lk-auth-guard'
const AUTH_FAIL_LIMIT = 5
const AUTH_LOCK_MS = 15 * 60 * 1000
let authGuardInstalled = false

function normalizePath(path) {
  return (path || '/').replace(/\/+$/, '') || '/'
}

function isPublicPage(path) {
  const normalized = normalizePath(path)
  return normalized === '/about' || normalized === '/tech'
}

function readGuardState() {
  if (typeof window === 'undefined') return { failCount: 0, lockUntil: 0 }
  try {
    const raw = window.localStorage.getItem(AUTH_GUARD_KEY)
    if (!raw) return { failCount: 0, lockUntil: 0 }
    const parsed = JSON.parse(raw)
    return {
      failCount: Number.isFinite(parsed?.failCount) ? parsed.failCount : 0,
      lockUntil: Number.isFinite(parsed?.lockUntil) ? parsed.lockUntil : 0,
    }
  } catch {
    return { failCount: 0, lockUntil: 0 }
  }
}

function writeGuardState(state) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_GUARD_KEY, JSON.stringify(state))
}

function resetGuardState() {
  writeGuardState({ failCount: 0, lockUntil: 0 })
}

function remainingLockMs(lockUntil) {
  return Math.max(0, lockUntil - Date.now())
}

function formatRemainingMs(ms) {
  const sec = Math.ceil(ms / 1000)
  const min = Math.floor(sec / 60)
  const remSec = sec % 60
  return min > 0 ? `${min}m ${remSec}s` : `${remSec}s`
}

function hasAuthSession() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(AUTH_SESSION_KEY) === 'ok'
}

function setAuthSession() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(AUTH_SESSION_KEY, 'ok')
}

function recordAuthFailure() {
  const current = readGuardState()
  const now = Date.now()
  const nextFail = now > current.lockUntil ? 1 : current.failCount + 1
  if (nextFail >= AUTH_FAIL_LIMIT) {
    writeGuardState({ failCount: 0, lockUntil: now + AUTH_LOCK_MS })
    return { locked: true, attemptsLeft: 0 }
  }
  writeGuardState({ failCount: nextFail, lockUntil: 0 })
  return { locked: false, attemptsLeft: AUTH_FAIL_LIMIT - nextFail }
}

function isGuardLocked() {
  const state = readGuardState()
  return remainingLockMs(state.lockUntil) > 0
}

function verifyCredentials(username, password) {
  return username === AUTH_USER && password === AUTH_PASS
}

function promptLoginWithGuard() {
  if (typeof window === 'undefined') return false
  if (isGuardLocked()) {
    const lockMs = remainingLockMs(readGuardState().lockUntil)
    window.alert(`登录尝试过多，请在 ${formatRemainingMs(lockMs)} 后再试。`)
    return false
  }
  const username = window.prompt('受限页面需要登录\n用户名：')
  if (username === null) return false
  const password = window.prompt('请输入密码：')
  if (password === null) return false

  if (verifyCredentials(username, password)) {
    setAuthSession()
    resetGuardState()
    return true
  }

  const result = recordAuthFailure()
  if (result.locked) {
    window.alert('登录失败次数过多，已锁定 15 分钟。')
  } else {
    window.alert(`用户名或密码错误，剩余 ${result.attemptsLeft} 次尝试。`)
  }
  return false
}

function ensureRouteAccess(path) {
  if (isPublicPage(path)) return true
  if (hasAuthSession()) return true
  return promptLoginWithGuard()
}

function setHomeEnhanceSuspended(flag) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('lk-home-enhance-suspended', !!flag)
}

/** VuePress home route (respects trailing slash normalization). */
function isSiteHomePath(path) {
  const normalized = (path || '/').replace(/\/+$/, '') || '/'
  return normalized === '/'
}

/** After hydration: toggles navbar/sidebar glass styles on non-home routes. */
function syncSiteNonHomeClass(path) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(
    'lk-site-non-home',
    !isSiteHomePath(path),
  )
}

/** Edge/Chromium: bump compositor layers for navbar/sidebar after navigation. */
function nudgeNavbarSidebarRepaint() {
  if (typeof document === 'undefined') return
  const els = document.querySelectorAll('.vp-navbar, .vp-sidebar')
  if (!els.length) return
  requestAnimationFrame(() => {
    for (const el of els) {
      el.style.transform = 'translateZ(0.02px)'
    }
    requestAnimationFrame(() => {
      for (const el of els) {
        el.style.transform = ''
      }
    })
  })
}

let scrollBlurHandler = null
let themeObserver = null
/** 已成功展示的图片下标（仅 onload 成功后更新） */
let wallpaperDisplayIndex = -1
/** 正在为其发起 Image 加载的下标，避免重复请求 */
let wallpaperLoadingForIndex = null
/** Whether we have overridden .vp-hero-mask background* inline styles */
let heroBgOverridden = false

/* ── Live2D：挂 body + fixed 视口右下，避免随首页网格卸载而销毁 ───────────── */
let live2dLoaded = false
let live2dViewportListenersAttached = false
const LIVE2D_MODEL_H = 440

let live2dViewportHandler = null

function applyLive2dViewportScale() {
  if (typeof window === 'undefined') return
  const el = document.getElementById('live2d-widget')
  if (!el) return
  const cs = window.getComputedStyle(el)
  if (cs.display === 'none' || cs.visibility === 'hidden') return

  const vv = window.visualViewport
  const h = vv ? vv.height : window.innerHeight
  const reservedBottom = 72
  const reservedTop = 72
  const avail = Math.max(160, h - reservedTop - reservedBottom)
  const scale = Math.min(1, Math.max(0.55, avail / LIVE2D_MODEL_H))

  el.style.transformOrigin = 'bottom right'
  el.style.transform = scale < 0.998 ? `scale(${scale})` : ''
}

function attachLive2dViewportListeners() {
  if (typeof window === 'undefined' || live2dViewportListenersAttached) return
  live2dViewportListenersAttached = true
  live2dViewportHandler = () => {
    applyLive2dViewportScale()
  }
  window.visualViewport?.addEventListener('resize', live2dViewportHandler)
  window.visualViewport?.addEventListener('scroll', live2dViewportHandler)
  window.addEventListener('resize', live2dViewportHandler)
}

function detachLive2dViewportListeners() {
  if (!live2dViewportHandler || typeof window === 'undefined') return
  window.visualViewport?.removeEventListener('resize', live2dViewportHandler)
  window.visualViewport?.removeEventListener('scroll', live2dViewportHandler)
  window.removeEventListener('resize', live2dViewportHandler)
  live2dViewportHandler = null
  live2dViewportListenersAttached = false
}

/** Viewport bottom-right; right offset clears ScrollProgressFab column (z-index above widget). */
function positionLive2DWidget() {
  if (typeof window === 'undefined') return
  const container = document.getElementById('live2d-widget')
  if (!container) return

  document.body.appendChild(container)

  Object.assign(container.style, {
    position: 'fixed',
    right:
      'calc(1rem + 52px + max(0.25rem, env(safe-area-inset-right, 0px)))',
    bottom: 'max(0.25rem, env(safe-area-inset-bottom, 0px))',
    left: '',
    top: '',
    zIndex: '50',
  })
  syncLive2dVisibility(window.location.pathname)
  applyLive2dViewportScale()
}

function syncLive2dVisibility(path) {
  if (typeof document === 'undefined') return
  const container = document.getElementById('live2d-widget')
  if (!container) return
  container.style.display = isPublicPage(path) ? 'none' : 'flex'
}

/** Run after layout + L2D internal DOM so fixed bottom/right are not overwritten. */
function scheduleLive2dReposition() {
  if (typeof window === 'undefined' || !live2dLoaded) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      positionLive2DWidget()
    })
  })
}

function initLive2DWidget() {
  if (typeof window === 'undefined' || live2dLoaded) return

  function mountWithGlobal() {
    if (!window.L2Dwidget || live2dLoaded) return
    window.L2Dwidget.init({
      model: {
        // 使用官方 Koharu 女孩模型，可按需替换为其他模型包
        jsonPath:
          'https://unpkg.com/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json',
      },
      display: {
        position: 'right',
        width: 220,
        height: 440,
      },
      mobile: {
        show: false,
      },
      react: {
        opacityDefault: 1,
        opacityOnHover: 1,
      },
    })
    live2dLoaded = true
    attachLive2dViewportListeners()
    scheduleLive2dReposition()
    syncLive2dVisibility(window.location.pathname)
  }

  if (window.L2Dwidget) {
    mountWithGlobal()
    return
  }

  const script = document.createElement('script')
  script.src = 'https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js'
  script.async = true
  script.onload = () => {
    mountWithGlobal()
  }
  document.body.appendChild(script)
}

function isDarkMode() {
  const root = document.documentElement
  const body = document.body
  return (
    root?.getAttribute('data-theme') === 'dark' ||
    body?.getAttribute('data-theme') === 'dark' ||
    root?.classList.contains('dark') ||
    body?.classList.contains('dark')
  )
}

function applyHeroMaskBaseStyles(mask) {
  if (!mask) return

  // If we don't have any wallpaper images configured, do not touch the
  // theme-provided hero background styles; otherwise we'd cause visible
  // background "flash" during mount/scroll.
  if (images.length === 0) {
    mask.style.willChange = 'filter, transform'
    return
  }

  // Always set a local fallback so the hero never becomes "blank"
  mask.style.backgroundImage = 'none'
  // Keep the same bright hero fallback in both light and dark mode so the
  // character illustration never gets fully crushed by a dark overlay.
  mask.style.backgroundColor = heroWallpaperFallbackBg
  mask.style.backgroundSize = 'cover'
  mask.style.backgroundPosition = 'center center'
  mask.style.willChange = 'filter, transform, background-image'
  heroBgOverridden = true
}

function wallpaperTargetIndex(scrollY, heroHeight) {
  const n = images.length
  if (n === 0) return 0
  const step = Math.max(heroHeight * 0.8, 1)
  const raw = Math.floor(scrollY / step)
  return ((raw % n) + n) % n
}

function loadWallpaperForTarget(mask, targetIndex) {
  if (!mask || images.length === 0) return
  const n = images.length
  const i = ((targetIndex % n) + n) % n
  if (i === wallpaperDisplayIndex) return
  if (wallpaperLoadingForIndex === i) return

  wallpaperLoadingForIndex = i
  const url = images[i]
  const img = new Image()
  img.onload = () => {
    wallpaperLoadingForIndex = null
    const heroHeight =
      document.querySelector('.vp-hero-info-wrapper')?.offsetHeight ||
      window.innerHeight
    const nowTarget = wallpaperTargetIndex(window.scrollY, heroHeight)
    if (nowTarget !== i) {
      const m = document.querySelector('.vp-hero-mask')
      if (m) loadWallpaperForTarget(m, nowTarget)
      return
    }
    const m = document.querySelector('.vp-hero-mask')
    if (!m) return
    applyHeroMaskBaseStyles(m)
    m.style.backgroundImage = `url("${url}")`
    wallpaperDisplayIndex = i
  }
  img.onerror = () => {
    wallpaperLoadingForIndex = null
    // Keep hero readable even if the external image is blocked (403) / unreachable.
    applyHeroMaskBaseStyles(mask)
    console.error(
      '[Hero wallpaper] Failed to load image (possible 403 or network error):',
      url,
    )
  }
  img.src = url
}

/* ── 模糊/缩放 + 绝对索引换图（仅预加载成功后才改 backgroundImage�?─ */
function initScrollBlur() {
  const mask = document.querySelector('.vp-hero-mask')
  if (!mask) return

  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }

  const y0 = window.scrollY
  const heroH0 =
    document.querySelector('.vp-hero-info-wrapper')?.offsetHeight ||
    window.innerHeight
  wallpaperDisplayIndex = -1
  wallpaperLoadingForIndex = null
  loadWallpaperForTarget(mask, wallpaperTargetIndex(y0, heroH0))

  scrollBlurHandler = () => {
    const m = document.querySelector('.vp-hero-mask')
    if (!m) return

    const scrollY = window.scrollY
    const heroHeight =
      document.querySelector('.vp-hero-info-wrapper')?.offsetHeight ||
      window.innerHeight

    if (images.length > 0) applyHeroMaskBaseStyles(m)
    const progress = Math.min(scrollY / (window.innerHeight * 0.55), 1)
    // Dark mode: keep hero image readable; avoid over-darkening the character.
    const darkFactor = isDarkMode() ? 0.85 : 1
    const brightness = (1 - progress * 0.25) * darkFactor
    m.style.filter = `blur(${progress * 14}px) brightness(${brightness})`
    m.style.transform = `scale(${1 + progress * 0.06})`

    const target = wallpaperTargetIndex(scrollY, heroHeight)
    loadWallpaperForTarget(m, target)
  }
  scrollBlurHandler()
  window.addEventListener('scroll', scrollBlurHandler, { passive: true })

  // Ensure dark mode toggle updates hero brightness immediately (without scrolling).
  themeObserver = new MutationObserver(() => {
    if (scrollBlurHandler) scrollBlurHandler()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  })
}

function cleanupScrollBlur() {
  wallpaperDisplayIndex = -1
  wallpaperLoadingForIndex = null
  if (scrollBlurHandler) {
    window.removeEventListener('scroll', scrollBlurHandler)
    scrollBlurHandler = null
    const mask = document.querySelector('.vp-hero-mask')
    if (mask) {
      mask.style.filter = ''
      mask.style.transform = ''
      if (heroBgOverridden) {
        // Restore theme-provided hero background (if any) by removing inline
        // overrides we previously applied in applyHeroMaskBaseStyles().
        mask.style.backgroundImage = ''
        mask.style.backgroundColor = ''
        mask.style.backgroundSize = ''
        mask.style.backgroundPosition = ''
        mask.style.willChange = ''
        heroBgOverridden = false
      }
    }
  }

  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
}

/* ── Scroll progress bar (global) ──────────────────────────────────────── */
let progressBar = null

function initProgressBar() {
  if (document.getElementById('lk-progress')) return
  const bar = document.createElement('div')
  bar.id = 'lk-progress'
  document.body.appendChild(bar)
  progressBar = bar

  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%'
  }, { passive: true })
}

/* ── Typewriter ─────────────────────────────────────────────────────────── */
let twApp = null

function mountTypewriter(text) {
  const el = document.getElementById('main-description')
  if (!el || el.dataset.tw) return
  el.dataset.tw = '1'
  el.innerHTML = ''
  twApp = createApp({ render: () => h(HomeTypewriterTagline, { text }) })
  twApp.mount(el)
}

function unmountTypewriter() {
  if (twApp) { twApp.unmount(); twApp = null }
}

/* ── 侧栏：Profile + Notice + Stats（主内容区左侧，非整�?fixed）──────────── */
let sidePanelApp = null

function firstElementAfter(hero) {
  let n = hero.nextSibling
  while (n && n.nodeType !== Node.ELEMENT_NODE) n = n.nextSibling
  return n
}

function mountHomeBodyGrid() {
  // Support both selector variants across theme versions
  const main = document.querySelector('main.vp-page.vp-project-home')
             || document.querySelector('main.vp-project-home')
  if (!main || main.dataset.bodygrid === '1') return

  // Try multiple hero selectors for theme-version resilience
  const hero = main.querySelector(':scope > header.vp-hero-info-wrapper')
             || main.querySelector(':scope > .vp-hero-info-wrapper')
             || main.querySelector(':scope > header')
             || main.querySelector('header.vp-hero-info-wrapper')
  if (!hero) return

  // NOTE: intentionally NOT checking for firstElementAfter(hero) �?the
  // feature items may still be hydrating at this point; the while-loop
  // handles the empty-sibling case gracefully.

  main.dataset.bodygrid = '1'
  main.classList.add('lk-home-dual')

  const row = document.createElement('div')
  row.className = 'lk-home-body-grid'

  // ── Force a two-column flex layout via inline styles to guarantee the
  // layout regardless of whatever the theme injects via its own stylesheet. ──
  Object.assign(row.style, {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    columnGap: '1.5rem',
    rowGap: '1.25rem',
    width: '100%',
    boxSizing: 'border-box',
  })

  const profileAside = document.createElement('aside')
  profileAside.className = 'lk-home-profile-col'
  profileAside.setAttribute('aria-label', '侧栏：简介、公告与站点信息')

  // Sticky sidebar via inline style �?same reason as above
  Object.assign(profileAside.style, {
    position: 'sticky',
    top: 'calc(var(--navbar-height, 3.5rem) + 20px)',
    alignSelf: 'start',
    justifySelf: 'stretch',
    width: '100%',
    maxWidth: '33%',
  })

  const mainCol = document.createElement('div')
  mainCol.className = 'lk-home-main-col'

  row.appendChild(profileAside)
  row.appendChild(mainCol)
  // Insert the grid at the hero position so the sidebar (avatar etc.)
  // is visible immediately on the first screen.
  hero.insertAdjacentElement('beforebegin', row)

  // Move `hero` + following siblings into the main column.
  // Capture `sibling` before moving `hero`, otherwise `hero.nextSibling`
  // becomes unrelated after the move.
  let sibling = hero.nextSibling
  mainCol.appendChild(hero)
  while (sibling) {
    const next = sibling.nextSibling
    mainCol.appendChild(sibling)
    sibling = next
  }

  sidePanelApp = createApp({ render: () => h(HomeSidePanel) })
  sidePanelApp.mount(profileAside)
}

function rescueLive2dFromHomeGrid() {
  const row = document.querySelector('main.vp-project-home .lk-home-body-grid')
  const container = document.getElementById('live2d-widget')
  if (row && container && row.contains(container)) {
    document.body.appendChild(container)
  }
}

function unmountHomeBodyGrid() {
  if (sidePanelApp) {
    sidePanelApp.unmount()
    sidePanelApp = null
  }
  const row = document.querySelector('main.vp-project-home .lk-home-body-grid')
  const main = document.querySelector('main.vp-page.vp-project-home')
  rescueLive2dFromHomeGrid()
  if (row && main) {
    const mainCol = row.querySelector('.lk-home-main-col')
    if (mainCol) {
      while (mainCol.firstChild) main.insertBefore(mainCol.firstChild, row)
    }
    row.remove()
  }
  if (main) {
    main.classList.remove('lk-home-dual')
    delete main.dataset.bodygrid
  }
}

/* ── Floating shapes (homepage hero) ───────────────────────────────────── */
let shapesApp = null

function mountFloatingShapes() {
  const wrapper = document.querySelector('.vp-hero-info-wrapper')
  if (!wrapper || wrapper.dataset.shapes) return
  wrapper.dataset.shapes = '1'
  const mount = document.createElement('div')
  mount.className = 'lk-shapes-mount'
  wrapper.appendChild(mount)
  shapesApp = createApp({ render: () => h(FloatingShapes) })
  shapesApp.mount(mount)
}

function unmountFloatingShapes() {
  if (shapesApp) {
    shapesApp.unmount(); shapesApp = null
    const m = document.querySelector('.lk-shapes-mount')
    if (m) m.remove()
    const w = document.querySelector('.vp-hero-info-wrapper')
    if (w) delete w.dataset.shapes
  }
}

/* ── Mount / unmount all home-page enhancements ─────────────────────────── */
function mountHome() {
  mountTypewriter('Welcome to my blog!')
  mountHomeBodyGrid()
  mountFloatingShapes()
  initScrollBlur()
  scheduleLive2dReposition()
}

function unmountHome() {
  unmountTypewriter()
  unmountHomeBodyGrid()
  unmountFloatingShapes()
  cleanupScrollBlur()
}

/* ── Entry ──────────────────────────────────────────────────────────────── */
export default defineClientConfig({
  rootComponents: [SiteFooter, ScrollProgressFab],

  enhance({ app }) {
    // Ensure these are usable in markdown as <ProjectNineGrid /> / <ProjectCardsGrid />.
    app.component('ProjectNineGrid', ProjectNineGrid)
    app.component('ProjectCardsGrid', ProjectCardsGrid)
  },

  setup() {
    const route = useRoute()
    const router = useRouter()
    if (!authGuardInstalled) {
      router.beforeEach((to) => {
        if (isPublicPage(to.path)) return true
        if (hasAuthSession()) return true
        return promptLoginWithGuard() ? true : '/about'
      })
      authGuardInstalled = true
    }

    const microtask =
      typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (fn) => Promise.resolve().then(fn)

    watch(
      () => route.path,
      (path) => {
        syncSiteNonHomeClass(path)
      },
      { flush: 'post' },
    )

    watch(
      () => route.path,
      () => {
        nudgeNavbarSidebarRepaint()
      },
      { flush: 'post' },
    )

    onMounted(() => {
      if (!ensureRouteAccess(route.path)) {
        router.replace('/about')
      }
      syncSiteNonHomeClass(route.path)
      nextTick(() => {
        nudgeNavbarSidebarRepaint()
      })
      initProgressBar()
      initLive2DWidget()
      syncLive2dVisibility(route.path)
      if (isSiteHomePath(route.path)) {
        setHomeEnhanceSuspended(true)
        microtask(() => {
          try {
            mountHome()
          } finally {
            setHomeEnhanceSuspended(false)
          }
        })
      }
    })

    onUnmounted(() => {
      cleanupScrollBlur()
      detachLive2dViewportListeners()
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('lk-site-non-home')
      }
    })

    watch(
      () => route.path,
      async () => {
        await nextTick()
        syncLive2dVisibility(route.path)
        if (live2dLoaded) {
          scheduleLive2dReposition()
        }
      },
      { flush: 'post' },
    )

    watch(
      () => route.path,
      (newPath, oldPath) => {
        if (isSiteHomePath(oldPath)) {
          unmountHome()
          setHomeEnhanceSuspended(false)
          if (live2dLoaded) {
            scheduleLive2dReposition()
          }
        }
        if (isSiteHomePath(newPath)) {
          setHomeEnhanceSuspended(true)
          microtask(() => {
            try {
              mountHome()
            } finally {
              setHomeEnhanceSuspended(false)
            }
          })
        }
      },
    )
  },
})
