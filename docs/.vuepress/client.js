import { defineClientConfig } from 'vuepress/client'
import { createApp, h, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import HomeTypewriterTagline from './components/HomeTypewriterTagline.vue'
import ProfileCard from './components/ProfileCard.vue'

/* ── Anime wallpaper pool (MIT · Dreamer-Paul/Anime-Wallpaper) ─────────────
   Each visit randomly picks one; sessionStorage keeps it stable per session.
   Add / remove numbers 1-100 to your taste.                                 */
const CDN = 'https://cdn.jsdelivr.net/gh/Dreamer-Paul/Anime-Wallpaper@master/'
const POOL = [1, 2, 3, 5, 6, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50]

function getWallpaperUrl() {
  const cached = sessionStorage.getItem('lk-wp')
  if (cached) return cached
  const url = CDN + POOL[Math.floor(Math.random() * POOL.length)] + '.jpg'
  sessionStorage.setItem('lk-wp', url)
  return url
}

/* ── Scroll-based blur ─────────────────────────────────────────────────────*/
let scrollHandler = null

function initScrollBlur() {
  const mask = document.querySelector('.vp-hero-mask')
  if (!mask) return

  // Apply random wallpaper (override the SSR default)
  const url = getWallpaperUrl()
  mask.style.backgroundImage = `url(${url})`
  mask.style.willChange = 'filter, transform'

  const hero = document.querySelector('.vp-hero-info-wrapper')

  scrollHandler = () => {
    const progress = Math.min(window.scrollY / (window.innerHeight * 0.55), 1)
    const blur = progress * 14                   // 0 → 14px
    const scale = 1 + progress * 0.06           // slight zoom to hide blur edges
    const brightness = 1 - progress * 0.25      // slight darken
    mask.style.filter = `blur(${blur}px) brightness(${brightness})`
    mask.style.transform = `scale(${scale})`
  }

  window.addEventListener('scroll', scrollHandler, { passive: true })
}

function cleanupScrollBlur() {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
    const mask = document.querySelector('.vp-hero-mask')
    if (mask) {
      mask.style.filter = ''
      mask.style.transform = ''
    }
  }
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

/* ── Profile card ───────────────────────────────────────────────────────── */
let cardApp = null

function mountProfileCard() {
  const heroInfo = document.querySelector('.vp-hero-info')
  if (!heroInfo || heroInfo.dataset.card) return
  heroInfo.dataset.card = '1'

  const mount = document.createElement('div')
  mount.className = 'lk-card-mount'
  const infos = heroInfo.querySelector('.vp-hero-infos')
  heroInfo.insertBefore(mount, infos)

  cardApp = createApp({ render: () => h(ProfileCard) })
  cardApp.mount(mount)
}

function unmountProfileCard() {
  if (cardApp) {
    cardApp.unmount()
    cardApp = null
    const mount = document.querySelector('.lk-card-mount')
    if (mount) mount.remove()
    const heroInfo = document.querySelector('.vp-hero-info')
    if (heroInfo) delete heroInfo.dataset.card
  }
}

/* ── Entry ─────────────────────────────────────────────────────────────── */
export default defineClientConfig({
  setup() {
    const route = useRoute()

    const mountHome = () => {
      mountTypewriter('Welcome to my blog')
      mountProfileCard()
      initScrollBlur()
    }

    const unmountHome = () => {
      unmountTypewriter()
      unmountProfileCard()
      cleanupScrollBlur()
    }

    onMounted(() => {
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
