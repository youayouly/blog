<template>
  <div v-show="anchored" ref="wrapRef" class="vp-nav-item lk-particles-nav-item">
    <div class="lk-navbar-fx-group" role="group" aria-label="页面效果开关">
      <button
        type="button"
        class="lk-particles-toggle"
        :class="{ 'is-off': !enabled }"
        :title="hint"
        :aria-label="hint"
        :aria-pressed="enabled ? 'true' : 'false'"
        @click="onClick"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="lk-particles-toggle__star"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M12,2.2 15.05,8.38 21.9,9.37 16.92,14.22 18.08,22 12,18.18 5.92,22 7.08,14.22 2.1,9.37 8.95,8.38 Z"
          />
        </svg>
      </button>
      <button
        v-if="showLive2dToggle"
        ref="live2dBtnRef"
        type="button"
        class="lk-live2d-toggle"
        :class="{ 'is-off': !live2dOn }"
        :title="live2dHint"
        :aria-label="live2dHint"
        :aria-pressed="live2dOn ? 'true' : 'false'"
        @click="onLive2dClick"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="lk-live2d-toggle__person"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useIsLoggedIn } from '../utils/authGate.js'
import {
  PARTICLES_PREF_EVENT,
  PARTICLES_PREF_KEY,
  readParticlesPref,
  writeParticlesPref,
} from '../utils/particlesPref.js'
import {
  LIVE2D_PREF_EVENT,
  LIVE2D_PREF_KEY,
  readLive2dPref,
  writeLive2dPref,
} from '../utils/live2dPref.js'

const wrapRef = ref(null)
const anchored = ref(false)
const enabled = ref(true)
const live2dOn = ref(true)
const route = useRoute()
const isLoggedIn = useIsLoggedIn()
const live2dBtnRef = ref(null)

function isLive2dHiddenPath(path) {
  const p = String(path || '/').replace(/\/+$/, '') || '/'
  return (
    p === '/about' ||
    p.startsWith('/about/') ||
    p === '/tech' ||
    p.startsWith('/tech/') ||
    p === '/article' ||
    p.startsWith('/article/')
  )
}

const showLive2dToggle = computed(
  () => isLoggedIn.value && !isLive2dHiddenPath(route.path),
)

function syncFromStorage() {
  enabled.value = readParticlesPref()
}

function syncLive2dFromStorage() {
  live2dOn.value = readLive2dPref()
}

function onStorage(e) {
  if (e.key === PARTICLES_PREF_KEY || e.key === null) syncFromStorage()
  if (e.key === LIVE2D_PREF_KEY || e.key === null) syncLive2dFromStorage()
}

function onClick() {
  writeParticlesPref(!enabled.value)
  enabled.value = readParticlesPref()
}

function onLive2dClick() {
  if (!showLive2dToggle.value) return
  writeLive2dPref(!live2dOn.value)
  live2dOn.value = readLive2dPref()
}

const hint = computed(() =>
  enabled.value ? '关闭粒子背景' : '开启粒子背景（About / Projects / Article）',
)

const live2dHint = computed(() =>
  live2dOn.value ? '隐藏右下角看板娘' : '显示右下角看板娘',
)

let mo = null

// #region agent log
function agentLog(hypothesisId, location, message, data) {
  if (typeof fetch === 'undefined') return
  fetch('http://127.0.0.1:7655/ingest/296c82e7-8e39-4cb8-9b2f-c70e9a1e3f41', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7f7323' },
    body: JSON.stringify({
      sessionId: '7f7323',
      hypothesisId,
      location,
      message,
      data: data || {},
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}
// #endregion

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 719px)').matches
}

function findSidebarToggle(end) {
  if (!end) return null
  return (
    end.querySelector('button.vp-toggle-sidebar-button') ||
    end.querySelector('.vp-toggle-sidebar-button') ||
    end.querySelector('button[aria-label*="Menu" i]') ||
    end.querySelector('button[aria-label*="菜单" i]') ||
    end.querySelector('button[aria-label*="Toggle" i]')
  )
}

/** 插在导航栏右侧按钮列最末一个按钮之前（汉堡 / 关闭等），保证不塞进侧栏抽屉 */
function findFxInsertBefore(end, el) {
  if (!end) return null
  const directButtons = [...end.querySelectorAll(':scope > button')].filter((n) => n !== el)
  if (directButtons.length) return directButtons[directButtons.length - 1]
  const t = findSidebarToggle(end)
  if (t && t !== el && t.parentNode === end) return t
  return null
}

/** 把主题月亮移入本组件的 flex 行：DOM 顺序为 星 → 月 → 人，桌面用 CSS order 还原为 星 → 人 → 月 */
function hoistColorModeIntoGroup() {
  const el = wrapRef.value
  if (!el) return
  const group = el.querySelector('.lk-navbar-fx-group')
  const sw = document.getElementById('color-mode-switch')
  if (!group || !sw) {
    agentLog('H2', 'ParticlesNavbarToggle.vue:hoist', 'hoist skip: missing group or #color-mode-switch', {
      hasGroup: !!group,
      hasSw: !!sw,
    })
    return
  }
  const colorWrap = sw.closest('.vp-nav-item')
  if (!colorWrap || colorWrap === el || el.contains(colorWrap)) {
    agentLog('H3', 'ParticlesNavbarToggle.vue:hoist', 'hoist skip: bad colorWrap', {
      hasColorWrap: !!colorWrap,
      sameAsEl: colorWrap === el,
      alreadyInside: colorWrap ? el.contains(colorWrap) : false,
    })
    return
  }
  /* Hope 默认把主题包在 `.hide-in-mobile` 里；搬到顶栏后必须在窄屏可见 */
  colorWrap.classList.remove('hide-in-mobile')
  colorWrap.classList.add('lk-navbar-theme-slot')

  const liveBtn = live2dBtnRef.value
  const mode = liveBtn && liveBtn.parentNode === group ? 'insertBeforeLive2d' : 'appendToGroup'
  if (liveBtn && liveBtn.parentNode === group) {
    group.insertBefore(colorWrap, liveBtn)
  } else {
    group.appendChild(colorWrap)
  }
  agentLog('H4', 'ParticlesNavbarToggle.vue:hoist', 'hoist applied', {
    mode,
    hasLiveBtn: !!liveBtn,
    swInNavbar: !!document.querySelector('#navbar #color-mode-switch'),
    swInSidebar: !!document.querySelector('#sidebar #color-mode-switch'),
    strippedHideInMobile: true,
  })
}

function tryAnchor() {
  const el = wrapRef.value
  if (!el) return false

  const end = document.querySelector('#navbar .vp-navbar-end')
  if (!end) return false

  const insertBefore = findFxInsertBefore(end, el)
  const endChildSummary = [...end.children].map((n) => ({
    tag: n.tagName,
    cls: (n.className && String(n.className).slice(0, 80)) || '',
  }))
  const directBtnCount = [...end.querySelectorAll(':scope > button')].filter((n) => n !== el).length
  agentLog('H1', 'ParticlesNavbarToggle.vue:tryAnchor', 'anchor placement', {
    mobile: isMobileViewport(),
    directBtnCount,
    hasInsertBefore: !!insertBefore,
    insertTag: insertBefore?.tagName,
    insertCls: insertBefore?.className && String(insertBefore.className).slice(0, 80),
    endChildCount: end.children.length,
    endChildSummary: endChildSummary.slice(0, 12),
  })
  if (insertBefore && insertBefore.parentNode === end) {
    if (el.parentNode !== end || el.nextSibling !== insertBefore) {
      end.insertBefore(el, insertBefore)
    }
  } else if (el.parentNode !== end) {
    end.appendChild(el)
  }

  hoistColorModeIntoGroup()
  anchored.value = true
  const sw = document.getElementById('color-mode-switch')
  agentLog('H5', 'ParticlesNavbarToggle.vue:tryAnchor', 'post-anchor state', {
    elParent: el.parentNode?.id || el.parentNode?.className,
    rootContainsSw: !!(wrapRef.value && sw && wrapRef.value.contains(sw)),
    path: route.path,
    loggedIn: isLoggedIn.value,
    showL2d: showLive2dToggle.value,
  })
  // #region agent log
  const navScreen = document.querySelector('#nav-screen')
  const drawerColorBlocks = navScreen
    ? navScreen.querySelectorAll('.vp-color-mode').length
    : 0
  const drawerTitles = navScreen
    ? navScreen.querySelectorAll('.vp-color-mode-title').length
    : 0
  const modeSwitches = document.querySelectorAll('button#color-mode-switch').length
  agentLog('H6', 'ParticlesNavbarToggle.vue:tryAnchor', 'nav-screen theme duplicate probe', {
    hasNavScreen: !!navScreen,
    drawerVpColorModeCount: drawerColorBlocks,
    drawerTitleCount: drawerTitles,
    duplicateIdSwitchCount: modeSwitches,
  })
  // #endregion
  return true
}

onMounted(async () => {
  syncFromStorage()
  syncLive2dFromStorage()
  await nextTick()
  const ok = tryAnchor()
  const root = wrapRef.value
  const sw = typeof document !== 'undefined' ? document.getElementById('color-mode-switch') : null
  const hoisted = !!(root && sw && root.contains(sw))
  if (!ok || isMobileViewport() || !hoisted) {
    mo = new MutationObserver(() => {
      tryAnchor()
    })
    mo.observe(document.body, { childList: true, subtree: true })
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', tryAnchor)
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(PARTICLES_PREF_EVENT, syncFromStorage)
  window.addEventListener(LIVE2D_PREF_EVENT, syncLive2dFromStorage)
})

onUnmounted(() => {
  mo?.disconnect()
  mo = null
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', tryAnchor)
  }
  window.removeEventListener('storage', onStorage)
  window.removeEventListener(PARTICLES_PREF_EVENT, syncFromStorage)
  window.removeEventListener(LIVE2D_PREF_EVENT, syncLive2dFromStorage)
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    tryAnchor()
  },
  { flush: 'post' },
)

watch(isLoggedIn, async () => {
  await nextTick()
  tryAnchor()
})

watch(showLive2dToggle, async () => {
  await nextTick()
  hoistColorModeIntoGroup()
})
</script>
