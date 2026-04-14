<template>
  <section class="lk-proj-cards" aria-label="Projects list cards">
    <div class="lk-proj-cards__grid">
      <RouterLink
        v-for="(item, idx) in items"
        :key="item.title"
        :to="item.to"
        class="lk-proj-card"
        :style="cardSurfaceStyle(item, idx)"
        :aria-label="item.title"
      >
        <div class="lk-proj-card__scrim" aria-hidden="true" />
        <div class="lk-proj-card__body">
          <header class="lk-proj-card__top">
            <h3 class="lk-proj-card__title">{{ item.title }}</h3>
          </header>
          <p class="lk-proj-card__desc">{{ item.summary }}</p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function cardSurfaceStyle(item, idx) {
  const seed = hashString(`${item.title}\0${item.to}`)
  const rnd = mulberry32(seed)
  const row = Math.floor(idx / 3)
  const col = idx % 3
  const tintAlpha = 0.14 + rnd() * 0.1
  return {
    '--proj-cell-col': String(col),
    '--proj-cell-row': String(row),
    '--proj-tint': `rgba(6, 18, 38, ${tintAlpha.toFixed(3)})`,
  }
}

const items = [
  {
    title: 'Personal Blog',
    to: '/tech/my-blog.html',
    summary: 'VuePress 2 + theme customization and deployment.',
  },
  {
    title: 'Xinke ICT Competition',
    to: '/tech/xinke-sai.html',
    summary: '5G / embedded contest projects and engineering practice.',
  },
  {
    title: 'National Intelligent Car Competition',
    to: '/tech/smartcar-nationwide.html',
    summary: 'Autonomous model car design, control, and racing strategy.',
  },
  {
    title: 'LLM RAG Assistant',
    to: '/tech/ai-llm-rag.html',
    summary: 'Grounded Q&A with retrieval, embedding, and chunking.',
  },
  {
    title: 'Edge AI Inference',
    to: '/tech/ai-edge-inference.html',
    summary: 'On-device model runtime, quantization, and latency tuning.',
  },
  {
    title: 'Vision ML Pipeline',
    to: '/tech/ai-vision-pipeline.html',
    summary: 'Dataset labeling, training, evaluation, and export flow.',
  },
  {
    title: 'Embedded Sensor Hub',
    to: '/tech/xinke-sai.html',
    summary: 'Multi-sensor data collection, filtering, and dashboard link.',
  },
  {
    title: 'Campus Mini Program',
    to: '/tech/my-blog.html',
    summary: 'Lightweight app for event, check-in, and service utilities.',
  },
  {
    title: 'Robotics Control Sandbox',
    to: '/tech/smartcar-nationwide.html',
    summary: 'PID tuning experiments and trajectory following simulation.',
  },
]
</script>

<style scoped>
.lk-proj-cards {
  padding: 0.25rem 0 1.25rem;
}

.lk-proj-cards__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 980px;
  margin: 0 auto;
}

@media (max-width: 959px) {
  .lk-proj-cards__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 719px) {
  .lk-proj-cards__grid {
    grid-template-columns: 1fr;
  }
}

.lk-proj-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 148px;
  border: 1px solid rgba(96, 165, 250, 0.28);
  border-radius: 14px;
  color: rgba(241, 245, 249, 0.96);
  box-shadow: 0 2px 16px rgba(2, 6, 23, 0.28);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  text-decoration: none;
  display: block;
  background:
    /* 共享底图切片：每张卡显示同一张图2的不同窗口 */
    url('/gallery/star-source.png'),
    linear-gradient(138deg, rgba(6, 16, 34, 0.98), rgba(7, 18, 40, 0.96));
  background-size:
    300% 300%,
    cover;
  background-position:
    calc(var(--proj-cell-col, 0) * 50%) calc(var(--proj-cell-row, 0) * 50%),
    center;
  background-repeat: no-repeat;
}

.lk-proj-card__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(168deg, rgba(2, 6, 23, 0.22), rgba(2, 6, 23, 0.62)),
    linear-gradient(0deg, var(--proj-tint), var(--proj-tint));
}

.lk-proj-card__body {
  position: relative;
  z-index: 2;
  padding: 16px 14px 14px;
}

.lk-proj-card__top {
  margin-bottom: 10px;
}

.lk-proj-card__title {
  font-size: 15.5px;
  font-weight: 750;
  line-height: 1.25;
  margin: 0;
  letter-spacing: 0.01em;
  text-align: left;
}

.lk-proj-card__desc {
  margin: 0;
  color: rgba(226, 232, 240, 0.9);
  font-size: 13.5px;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.lk-proj-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.5);
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.45);
}
</style>
