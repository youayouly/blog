<template>
  <button
    v-show="anchored"
    ref="btnRef"
    type="button"
    class="lk-settings-btn"
    :class="{ 'is-open': open }"
    :aria-label="open ? '关闭设置' : '打开站点设置'"
    :aria-expanded="open ? 'true' : 'false'"
    @click.stop="toggleOpen"
  >
    <svg
      class="lk-settings-btn__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      />
      <path
        fill="currentColor"
        d="m19.43 12.98.04-.36a7.4 7.4 0 0 0 0-1.24l-.04-.36 1.97-1.5a.5.5 0 0 0 .12-.65l-1.86-3.22a.5.5 0 0 0-.6-.22l-2.32.94a7.13 7.13 0 0 0-2.15-1.24l-.36-2.45a.5.5 0 0 0-.5-.43h-3.72a.5.5 0 0 0-.5.43l-.36 2.45a7.13 7.13 0 0 0-2.15 1.24l-2.32-.94a.5.5 0 0 0-.6.22L2.46 8.87a.5.5 0 0 0 .12.65l1.97 1.5-.04.36a7.4 7.4 0 0 0 0 1.24l.04.36-1.97 1.5a.5.5 0 0 0-.12.65l1.86 3.22a.5.5 0 0 0 .6.22l2.32-.94a7.13 7.13 0 0 0 2.15 1.24l.36 2.45a.5.5 0 0 0 .5.43h3.72a.5.5 0 0 0 .5-.43l.36-2.45a7.13 7.13 0 0 0 2.15-1.24l2.32.94a.5.5 0 0 0 .6-.22l1.86-3.22a.5.5 0 0 0-.12-.65l-1.97-1.5ZM12 17.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11Z"
      />
    </svg>
  </button>

  <ClientOnly>
    <Teleport to="body">
      <Transition name="lk-settings-pop-fade">
        <div
          v-if="open"
          ref="popRef"
          class="lk-settings-pop"
          :style="popStyle"
          role="dialog"
          aria-label="站点设置"
          @click.stop
        >
            <div class="lk-settings-pop__title">站点设置</div>

            <button
              type="button"
              class="lk-settings-row"
              role="switch"
              :aria-checked="particlesOn ? 'true' : 'false'"
              @click="toggleParticles"
            >
              <span class="lk-settings-row__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2.2 15.05 8.38 21.9 9.37 16.92 14.22 18.08 22 12 18.18 5.92 22 7.08 14.22 2.1 9.37 8.95 8.38Z"
                  />
                </svg>
              </span>
              <span class="lk-settings-row__label">背景粒子特效</span>
              <span class="lk-settings-switch" :class="{ 'is-on': particlesOn }">
                <span class="lk-settings-switch__dot" />
              </span>
            </button>

            <button
              type="button"
              class="lk-settings-row"
              role="switch"
              :aria-checked="curtainOn ? 'true' : 'false'"
              @click="toggleCurtain"
            >
              <span class="lk-settings-row__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <g
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                  >
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <circle cx="4.5" cy="6" r="1.4" fill="currentColor" />
                    <circle cx="19.5" cy="6" r="1.4" fill="currentColor" />
                    <circle cx="4.5" cy="18" r="1.4" fill="currentColor" />
                    <circle cx="19.5" cy="18" r="1.4" fill="currentColor" />
                    <line x1="4.5" y1="6" x2="12" y2="12" />
                    <line x1="19.5" y1="6" x2="12" y2="12" />
                    <line x1="4.5" y1="18" x2="12" y2="12" />
                    <line x1="19.5" y1="18" x2="12" y2="12" />
                  </g>
                </svg>
              </span>
              <span class="lk-settings-row__label">页面切换动画</span>
              <span class="lk-settings-switch" :class="{ 'is-on': curtainOn }">
                <span class="lk-settings-switch__dot" />
              </span>
            </button>

            <div class="lk-settings-divider" />

            <button
              type="button"
              class="lk-settings-action"
              @click="onScrollTop"
            >
              <span class="lk-settings-row__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </span>
              <span class="lk-settings-row__label">回到顶部</span>
            </button>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ClientOnly } from 'vuepress/client'
import {
  PARTICLES_PREF_EVENT,
  PARTICLES_PREF_KEY,
  readParticlesPref,
  writeParticlesPref,
} from '../utils/particlesPref.js'
import {
  ROUTE_CURTAIN_PREF_EVENT,
  ROUTE_CURTAIN_PREF_KEY,
  readRouteCurtainPref,
  writeRouteCurtainPref,
} from '../utils/routeCurtainPref.js'

const route = useRoute()
const btnRef = ref(null)
const popRef = ref(null)
const anchored = ref(false)
const open = ref(false)
const particlesOn = ref(false)
const curtainOn = ref(true)
const popPos = ref({ top: 0, right: 0 })

function syncParticles() {
  particlesOn.value = readParticlesPref()
}

function syncCurtain() {
  curtainOn.value = readRouteCurtainPref()
}

function onStorage(e) {
  if (e.key === PARTICLES_PREF_KEY || e.key === null) syncParticles()
  if (e.key === ROUTE_CURTAIN_PREF_KEY || e.key === null) syncCurtain()
}

function computePopPos() {
  const btn = btnRef.value
  if (!btn) return
  const r = btn.getBoundingClientRect()
  popPos.value = {
    top: r.bottom + 8,
    right: Math.max(8, window.innerWidth - r.right),
  }
}

const popStyle = computed(() => ({
  top: `${popPos.value.top}px`,
  right: `${popPos.value.right}px`,
}))

function toggleOpen() {
  if (!open.value) computePopPos()
  open.value = !open.value
}

function toggleParticles() {
  writeParticlesPref(!particlesOn.value)
  syncParticles()
}

function toggleCurtain() {
  writeRouteCurtainPref(!curtainOn.value)
  syncCurtain()
}

function onScrollTop() {
  open.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onDocClick(e) {
  if (!open.value) return
  const target = e.target
  if (!(target instanceof HTMLElement)) return
  if (popRef.value && popRef.value.contains(target)) return
  if (target.closest('.lk-settings-btn')) return
  open.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape' && open.value) open.value = false
}

function onWindowChange() {
  if (open.value) computePopPos()
}

let mo = null

/**
 * 锚定策略：优先把齿轮按钮放进 ParticlesNavbarToggle 的 `.lk-navbar-fx-group` 内、
 * 紧挨在 color-mode 切换器（太阳/月亮）左边；group 还没建好或 color-mode 还没 hoist
 * 进 group 时，先挂在 navbar-end 末尾，等 MutationObserver 触发后再修正位置。
 */
function tryAnchor() {
  const el = btnRef.value
  if (!el) return false

  const group = document.querySelector('#navbar .lk-navbar-fx-group')
  const sw = document.getElementById('color-mode-switch')
  const colorWrap = sw ? sw.closest('.vp-nav-item') : null

  if (group && colorWrap && colorWrap.parentNode === group) {
    if (el.parentNode !== group || el.nextSibling !== colorWrap) {
      group.insertBefore(el, colorWrap)
    }
    anchored.value = true
    return true
  }

  // 兜底：group / color-mode 还没就位，先挂在 navbar-end 末尾，避免按钮永远不可见
  const end = document.querySelector('#navbar .vp-navbar-end')
  if (end && el.parentNode !== end) {
    end.appendChild(el)
    anchored.value = true
  }
  return false
}

onMounted(async () => {
  syncParticles()
  syncCurtain()
  await nextTick()
  tryAnchor()
  mo = new MutationObserver(() => {
    tryAnchor()
  })
  mo.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, { passive: true })
  window.addEventListener('storage', onStorage)
  window.addEventListener(PARTICLES_PREF_EVENT, syncParticles)
  window.addEventListener(ROUTE_CURTAIN_PREF_EVENT, syncCurtain)
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  mo?.disconnect()
  mo = null
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange)
  window.removeEventListener('storage', onStorage)
  window.removeEventListener(PARTICLES_PREF_EVENT, syncParticles)
  window.removeEventListener(ROUTE_CURTAIN_PREF_EVENT, syncCurtain)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})

watch(
  () => route.fullPath,
  async () => {
    open.value = false
    await nextTick()
    tryAnchor()
  },
  { flush: 'post' },
)
</script>

<style scoped>
.lk-settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text, rgba(30, 41, 59, 0.86));
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.lk-settings-btn:hover {
  background: rgba(124, 58, 237, 0.12);
  color: rgba(91, 33, 182, 0.96);
}

:root[data-theme='dark'] .lk-settings-btn {
  color: rgba(226, 232, 240, 0.94);
}

:root[data-theme='dark'] .lk-settings-btn:hover {
  background: rgba(196, 181, 253, 0.18);
  color: #f5f3ff;
}

.lk-settings-btn.is-open {
  color: rgba(91, 33, 182, 0.96);
  background: rgba(124, 58, 237, 0.16);
}

:root[data-theme='dark'] .lk-settings-btn.is-open {
  color: #f5f3ff;
  background: rgba(196, 181, 253, 0.22);
}

/* 齿轮一直缓慢转动；hover/打开时加速 */
.lk-settings-btn__icon {
  width: 1.18rem;
  height: 1.18rem;
  display: block;
  pointer-events: none;
  animation: lk-settings-spin 8s linear infinite;
  transform-origin: 50% 50%;
}

.lk-settings-btn:hover .lk-settings-btn__icon,
.lk-settings-btn.is-open .lk-settings-btn__icon {
  animation-duration: 1.8s;
}

@keyframes lk-settings-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lk-settings-btn__icon {
    animation: none;
  }
}
</style>

<style>
/* 浮层走 Teleport，因此用全局样式 */
.lk-settings-pop {
  position: fixed;
  width: 13.6rem;
  padding: 0.55rem;
  border-radius: 14px;
  background: rgba(255, 252, 248, 0.97);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  z-index: 9000;
}

:root[data-theme='dark'] .lk-settings-pop {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(148, 163, 184, 0.24);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.42);
}

.lk-settings-pop__title {
  padding: 0.18rem 0.45rem 0.32rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(71, 85, 105, 0.82);
}

:root[data-theme='dark'] .lk-settings-pop__title {
  color: rgba(203, 213, 225, 0.78);
}

.lk-settings-pop .lk-settings-row,
.lk-settings-pop .lk-settings-action {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.55rem;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(30, 41, 59, 0.9);
  cursor: pointer;
  text-align: left;
  font-size: 0.83rem;
  transition: background 0.16s ease;
}

.lk-settings-pop .lk-settings-row:hover,
.lk-settings-pop .lk-settings-action:hover {
  background: rgba(124, 58, 237, 0.08);
}

:root[data-theme='dark'] .lk-settings-pop .lk-settings-row,
:root[data-theme='dark'] .lk-settings-pop .lk-settings-action {
  color: rgba(226, 232, 240, 0.94);
}

:root[data-theme='dark'] .lk-settings-pop .lk-settings-row:hover,
:root[data-theme='dark'] .lk-settings-pop .lk-settings-action:hover {
  background: rgba(196, 181, 253, 0.12);
}

.lk-settings-pop .lk-settings-row__icon {
  width: 1.05rem;
  height: 1.05rem;
  display: grid;
  place-items: center;
  color: rgba(124, 58, 237, 0.85);
}

.lk-settings-pop .lk-settings-row__icon svg {
  width: 100%;
  height: 100%;
}

:root[data-theme='dark'] .lk-settings-pop .lk-settings-row__icon {
  color: rgba(196, 181, 253, 0.92);
}

.lk-settings-pop .lk-settings-row__label {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.lk-settings-pop .lk-settings-switch {
  width: 2.1rem;
  height: 1.15rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.42);
  position: relative;
  transition: background 0.2s ease;
  flex: 0 0 auto;
}

.lk-settings-pop .lk-settings-switch__dot {
  position: absolute;
  top: 50%;
  left: 0.15rem;
  width: 0.85rem;
  height: 0.85rem;
  margin-top: -0.425rem;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  transition: transform 0.22s ease;
}

.lk-settings-pop .lk-settings-switch.is-on {
  background: linear-gradient(120deg, #7c3aed, #ec4899);
}

.lk-settings-pop .lk-settings-switch.is-on .lk-settings-switch__dot {
  transform: translateX(0.95rem);
}

.lk-settings-pop .lk-settings-divider {
  height: 1px;
  margin: 0.18rem 0.4rem;
  background: rgba(148, 163, 184, 0.28);
}

:root[data-theme='dark'] .lk-settings-pop .lk-settings-divider {
  background: rgba(148, 163, 184, 0.22);
}

.lk-settings-pop-fade-enter-active,
.lk-settings-pop-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: 100% 0%;
}

.lk-settings-pop-fade-enter-from,
.lk-settings-pop-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.45rem) scale(0.94);
}
</style>
