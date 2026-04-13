<template>
  <div
    v-show="anchored"
    ref="wrapRef"
    class="vp-nav-item hide-in-mobile lk-particles-nav-item"
  >
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
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="6" cy="10" r="1.35" fill="currentColor" stroke="none" />
        <circle cx="14" cy="7" r="1.35" fill="currentColor" stroke="none" />
        <circle cx="17" cy="15" r="1.35" fill="currentColor" stroke="none" />
        <circle cx="9" cy="16" r="1.35" fill="currentColor" stroke="none" />
        <path d="M7.2 10.3 13.2 7.4M14.6 8.1 16.2 14M15.4 15.5 9.8 15.8M8.4 15.2 6.5 10.8" />
      </svg>
    </button>
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

const wrapRef = ref(null)
const anchored = ref(false)
const enabled = ref(true)
const route = useRoute()

function syncFromStorage() {
  enabled.value = readParticlesPref()
}

function onStorage(e) {
  if (e.key === PARTICLES_PREF_KEY || e.key === null) syncFromStorage()
}

function onClick() {
  writeParticlesPref(!enabled.value)
  enabled.value = readParticlesPref()
}

const hint = computed(() =>
  enabled.value ? '关闭粒子背景' : '开启粒子背景（About / Projects / Article）',
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
  await nextTick()
  if (!tryAnchor()) {
    mo = new MutationObserver(() => {
      tryAnchor()
    })
    mo.observe(document.body, { childList: true, subtree: true })
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(PARTICLES_PREF_EVENT, syncFromStorage)
})

onUnmounted(() => {
  mo?.disconnect()
  mo = null
  window.removeEventListener('storage', onStorage)
  window.removeEventListener(PARTICLES_PREF_EVENT, syncFromStorage)
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
