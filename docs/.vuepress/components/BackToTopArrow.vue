<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="lk-back-to-top-fade">
        <button
          v-show="visible"
          type="button"
          class="lk-back-to-top-arrow"
          :aria-label="`Back to top, ${percent}% scrolled`"
          @click="scrollToTop"
        >
          <!-- 外圈：周长按阅读进度增长 -->
          <svg
            class="lk-back-to-top-arrow__ring"
            viewBox="0 0 56 56"
            fill="none"
            aria-hidden="true"
          >
            <circle
              class="lk-back-to-top-arrow__track"
              cx="28"
              cy="28"
              :r="RING_R"
              stroke-width="2.5"
            />
            <circle
              class="lk-back-to-top-arrow__progress"
              cx="28"
              cy="28"
              :r="RING_R"
              stroke-width="2.5"
              stroke-linecap="round"
              :stroke-dasharray="ringDashArray"
              :stroke-dashoffset="progressOffset"
              transform="rotate(-90 28 28)"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.25"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lk-back-to-top-arrow__icon"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ClientOnly, useFrontmatter } from 'vuepress/client'

const RING_R = 21
const RING_C = 2 * Math.PI * RING_R

const frontmatter = useFrontmatter()
const route = useRoute()
const scrollY = ref(0)

function tick() {
  scrollY.value = window.scrollY
}

onMounted(() => {
  tick()
  window.addEventListener('scroll', tick, { passive: true })
  window.addEventListener('resize', tick, { passive: true })
})

watch(
  () => route.path,
  () => {
    requestAnimationFrame(tick)
  },
)

onUnmounted(() => {
  window.removeEventListener('scroll', tick)
  window.removeEventListener('resize', tick)
})

const maxScroll = computed(() => {
  if (typeof document === 'undefined') return 0
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
})

const percent = computed(() => {
  const max = maxScroll.value
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((scrollY.value / max) * 100)))
})

const ringDashArray = `${RING_C}`

const progressOffset = computed(() => {
  const t = percent.value / 100
  return RING_C * (1 - t)
})

/** 各页面默认显示；仅 frontmatter `backToTop: false` 时隐藏 */
const visible = computed(() => frontmatter.value?.backToTop !== false)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.lk-back-to-top-arrow {
  position: fixed;
  inset-inline-end: 1rem;
  bottom: 4rem;
  z-index: 100;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  background: rgba(255, 252, 248, 0.94);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
  color: rgba(30, 41, 59, 0.88);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

@media (max-width: 959px) {
  .lk-back-to-top-arrow {
    transform: scale(0.85);
    transform-origin: 100% 100%;
  }
}

.lk-back-to-top-arrow:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.16);
  color: rgba(15, 23, 42, 0.95);
}

:root[data-theme='dark'] .lk-back-to-top-arrow {
  background: rgba(30, 41, 59, 0.92);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  color: rgba(241, 245, 249, 0.92);
}

:root[data-theme='dark'] .lk-back-to-top-arrow:hover {
  background: rgba(51, 65, 85, 0.95);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  color: #fff;
}

.lk-back-to-top-arrow__ring {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.lk-back-to-top-arrow__track {
  fill: none;
  stroke: rgba(15, 23, 42, 0.12);
}

.lk-back-to-top-arrow__progress {
  fill: none;
  stroke: #22c55e;
  transition: stroke-dashoffset 0.12s ease-out;
}

:root[data-theme='dark'] .lk-back-to-top-arrow__track {
  stroke: rgba(248, 250, 252, 0.14);
}

:root[data-theme='dark'] .lk-back-to-top-arrow__progress {
  stroke: #4ade80;
}

.lk-back-to-top-arrow__icon {
  grid-area: 1 / 1;
  width: 1.15rem;
  height: 1.15rem;
  z-index: 1;
  display: block;
  pointer-events: none;
}

.lk-back-to-top-fade-enter-active,
.lk-back-to-top-fade-leave-active {
  transition: opacity 0.2s ease;
}

.lk-back-to-top-fade-enter-from,
.lk-back-to-top-fade-leave-to {
  opacity: 0;
}

@media print {
  .lk-back-to-top-arrow {
    display: none !important;
  }
}
</style>
