<template>
  <Teleport to="body">
    <Transition name="lk-scroll-fab-fade">
      <button
        v-show="visible"
        type="button"
        class="lk-scroll-fab"
        aria-label="Back to top"
        @click="scrollToTop"
      >
        <svg
          class="lk-scroll-fab__ring"
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden="true"
        >
          <circle
            class="lk-scroll-fab__track"
            cx="28"
            cy="28"
            :r="RING_R"
            stroke-width="3"
          />
          <circle
            class="lk-scroll-fab__progress"
            cx="28"
            cy="28"
            :r="RING_R"
            stroke-width="3"
            stroke-linecap="round"
            :stroke-dasharray="ringDashArray"
            :stroke-dashoffset="progressOffset"
            transform="rotate(-90 28 28)"
          />
        </svg>
        <span class="lk-scroll-fab__pct" aria-live="polite">{{ percent }}</span>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFrontmatter } from 'vuepress/client'

const THRESHOLD_PX = 100
const RING_R = 20
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

const visible = computed(
  () => (frontmatter.value?.backToTop ?? true) && scrollY.value > THRESHOLD_PX,
)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.lk-scroll-fab {
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
  color: rgba(30, 41, 59, 0.9);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

@media (max-width: 959px) {
  .lk-scroll-fab {
    transform: scale(0.85);
    transform-origin: 100% 100%;
  }
}

.lk-scroll-fab:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.16);
}

:root[data-theme='dark'] .lk-scroll-fab {
  background: rgba(30, 41, 59, 0.92);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  color: rgba(226, 232, 240, 0.94);
}

:root[data-theme='dark'] .lk-scroll-fab:hover {
  background: rgba(51, 65, 85, 0.95);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
}

.lk-scroll-fab__ring {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.lk-scroll-fab__track {
  fill: none;
  stroke: rgba(148, 163, 184, 0.45);
}

.lk-scroll-fab__progress {
  fill: none;
  stroke: #22c55e;
}

:root[data-theme='dark'] .lk-scroll-fab__track {
  stroke: rgba(148, 163, 184, 0.35);
}

:root[data-theme='dark'] .lk-scroll-fab__progress {
  stroke: #4ade80;
}

.lk-scroll-fab__pct {
  grid-area: 1 / 1;
  z-index: 1;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.lk-scroll-fab-fade-enter-active,
.lk-scroll-fab-fade-leave-active {
  transition: opacity 0.2s ease;
}

.lk-scroll-fab-fade-enter-from,
.lk-scroll-fab-fade-leave-to {
  opacity: 0;
}

@media print {
  .lk-scroll-fab {
    display: none !important;
  }
}
</style>
