<template>
  <div class="lk-shapes" aria-hidden="true">
    <div
      v-for="s in shapes"
      :key="s.id"
      class="lk-shape"
      :class="[`lk-shape--${s.type}`, s.depthClass, s.motionClass].filter(Boolean)"
      :style="s.style"
    />
  </div>
</template>

<script setup>
/**
 * 首页 Hero 左侧/底部装饰：浅蓝圆环、小三角、淡紫多边形 — 散布 + 轻微景深（blur/opacity）
 * 仅占据读区一侧，不抢右侧人物。
 */
const shapes = [
  {
    id: 'r-far',
    type: 'ring',
    depthClass: 'lk-shape--depth-far',
    motionClass: 'lk-shape--motion-a',
    style: {
      width: '152px',
      height: '152px',
      top: '4%',
      left: '-3%',
      border: '3px solid rgba(165, 180, 252, 0.42)',
      opacity: 0.22,
      filter: 'blur(2px)',
      animationDelay: '0s',
      animationDuration: '14s',
    },
  },
  {
    id: 'r-mid',
    type: 'ring',
    depthClass: 'lk-shape--depth-mid',
    motionClass: 'lk-shape--motion-b',
    style: {
      width: '96px',
      height: '96px',
      top: '11%',
      left: '7%',
      border: '2px solid rgba(147, 197, 253, 0.55)',
      opacity: 0.34,
      filter: 'blur(0.6px)',
      animationDelay: '1.2s',
      animationDuration: '11s',
    },
  },
  {
    id: 'r-near',
    type: 'ring',
    depthClass: 'lk-shape--depth-near',
    motionClass: 'lk-shape--motion-a',
    style: {
      width: '58px',
      height: '58px',
      top: '22%',
      left: '1%',
      border: '2px solid rgba(199, 210, 254, 0.65)',
      opacity: 0.4,
      animationDelay: '0.4s',
      animationDuration: '9s',
    },
  },
  {
    id: 'tri',
    type: 'triangle',
    depthClass: 'lk-shape--depth-near',
    motionClass: 'lk-shape--motion-c',
    style: {
      width: '36px',
      height: '32px',
      top: '62%',
      left: '4%',
      opacity: 0.45,
      filter: 'blur(0.3px)',
      animationDelay: '2s',
      animationDuration: '10s',
    },
  },
  {
    id: 'tri-sm',
    type: 'triangle',
    depthClass: 'lk-shape--depth-far',
    motionClass: 'lk-shape--motion-b',
    style: {
      width: '22px',
      height: '20px',
      top: '48%',
      left: '11%',
      opacity: 0.28,
      filter: 'blur(1px)',
      animationDelay: '1.8s',
      animationDuration: '12s',
    },
  },
  {
    id: 'poly',
    type: 'polygon',
    depthClass: 'lk-shape--depth-far',
    motionClass: '',
    style: {
      width: '200px',
      height: '160px',
      bottom: '-12%',
      left: '-10%',
      opacity: 0.26,
      filter: 'blur(3px)',
      transform: 'rotate(-11deg)',
      animationDelay: '0.6s',
      animationDuration: '16s',
    },
  },
  {
    id: 'poly-mid',
    type: 'polygon',
    depthClass: 'lk-shape--depth-mid',
    motionClass: '',
    style: {
      width: '120px',
      height: '100px',
      bottom: '2%',
      left: '2%',
      opacity: 0.32,
      filter: 'blur(1.2px)',
      transform: 'rotate(8deg)',
      animationDelay: '2.4s',
      animationDuration: '13s',
    },
  },
  {
    id: 'dot-a',
    type: 'bokeh',
    depthClass: 'lk-shape--depth-far',
    motionClass: 'lk-shape--motion-b',
    style: {
      width: '10px',
      height: '10px',
      top: '34%',
      left: '14%',
      opacity: 0.35,
      filter: 'blur(1.5px)',
      animationDelay: '3s',
      animationDuration: '8s',
    },
  },
  {
    id: 'dot-b',
    type: 'bokeh',
    depthClass: 'lk-shape--depth-mid',
    motionClass: 'lk-shape--motion-a',
    style: {
      width: '6px',
      height: '6px',
      top: '76%',
      left: '12%',
      opacity: 0.4,
      animationDelay: '0.2s',
      animationDuration: '7s',
    },
  },
]
</script>

<style scoped>
.lk-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  contain: layout style paint;
  display: none;
  overflow: hidden;
}

@media (min-width: 768px) {
  .lk-shapes {
    display: block;
  }
}

.lk-shape {
  position: absolute;
  border-radius: 50%;
  box-sizing: border-box;
  will-change: transform, opacity, filter;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.lk-shape--ring {
  background: transparent;
}

.lk-shape--triangle {
  border-radius: 0;
  background: linear-gradient(165deg, rgba(59, 130, 246, 0.55), rgba(96, 165, 250, 0.4));
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.lk-shape--polygon {
  border-radius: 0;
  background: linear-gradient(
    145deg,
    rgba(196, 181, 253, 0.55) 0%,
    rgba(165, 180, 252, 0.38) 45%,
    rgba(199, 210, 254, 0.28) 100%
  );
  clip-path: polygon(8% 18%, 92% 0%, 100% 78%, 42% 100%, 0% 62%);
}

.lk-shape--bokeh {
  background: radial-gradient(
    circle,
    rgba(147, 197, 253, 0.85) 0%,
    rgba(147, 197, 253, 0.2) 55%,
    transparent 70%
  );
}

.lk-shape--depth-far {
  z-index: 0;
}

.lk-shape--depth-mid {
  z-index: 1;
}

.lk-shape--depth-near {
  z-index: 2;
}

.lk-shape--motion-a {
  animation-name: lk-drift-a;
}

.lk-shape--motion-b {
  animation-name: lk-drift-b;
}

.lk-shape--motion-c {
  animation-name: lk-drift-c;
}

@keyframes lk-drift-a {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }

  33% {
    transform: translate3d(4px, -10px, 0) rotate(4deg);
  }

  66% {
    transform: translate3d(-3px, 8px, 0) rotate(-3deg);
  }
}

@keyframes lk-drift-b {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }

  40% {
    transform: translate3d(-6px, 12px, 0) rotate(-5deg);
  }

  70% {
    transform: translate3d(5px, -8px, 0) rotate(4deg);
  }
}

@keyframes lk-drift-c {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }

  50% {
    transform: translate3d(3px, 14px, 0) rotate(6deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lk-shape {
    animation: none !important;
  }
}
</style>
