import { ClientOnly, defineClientConfig } from 'vuepress/client'
import { createApp, defineComponent, h, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import HomeSidePanel from './components/HomeSidePanel.vue'
import HomeTypewriterTagline from './components/HomeTypewriterTagline.vue'
import ProfileCard from './components/ProfileCard.vue'
import ProjectNineGrid from './components/ProjectNineGrid.vue'
import ProjectCardsGrid from './components/ProjectCardsGrid.vue'
import SiteFooter from './components/SiteFooter.vue'
import BackToTopArrow from './components/BackToTopArrow.vue'
import LoginGate from './components/LoginGate.vue'
import ArticleCategoriesAside from './components/ArticleCategoriesAside.vue'
import AboutTimeline from './components/AboutTimeline.vue'
import AboutArticleRecommend from './components/AboutArticleRecommend.vue'
import AboutCategoriesCard from './components/AboutCategoriesCard.vue'
import AboutPageLayoutV2 from './components/AboutPageLayoutV2.vue'
import AboutMePage from './components/AboutMePage.vue'
import EarthVisitedGlobe from './components/EarthVisitedGlobe.vue'
import StatsEntryGrid from './components/StatsEntryGrid.vue'
import StatsBigBoard from './components/StatsBigBoard.vue'
import ArticleIndexList from './components/ArticleIndexList.vue'
import ProjectPortfolio from './components/ProjectPortfolio.vue'
import ProductManagerCases from './components/ProductManagerCases.vue'
import ProjectsSidebarFilters from './components/ProjectsSidebarFilters.vue'
import ProjectsRolesCard from './components/ProjectsRolesCard.vue'
import SiteAvatar from './components/SiteAvatar.vue'
import CursorEffect from './components/CursorEffect.vue'
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

/** 客户端导航到带 hash 的地址（如 `/about#about-intro`）时，确保滚到对应锚点，避免「关于我」与首屏同页却停在顶栏像又点了首页。 */
function scrollToRouteHash(to) {
  if (typeof document === 'undefined' || !to?.hash) return
  const raw = to.hash
  const id = raw.startsWith('#') ? decodeURIComponent(raw.slice(1)) : decodeURIComponent(raw)
  if (!id) return
  const tryOnce = () => {
    let el = document.getElementById(id)
    if (!el && raw) {
      try {
        el = document.querySelector(raw)
      } catch {
        /* 非法 selector 时忽略 */
      }
    }
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'auto' })
      return true
    }
    return false
  }
  const run = (attempt) => {
    if (tryOnce() || attempt > 40) return
    requestAnimationFrame(() => run(attempt + 1))
  }
  nextTick(() => run(0))
}

/** 站点根路径 `/`（README）= Hope 首页，用于 `lk-site-non-home` 等 */
function isSiteHomePath(path) {
  if (path === undefined) {
    if (typeof window === 'undefined') return false
    path = window.location?.pathname
  }
  const p = normPath(path)
  return p === '/' || p === '/index'
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

function clearManagedHomeFeatureVisibility() {
  if (typeof document === 'undefined') return
  for (const el of document.querySelectorAll('[data-lk-hidden-home-entry="1"]')) {
    el.style.display = ''
    el.removeAttribute('data-lk-hidden-home-entry')
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

    for (const wrapper of root.querySelectorAll('.vp-dropdown-wrapper')) {
      const links = [...wrapper.querySelectorAll('.vp-dropdown-item, .vp-dropdown-link, li, a[href]')]
      const visibleItems = links.filter((el) => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })
      if (visibleItems.length === 0) {
        wrapper.style.display = 'none'
        wrapper.setAttribute('data-lk-hidden-nav-item', '1')
        wrapper.setAttribute('data-lk-hidden-nav-id', 'dropdown-empty')
      }
    }
  }
}

function applyHiddenHomeEntries() {
  if (typeof document === 'undefined') return
  clearManagedHomeFeatureVisibility()

  const hiddenIds = new Set(readHiddenNavItems())
  if (!hiddenIds.size) return

  const matchers = navbarPageOptions.filter((item) => hiddenIds.has(item.id))
  const homeRoot = document.querySelector('.page-home')
  if (!homeRoot) return

  for (const anchor of homeRoot.querySelectorAll('a[href]')) {
    const path = normalizeAnchorPath(anchor.getAttribute('href') || anchor.href)
    if (!path) continue
    const matched = matchers.find((item) => item.matches(path))
    if (!matched) continue
    const target =
      anchor.closest('.vp-feature') ||
      anchor.closest('.feature') ||
      anchor.closest('li') ||
      anchor
    target.style.display = 'none'
    target.setAttribute('data-lk-hidden-home-entry', '1')
    target.setAttribute('data-lk-hidden-nav-id', matched.id)
  }
}

function ensureNavbarHideObserver() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
  if (navbarHideObserver) return
  navbarHideObserver = new MutationObserver(() => {
    applyHiddenNavbarItems()
    applyHiddenHomeEntries()
  })
  navbarHideObserver.observe(document.body, { childList: true, subtree: true })
}

/** 看板娘显隐仅由导航栏开关 + localStorage（`live2dPref.js`）控制，全站路由一致。 */
function isLive2dHiddenPath(path) {
  const p = normPath(path)
  return (
    p === '/about' ||
    p.startsWith('/about/') ||
    p === '/stats' ||
    p.startsWith('/stats/') ||
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
    initLive2DScript()
    tryMountLive2dModel()
    nudgeLive2dForCurrentRoute()
  }
}

function onLive2dPrefStorage(e) {
  if (typeof window === 'undefined') return
  if (e.key === LIVE2D_PREF_KEY || e.key === null) syncLive2dPref()
}

/**
 * 与当前目标路由同步到 <html data-lk-route>（normPath），供 index.scss 在「过渡帧」隐藏未卸载的旧页 DOM。
 * 比 theme-container 的 pageClass 更早，可避免 /tech ↔ /article 同帧内 :has() 仍命中旧结构而闪一帧 Projects 左栏。
 */
function syncRouteDataAttr(path) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-lk-route', normPath(path))
}

/** About / Projects / Article：无面包屑，标题与 meta 同一行底对齐 + 下划线（见 index.scss `.lk-header-split`） */
function syncSplitPageHeader(path) {
  if (typeof document === 'undefined') return
  const p = normPath(path)
  const use =
    p === '/' ||
      p === '/index' ||
      p === '/about' ||
      p.startsWith('/about/') ||
      p === '/stats' ||
      p.startsWith('/stats/') ||
      p === '/tech' ||
      p.startsWith('/tech/') ||
      p === '/article' ||
      p.startsWith('/article/')
  document.documentElement.classList.toggle('lk-header-split', use)
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

let navbarHideObserver = null

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

/** 仅在用户开启看板娘时加载 unpkg 脚本；init 仍由 tryMountLive2dModel 在非隐藏页执行。 */
function initLive2DScript() {
  if (typeof window === 'undefined' || live2dScriptInjected) return
  if (!readLive2dPref()) return

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

/* ── 全局背景模糊蒙版（#lk-blur-layer）── ──────────────────────────────
 * 替代 CSS ::before 方案，直接由 JS 管理 div 的 class，
 * 避免 lk-site-non-home !important 导致的 backdrop-filter 清零问题。
 *
 * 三种状态（对应 CSS 类）：
 *   lk-blur--clear  : About 页顶部，不模糊
 *   lk-blur--soft   : About 页滚动后，轻度模糊
 *   lk-blur--static : 其他页面，固定轻度模糊，切页时无 transition
 */
let blurLayer = null
const LK_SCROLL_BLUR_THRESHOLD = 100  // 滚过 Hero 的安全高度

/** Theme Hope / VuePress 常把滚动放在 .theme-container 内，window.scrollY 恒为 0，导致 About 模糊层永远不切换。 */
function getEffectiveScrollY() {
  if (typeof window === 'undefined') return 0
  const root = document.scrollingElement || document.documentElement
  const fromDocument =
    window.scrollY ||
    window.pageYOffset ||
    root?.scrollTop ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  let inner = 0
  for (const sel of ['.theme-container', '#app', 'main.vp-page', '.vp-page-content', '[vp-content]']) {
    const el = document.querySelector(sel)
    if (el && el.scrollTop > inner) inner = el.scrollTop
  }
  return Math.max(fromDocument, inner)
}

function getScrollRangeForProgress() {
  const winH = window.innerHeight
  const docMax = Math.max(0, document.documentElement.scrollHeight - winH)
  const tc = document.querySelector('.theme-container')
  const innerMax = tc ? Math.max(0, tc.scrollHeight - tc.clientHeight) : 0
  return Math.max(docMax, innerMax, 1)
}

function ensureBlurLayer() {
  if (typeof document === 'undefined') return
  if (blurLayer) return
  blurLayer = document.createElement('div')
  blurLayer.id = 'lk-blur-layer'
  document.body.insertBefore(blurLayer, document.body.firstChild)
}

function isAboutRoute(path) {
  // dev 模式 path 形如 /about.html、prod 形如 /about 或 /about/。
  // 先剥 .html 后缀，再去 trailing slash，最后做精确 / 前缀匹配。
  const raw = path || (typeof window !== 'undefined' ? window.location.pathname : '/')
  const p = raw.replace(/\.html$/, '').replace(/\/+$/, '') || '/'
  return p === '/' || p === '/about' || p.startsWith('/about/')
}

function updateBlurLayer(path) {
  if (!blurLayer) return
  const scrollY = getEffectiveScrollY()
  const aboutHit = isAboutRoute(path)
  blurLayer.classList.remove('lk-blur--clear', 'lk-blur--soft', 'lk-blur--static')
  let appliedClass
  if (aboutHit) {
    appliedClass = scrollY > LK_SCROLL_BLUR_THRESHOLD ? 'lk-blur--soft' : 'lk-blur--clear'
  } else {
    appliedClass = 'lk-blur--static'
  }
  blurLayer.classList.add(appliedClass)
}

/* ── Scroll progress bar (global) ─────────────────────────────────────── */
let progressBar = null

function initProgressBar() {
  if (document.getElementById('lk-progress')) return
  const bar = document.createElement('div')
  bar.id = 'lk-progress'
  document.body.appendChild(bar)
  progressBar = bar

  let ticking = false
  const onScroll = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(() => {
        const y = getEffectiveScrollY()
        const max = getScrollRangeForProgress()
        bar.style.width = max > 0 ? `${(y / max) * 100}%` : '0%'
        updateBlurLayer(window.location.pathname)
        ticking = false
      })
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  /* 内部滚动容器不冒泡到 window；捕获阶段仍能收到 scroll */
  document.addEventListener('scroll', onScroll, { passive: true, capture: true })
}

function rescueLive2dFromHomeGrid() {
  const row = document.querySelector('main.vp-project-home .lk-home-body-grid')
  const container = document.getElementById('live2d-widget')
  if (row && container && row.contains(container)) {
    document.body.appendChild(container)
  }
}

/** 首页 Hero 进栏前暂隐主区，减少 DOM 重排显式跳动（与 index.scss `lk-home-enhance-suspended` 配套） */
function setHomeEnhanceSuspended(flag) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('lk-home-enhance-suspended', !!flag)
}

let homeTypewriterApp = null

function mountHomeTypewriter() {
  if (typeof document === 'undefined' || homeTypewriterApp) return
  const el = document.getElementById('main-description')
  if (!el || el.dataset.lkTw) return
  el.dataset.lkTw = '1'
  const tagline = el.textContent?.trim() || 'Welcome to my blog'
  el.innerHTML = ''
  const text = tagline || 'Welcome to my blog'
  homeTypewriterApp = createApp({ render: () => h(HomeTypewriterTagline, { text }) })
  homeTypewriterApp.mount(el)
}

function unmountHomeTypewriter() {
  if (homeTypewriterApp) {
    homeTypewriterApp.unmount()
    homeTypewriterApp = null
  }
  const el = document.getElementById('main-description')
  if (el) delete el.dataset.lkTw
}

/**
 * 将 Hope 首屏 Hero（及主题生成的 features）移入 Markdown 中的 `.lk-home-main-col`，
 * 与左侧小卡片同排；逻辑源自旧版 `mountHomeBodyGrid`（见 git 1b02bbe）。
 * @returns {boolean} 是否已放好（或已处于放好状态）
 */
function placeHomeHeroInGrid() {
  if (typeof document === 'undefined') return false
  const main = document.querySelector('main.vp-page.vp-project-home') || document.querySelector('main.vp-project-home')
  if (!main) return false
  if (main.dataset.lkHomeHeroPlaced === '1') return true

  const grid = main.querySelector('.lk-home-body-grid')
  const mainCol = grid?.querySelector?.('.lk-home-main-col') ?? null
  if (!grid || !mainCol) return false

  const hero =
    main.querySelector(':scope > .vp-hero-info-wrapper') || main.querySelector(':scope > header.vp-hero-info-wrapper')
  if (!hero) return false

  setHomeEnhanceSuspended(true)
  try {
    main.classList.add('lk-home-dual')
    mainCol.appendChild(hero)

    // Hope `home: true` 渲染：hero 与 feature-wrapper 都是 main 的直接子节点
    for (const el of main.querySelectorAll(':scope > .vp-feature-wrapper, :scope > .vp-features')) {
      if (grid.contains(el)) continue
      mainCol.appendChild(el)
    }

    main.dataset.lkHomeHeroPlaced = '1'
  } finally {
    setHomeEnhanceSuspended(false)
  }
  rescueLive2dFromHomeGrid()
  return true
}

function unplaceHomeHeroFromGrid() {
  if (typeof document === 'undefined') return
  const main = document.querySelector('main.vp-page.vp-project-home') || document.querySelector('main.vp-project-home')
  if (!main || main.dataset.lkHomeHeroPlaced !== '1') return
  const grid = main.querySelector('.lk-home-body-grid')
  const mainCol = grid?.querySelector?.('.lk-home-main-col') ?? null
  const hero = mainCol?.querySelector?.('.vp-hero-info-wrapper')
  if (hero) {
    main.prepend(hero)
  }
  // 把 features 也送回 main（hero 之后），保持原 Hope DOM 结构
  if (mainCol) {
    for (const el of mainCol.querySelectorAll(':scope > .vp-feature-wrapper, :scope > .vp-features')) {
      hero ? hero.insertAdjacentElement('afterend', el) : main.prepend(el)
    }
  }
  main.classList.remove('lk-home-dual')
  delete main.dataset.lkHomeHeroPlaced
}

/**
 * 主题异步出水合后再移动 Hero；从非首页切回 `/` 时同样重试。
 */
function scheduleHomePageLayout(p, attempt = 0) {
  if (typeof document === 'undefined') return
  const path = p != null ? normPath(p) : normPath(window.location?.pathname)
  if (path !== '/' && path !== '/index') {
    unplaceHomeHeroFromGrid()
    unmountHomeTypewriter()
    return
  }
  if (placeHomeHeroInGrid()) {
    mountHomeTypewriter()
    return
  }
  if (attempt < 40) {
    setTimeout(
      () => {
        if (placeHomeHeroInGrid()) {
          mountHomeTypewriter()
        } else {
          scheduleHomePageLayout(path, attempt + 1)
        }
      },
      32,
    )
  }
}

/* ── Entry ──────────────────────────────────────────────────────────────── */
export default defineClientConfig({
  rootComponents: [
    CursorEffect,
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
    app.component('AboutPageLayoutV2', AboutPageLayoutV2)
    app.component('AboutMePage', AboutMePage)
    app.component('EarthVisitedGlobe', EarthVisitedGlobe)
    app.component('StatsEntryGrid', StatsEntryGrid)
    app.component('StatsBigBoard', StatsBigBoard)
    app.component('HomeSidePanel', HomeSidePanel)
    app.component('ProfileCard', ProfileCard)
    app.component('ArticleIndexList', ArticleIndexList)
    app.component('ProjectPortfolio', ProjectPortfolio)
    app.component('ProductManagerCases', ProductManagerCases)
    app.component('ProjectsSidebarFilters', ProjectsSidebarFilters)
    app.component('ProjectsRolesCard', ProjectsRolesCard)
    app.component('SiteAvatar', SiteAvatar)
    router.beforeEach((to) => {
      if (!canAccessPath(to.path)) {
        return { path: '/about', replace: true }
      }
      // 在首帧 paint 前挂上 lk-header-split，减少切到 About/Projects/文章 时主题布局「晚一拍」
      syncSplitPageHeader(to.path)
      syncRouteDataAttr(to.path)
    })
    router.afterEach((to) => {
      scrollToRouteHash(to)
    })
  },

  setup() {
    const route = useRoute()

    const syncHiddenNav = () => {
      applyHiddenNavbarItems()
      applyHiddenHomeEntries()
    }

    const syncProtectedAccess = () => {
      if (typeof window === 'undefined') return
      if (!canAccessPath(route.path)) {
        window.location.replace('/about.html')
      }
    }

    /** 首屏客户端初始化：模糊层、路由类、导航/侧栏观察器、进度条、Live2D、存储事件。 */
    function initClientShell() {
      if (typeof window === 'undefined') return
      ensureBlurLayer()
      updateBlurLayer(route.path)
      syncSiteNonHomeClass(route.path)
      applyLive2dRouteClass(route.path)
      syncLive2dPref()
      syncSplitPageHeader(route.path)
      syncRouteDataAttr(route.path)
      ensureNavbarHideObserver()
      applyHiddenNavbarItems()
      nextTick(() => {
        nudgeNavbarSidebarRepaint()
        applyHiddenNavbarItems()
        applyHiddenHomeEntries()
      })
      initProgressBar()
      initLive2DScript()
      nextTick(() => {
        tryMountLive2dModel()
      })
      void nextTick(() => {
        scheduleHomePageLayout(route.path)
      })
      window.addEventListener('storage', onLive2dPrefStorage)
      window.addEventListener(LIVE2D_PREF_EVENT, syncLive2dPref)
      window.addEventListener('storage', syncHiddenNav)
      window.addEventListener(HIDDEN_NAV_ITEMS_EVENT, syncHiddenNav)
      window.addEventListener('storage', syncProtectedAccess)
      window.addEventListener(PROTECTED_ACCESS_EVENT, syncProtectedAccess)
    }

    watch(
      () => route.path,
      (path) => {
        syncSiteNonHomeClass(path)
        updateBlurLayer(path)
      },
      { flush: 'post' },
    )

    watch(
      () => route.path,
      (path) => {
        void nextTick(() => {
          scheduleHomePageLayout(path)
        })
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
      },
      { flush: 'post', immediate: true },
    )

    watch(
      () => route.path,
      (path) => {
        syncRouteDataAttr(path)
      },
      { flush: 'sync', immediate: true },
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
      initClientShell()
    })

    onUnmounted(() => {
      unplaceHomeHeroFromGrid()
      unmountHomeTypewriter()
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
        document.documentElement.removeAttribute('data-lk-route')
      }
      navbarHideObserver?.disconnect()
      navbarHideObserver = null
      clearManagedNavbarVisibility()
      clearManagedHomeFeatureVisibility()
    })

    watch(
      () => route.path,
      async () => {
        await nextTick()
        nudgeLive2dForCurrentRoute()
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

  },
})
