import { ClientOnly, defineClientConfig } from 'vuepress/client'
import { defineComponent, h, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
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
import AboutPageLayoutV2 from './components/AboutPageLayoutV2.vue'
import StatsEntryGrid from './components/StatsEntryGrid.vue'
import StatsBigBoard from './components/StatsBigBoard.vue'
import ArticleIndexList from './components/ArticleIndexList.vue'
import ProjectPortfolio from './components/ProjectPortfolio.vue'
import ProductManagerCases from './components/ProductManagerCases.vue'
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

/** 原 `/home` 已移除；保留函数供路由样式判断（恒为 false）。 */
function isSiteHomePath() {
  return false
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

/** About / Projects / Article：无面包屑，标题与 meta 同一行底对齐 + 下划线（见 index.scss `.lk-header-split`） */
function syncSplitPageHeader(path) {
  if (typeof document === 'undefined') return
  const p = normPath(path)
  const use =
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

function rescueLive2dFromHomeGrid() {
  const row = document.querySelector('main.vp-project-home .lk-home-body-grid')
  const container = document.getElementById('live2d-widget')
  if (row && container && row.contains(container)) {
    document.body.appendChild(container)
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
    app.component('StatsEntryGrid', StatsEntryGrid)
    app.component('StatsBigBoard', StatsBigBoard)
    app.component('HomeSidePanel', HomeSidePanel)
    app.component('ArticleIndexList', ArticleIndexList)
    app.component('ProjectPortfolio', ProjectPortfolio)
    app.component('ProductManagerCases', ProductManagerCases)
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
        applyHiddenHomeEntries()
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
    })

    onUnmounted(() => {
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
      clearManagedHomeFeatureVisibility()
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

  },
})
