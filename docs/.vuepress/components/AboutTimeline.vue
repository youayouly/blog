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
  const list = sorted.value
  let prevYear = ''
  return list.map((item) => {
    const y = yearOf(item.date)
    const showYear = y !== prevYear
    prevYear = y
    return { ...item, showYear, year: y }
  })
})
</script>

<template>
  <div class="lk-about-timeline">
    <h3 class="lk-about-timeline__heading">动态</h3>
    <ul class="lk-about-timeline__list">
      <li v-for="(row, i) in rows" :key="i" class="lk-about-timeline__item">
        <div class="lk-about-timeline__body">
          <span v-if="row.showYear" class="lk-about-timeline__year">{{ row.year }}</span>
          <time class="lk-about-timeline__date" :datetime="row.date">{{ row.date }}</time>
          <a v-if="row.href" class="lk-about-timeline__title" :href="row.href">{{ row.title }}</a>
          <span v-else class="lk-about-timeline__title lk-about-timeline__title--plain">{{ row.title }}</span>
          <span class="lk-about-timeline__cat">{{ row.category }}</span>
        </div>
        <div class="lk-about-timeline__rail" aria-hidden="true">
          <span class="lk-about-timeline__dot" />
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lk-about-timeline {
  position: relative;
  min-width: 0;
}

.lk-about-timeline__heading {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0a0a0a;
  letter-spacing: 0.04em;
}

.lk-about-timeline__list {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0 0 0.25rem;
}

/* Single continuous rail — one vertical segment for the whole module */
.lk-about-timeline__list::before {
  content: '';
  position: absolute;
  top: 0.35rem;
  bottom: 0.35rem;
  right: 10px;
  width: 2px;
  background: rgba(15, 23, 42, 0.22);
  border-radius: 1px;
}

.lk-about-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 22px;
  gap: 0.35rem;
  align-items: start;
  padding: 0.55rem 0;
}

.lk-about-timeline__item:first-child {
  padding-top: 0.15rem;
}

.lk-about-timeline__body {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  gap: 0.2rem;
  padding-right: 0.15rem;
  min-width: 0;
}

.lk-about-timeline__year {
  align-self: flex-end;
  margin-bottom: 0.15rem;
  padding: 0.12rem 0.45rem;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #5b9bd5 0%, #4a90d9 100%);
  box-shadow: 0 2px 8px rgba(74, 144, 217, 0.35);
}

.lk-about-timeline__date {
  font-size: 0.68rem;
  color: #334155;
}

.lk-about-timeline__title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0a0a0a;
  text-decoration: none;
  line-height: 1.35;
}

.lk-about-timeline__title:hover {
  color: #2563eb;
}

.lk-about-timeline__title--plain {
  cursor: default;
}

.lk-about-timeline__cat {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
}

.lk-about-timeline__rail {
  position: relative;
  display: flex;
  justify-content: center;
  padding-top: 1.35rem;
}

.lk-about-timeline__item:first-child .lk-about-timeline__rail {
  padding-top: 1.85rem;
}

.lk-about-timeline__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #4a90d9;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
  z-index: 1;
}

[data-theme='dark'] .lk-about-timeline__heading {
  color: #f8fafc;
}

[data-theme='dark'] .lk-about-timeline__date {
  color: #cbd5e1;
}

[data-theme='dark'] .lk-about-timeline__title {
  color: #f8fafc;
}

[data-theme='dark'] .lk-about-timeline__title:hover {
  color: #93c5fd;
}

[data-theme='dark'] .lk-about-timeline__cat {
  color: #e2e8f0;
}

[data-theme='dark'] .lk-about-timeline__dot {
  background: #0a0a0a;
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px #0a0a0a;
}

[data-theme='dark'] .lk-about-timeline__list::before {
  background: rgba(248, 250, 252, 0.35);
}
</style>
