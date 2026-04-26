<template>
  <div v-show="anchored" ref="wrapRef" class="vp-nav-item lk-particles-nav-item">
    <div class="lk-navbar-fx-group" role="group" aria-label="页面效果开关">
      <button
        v-if="isLoggedIn"
        type="button"
        class="lk-access-toggle"
        :class="{ 'is-active': blockedAccessIds.length > 0 }"
        :title="accessHint"
        :aria-label="accessHint"
        @click="openAccessModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 1.75 4 4.9v5.33c0 5.14 3.4 9.93 8 11.52 4.6-1.59 8-6.38 8-11.52V4.9l-8-3.15Zm0 2.15 6 2.36v3.97c0 4.11-2.58 7.97-6 9.55-3.42-1.58-6-5.44-6-9.55V6.26l6-2.36Z"
          />
          <path
            fill="currentColor"
            d="M12 7.5a2.75 2.75 0 0 0-2.75 2.75v.75H8.5a.75.75 0 0 0-.75.75v4.5c0 .41.34.75.75.75h7a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-.75v-.75A2.75 2.75 0 0 0 12 7.5Zm-1.25 3.5v-.75a1.25 1.25 0 1 1 2.5 0V11h-2.5Z"
          />
        </svg>
      </button>
      <button
        v-if="isLoggedIn"
        type="button"
        class="lk-nav-hide-toggle"
        :class="{ 'is-active': hiddenNavIds.length > 0 }"
        :title="navHideHint"
        :aria-label="navHideHint"
        @click="openNavHideModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 5c4.97 0 9.27 3.11 11 7-1.04 2.33-2.92 4.29-5.29 5.52l-1.18-1.18A8.96 8.96 0 0 0 20.76 12 10.94 10.94 0 0 0 12 7c-1.28 0-2.5.22-3.63.61L6.8 6.04C8.42 5.38 10.17 5 12 5Zm-9.19.4 15.8 15.79-1.41 1.41-3.02-3.02A11.8 11.8 0 0 1 12 19c-4.97 0-9.27-3.11-11-7 1.01-2.27 2.81-4.19 5.08-5.43L1.4 6.81 2.81 5.4Zm4.9 4.9A9.02 9.02 0 0 0 3.24 12 10.94 10.94 0 0 0 12 17c.96 0 1.88-.12 2.76-.35l-1.65-1.65a3.5 3.5 0 0 1-4.1-4.1L7.71 10.3Zm4.44-.44a2 2 0 0 1 2 2c0 .23-.04.46-.11.67l-2.56-2.56c.21-.07.44-.11.67-.11Z"
          />
        </svg>
      </button>
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

  <Teleport to="body">
    <div
      v-if="isLoggedIn && showAccessModal"
      class="lk-login-modal-wrap"
      role="dialog"
      aria-modal="true"
      aria-label="控制页面访问"
      @click.self="closeAccessModal"
    >
      <div class="lk-login-entry-card lk-nav-hide-card">
        <button type="button" class="lk-login-close" aria-label="关闭访问控制面板" @click="closeAccessModal">
          ×
        </button>
        <h2 class="lk-login-entry-title">控制页面访问</h2>
        <p class="lk-login-entry-hint">
          点击下面的按钮切换访问状态。被关闭的页面即使出现在导航栏里，点击后也会被拦回 `About Me`。
        </p>
        <div class="lk-nav-hide-grid">
          <button
            v-for="item in accessControlledPageOptions"
            :key="item.id"
            type="button"
            class="lk-nav-hide-option"
            :class="{ 'is-active': blockedAccessIds.includes(item.id) }"
            @click="onAccessOptionClick(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="isLoggedIn && showNavHideModal"
      class="lk-login-modal-wrap"
      role="dialog"
      aria-modal="true"
      aria-label="隐藏导航页面"
      @click.self="closeNavHideModal"
    >
      <div class="lk-login-entry-card lk-nav-hide-card">
        <button type="button" class="lk-login-close" aria-label="关闭隐藏页面面板" @click="closeNavHideModal">
          ×
        </button>
        <h2 class="lk-login-entry-title">隐藏导航页面</h2>
        <p class="lk-login-entry-hint">
          点击下面的按钮切换隐藏状态。这里只隐藏导航栏入口，不影响页面本身是否可访问。
        </p>
        <div class="lk-nav-hide-grid">
          <button
            v-for="item in navbarPageOptions"
            :key="item.id"
            type="button"
            class="lk-nav-hide-option"
            :class="{ 'is-active': hiddenNavIds.includes(item.id) }"
            @click="onNavHideOptionClick(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import {
  accessControlledPageOptions,
  HIDDEN_NAV_ITEMS_EVENT,
  HIDDEN_NAV_ITEMS_PREF_KEY,
  PROTECTED_ACCESS_EVENT,
  PROTECTED_ACCESS_ITEMS_PREF_KEY,
  navbarPageOptions,
  readHiddenNavItems,
  readProtectedAccessItems,
  toggleHiddenNavItem,
  toggleProtectedAccessItem,
} from '../utils/navPrefs.js'

const wrapRef = ref(null)
const anchored = ref(false)
const enabled = ref(true)
const live2dOn = ref(false)
const blockedAccessIds = ref([])
const hiddenNavIds = ref([])
const showAccessModal = ref(false)
const showNavHideModal = ref(false)
const route = useRoute()
const router = useRouter()
const isLoggedIn = useIsLoggedIn()
const live2dBtnRef = ref(null)

function isLive2dHiddenPath(path) {
  const p = String(path || '/').replace(/\/+$/, '') || '/'
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

const showLive2dToggle = computed(
  () => isLoggedIn.value && !isLive2dHiddenPath(route.path),
)

function syncFromStorage() {
  enabled.value = readParticlesPref()
}

function syncLive2dFromStorage() {
  live2dOn.value = readLive2dPref()
}

function syncProtectedAccessFromStorage() {
  blockedAccessIds.value = readProtectedAccessItems()
}

function syncHiddenNavFromStorage() {
  hiddenNavIds.value = readHiddenNavItems()
}

function onStorage(e) {
  if (e.key === PARTICLES_PREF_KEY || e.key === null) syncFromStorage()
  if (e.key === LIVE2D_PREF_KEY || e.key === null) syncLive2dFromStorage()
  if (e.key === PROTECTED_ACCESS_ITEMS_PREF_KEY || e.key === null) syncProtectedAccessFromStorage()
  if (e.key === HIDDEN_NAV_ITEMS_PREF_KEY || e.key === null) syncHiddenNavFromStorage()
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

function openAccessModal() {
  if (!isLoggedIn.value) return
  syncProtectedAccessFromStorage()
  showAccessModal.value = true
}

function closeAccessModal() {
  showAccessModal.value = false
}

async function onAccessOptionClick(id) {
  if (!isLoggedIn.value) return
  toggleProtectedAccessItem(id)
  syncProtectedAccessFromStorage()
  const shouldBlockCurrent = accessControlledPageOptions.some(
    (item) => item.id === id && blockedAccessIds.value.includes(item.id) && item.matches(route.path),
  )
  if (shouldBlockCurrent) {
    try {
      await router.replace('/about')
    } catch {
      /* ignore navigation failure */
    }
  }
}

function openNavHideModal() {
  if (!isLoggedIn.value) return
  syncHiddenNavFromStorage()
  showNavHideModal.value = true
}

function closeNavHideModal() {
  showNavHideModal.value = false
}

function onNavHideOptionClick(id) {
  if (!isLoggedIn.value) return
  toggleHiddenNavItem(id)
  syncHiddenNavFromStorage()
}

const hint = computed(() =>
  enabled.value ? '关闭粒子背景' : '开启粒子背景（About / Projects / Article）',
)

const accessHint = computed(() =>
  blockedAccessIds.value.length ? '管理已限制访问的导航页面' : '选择要限制访问的导航页面',
)

const navHideHint = computed(() =>
  hiddenNavIds.value.length ? '管理已隐藏的导航页面' : '选择要隐藏的导航页面',
)

const live2dHint = computed(() =>
  live2dOn.value ? '隐藏右下角看板娘' : '显示右下角看板娘',
)

let mo = null

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
    return
  }
  const colorWrap = sw.closest('.vp-nav-item')
  if (!colorWrap || colorWrap === el || el.contains(colorWrap)) {
    return
  }
  /* Hope 默认把主题包在 `.hide-in-mobile` 里；搬到顶栏后必须在窄屏可见 */
  colorWrap.classList.remove('hide-in-mobile')
  colorWrap.classList.add('lk-navbar-theme-slot')

  const liveBtn = live2dBtnRef.value
  if (liveBtn && liveBtn.parentNode === group) {
    group.insertBefore(colorWrap, liveBtn)
  } else {
    group.appendChild(colorWrap)
  }
}

function tryAnchor() {
  const el = wrapRef.value
  if (!el) return false

  const end = document.querySelector('#navbar .vp-navbar-end')
  if (!end) return false

  const insertBefore = findFxInsertBefore(end, el)
  if (insertBefore && insertBefore.parentNode === end) {
    if (el.parentNode !== end || el.nextSibling !== insertBefore) {
      end.insertBefore(el, insertBefore)
    }
  } else if (el.parentNode !== end) {
    end.appendChild(el)
  }

  hoistColorModeIntoGroup()
  anchored.value = true
  return true
}

onMounted(async () => {
  syncFromStorage()
  syncLive2dFromStorage()
  syncProtectedAccessFromStorage()
  syncHiddenNavFromStorage()
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
  window.addEventListener(PROTECTED_ACCESS_EVENT, syncProtectedAccessFromStorage)
  window.addEventListener(HIDDEN_NAV_ITEMS_EVENT, syncHiddenNavFromStorage)
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
  window.removeEventListener(PROTECTED_ACCESS_EVENT, syncProtectedAccessFromStorage)
  window.removeEventListener(HIDDEN_NAV_ITEMS_EVENT, syncHiddenNavFromStorage)
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    tryAnchor()
    closeAccessModal()
    closeNavHideModal()
  },
  { flush: 'post' },
)

watch(isLoggedIn, async () => {
  await nextTick()
  tryAnchor()
  if (!isLoggedIn.value) closeAccessModal()
  if (!isLoggedIn.value) closeNavHideModal()
})

watch(showLive2dToggle, async () => {
  await nextTick()
  hoistColorModeIntoGroup()
})
</script>

<style scoped>
.lk-login-modal-wrap {
  position: fixed;
  inset: 0;
  z-index: 99990;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(2, 6, 23, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.lk-login-entry-card {
  position: relative;
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.1rem 1rem 1rem;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.lk-login-close {
  position: absolute;
  right: 0.55rem;
  top: 0.45rem;
  width: 1.4rem;
  height: 1.4rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  color: rgba(226, 232, 240, 0.9);
  background: rgba(51, 65, 85, 0.7);
}

.lk-login-entry-title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.96);
}

.lk-login-entry-hint {
  margin: 0 0 0.85rem;
  font-size: 0.72rem;
  line-height: 1.4;
  color: rgba(148, 163, 184, 0.95);
}

.lk-nav-hide-card {
  width: min(24rem, calc(100vw - 2rem));
}

.lk-nav-hide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.lk-nav-hide-option {
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(100, 116, 139, 0.42);
  background: rgba(15, 23, 42, 0.55);
  color: rgba(226, 232, 240, 0.96);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
}

.lk-nav-hide-option.is-active {
  border-color: rgba(244, 114, 182, 0.88);
  background: rgba(131, 24, 67, 0.38);
  color: rgba(255, 228, 236, 0.98);
}

[data-theme='light'] .lk-nav-hide-option {
  background: rgba(248, 250, 252, 0.96);
  color: rgba(30, 41, 59, 0.95);
}

[data-theme='light'] .lk-login-entry-card {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(100, 116, 139, 0.25);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

[data-theme='light'] .lk-login-entry-title {
  color: rgba(15, 23, 42, 0.92);
}

[data-theme='light'] .lk-login-entry-hint {
  color: rgba(71, 85, 105, 0.95);
}

[data-theme='light'] .lk-nav-hide-option.is-active {
  background: rgba(252, 231, 243, 0.92);
  color: rgba(157, 23, 77, 0.96);
}
</style>
