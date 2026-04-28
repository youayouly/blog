<script setup>
/**
 * 路由切换帘幕动画：
 *   1) closing：左右两片白幕从屏外拉到中央合上（约 260ms）
 *   2) mid：合幕停留 140ms，中央粒子网球旋转 + 「加载中…」
 *   3) opening：双幕分别拉回屏外（约 260ms）
 *   4) idle：透传所有交互
 *
 * 仅在 path 变化时触发；hash-only 切换、首次冷启动跳过；
 * 同一时段重复触发会以最新一次为准（token 兜底，老 timer 不会污染状态）。
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { readRouteCurtainPref } from '../utils/routeCurtainPref.js'

const stage = ref('idle')
let token = 0
let timers = []
let unhook = null

function clearTimers() {
  for (const t of timers) clearTimeout(t)
  timers = []
}

function playCurtain() {
  if (!readRouteCurtainPref()) return
  token += 1
  const my = token
  clearTimers()
  stage.value = 'closing'
  timers.push(
    setTimeout(() => {
      if (token !== my) return
      stage.value = 'mid'
      timers.push(
        setTimeout(() => {
          if (token !== my) return
          stage.value = 'opening'
          timers.push(
            setTimeout(() => {
              if (token !== my) return
              stage.value = 'idle'
            }, 260),
          )
        }, 140),
      )
    }, 260),
  )
}

onMounted(() => {
  const router = useRouter()
  unhook = router.beforeEach((to, from) => {
    if (!from || from.path === to.path) return true
    playCurtain()
    return true
  })
})

onUnmounted(() => {
  clearTimers()
  if (unhook) unhook()
  unhook = null
})
</script>

<template>
  <div
    class="lk-curtain"
    :data-stage="stage"
    :aria-hidden="stage === 'idle' ? 'true' : 'false'"
    role="status"
  >
    <div class="lk-curtain__panel lk-curtain__panel--left" />
    <div class="lk-curtain__panel lk-curtain__panel--right" />
    <div class="lk-curtain__core" aria-hidden="true">
      <svg
        class="lk-curtain__net"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g class="lk-curtain__net-rot">
          <!-- 12 条边：8 条相邻环边 + 4 条贯穿中心的直径 -->
          <g class="lk-curtain__net-edges">
            <line x1="82" y1="50" x2="72.63" y2="27.37" />
            <line x1="72.63" y1="27.37" x2="50" y2="18" />
            <line x1="50" y1="18" x2="27.37" y2="27.37" />
            <line x1="27.37" y1="27.37" x2="18" y2="50" />
            <line x1="18" y1="50" x2="27.37" y2="72.63" />
            <line x1="27.37" y1="72.63" x2="50" y2="82" />
            <line x1="50" y1="82" x2="72.63" y2="72.63" />
            <line x1="72.63" y1="72.63" x2="82" y2="50" />
            <line x1="82" y1="50" x2="18" y2="50" />
            <line x1="72.63" y1="27.37" x2="27.37" y2="72.63" />
            <line x1="50" y1="18" x2="50" y2="82" />
            <line x1="27.37" y1="27.37" x2="72.63" y2="72.63" />
          </g>
          <!-- 8 个外圈节点 -->
          <g class="lk-curtain__net-nodes">
            <circle cx="82" cy="50" r="3.4" />
            <circle cx="72.63" cy="27.37" r="3.4" />
            <circle cx="50" cy="18" r="3.4" />
            <circle cx="27.37" cy="27.37" r="3.4" />
            <circle cx="18" cy="50" r="3.4" />
            <circle cx="27.37" cy="72.63" r="3.4" />
            <circle cx="50" cy="82" r="3.4" />
            <circle cx="72.63" cy="72.63" r="3.4" />
          </g>
          <!-- 中心节点 -->
          <circle class="lk-curtain__net-core" cx="50" cy="50" r="4.6" />
        </g>
      </svg>
      <p class="lk-curtain__hint">加载中…</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lk-curtain {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.lk-curtain[data-stage='closing'],
.lk-curtain[data-stage='mid'] {
  pointer-events: auto;
}

.lk-curtain__panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 0.26s cubic-bezier(0.42, 0, 0.2, 1);
  will-change: transform;
}

.lk-curtain__panel--left {
  left: 0;
  transform: translateX(-101%);
}

.lk-curtain__panel--right {
  right: 0;
  transform: translateX(101%);
}

.lk-curtain[data-stage='closing'] .lk-curtain__panel--left,
.lk-curtain[data-stage='mid'] .lk-curtain__panel--left {
  transform: translateX(0);
}

.lk-curtain[data-stage='closing'] .lk-curtain__panel--right,
.lk-curtain[data-stage='mid'] .lk-curtain__panel--right {
  transform: translateX(0);
}

[data-theme='dark'] .lk-curtain__panel {
  background: rgba(15, 23, 42, 0.96);
}

.lk-curtain__core {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}

.lk-curtain[data-stage='closing'] .lk-curtain__core {
  opacity: 0.4;
}

.lk-curtain[data-stage='mid'] .lk-curtain__core {
  opacity: 1;
}

.lk-curtain__net {
  width: clamp(76px, 9vw, 108px);
  height: clamp(76px, 9vw, 108px);
  filter: drop-shadow(0 8px 22px rgba(91, 33, 182, 0.28));
  overflow: visible;
}

[data-theme='dark'] .lk-curtain__net {
  filter: drop-shadow(0 10px 24px rgba(196, 181, 253, 0.35));
}

.lk-curtain__net-rot {
  transform-box: fill-box;
  transform-origin: center;
  animation: lk-curtain-net-rot 2.6s linear infinite;
}

.lk-curtain__net-edges line {
  stroke: rgba(124, 58, 237, 0.55);
  stroke-width: 1.1;
  stroke-linecap: round;
  fill: none;
}

[data-theme='dark'] .lk-curtain__net-edges line {
  stroke: rgba(196, 181, 253, 0.62);
}

.lk-curtain__net-nodes circle {
  fill: #7c3aed;
  animation: lk-curtain-net-pulse 1.45s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.lk-curtain__net-nodes circle:nth-child(1) { animation-delay: 0.00s; }
.lk-curtain__net-nodes circle:nth-child(2) { animation-delay: 0.18s; }
.lk-curtain__net-nodes circle:nth-child(3) { animation-delay: 0.36s; }
.lk-curtain__net-nodes circle:nth-child(4) { animation-delay: 0.54s; }
.lk-curtain__net-nodes circle:nth-child(5) { animation-delay: 0.72s; }
.lk-curtain__net-nodes circle:nth-child(6) { animation-delay: 0.90s; }
.lk-curtain__net-nodes circle:nth-child(7) { animation-delay: 1.08s; }
.lk-curtain__net-nodes circle:nth-child(8) { animation-delay: 1.26s; }

[data-theme='dark'] .lk-curtain__net-nodes circle {
  fill: #c4b5fd;
}

.lk-curtain__net-core {
  fill: #6d28d9;
  animation: lk-curtain-net-core 1.4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

[data-theme='dark'] .lk-curtain__net-core {
  fill: #e9d5ff;
}

.lk-curtain__hint {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #5b21b6;
}

[data-theme='dark'] .lk-curtain__hint {
  color: #c4b5fd;
}

@keyframes lk-curtain-net-rot {
  to {
    transform: rotate(360deg);
  }
}

@keyframes lk-curtain-net-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes lk-curtain-net-core {
  0%, 100% {
    transform: scale(0.92);
  }
  50% {
    transform: scale(1.18);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lk-curtain__panel {
    transition-duration: 0.16s;
  }
  .lk-curtain__net-rot,
  .lk-curtain__net-nodes circle,
  .lk-curtain__net-core {
    animation: none;
  }
}
</style>
