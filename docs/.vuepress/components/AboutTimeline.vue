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
  --lk-time-rail: rgba(33, 37, 41, 0.18);
  --lk-time-dot: var(--lk-accent, #343A40);
  --lk-time-year-bg: linear-gradient(135deg, #495057 0%, #212529 100%);
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
  border: 1px solid rgba(33, 37, 41, 0.10);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  transition:
    background 0.22s ease-out,
    border-color 0.22s ease-out,
    box-shadow 0.22s ease-out,
    backdrop-filter 0.22s ease-out;
}

/* hover：磨砂背景变得更清晰 + 微阴影抬起，文字不变色（克制） */
.lk-about-timeline__item:hover .lk-about-timeline__body {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(33, 37, 41, 0.20);
  box-shadow:
    0 6px 18px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(2px) saturate(1.1);
  -webkit-backdrop-filter: blur(2px) saturate(1.1);
}

/* hover 时圆点稍微变实心（额外的物理反馈） */
.lk-about-timeline__item:hover .lk-about-timeline__dot {
  background: var(--lk-time-dot);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--lk-time-dot) 16%, transparent);
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
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
  font-family: var(--lk-font-mono, monospace);
  letter-spacing: 0.02em;
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
  transition: color 0.22s ease-out;
}

/* 克制感：标题 hover 仅微调字重 / 不变色（颜色反馈交给整张卡片的磨砂变化） */
.lk-about-timeline__title:hover {
  color: var(--lk-accent-strong, #212529);
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
  --lk-time-rail: rgba(222, 226, 230, 0.18);
  --lk-time-dot: #DEE2E6;
  --lk-time-year-bg: linear-gradient(135deg, #495057 0%, #ADB5BD 100%);
}

[data-theme='dark'] .lk-about-timeline__heading,
[data-theme='dark'] .lk-about-timeline__title {
  color: rgba(248, 250, 252, 0.96);
}

[data-theme='dark'] .lk-about-timeline__body {
  border-color: rgba(222, 226, 230, 0.10);
  background: rgba(15, 23, 42, 0.55);
}

[data-theme='dark'] .lk-about-timeline__item:hover .lk-about-timeline__body {
  background: rgba(15, 23, 42, 0.88);
  border-color: rgba(222, 226, 230, 0.20);
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.35),
    0 1px 3px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .lk-about-timeline__item:hover .lk-about-timeline__title {
  color: #ffffff;
}

[data-theme='dark'] .lk-about-timeline__date {
  color: rgba(203, 213, 225, 0.82);
}

[data-theme='dark'] .lk-about-timeline__cat {
  color: rgba(173, 181, 189, 0.86);
}

@media (max-width: 959px) {
  .lk-about-timeline__item:nth-child(even) .lk-about-timeline__body {
    transform: translateX(0);
  }
}
</style>
