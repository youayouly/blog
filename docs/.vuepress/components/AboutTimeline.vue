<script setup>
import { computed } from 'vue'
import { timelineItems } from '../data/aboutArticleFeed.js'

const sorted = computed(() =>
  [...timelineItems].sort((a, b) => String(b.date).localeCompare(String(a.date))),
)

function yearOf(d) {
  return String(d).slice(0, 4)
}

const rows = computed(() => {
  let prevYear = ''
  return sorted.value.slice(0, 10).map((item) => {
    const y = yearOf(item.date)
    const showYear = y !== prevYear
    prevYear = y
    return { ...item, showYear, year: y }
  })
})
</script>

<template>
  <div class="lk-about-timeline">
    <h3 class="lk-about-timeline__heading">动态时间线</h3>
    <ul class="lk-about-timeline__list">
      <li v-for="(row, i) in rows" :key="i" class="lk-about-timeline__item">
        <div class="lk-about-timeline__rail" aria-hidden="true">
          <span class="lk-about-timeline__dot" />
        </div>
        <div class="lk-about-timeline__body">
          <span v-if="row.showYear" class="lk-about-timeline__year">{{ row.year }}</span>
          <time class="lk-about-timeline__date" :datetime="row.date">{{ row.date }}</time>
          <a v-if="row.href" class="lk-about-timeline__title" :href="row.href">{{ row.title }}</a>
          <span v-else class="lk-about-timeline__title lk-about-timeline__title--plain">{{ row.title }}</span>
          <span class="lk-about-timeline__cat">{{ row.category }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lk-about-timeline {
  position: relative;
  min-width: 0;
  margin-left: 0;
  margin-right: 0;
  --lk-time-rail: rgba(37, 99, 235, 0.2);
  --lk-time-dot: #2563eb;
  --lk-time-year-bg: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
}

.lk-about-timeline__heading {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--vp-c-text-1, #0f172a);
  letter-spacing: 0.05em;
  text-align: left;
}

.lk-about-timeline__list {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0.25rem 0 0.25rem 1.5rem;
}

.lk-about-timeline__list::before {
  content: '';
  position: absolute;
  top: 0.35rem;
  bottom: 0.35rem;
  left: 1.7rem;
  width: 2px;
  background: var(--lk-time-rail);
  border-radius: 1px;
}

.lk-about-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 0.45rem;
  align-items: start;
  padding: 0.55rem 0;
  margin-left: 0;
}

.lk-about-timeline__item:nth-child(odd) .lk-about-timeline__body {
  transform: translateX(0);
}

.lk-about-timeline__item:nth-child(even) .lk-about-timeline__body {
  transform: translateX(18px);
}

.lk-about-timeline__item:first-child {
  padding-top: 0.15rem;
}

.lk-about-timeline__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 0.22rem;
  min-width: 0;
  padding: 0.55rem 0.7rem 0.62rem;
  border-radius: 12px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  background: rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(6px);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.lk-about-timeline__item:hover .lk-about-timeline__body {
  border-color: rgba(37, 99, 235, 0.26);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
}

.lk-about-timeline__year {
  align-self: flex-start;
  margin-bottom: 0.12rem;
  padding: 0.12rem 0.48rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  color: #fff;
  background: var(--lk-time-year-bg);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.26);
}

.lk-about-timeline__date {
  font-size: 0.68rem;
  color: var(--vp-c-text-3, #64748b);
}

.lk-about-timeline__title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--vp-c-text-1, #0f172a);
  text-decoration: none;
  line-height: 1.35;
}

.lk-about-timeline__title:hover {
  color: var(--lk-time-dot);
  text-decoration: none;
}

.lk-about-timeline__title,
.lk-about-timeline__title:hover,
.lk-about-timeline__title:focus,
.lk-about-timeline__title:active {
  text-decoration: none !important;
}

.lk-about-timeline__title--plain {
  cursor: default;
}

.lk-about-timeline__cat {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--vp-c-text-2, #475569);
}

.lk-about-timeline__rail {
  position: relative;
  display: flex;
  justify-content: center;
  padding-top: 1.45rem;
}

.lk-about-timeline__item:first-child .lk-about-timeline__rail {
  padding-top: 1.9rem;
}

.lk-about-timeline__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--vp-c-bg, #fff);
  border: 2px solid var(--lk-time-dot);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-bg, #fff) 88%, transparent);
  z-index: 1;
}

[data-theme='dark'] .lk-about-timeline {
  --lk-time-rail: rgba(125, 211, 252, 0.28);
  --lk-time-dot: #7dd3fc;
  --lk-time-year-bg: linear-gradient(135deg, #0e7490 0%, #38bdf8 100%);
}

[data-theme='dark'] .lk-about-timeline__heading,
[data-theme='dark'] .lk-about-timeline__title {
  color: rgba(248, 250, 252, 0.96);
}

[data-theme='dark'] .lk-about-timeline__body {
  border-color: rgba(125, 211, 252, 0.2);
  background: rgba(15, 23, 42, 0.72);
}

[data-theme='dark'] .lk-about-timeline__item:hover .lk-about-timeline__body {
  border-color: rgba(125, 211, 252, 0.36);
  box-shadow: 0 12px 28px rgba(2, 132, 199, 0.18);
}

[data-theme='dark'] .lk-about-timeline__date {
  color: rgba(203, 213, 225, 0.82);
}

[data-theme='dark'] .lk-about-timeline__cat {
  color: rgba(147, 197, 253, 0.88);
}

@media (max-width: 959px) {
  .lk-about-timeline__item:nth-child(even) .lk-about-timeline__body {
    transform: translateX(0);
  }
}
</style>
