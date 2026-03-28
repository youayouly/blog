import { defineClientConfig } from 'vuepress/client'
import { createApp, h, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import HomeTypewriterTagline from './components/HomeTypewriterTagline.vue'
import HomeSidePanel from './components/HomeSidePanel.vue'
import SiteFooter from './components/SiteFooter.vue'
import FloatingShapes from './components/FloatingShapes.vue'

/* ── Anime wallpaper pool (MIT · Dreamer-Paul/Anime-Wallpaper) ─────────── */
const CDN = 'https://cdn.jsdelivr.net/gh/Dreamer-Paul/Anime-Wallpaper@master/'
const POOL = [1, 2, 3, 5, 6, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50]

function getWallpaperUrl() {
  const cached = sessionStorage.getItem('lk-wp')
  if (cached) return cached
  const url = CDN + POOL[Math.floor(Math.random() * POOL.length)] + '.jpg'
  sessionStorage.setItem('lk-wp', url)
  return url
}

/* ── Scroll blur ────────────────────────────────────────────────────────── */
let scrollBlurHandler = null

function initScrollBlur() {
  const mask = document.querySelector('.vp-hero-mask')
  if (!mask) return
  mask.style.backgroundImage = `url(${getWallpaperUrl()})`
  mask.style.willChange = 'filter, transform'

  scrollBlurHandler = () => {
    const progress = Math.min(window.scrollY / (window.innerHeight * 0.55), 1)
    mask.style.filter = `blur(${progress * 14}px) brightness(${1 - progress * 0.25})`
    mask.style.transform = `scale(${1 + progress * 0.06})`
  }
  window.addEventListener('scroll', scrollBlurHandler, { passive: true })
}

function cleanupScrollBlur() {
  if (scrollBlurHandler) {
    window.removeEventListener('scroll', scrollBlurHandler)
    scrollBlurHandler = null
    const mask = document.querySelector('.vp-hero-mask')
    if (mask) { mask.style.filter = ''; mask.style.transform = '' }
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

  let sibling = hero.nextSibling
  while (sibling) {
    const next = sibling.nextSibling
    mainCol.appendChild(sibling)
    sibling = next
  }

  row.appendChild(profileAside)
  row.appendChild(mainCol)
  hero.insertAdjacentElement('afterend', row)

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
    const hero = main.querySelector(':scope > header.vp-hero-info-wrapper')
    if (mainCol && hero) {
      while (mainCol.firstChild)
        main.insertBefore(mainCol.firstChild, row)
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

  setup() {
    const route = useRoute()

    onMounted(() => {
      initProgressBar()
      if (route.path === '/') setTimeout(mountHome, 250)
    })

    watch(
      () => route.path,
      (newPath, oldPath) => {
        if (oldPath === '/') unmountHome()
        if (newPath === '/') setTimeout(mountHome, 350)
      },
    )
  },
})
