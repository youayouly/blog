<template>
  <section class="lk-album" aria-label="Album">
    <header class="lk-album__top">
      <div class="lk-album__brand">
        <svg class="lk-album__cam" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" />
          <circle cx="12" cy="13" r="3.5" stroke="currentColor" stroke-width="2" />
          <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" stroke="currentColor" stroke-width="2" />
        </svg>
        <span class="lk-album__title">Album</span>
      </div>
      <a class="lk-album__all" href="/comments/">
        View All
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </a>
    </header>

    <article
      v-for="block in blocks"
      :key="block.id"
      class="lk-album__block"
    >
      <header class="lk-album__meta">
        <span class="lk-album__place">{{ block.place }}</span>
        <time class="lk-album__when" :datetime="block.iso">{{ block.dateLabel }}</time>
      </header>

      <div
        class="lk-album__grid"
        :class="{ 'lk-album__grid--loading': !block.ready }"
        :aria-busy="!block.ready"
      >
        <template v-if="!block.ready">
          <div
            v-for="n in 9"
            :key="'sk-' + block.id + n"
            class="lk-album__skel"
          >
            <div class="lk-album__bars" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
          </div>
        </template>
        <template v-else>
          <a
            v-for="(src, i) in block.urls"
            :key="'img-' + block.id + i"
            class="lk-album__cell"
            :href="src"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img :src="src" :alt="block.place + ' photo ' + (i + 1)" loading="lazy" />
          </a>
        </template>
      </div>
      <div class="lk-album__rule" role="presentation" />
    </article>
  </section>
</template>

<script setup>
import { onMounted, reactive } from 'vue'

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

const blocks = reactive([
  {
    id: 'bcn',
    place: 'Spain Barcelona',
    dateLabel: 'Feb 25, 2026',
    iso: '2026-02-25',
    urls: Array.from({ length: 9 }, (_, i) => `https://picsum.photos/seed/lkbcn${i}/240/240`),
    ready: false,
  },
  {
    id: 'neu',
    place: 'Germany NeuschwansteinCastle',
    dateLabel: 'Jan 06, 2026',
    iso: '2026-01-06',
    urls: Array.from({ length: 9 }, (_, i) => `https://picsum.photos/seed/lkneu${i}/240/240`),
    ready: false,
  },
  {
    id: 'mit',
    place: 'Germany Mittenwald',
    dateLabel: 'Mar 08, 2026',
    iso: '2026-03-08',
    urls: Array.from({ length: 9 }, (_, i) => `https://picsum.photos/seed/lkmit${i}/240/240`),
    ready: false,
  },
])

onMounted(() => {
  blocks.forEach((b) => {
    Promise.all(b.urls.map((u) => loadImage(u))).then(() => {
      b.ready = true
    })
  })
})
</script>

<style scoped>
.lk-album {
  --lk-album-bg: #faf7f2;
  --lk-album-muted: #6b5b73;
  --lk-album-text: #3d3548;
  --lk-album-skel: #ebe4db;
  --lk-album-bar: #c4b8a8;

  max-width: 420px;
  margin: 1.25rem auto 2rem;
  padding: 1rem 1.1rem 0.5rem;
  background: var(--lk-album-bg);
  border-radius: 16px;
  box-shadow: 0 2px 20px rgba(61, 53, 72, 0.08);
  color: var(--lk-album-text);
  font-family: ui-serif, Georgia, 'Times New Roman', serif;
}

.lk-album__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.lk-album__brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.lk-album__cam {
  color: var(--lk-album-muted);
  flex-shrink: 0;
}

.lk-album__title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.lk-album__all {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--lk-album-muted);
  text-decoration: none;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.lk-album__all:hover {
  color: var(--lk-album-text);
  text-decoration: underline;
}

.lk-album__block {
  margin: 0;
  padding: 0;
}

.lk-album__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 0.65rem;
  margin-bottom: 0.65rem;
}

.lk-album__place {
  font-size: 0.95rem;
  font-weight: 700;
}

.lk-album__when {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--lk-album-muted);
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.lk-album__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 320px;
}

.lk-album__skel {
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--lk-album-skel);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lk-album__bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 28px;
  color: var(--lk-album-bar);
}

.lk-album__bars span {
  width: 5px;
  border-radius: 2px;
  background: currentColor;
  transform-origin: center bottom;
  animation: lk-album-bar 0.85s ease-in-out infinite;
}

.lk-album__bars span:nth-child(1) {
  height: 10px;
  animation-delay: 0s;
}

.lk-album__bars span:nth-child(2) {
  height: 18px;
  animation-delay: 0.12s;
}

.lk-album__bars span:nth-child(3) {
  height: 14px;
  animation-delay: 0.24s;
}

.lk-album__bars span:nth-child(4) {
  height: 22px;
  animation-delay: 0.36s;
}

@keyframes lk-album-bar {
  0%,
  100% {
    transform: scaleY(0.35);
    opacity: 0.65;
  }

  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.lk-album__cell {
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  display: block;
  border: 2px solid rgba(107, 91, 115, 0.12);
  box-shadow: 0 2px 8px rgba(61, 53, 72, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lk-album__cell:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 14px rgba(61, 53, 72, 0.16);
}

.lk-album__cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lk-album__rule {
  height: 1px;
  background: rgba(107, 91, 115, 0.12);
  margin: 1rem 0 1.1rem;
}

.lk-album__block:last-child .lk-album__rule {
  display: none;
}
</style>
