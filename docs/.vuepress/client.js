import { ClientOnly, defineClientConfig } from 'vuepress/client'
import { createApp, defineComponent, h, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import HomeTypewriterTagline from './components/HomeTypewriterTagline.vue'
import HomeSidePanel from './components/HomeSidePanel.vue'
import ProjectNineGrid from './components/ProjectNineGrid.vue'
import ProjectCardsGrid from './components/ProjectCardsGrid.vue'
import SiteFooter from './components/SiteFooter.vue'
import BackToTopArrow from './components/BackToTopArrow.vue'
import LoginGate from './components/LoginGate.vue'
import ArticleCategoriesAside from './components/ArticleCategoriesAside.vue'
import AboutTimeline from './components/AboutTimeline.vue'
import AboutArticleRecommend from './components/AboutArticleRecommend.vue'
import AboutCategoriesCard from './components/AboutCategoriesCard.vue'
import ArticleIndexList from './components/ArticleIndexList.vue'
import ProjectsRolesCard from './components/ProjectsRolesCard.vue'
import SiteAvatar from './components/SiteAvatar.vue'
import { authedRef, isPublicPath, normPath, readAuthed } from './utils/authGate.js'
import {
  LIVE2D_PREF_EVENT,
  LIVE2D_PREF_KEY,
  readLive2dPref,
} from './utils/live2dPref.js'
import {
  accessControlledPageOptions,
  HIDDEN_NAV_ITEMS_EVENT,
  PROTECTED_ACCESS_EVENT,
  navbarPageOptions,
  readHiddenNavItems,
  readProtectedAccessItems,
} from './utils/navPrefs.js'
import FloatingShapes from './components/FloatingShapes.vue'
import NetworkParticlesBg from './components/NetworkParticlesBg.vue'
import ParticlesNavbarToggle from './components/ParticlesNavbarToggle.vue'
import PublishFab from './components/PublishFab.vue'
import ArticleBatchOps from './components/ArticleBatchOps.vue'

/** Canvas + rAF: keep out of SSR to avoid Node rAF spin / heap growth during prerender. */
const NetworkParticlesBgClient = defineComponent({
  name: 'NetworkParticlesBgClient',
  setup() {
    return () => h(ClientOnly, null, () => h(NetworkParticlesBg))
  },
})

const ParticlesNavbarToggleClient = defineComponent({
  name: 'ParticlesNavbarToggleClient',
  setup() {
    return () => h(ClientOnly, null, () => h(ParticlesNavbarToggle))
  },
})

const ArticleCategoriesAsideClient = defineComponent({
  name: 'ArticleCategoriesAsideClient',
  setup() {
    return () => h(ClientOnly, null, () => h(ArticleCategoriesAside))
  },
})

/** Teleport + DOM anchors: render only on client to avoid SSR/prerender vs client markup drift (e.g. About). */
const LoginGateClient = defineComponent({
  name: 'LoginGateClient',
  setup() {
    return () => h(ClientOnly, null, () => h(LoginGate))
  },
})

const PublishFabClient = defineComponent({
  name: 'PublishFabClient',
  setup() {
    return () => h(ClientOnly, null, () => h(PublishFab))
  },
})

const ArticleBatchOpsClient = defineComponent({
  name: 'ArticleBatchOpsClient',
  setup() {
    return () => h(ClientOnly, null, () => h(ArticleBatchOps))
  },
})

/* ── Hero 背景：禁用失效外�?+ 降级到本地背景色 ─ */
// Note: If external images return 403, we must not trigger requests.
const images = []
const heroWallpaperFallbackBg = 'rgba(198, 212, 232, 0.45)'

function setHomeEnhanceSuspended(flag) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('lk-home-enhance-suspended', !!flag)
}

/** Theme hero home lives at `/home` (root `/` redirects to About Me). */
function isSiteHomePath(path) {
  const normalized = (path || '/').replace(/\/+$/, '') || '/'
  const noHtml = normalized.replace(/\.html$/i, '')
  return noHtml === '/home'
}

/** Open site root → About Me (navbar Home still uses `/`, so it lands here too). */
function isRootPathForAboutRedirect(path) {
  const normalized = (path || '/').replace(/\/+$/, '') || '/'
  return normalized === '/' || /^\/index\.html$/i.test(normalized)
}

function canAccessPath(path) {
  const blockedIds = new Set(readProtectedAccessItems())
  const matched = accessControlledPageOptions.find((item) => item.matches(path))
  // Access control panel decides what is blocked.
  // Login is only required to operate the UI, not to view pages that are not blocked.
  if (matched) return !blockedIds.has(matched.id)
  if (isPublicPath(path)) return true
  return readAuthed()
}

function normalizeAnchorPath(href) {
  if (!href || typeof window === 'undefined') return ''
  try {
    const url = new URL(href, window.location.origin)
    return normPath(url.pathname)
  } catch {
    return ''
  }
}

function findNavHideTarget(anchor) {
  return (
    anchor.closest('.vp-navbar-item') ||
    anchor.closest('.vp-dropdown-wrapper') ||
    anchor.closest('.vp-sidebar-item') ||
    anchor.closest('.vp-dropdown-item') ||
    anchor.closest('.vp-nav-item') ||
    anchor.closest('li') ||
    anchor
  )
}

function clearManagedNavbarVisibility() {
  if (typeof document === 'undefined') return
  for (const el of document.querySelectorAll('[data-lk-hidden-nav-item="1"]')) {
    el.style.display = ''
    el.removeAttribute('data-lk-hidden-nav-item')
    el.removeAttribute('data-lk-hidden-nav-id')
  }
}

function applyHiddenNavbarItems() {
  if (typeof document === 'undefined') return
  clearManagedNavbarVisibility()

  const hiddenIds = new Set(readHiddenNavItems())
  if (!hiddenIds.size) return

  const matchers = navbarPageOptions.filter((item) => hiddenIds.has(item.id))
  const roots = [document.getElementById('navbar'), document.getElementById('nav-screen')].filter(Boolean)

  for (const root of roots) {
    for (const anchor of root.querySelectorAll('a[href]')) {
      const path = normalizeAnchorPath(anchor.getAttribute('href') || anchor.href)
      if (!path) continue
      const matched = matchers.find((item) => item.matches(path))
      if (!matched) continue
      const target = findNavHideTarget(anchor)
      target.style.display = 'none'
      target.setAttribute('data-lk-hidden-nav-item', '1')
      target.setAttribute('data-lk-hidden-nav-id', matched.id)
    }
  }
}

function ensureNavbarHideObserver() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
  if (navbarHideObserver) return
  navbarHideObserver = new MutationObserver(() => {
    applyHiddenNavbarItems()
  })
  navbarHideObserver.observe(document.body, { childList: true, subtree: true })
}

/** 看板娘显隐仅由导航栏开关 + localStorage（`live2dPref.js`）控制，全站路由一致。 */
function isLive2dHiddenPath(path) {
  const p = normPath(path)
  return (
    p === '/about' ||
    p.startsWith('/about/') ||
    p === '/tech' ||
    p.startsWith('/tech/') ||
    p === '/article' ||
    p.startsWith('/article/')
  )
}

function applyLive2dRouteClass(path) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(
    'lk-live2d-route-hidden',
    isLive2dHiddenPath(path),
  )
}

function applyLive2dUserClass() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('lk-live2d-user-off', !readLive2dPref())
}

function syncLive2dPref() {
  applyLive2dUserClass()
  if (isLive2dHiddenPath(window.location.pathname)) return
  if (readLive2dPref()) {
    tryMountLive2dModel()
    nudgeLive2dForCurrentRoute()
  }
}

function onLive2dPrefStorage(e) {
  if (typeof window === 'undefined') return
  if (e.key === LIVE2D_PREF_KEY || e.key === null) syncLive2dPref()
}

/** About / Projects / Article：无面包屑，标题与 meta 同一行底对齐 + 下划线（见 index.scss `.lk-header-split`） */
function syncSplitPageHeader(path) {
  if (typeof document === 'undefined') return
  const p = normPath(path)
  const use =
    p !== '/home' &&
    (p === '/about' ||
      p.startsWith('/about/') ||
      p === '/tech' ||
      p.startsWith('/tech/') ||
      p === '/article' ||
      p.startsWith('/article/'))
  document.documentElement.classList.toggle('lk-header-split', use)
}

function debugAboutHeaderMetrics(runId) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const p = normPath(window.location.pathname || '')
  if (!(p === '/about' || p.startsWith('/about/'))) return

  const pageTitle = document.querySelector('.vp-page-title')
  const pageTitleH1 = document.querySelector('.vp-page-title h1')
  const aboutLayout = document.querySelector('.lk-about-fullbleed .about-page-layout')
  const navbar = document.querySelector('.vp-navbar')

  const pageTitleRect = pageTitle?.getBoundingClientRect?.() || null
  const h1Rect = pageTitleH1?.getBoundingClientRect?.() || null
  const layoutRect = aboutLayout?.getBoundingClientRect?.() || null
  const navbarRect = navbar?.getBoundingClientRect?.() || null

  const data = {
    path: p,
    hasHeaderSplitClass: document.documentElement.classList.contains('lk-header-split'),
    hasPageTitle: !!pageTitle,
    hasPageTitleH1: !!pageTitleH1,
    hasAboutLayout: !!aboutLayout,
    pageTitlePaddingTop: pageTitle ? window.getComputedStyle(pageTitle).paddingTop : null,
    pageTitleMarginTop: pageTitle ? window.getComputedStyle(pageTitle).marginTop : null,
    h1Transform: pageTitleH1 ? window.getComputedStyle(pageTitleH1).transform : null,
    layoutTransform: aboutLayout ? window.getComputedStyle(aboutLayout).transform : null,
    navbarBottom: navbarRect ? Math.round(navbarRect.bottom) : null,
    titleTop: pageTitleRect ? Math.round(pageTitleRect.top) : null,
    h1Top: h1Rect ? Math.round(h1Rect.top) : null,
    layoutTop: layoutRect ? Math.round(layoutRect.top) : null,
    gapNavbarToTitle: navbarRect && pageTitleRect ? Math.round(pageTitleRect.top - navbarRect.bottom) : null,
    gapTitleToLayout: pageTitleRect && layoutRect ? Math.round(layoutRect.top - pageTitleRect.bottom) : null,
  }

  // #region agent log
  fetch('http://127.0.0.1:7655/ingest/296c82e7-8e39-4cb8-9b2f-c70e9a1e3f41',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'53a7cd'},body:JSON.stringify({sessionId:'53a7cd',runId,hypothesisId:'H1-H4',location:'docs/.vuepress/client.js:debugAboutHeaderMetrics',message:'About header/layout metrics snapshot',data,timestamp:Date.now()})}).catch(()=>{})
  // #endregion
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
let navbarHideObserver = null
/** 已成功展示的图片下标（仅 onload 成功后更新） */
let wallpaperDisplayIndex = -1
/** 正在为其发起 Image 加载的下标，避免重复请求 */
let wallpaperLoadingForIndex = null
/** Whether we have overridden .vp-hero-mask background* inline styles */
let heroBgOverridden = false

/* ── Live2D：挂 body + fixed 视口右下，避免随首页网格卸载而销毁 ───────────── */
let live2dLoaded = false
/** 仅表示已插入 unpkg 脚本（模型可能尚未 init，见 tryMountLive2dModel） */
let live2dScriptInjected = false
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

/** Viewport bottom-right; right offset clears back-to-top arrow (z-index above widget). */
function positionLive2DWidget() {
  if (typeof window === 'undefined') return
  const container = document.getElementById('live2d-widget')
  if (!container) return

  document.body.appendChild(container)

  const isMobile = window.matchMedia('(max-width: 959px)').matches
  Object.assign(container.style, {
    position: 'fixed',
    right: isMobile
      ? 'max(0.25rem, env(safe-area-inset-right, 0px))'
      : 'calc(1rem + 52px + max(0.25rem, env(safe-area-inset-right, 0px)))',
    bottom: isMobile
      ? 'max(0.5rem, env(safe-area-inset-bottom, 0px))'
      : 'max(0.25rem, env(safe-area-inset-bottom, 0px))',
    left: '',
    top: '',
    zIndex: '55',
  })
  applyLive2dViewportScale()
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

/** 用户关闭看板娘时不 init；开启后由 `syncLive2dPref` 再触发。 */
function tryMountLive2dModel() {
  if (typeof window === 'undefined' || live2dLoaded) return
  if (!window.L2Dwidget) return
  if (isLive2dHiddenPath(window.location.pathname)) return
  if (!readLive2dPref()) return

  window.L2Dwidget.init({
    model: {
      jsonPath:
        'https://unpkg.com/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json',
    },
    display: {
      position: 'right',
      width: 220,
      height: 440,
    },
    mobile: {
      show: true,
    },
    react: {
      opacityDefault: 1,
      opacityOnHover: 1,
    },
  })
  live2dLoaded = true
  attachLive2dViewportListeners()
  applyLive2dUserClass()
  scheduleLive2dReposition()
  try {
    window.dispatchEvent(new Event('resize'))
  } catch {
    /* ignore */
  }
}

/** 尽早加载脚本；真正 init 延迟到非隐藏页（tryMountLive2dModel） */
function initLive2DScript() {
  if (typeof window === 'undefined' || live2dScriptInjected) return
  live2dScriptInjected = true

  const onLibReady = () => {
    tryMountLive2dModel()
  }

  if (window.L2Dwidget) {
    onLibReady()
    return
  }

  const script = document.createElement('script')
  script.src = 'https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js'
  script.async = true
  script.onload = onLibReady
  document.body.appendChild(script)
}

/** 路由切换后：补一次 init + 定位（从隐藏页进首页时） */
function nudgeLive2dForCurrentRoute() {
  if (typeof window === 'undefined') return
  applyLive2dRouteClass(window.location.pathname)
  if (isLive2dHiddenPath(window.location.pathname)) return
  tryMountLive2dModel()
  rescueLive2dFromHomeGrid()
  if (live2dLoaded) {
    scheduleLive2dReposition()
    requestAnimationFrame(() => {
      applyLive2dViewportScale()
    })
  }
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
  tryMountLive2dModel()
  mountTypewriter('Welcome to my blog!')
  mountHomeBodyGrid()
  mountFloatingShapes()
  initScrollBlur()
  rescueLive2dFromHomeGrid()
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
  rootComponents: [
    NetworkParticlesBgClient,
    ParticlesNavbarToggleClient,
    SiteFooter,
    BackToTopArrow,
    LoginGateClient,
    ArticleCategoriesAsideClient,
    PublishFabClient,
    ArticleBatchOpsClient,
  ],

  enhance({ app, router }) {
    // Ensure these are usable in markdown as <ProjectNineGrid /> / <ProjectCardsGrid />.
    app.component('ProjectNineGrid', ProjectNineGrid)
    app.component('ProjectCardsGrid', ProjectCardsGrid)
    app.component('AboutTimeline', AboutTimeline)
    app.component('AboutArticleRecommend', AboutArticleRecommend)
    app.component('AboutCategoriesCard', AboutCategoriesCard)
    app.component('ArticleIndexList', ArticleIndexList)
    app.component('ProjectsRolesCard', ProjectsRolesCard)
    app.component('SiteAvatar', SiteAvatar)
    router.beforeEach((to) => {
      if (isRootPathForAboutRedirect(to.path)) {
        return { path: '/about', replace: true }
      }
      if (!canAccessPath(to.path)) {
        return { path: '/about', replace: true }
      }
    })
  },

  setup() {
    const route = useRoute()

    const microtask =
      typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (fn) => Promise.resolve().then(fn)

    const syncHiddenNav = () => {
      applyHiddenNavbarItems()
    }

    const syncProtectedAccess = () => {
      if (typeof window === 'undefined') return
      if (!canAccessPath(route.path)) {
        window.location.replace('/about.html')
      }
    }

    watch(
      () => route.path,
      (path) => {
        syncSiteNonHomeClass(path)
      },
      { flush: 'post' },
    )

    watch(
      () => route.path,
      (path) => {
        applyLive2dRouteClass(path)
      },
      { flush: 'post', immediate: true },
    )

    watch(
      () => route.path,
      (path) => {
        syncSplitPageHeader(path)
        nextTick(() => {
          debugAboutHeaderMetrics('run-before-fix-route-watch')
        })
      },
      { flush: 'post', immediate: true },
    )

    watch(
      () => route.path,
      () => {
        nudgeNavbarSidebarRepaint()
        nextTick(() => {
          applyHiddenNavbarItems()
        })
      },
      { flush: 'post' },
    )

    onMounted(() => {
      syncSiteNonHomeClass(route.path)
      applyLive2dRouteClass(route.path)
      syncLive2dPref()
      syncSplitPageHeader(route.path)
      nextTick(() => {
        debugAboutHeaderMetrics('run-before-fix-mounted')
      })
      ensureNavbarHideObserver()
      applyHiddenNavbarItems()
      nextTick(() => {
        nudgeNavbarSidebarRepaint()
        applyHiddenNavbarItems()
      })
      initProgressBar()
      initLive2DScript()
      nextTick(() => {
        tryMountLive2dModel()
      })
      window.addEventListener('storage', onLive2dPrefStorage)
      window.addEventListener(LIVE2D_PREF_EVENT, syncLive2dPref)
      window.addEventListener('storage', syncHiddenNav)
      window.addEventListener(HIDDEN_NAV_ITEMS_EVENT, syncHiddenNav)
      window.addEventListener('storage', syncProtectedAccess)
      window.addEventListener(PROTECTED_ACCESS_EVENT, syncProtectedAccess)
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
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onLive2dPrefStorage)
        window.removeEventListener(LIVE2D_PREF_EVENT, syncLive2dPref)
        window.removeEventListener('storage', syncHiddenNav)
        window.removeEventListener(HIDDEN_NAV_ITEMS_EVENT, syncHiddenNav)
        window.removeEventListener('storage', syncProtectedAccess)
        window.removeEventListener(PROTECTED_ACCESS_EVENT, syncProtectedAccess)
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('lk-site-non-home')
        document.documentElement.classList.remove('lk-live2d-off')
        document.documentElement.classList.remove('lk-live2d-user-off')
        document.documentElement.classList.remove('lk-live2d-route-hidden')
        document.documentElement.classList.remove('lk-header-split')
      }
      navbarHideObserver?.disconnect()
      navbarHideObserver = null
      clearManagedNavbarVisibility()
    })

    watch(
      () => route.path,
      async () => {
        await nextTick()
        nudgeLive2dForCurrentRoute()
        debugAboutHeaderMetrics('run-before-fix-route-post-nexttick')
      },
      { flush: 'post' },
    )

    watch(
      () => authedRef.value,
      async () => {
        await nextTick()
        nudgeLive2dForCurrentRoute()
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
              rescueLive2dFromHomeGrid()
              if (live2dLoaded) scheduleLive2dReposition()
            }
          })
        }
      },
    )
  },
})
