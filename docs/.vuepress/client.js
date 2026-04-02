import { defineClientConfig } from 'vuepress/client'
import { createApp, h, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
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

function setHomeEnhanceSuspended(flag) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('lk-home-enhance-suspended', !!flag)
}

/** VuePress home route (respects trailing slash normalization). */
function isSiteHomePath(path) {
  const normalized = (path || '/').replace(/\/+$/, '') || '/'
  return normalized === '/'
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
let homeHoverProbeSamples = 0
let themeChangeSamples = 0
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
    display: '',
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
    if (themeChangeSamples < 6) {
      themeChangeSamples += 1
      const root = document.documentElement
      const dataTheme = root ? root.getAttribute('data-theme') || null : null
      const rootClasses = root ? Array.from(root.classList || []) : []
      let storedScheme = null
      try {
        storedScheme =
          window.localStorage.getItem('vuepress-theme-hope-scheme') ??
          window.localStorage.getItem('hope-theme-scheme') ??
          null
      } catch (_) {
        storedScheme = null
      }
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run-theme',hypothesisId:'H8',location:'client.js:initScrollBlur:themeMutation',message:'theme attributes changed',data:{sample:themeChangeSamples,dataTheme,rootClasses,storedScheme},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    }
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

  const cards = mainCol.querySelectorAll('.vp-feature-item')
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      if (homeHoverProbeSamples >= 12) return
      homeHoverProbeSamples += 1
      const sidebarRect = profileAside.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const gridRect = row.getBoundingClientRect()
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run-hover',hypothesisId:'H7',location:'client.js:mountHomeBodyGrid:hoverEnter',message:'feature card hover enter',data:{sample:homeHoverProbeSamples,sidebarTop:sidebarRect.top,sidebarBottom:sidebarRect.bottom,gridTop:gridRect.top,gridBottom:gridRect.bottom,cardTop:cardRect.top,cardBottom:cardRect.bottom},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      const bgColor = window.getComputedStyle(card).backgroundColor
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b4536a'},body:JSON.stringify({sessionId:'b4536a',runId:'hover-color',hypothesisId:'H1',location:'client.js:mountHomeBodyGrid:hoverEnter:bg',message:'feature card hover enter bg',data:{sample:homeHoverProbeSamples,bgColor,cardTop:cardRect.top,cardBottom:cardRect.bottom},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    })
    card.addEventListener('mouseleave', () => {
      if (homeHoverProbeSamples >= 12) return
      homeHoverProbeSamples += 1
      const sidebarRect = profileAside.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const gridRect = row.getBoundingClientRect()
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run-hover',hypothesisId:'H7',location:'client.js:mountHomeBodyGrid:hoverLeave',message:'feature card hover leave',data:{sample:homeHoverProbeSamples,sidebarTop:sidebarRect.top,sidebarBottom:sidebarRect.bottom,gridTop:gridRect.top,gridBottom:gridRect.bottom,cardTop:cardRect.top,cardBottom:cardRect.bottom},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      const bgColor = window.getComputedStyle(card).backgroundColor
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b4536a'},body:JSON.stringify({sessionId:'b4536a',runId:'hover-color',hypothesisId:'H1',location:'client.js:mountHomeBodyGrid:hoverLeave:bg',message:'feature card hover leave bg',data:{sample:homeHoverProbeSamples,bgColor,cardTop:cardRect.top,cardBottom:cardRect.bottom},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    })
  })

  // #region agent log
  try {
    const featureWrapper = mainCol.querySelector('.vp-feature-wrapper')
    const themeContent = document.querySelector('.theme-hope-content')
    const viewportWidth = window.innerWidth
    const data = {
      viewportWidth,
      mainColWidth: mainCol.getBoundingClientRect().width,
      featureWrapperWidth: featureWrapper
        ? featureWrapper.getBoundingClientRect().width
        : null,
      themeContentWidth: themeContent
        ? themeContent.getBoundingClientRect().width
        : null,
      cardCount: cards.length,
    }
    fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '0eee0b',
      },
      body: JSON.stringify({
        sessionId: '0eee0b',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'client.js:mountHomeBodyGrid:widths',
        message: 'Home feature widths snapshot',
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  } catch (_) {
    // ignore logging errors
  }
  // #endregion
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
    const microtask =
      typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (fn) => Promise.resolve().then(fn)

    watch(
      () => route.path,
      (path) => {
        if (typeof document === 'undefined') return
        document.documentElement.classList.toggle(
          'lk-site-non-home',
          !isSiteHomePath(path),
        )
      },
      { immediate: true },
    )

    watch(
      () => route.path,
      () => {
        nudgeNavbarSidebarRepaint()
      },
      { immediate: true, flush: 'post' },
    )

    onMounted(() => {
      initProgressBar()
      initLive2DWidget()
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00c032'},body:JSON.stringify({sessionId:'00c032',runId:'run-route',hypothesisId:'H1',location:'client.js:setup:onMounted',message:'client mounted with initial route',data:{path:route.path},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
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
        if (live2dLoaded) {
          scheduleLive2dReposition()
        }
      },
      { flush: 'post' },
    )

    watch(
      () => route.path,
      (newPath, oldPath) => {
        // #region agent log
        fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00c032'},body:JSON.stringify({sessionId:'00c032',runId:'run-route',hypothesisId:'H1',location:'client.js:setup:watchRoute',message:'route changed',data:{oldPath,newPath},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
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
