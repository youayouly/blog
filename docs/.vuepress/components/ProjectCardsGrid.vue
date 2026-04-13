<template>
  <section class="lk-proj-cards" aria-label="Projects list cards">
    <div class="lk-proj-cards__grid">
      <RouterLink
        v-for="item in items"
        :key="item.title"
        :to="item.to"
        class="lk-proj-card"
        :class="{ 'lk-proj-card--no-art': isArtFailed(item.to) }"
        :style="isArtFailed(item.to) ? cardAiSurfaceStyle(item) : cardArtUnderlayStyle(item)"
        :aria-label="item.title"
      >
        <img
          v-if="!isArtFailed(item.to)"
          class="lk-proj-card__art"
          :src="cardArtSrc(item)"
          alt=""
          width="768"
          height="512"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          referrerpolicy="no-referrer"
          @error="onCardArtError(item.to)"
        />

        <div class="lk-proj-card__scrim" aria-hidden="true" />

        <div class="lk-proj-card__body">
          <header
            class="lk-proj-card__top"
            :class="{ 'lk-proj-card__top--noicon': !item.href }"
          >
            <h3 class="lk-proj-card__title">{{ item.title }}</h3>

            <a
              v-if="item.href"
              class="lk-proj-card__icon"
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="item.iconLabel || 'Open external link'"
              @click.stop
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.86-.01-1.69-2.78.62-3.37-1.38-3.37-1.38-.46-1.19-1.12-1.51-1.12-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.58 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.15-4.56-5.13 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05.8-.23 1.66-.35 2.52-.35.86 0 1.72.12 2.52.35 1.9-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.77 0 3.99-2.35 4.86-4.58 5.12.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49 3.96-1.36 6.83-5.2 6.83-9.73C22 6.58 17.52 2 12 2Z"
                />
              </svg>
            </a>
          </header>

          <p class="lk-proj-card__desc">
            {{ item.summary }}
          </p>

          <footer
            v-if="item.stats || (item.tags && item.tags.length)"
            class="lk-proj-card__bottom"
          >
            <div class="lk-proj-card__stats">
              <template v-if="item.stats">
                <div class="lk-proj-card__statrow">
                  <span
                    v-if="typeof item.stats.star === 'number'"
                    class="lk-proj-card__stat"
                  >
                    <span class="lk-proj-card__stat-ico" aria-hidden="true">★</span>
                    {{ item.stats.star }}
                  </span>
                  <span
                    v-if="typeof item.stats.fork === 'number'"
                    class="lk-proj-card__stat"
                  >
                    <span class="lk-proj-card__stat-ico" aria-hidden="true">🍴</span>
                    {{ item.stats.fork }}
                  </span>
                </div>
              </template>

              <div v-if="item.tags && item.tags.length" class="lk-proj-card__tags">
                <span v-for="t in item.tags" :key="t" class="lk-proj-card__tag">
                  {{ t }}
                </span>
              </div>
            </div>
          </footer>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

/** 文本提示 → 图（Pollinations）；失败时回退到 CSS 渐变 */
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt'

/** 稳定哈希：同一张卡片 SSR/CSR 一致 */
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

const artFailed = ref({})

function isArtFailed(to) {
  return !!artFailed.value[to]
}

function onCardArtError(to) {
  artFailed.value = { ...artFailed.value, [to]: true }
}

function clipText(s, max) {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`
}

function buildArtPrompt(item) {
  const fromItem = typeof item.artPrompt === 'string' ? item.artPrompt.trim() : ''
  if (fromItem) return clipText(fromItem, 380)

  const core = clipText(`${item.title}. ${item.summary}`, 160)
  const suffix =
    ' Wide cinematic abstract technology illustration, soft neural mesh and light particles, deep navy blue and cyan emerald glow, volumetric fog, ultra sharp, no text, no letters, no logos, no watermark, empty negative space for UI overlay'
  return clipText(`${core}. ${suffix}`, 420)
}

function cardArtSrc(item) {
  const prompt = buildArtPrompt(item)
  const seed = hashString(`${item.title}\0${item.to}`) % 999_983
  const q = new URLSearchParams({
    width: '768',
    height: '512',
    seed: String(seed),
    model: 'turbo',
    enhance: 'false',
    nologo: 'true',
  })
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${q.toString()}`
}

/** 有图时：底层纯色 + 与 seed 呼应的微弱色晕，避免图加载前全白 */
function cardArtUnderlayStyle(item) {
  const seed = hashString(`${item.title}\0${item.to}`)
  const rnd = mulberry32(seed)
  const h = Math.floor(rnd() * 360)
  return {
    '--proj-art-fallback': `hsl(${h} 32% 12%)`,
  }
}

/** 无图（外链失败）时：保留原先的 procedural 渐变 */
function cardAiSurfaceStyle(item) {
  const seed = hashString(`${item.title}\0${item.to}`)
  const rnd = mulberry32(seed)
  const h1 = Math.floor(rnd() * 360)
  const h2 = Math.floor(rnd() * 360)
  const h3 = Math.floor(rnd() * 360)
  const x1 = 8 + Math.floor(rnd() * 72)
  const y1 = 6 + Math.floor(rnd() * 48)
  const x2 = 10 + Math.floor(rnd() * 75)
  const y2 = 18 + Math.floor(rnd() * 55)
  const x3 = 55 + Math.floor(rnd() * 40)
  const y3 = 10 + Math.floor(rnd() * 70)
  const a1 = 0.28 + rnd() * 0.14
  const a2 = 0.22 + rnd() * 0.12
  const a3 = 0.14 + rnd() * 0.1

  const c1 = `hsla(${h1}, 82%, 58%, ${a1.toFixed(3)})`
  const c2 = `hsla(${h2}, 76%, 52%, ${a2.toFixed(3)})`
  const c3 = `hsla(${h3}, 70%, 56%, ${a3.toFixed(3)})`

  return {
    '--proj-ai-r1': `radial-gradient(ellipse 118% 96% at ${x1}% ${y1}%, ${c1} 0%, transparent 58%)`,
    '--proj-ai-r2': `radial-gradient(ellipse 96% 88% at ${x2}% ${y2}%, ${c2} 0%, transparent 54%)`,
    '--proj-ai-r3': `radial-gradient(circle at ${x3}% ${y3}%, ${c3} 0%, transparent 42%)`,
  }
}

const items = [
  {
    title: 'Personal Blog',
    to: '/tech/my-blog.html',
    summary:
      'VuePress 2 + vuepress-theme-hope static site: custom home, album, tech hub, and deploy story.',
  },
  {
    title: 'Xinke ICT Competition',
    to: '/tech/xinke-sai.html',
    summary:
      'National new-generation ICT contest (信科赛): 5G/embedded tracks, engineering practice and innovation.',
  },
  {
    title: 'National Intelligent Car Competition',
    to: '/tech/smartcar-nationwide.html',
    summary:
      'NXP Cup–style autonomous model cars: full-model and vision-class work in one write-up.',
  },
  {
    title: 'LLM RAG Assistant',
    to: '/tech/ai-llm-rag.html',
    summary:
      'Retrieval-augmented LLM: chunking, embeddings, vector store, and grounded Q&A.',
  },
  {
    title: 'Edge AI Inference',
    to: '/tech/ai-edge-inference.html',
    summary:
      'On-device neural nets: quantization, TFLite/ONNX runtimes, and latency-focused benchmarks.',
  },
  {
    title: 'Vision ML Pipeline',
    to: '/tech/ai-vision-pipeline.html',
    summary:
      'Label, train, evaluate, and export for CV models and small demos.',
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
  --proj-surface-a: rgba(255, 255, 255, 0.93);
  --proj-surface-b: rgba(248, 250, 255, 0.86);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 148px;
  border: 1px solid rgba(59, 43, 119, 0.08);
  border-radius: 14px;
  padding: 0;
  color: #2f2b74;
  box-shadow: 0 2px 16px rgba(45, 43, 111, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  text-decoration: none;
  display: block;
}

/* ── 文本生图模式：满幅背景图 ─────────────────────────────────── */
.lk-proj-card:not(.lk-proj-card--no-art) {
  background-color: var(--proj-art-fallback, #0b1020);
}

.lk-proj-card__art {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  display: block;
}

.lk-proj-card__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.88) 0%,
    rgba(255, 255, 255, 0.42) 42%,
    rgba(15, 23, 42, 0.52) 100%
  );
}

.lk-proj-card__body {
  position: relative;
  z-index: 2;
  padding: 16px 14px 14px;
}

.lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__title {
  color: #0c1222;
  text-shadow:
    0 0 1px rgba(255, 255, 255, 0.9),
    0 1px 14px rgba(255, 255, 255, 0.75);
}

.lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__desc {
  color: rgba(15, 23, 42, 0.88);
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.55);
}

.lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__stat {
  color: rgba(15, 23, 42, 0.82);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.45);
}

.lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__tag {
  color: rgba(15, 23, 42, 0.9);
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(6px);
}

.lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__icon {
  color: rgba(15, 23, 42, 0.82);
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.7));
}

/* ── 无图回退：原 procedural 渐变 + 斜线纹理 ───────────────────── */
.lk-proj-card--no-art {
  background-color: transparent;
  background-image:
    linear-gradient(168deg, var(--proj-surface-a) 0%, var(--proj-surface-b) 100%),
    var(--proj-ai-r1, none),
    var(--proj-ai-r2, none),
    var(--proj-ai-r3, none);
  background-repeat: no-repeat;
  background-size: cover;
}

.lk-proj-card--no-art .lk-proj-card__scrim {
  display: none;
}

.lk-proj-card--no-art::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0.07;
  background-image: repeating-linear-gradient(
    -18deg,
    transparent,
    transparent 6px,
    rgba(59, 43, 119, 0.12) 6px,
    rgba(59, 43, 119, 0.12) 7px
  );
  z-index: 1;
}

.lk-proj-card--no-art .lk-proj-card__title,
.lk-proj-card--no-art .lk-proj-card__desc,
.lk-proj-card--no-art .lk-proj-card__stat,
.lk-proj-card--no-art .lk-proj-card__tag,
.lk-proj-card--no-art .lk-proj-card__icon {
  color: inherit;
  text-shadow: none;
  filter: none;
  backdrop-filter: none;
}

.lk-proj-card--no-art .lk-proj-card__tag {
  background: rgba(47, 43, 116, 0.06);
  border-color: rgba(47, 43, 116, 0.12);
}

.lk-proj-card:hover {
  transform: translateY(-3px);
  border-color: rgba(59, 43, 119, 0.18);
  box-shadow: 0 14px 34px rgba(45, 43, 111, 0.14);
}

.lk-proj-card__top {
  position: relative;
  display: block;
  margin-bottom: 10px;
  padding-right: 24px;
}

.lk-proj-card__top--noicon {
  padding-right: 0;
}

.lk-proj-card__title {
  font-size: 15.5px;
  font-weight: 750;
  line-height: 1.25;
  margin: 0;
  letter-spacing: 0.01em;
  text-align: left;
}

.lk-proj-card__icon {
  position: absolute;
  right: 0;
  top: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(47, 43, 116, 0.78);
  text-decoration: none;
  transition: color 0.18s ease;
}

.lk-proj-card:not(.lk-proj-card--no-art):hover .lk-proj-card__icon {
  color: rgba(15, 23, 42, 0.95);
}

.lk-proj-card--no-art:hover .lk-proj-card__icon {
  color: rgba(47, 43, 116, 0.98);
}

.lk-proj-card__icon:focus-visible {
  outline: 2px solid rgba(59, 43, 119, 0.35);
  outline-offset: 2px;
}

.lk-proj-card__desc {
  margin: 0;
  color: rgba(45, 43, 111, 0.82);
  font-size: 13.5px;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.lk-proj-card__bottom {
  margin-top: 12px;
}

.lk-proj-card__stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lk-proj-card__statrow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.lk-proj-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1;
  color: rgba(47, 43, 116, 0.82);
}

.lk-proj-card__stat-ico {
  font-size: 12px;
}

.lk-proj-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lk-proj-card__tag {
  font-size: 12px;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 999px;
  color: rgba(47, 43, 116, 0.92);
  background: rgba(47, 43, 116, 0.06);
  border: 1px solid rgba(47, 43, 116, 0.12);
}

[data-theme='dark'] .lk-proj-card {
  --proj-surface-a: rgba(30, 41, 59, 0.88);
  --proj-surface-b: rgba(15, 23, 42, 0.78);
  border-color: rgba(148, 163, 184, 0.18);
  color: rgba(226, 232, 240, 0.92);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.18);
}

[data-theme='dark'] .lk-proj-card__scrim {
  background: linear-gradient(
    165deg,
    rgba(15, 23, 42, 0.82) 0%,
    rgba(15, 23, 42, 0.38) 46%,
    rgba(2, 6, 23, 0.82) 100%
  );
}

[data-theme='dark'] .lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__title {
  color: #f8fafc;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 18px rgba(0, 0, 0, 0.75);
}

[data-theme='dark'] .lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__desc {
  color: rgba(241, 245, 249, 0.9);
  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.85);
}

[data-theme='dark'] .lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__stat {
  color: rgba(241, 245, 249, 0.88);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.8);
}

[data-theme='dark'] .lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__tag {
  color: rgba(248, 250, 252, 0.92);
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(148, 163, 184, 0.22);
}

[data-theme='dark'] .lk-proj-card:not(.lk-proj-card--no-art) .lk-proj-card__icon {
  color: rgba(248, 250, 252, 0.88);
  filter: drop-shadow(0 1px 8px rgba(0, 0, 0, 0.85));
}

[data-theme='dark'] .lk-proj-card:not(.lk-proj-card--no-art):hover .lk-proj-card__icon {
  color: #fff;
}

[data-theme='dark'] .lk-proj-card--no-art::after {
  opacity: 0.09;
  background-image: repeating-linear-gradient(
    -18deg,
    transparent,
    transparent 6px,
    rgba(148, 163, 184, 0.14) 6px,
    rgba(148, 163, 184, 0.14) 7px
  );
}

[data-theme='dark'] .lk-proj-card--no-art .lk-proj-card__desc {
  color: rgba(226, 232, 240, 0.74);
}

[data-theme='dark'] .lk-proj-card--no-art .lk-proj-card__stat {
  color: rgba(226, 232, 240, 0.78);
}

[data-theme='dark'] .lk-proj-card--no-art .lk-proj-card__tag {
  color: rgba(226, 232, 240, 0.86);
  background: rgba(226, 232, 240, 0.06);
  border-color: rgba(226, 232, 240, 0.14);
}

[data-theme='dark'] .lk-proj-card--no-art .lk-proj-card__icon {
  color: rgba(226, 232, 240, 0.72);
}

[data-theme='dark'] .lk-proj-card--no-art:hover .lk-proj-card__icon {
  color: rgba(226, 232, 240, 0.92);
}

@media print {
  .lk-proj-card__art {
    display: none !important;
  }
}
</style>
