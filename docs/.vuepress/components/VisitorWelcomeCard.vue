<template>
  <section class="lk-welcome" aria-label="欢迎来访者">
    <div class="lk-welcome__head">
      <h2 class="lk-welcome__title">
        <span class="lk-welcome__icon" aria-hidden="true">👤</span>
        <span class="lk-welcome__title-text">欢迎来访者！</span>
      </h2>
    </div>
    <div class="lk-welcome__body" aria-live="polite">
      <p class="lk-welcome__line">{{ visitor.placeLine }}</p>
      <p class="lk-welcome__line">IP：{{ visitor.ip }}</p>
      <p v-if="visitor.distanceKm != null" class="lk-welcome__line">
        距主站直线约 {{ visitor.distanceKm }} 公里
      </p>
      <p class="lk-welcome__tip">{{ visitor.tip }}</p>
    </div>
  </section>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { fetchVisitorSnapshot, timeTipByHour } from '../utils/visitorClient.js'

const visitor = reactive({
  placeLine: '正在解析访问信息…',
  ip: '—',
  distanceKm: null,
  tip: '',
})

visitor.tip = timeTipByHour(new Date().getHours())

onMounted(async () => {
  try {
    const s = await fetchVisitorSnapshot()
    visitor.placeLine = s.placeLine
    visitor.ip = s.ip
    visitor.distanceKm = s.distanceKm
    visitor.tip = s.tip
  } catch {
    visitor.placeLine = '暂时无法获取位置信息'
  }
})
</script>

<style scoped>
/* 外层卡片皮肤由 HomeSidePanel 统一提供 */
.lk-welcome {
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
  color: var(--lk-text);
  min-width: 0;
  align-self: stretch;
}

/* 图 1：顶栏粉彩蓝、圆角与卡片顶一致，图标与标题同一行居中 */
.lk-welcome__head {
  padding: 10px 12px;
  margin: 0;
  background: #d6ebff;
  border-radius: 14px 14px 0 0;
}

.lk-welcome__title {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  width: 100%;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: 0.02em;
  line-height: 1.3;
  text-align: center;
}

.lk-welcome__title-text {
  white-space: nowrap;
}

.lk-welcome__icon {
  font-size: 0.95rem;
  line-height: 1;
  flex-shrink: 0;
}

.lk-welcome__body {
  padding: 10px 12px 12px;
}

.lk-welcome__line {
  margin: 0 0 4px;
  font-size: 0.66rem;
  line-height: 1.45;
  color: var(--lk-text-body);
  word-break: break-word;
}

.lk-welcome__tip {
  margin: 6px 0 0;
  font-size: 0.62rem;
  line-height: 1.4;
  color: var(--lk-text-muted);
  font-style: italic;
}
</style>

<style>
[data-theme='dark'] .lk-welcome__head {
  background: rgba(56, 130, 210, 0.28);
}

[data-theme='dark'] .lk-welcome__title {
  color: var(--lk-text);
}
</style>
