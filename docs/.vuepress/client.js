import { defineClientConfig } from 'vuepress/client'
import { createApp, h, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import HomeTypewriterTagline from './components/HomeTypewriterTagline.vue'
import HomeSidePanel from './components/HomeSidePanel.vue'
import ProjectNineGrid from './components/ProjectNineGrid.vue'
import ProjectCardsGrid from './components/ProjectCardsGrid.vue'
import MockCommentsPreview from './components/MockCommentsPreview.vue'
import SiteFooter from './components/SiteFooter.vue'
import FloatingShapes from './components/FloatingShapes.vue'

/* ── Hero 背景：禁用失效外链 + 降级到本地背景色 ─ */
// Note: If external images return 403, we must not trigger requests.
// 使用本地首页壁纸作为主背景；如需多图轮换，可在此数组中继续追加路径。
const images = ['/home-hero.jpg']
const heroWallpaperFallbackBg = 'rgba(74, 144, 217, 0.18)'

function setHomeEnhanceSuspended(flag) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('lk-home-enhance-suspended', !!flag)
}

let scrollBlurHandler = null
let themeObserver = null
let heroDebugScrollSamples = 0
let heroDebugLayoutProbeSent = false
let globalBgProbeSamples = 0
let globalBgProbeHandler = null
/** 已成功展示的图片下标（仅 onload 成功后更新） */
let wallpaperDisplayIndex = -1
/** 正在为其发起 Image 加载的下标，避免重复请求 */
let wallpaperLoadingForIndex = null
/** Whether we have overridden .vp-hero-mask background* inline styles */
let heroBgOverridden = false

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
  mask.style.backgroundColor = isDarkMode()
    ? 'rgba(0, 0, 0, 0.35)'
    : heroWallpaperFallbackBg
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

/* ── Hero 背景：滚动模糊/缩放 + 本地图片兜底 ─ */
function initScrollBlur() {
  const mask = document.querySelector('.vp-hero-mask')
  if (!mask) return
  heroDebugScrollSamples = 0
  heroDebugLayoutProbeSent = false
  // #region agent log
  fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run1',hypothesisId:'H1',location:'client.js:initScrollBlur',message:'init scroll blur entered',data:{maskExists:!!mask,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight},timestamp:Date.now()})}).catch(()=>{})
  // #endregion

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
    const darkFactor = isDarkMode() ? 0.68 : 1
    const brightness = (1 - progress * 0.25) * darkFactor
    m.style.filter = `blur(${progress * 14}px) brightness(${brightness})`
    m.style.transform = `scale(${1 + progress * 0.06})`
    if (heroDebugScrollSamples < 8) {
      heroDebugScrollSamples += 1
      const rect = m.getBoundingClientRect()
      const computed = window.getComputedStyle(m)
      const pageMain = document.querySelector('main.vp-page.vp-project-home') || document.querySelector('main.vp-project-home')
      const pageMainStyle = pageMain ? window.getComputedStyle(pageMain) : null
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run2',hypothesisId:'H2',location:'client.js:scrollBlurHandler',message:'scroll blur sample',data:{sample:heroDebugScrollSamples,scrollY,progress,filter:m.style.filter,transform:m.style.transform,maskRectLeft:rect.left,maskRectRight:rect.right,maskRectWidth:rect.width,maskCssLeft:computed.left,maskCssMarginLeft:computed.marginLeft,maskCssPosition:computed.position,mainPaddingLeft:pageMainStyle?.paddingLeft ?? null,mainPaddingRight:pageMainStyle?.paddingRight ?? null,viewportWidth:window.innerWidth},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    }
    if (!heroDebugLayoutProbeSent) {
      heroDebugLayoutProbeSent = true
      const wrapper = document.querySelector('.vp-hero-info-wrapper')
      const page = document.querySelector('.page.page-home') || document.querySelector('.theme-container.page-home')
      const wrapRect = wrapper?.getBoundingClientRect()
      const pageRect = page?.getBoundingClientRect()
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run2',hypothesisId:'H3',location:'client.js:scrollBlurHandler:firstLayoutProbe',message:'hero parent geometry',data:{hasWrapper:!!wrapper,hasPage:!!page,wrapperLeft:wrapRect?.left ?? null,wrapperWidth:wrapRect?.width ?? null,pageLeft:pageRect?.left ?? null,pageWidth:pageRect?.width ?? null,viewportWidth:window.innerWidth},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    }

    const target = wallpaperTargetIndex(scrollY, heroHeight)
    loadWallpaperForTarget(m, target)
  }
  scrollBlurHandler()
  window.addEventListener('scroll', scrollBlurHandler, { passive: true })

  themeObserver = new MutationObserver(() => {
    if (scrollBlurHandler) scrollBlurHandler()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  })
}

/* ── 修复向下箭头按钮 ─ */
function fixHeroSlideDownButton() {
  const button = document.querySelector('.vp-hero-slide-down-button')
  if (!button) return

  // 隐藏所有SVG图标
  const icons = button.querySelectorAll('.icon')
  icons.forEach(icon => {
    Object.assign(icon.style, {
      display: 'none',
      opacity: '0',
      visibility: 'hidden',
    })
  })

  const actions = document.querySelector('.page-home .vp-hero-actions')
  const wrapper = document.querySelector('.page-home .vp-hero-info-wrapper')
  if (actions && wrapper) {
    const actionsBox = actions.getBoundingClientRect()
    const wrapperBox = wrapper.getBoundingClientRect()
    const topPx = Math.max(actionsBox.bottom - wrapperBox.top + 14, 0)
    button.style.top = `${Math.round(topPx)}px`
    button.style.bottom = 'auto'
  }

  // 默认兜底：固定在左侧内容线附近
  Object.assign(button.style, {
    left: 'var(--lk-hero-content-inset, 1.75rem)',
    right: 'auto',
    border: 'none',
    position: 'absolute',
    zIndex: '22',
  })
  requestAnimationFrame(() => {
    const btnRect = button.getBoundingClientRect()
    const actions = document.querySelector('.page-home .vp-hero-actions')
    const actionsRect = actions?.getBoundingClientRect()
    // #region agent log
    fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run2',hypothesisId:'H4',location:'client.js:fixHeroSlideDownButton',message:'slide button placement',data:{viewportWidth:window.innerWidth,buttonLeft:btnRect.left,buttonRight:btnRect.right,buttonTop:btnRect.top,buttonBottom:btnRect.bottom,actionsBottom:actionsRect?.bottom ?? null,buttonStyleTop:button.style.top || null,buttonStyleLeft:button.style.left || null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
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

  if (globalBgProbeHandler) {
    window.removeEventListener('resize', globalBgProbeHandler)
    globalBgProbeHandler = null
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

/* ── 侧栏：Profile + Notice + Stats（主内容区左侧，非整屏 fixed）──────────── */
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

  // NOTE: intentionally NOT checking for firstElementAfter(hero) — the
  // feature items may still be hydrating at this point; the while-loop
  // handles the empty-sibling case gracefully.

  main.dataset.bodygrid = '1'
  main.classList.add('lk-home-dual')

  const row = document.createElement('div')
  row.className = 'lk-home-body-grid'

  // ── Force the two-column grid via inline styles to guarantee the layout
  // regardless of whatever the theme injects via its own stylesheet. ──────
  Object.assign(row.style, {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 3fr)',
    gap: '1.25rem 1.5rem',
    alignItems: 'start',
    width: '100%',
    boxSizing: 'border-box',
  })

  const profileAside = document.createElement('aside')
  profileAside.className = 'lk-home-profile-col'
  profileAside.setAttribute('aria-label', '侧栏：简介、公告与站点信息')

  // Sticky sidebar via inline style — same reason as above
  Object.assign(profileAside.style, {
    position: 'sticky',
    top: 'calc(var(--navbar-height, 3.5rem) + 20px)',
    alignSelf: 'start',
    justifySelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
  })

  const mainCol = document.createElement('div')
  mainCol.className = 'lk-home-main-col'

  row.appendChild(profileAside)
  row.appendChild(mainCol)
  // Keep hero as a standalone first block; two-column grid starts AFTER hero.
  hero.insertAdjacentElement('afterend', row)

  // Move all sections after hero into the main column.
  let sibling = row.nextSibling
  while (sibling) {
    const next = sibling.nextSibling
    mainCol.appendChild(sibling)
    sibling = next
  }

  sidePanelApp = createApp({ render: () => h(HomeSidePanel) })
  sidePanelApp.mount(profileAside)
}

function unmountHomeBodyGrid() {
  if (sidePanelApp) {
    sidePanelApp.unmount()
    sidePanelApp = null
  }
  const row = document.querySelector('main.vp-project-home .lk-home-body-grid')
  const main = document.querySelector('main.vp-page.vp-project-home')
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
  mountTypewriter('Welcome to my blog')
  mountHomeBodyGrid()
  mountFloatingShapes()
  initScrollBlur()
  fixHeroSlideDownButton() // 新增
  requestAnimationFrame(() => {
    const mask = document.querySelector('.vp-hero-mask')
    const main = document.querySelector('main.vp-page.vp-project-home') || document.querySelector('main.vp-project-home')
    const wrapper = document.querySelector('.vp-hero-info-wrapper')
    const page = document.querySelector('.theme-container.page-home')
    if (!mask || !main || !wrapper || !page) return
    const maskRect = mask.getBoundingClientRect()
    const mainRect = main.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()
    const maskStyle = window.getComputedStyle(mask)
    const mainStyle = window.getComputedStyle(main)
    // #region agent log
    fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId:'run1',hypothesisId:'H3',location:'client.js:mountHome:layoutProbe',message:'hero layout probe',data:{viewportWidth:window.innerWidth,maskRectLeft:maskRect.left,maskRectRight:maskRect.right,maskRectWidth:maskRect.width,mainRectLeft:mainRect.left,mainRectRight:mainRect.right,wrapperRectLeft:wrapperRect.left,wrapperRectRight:wrapperRect.right,maskCssWidth:maskStyle.width,maskCssLeft:maskStyle.left,maskCssMaxWidth:maskStyle.maxWidth,maskCssPosition:maskStyle.position,maskCssMarginLeft:maskStyle.marginLeft,mainPaddingLeft:mainStyle.paddingLeft,mainPaddingRight:mainStyle.paddingRight},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
  })

  const probeGlobalBackground = (runId, hypothesisId, location, message) => {
    if (globalBgProbeSamples >= 8) return
    globalBgProbeSamples += 1
    const html = document.documentElement
    const body = document.body
    const theme = document.querySelector('.theme-container.page-home')
    const page = document.querySelector('.page.page-home') || theme
    const main = document.querySelector('main.vp-page.vp-project-home') || document.querySelector('main.vp-project-home')
    const htmlStyle = html ? window.getComputedStyle(html) : null
    const bodyStyle = body ? window.getComputedStyle(body) : null
    const themeStyle = theme ? window.getComputedStyle(theme) : null
    const pageStyle = page ? window.getComputedStyle(page) : null
    const mainStyle = main ? window.getComputedStyle(main) : null
    // #region agent log
    fetch('http://127.0.0.1:7715/ingest/3136d737-2eab-49d2-89cb-f2491c213577',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a1d28'},body:JSON.stringify({sessionId:'0a1d28',runId,hypothesisId,location,message,data:{sample:globalBgProbeSamples,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,scrollHeight:document.documentElement.scrollHeight,bodyClientHeight:body?.clientHeight ?? null,bodyScrollHeight:body?.scrollHeight ?? null,htmlBgImage:htmlStyle?.backgroundImage ?? null,htmlBgColor:htmlStyle?.backgroundColor ?? null,bodyBgImage:bodyStyle?.backgroundImage ?? null,bodyBgColor:bodyStyle?.backgroundColor ?? null,themeBgImage:themeStyle?.backgroundImage ?? null,themeBgColor:themeStyle?.backgroundColor ?? null,pageBgImage:pageStyle?.backgroundImage ?? null,pageBgColor:pageStyle?.backgroundColor ?? null,mainBgImage:mainStyle?.backgroundImage ?? null,mainBgColor:mainStyle?.backgroundColor ?? null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
  }

  requestAnimationFrame(() => {
    probeGlobalBackground('run3', 'H5', 'client.js:mountHome:globalBackgroundProbe', 'initial global background layers')
  })

  globalBgProbeHandler = () => {
    probeGlobalBackground('run3', 'H6', 'client.js:mountHome:resizeGlobalBackgroundProbe', 'global background layers after resize')
  }
  window.addEventListener('resize', globalBgProbeHandler, { passive: true })
}

function unmountHome() {
  unmountTypewriter()
  unmountHomeBodyGrid()
  unmountFloatingShapes()
  cleanupScrollBlur()
}

/* ── Entry ──────────────────────────────────────────────────────────────── */
export default defineClientConfig({
  rootComponents: [SiteFooter],

  enhance({ app }) {
    // Ensure these are usable in markdown as <ProjectNineGrid /> / <ProjectCardsGrid />.
    app.component('ProjectNineGrid', ProjectNineGrid)
    app.component('ProjectCardsGrid', ProjectCardsGrid)
    app.component('MockCommentsPreview', MockCommentsPreview)
  },

  setup() {
    const route = useRoute()
    const microtask =
      typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (fn) => Promise.resolve().then(fn)

    onMounted(() => {
      initProgressBar()
      if (route.path === '/') {
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
    })

    watch(
      () => route.path,
      (newPath, oldPath) => {
        if (oldPath === '/') {
          unmountHome()
          setHomeEnhanceSuspended(false)
        }
        if (newPath === '/') {
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
