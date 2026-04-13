<template>
  <div
    v-if="active && !reducedMotion"
    class="lk-network-particles"
    aria-hidden="true"
  >
    <canvas ref="canvasRef" class="lk-network-particles__canvas" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { normPath } from '../utils/authGate.js'

const route = useRoute()
const canvasRef = ref(null)
const reducedMotion = ref(false)

const active = computed(() => {
  const p = normPath(route.path)
  if (p === '/about' || p.startsWith('/about/')) return true
  if (p === '/tech' || p.startsWith('/tech/')) return true
  if (p === '/article' || p.startsWith('/article/')) return true
  return false
})

let raf = 0
let particles = []
let w = 0
let h = 0
let linkDist = 120
let n = 56

function readThemeColors() {
  if (typeof document === 'undefined') {
    return { dot: 'rgba(100,120,180,0.35)', line: 'rgba(100,120,180,0.35)' }
  }
  const dark =
    document.documentElement.getAttribute('data-theme') === 'dark'
  if (dark) {
    return {
      dot: 'rgba(200, 215, 255, 0.35)',
      line: 'rgba(200, 215, 255, 0.45)',
    }
  }
  return {
    dot: 'rgba(40, 60, 110, 0.28)',
    line: 'rgba(40, 60, 110, 0.35)',
  }
}

function randomParticle() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
  }
}

function initParticles() {
  particles = []
  for (let i = 0; i < n; i += 1) particles.push(randomParticle())
}

function resize() {
  const c = canvasRef.value
  if (!c || typeof window === 'undefined') return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = window.innerWidth
  h = window.innerHeight
  linkDist = Math.min(140, Math.max(90, Math.hypot(w, h) / 12))
  n = Math.round(Math.min(90, Math.max(36, (w * h) / 22000)))
  c.width = Math.floor(w * dpr)
  c.height = Math.floor(h * dpr)
  c.style.width = `${w}px`
  c.style.height = `${h}px`
  const ctx = c.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  initParticles()
}

let running = true

function tick() {
  if (typeof window === 'undefined') return
  if (!running || !active.value) return
  const c = canvasRef.value
  const ctx = c?.getContext('2d')
  if (!ctx || !w || !h) {
    raf = requestAnimationFrame(tick)
    return
  }

  const { dot, line } = readThemeColors()
  ctx.clearRect(0, 0, w, h)

  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0 || p.x > w) p.vx *= -1
    if (p.y < 0 || p.y > h) p.vy *= -1
    p.x = Math.max(0, Math.min(w, p.x))
    p.y = Math.max(0, Math.min(h, p.y))
  }

  const ld2 = linkDist * linkDist
  ctx.lineWidth = 0.65
  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i]
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const d2 = dx * dx + dy * dy
      if (d2 < ld2) {
        const t = 1 - d2 / ld2
        ctx.save()
        ctx.globalAlpha = t * 0.22
        ctx.strokeStyle = line
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  ctx.fillStyle = dot
  for (const p of particles) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.35, 0, Math.PI * 2)
    ctx.fill()
  }

  raf = requestAnimationFrame(tick)
}

function onVisibility() {
  running = document.visibilityState !== 'hidden'
  if (running && active.value && !reducedMotion.value) {
    cancelAnimationFrame(raf)
    tick()
  }
}

function checkReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let mq = null
let mqHandler = null

function startLayer() {
  if (typeof window === 'undefined') return
  if (reducedMotion.value || !active.value) return
  requestAnimationFrame(() => resize())
  running = true
  cancelAnimationFrame(raf)
  tick()
}

function stopLayer() {
  running = false
  cancelAnimationFrame(raf)
}

onMounted(() => {
  reducedMotion.value = checkReducedMotion()
  if (reducedMotion.value) return

  window.addEventListener('resize', resize, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mqHandler = () => {
    reducedMotion.value = mq.matches
    if (reducedMotion.value) stopLayer()
    else startLayer()
  }
  if (mq.addEventListener) mq.addEventListener('change', mqHandler)
  else mq.addListener(mqHandler)

  if (active.value) startLayer()
})

onUnmounted(() => {
  stopLayer()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resize)
    document.removeEventListener('visibilitychange', onVisibility)
    if (mq && mqHandler) {
      if (mq.removeEventListener) mq.removeEventListener('change', mqHandler)
      else mq.removeListener(mqHandler)
    }
  }
})

watch(active, (on) => {
  if (typeof window === 'undefined') return
  if (reducedMotion.value) return
  if (on) startLayer()
  else stopLayer()
})
</script>

<style scoped>
.lk-network-particles {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.lk-network-particles__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
