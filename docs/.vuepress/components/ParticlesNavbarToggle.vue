<template>
  <div
    v-show="anchored"
    ref="wrapRef"
    class="vp-nav-item hide-in-mobile lk-particles-nav-item"
  >
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

const showLive2dToggle = computed(() => !isLive2dHiddenPath(route.path))

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

function tryAnchor() {
  const el = wrapRef.value
  if (!el) return false
  const end = document.querySelector('#navbar .vp-navbar-end')
  if (!end) return false
  if (el.parentNode !== end) {
    const colorBtn = end.querySelector('#color-mode-switch')
    const colorWrap = colorBtn?.closest('.vp-nav-item') ?? null
    end.insertBefore(el, colorWrap)
  }
  anchored.value = true
  if (mo) {
    mo.disconnect()
    mo = null
  }
  return true
}

onMounted(async () => {
  syncFromStorage()
  syncLive2dFromStorage()
  await nextTick()
  if (!tryAnchor()) {
    mo = new MutationObserver(() => {
      tryAnchor()
    })
    mo.observe(document.body, { childList: true, subtree: true })
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(PARTICLES_PREF_EVENT, syncFromStorage)
  window.addEventListener(LIVE2D_PREF_EVENT, syncLive2dFromStorage)
})

onUnmounted(() => {
  mo?.disconnect()
  mo = null
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
</script>
