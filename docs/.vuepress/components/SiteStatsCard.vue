<template>
  <div
    class="lk-stats"
    :class="{
      'lk-stats--footer': variant === 'footer',
      'lk-stats--embedded': embedded,
    }"
    role="region"
    aria-label="网站信息"
  >
    <div class="lk-stats__head" :class="{ 'lk-stats__head--band': embedded }">
      <svg class="lk-stats__head-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M4 14l4-4 4 3 4-6 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="lk-stats__title">网站信息</span>
    </div>

    <ul class="lk-stats__list" :class="{ 'lk-stats__list--embedded': embedded }">
      <li class="lk-stats__row">
        <span class="lk-stats__key">文章数目</span>
        <span class="lk-stats__val">{{ articleCount }}</span>
      </li>
      <li class="lk-stats__row">
        <span class="lk-stats__key">本站访客数</span>
        <span class="lk-stats__val">
          <span v-if="!busuanziState.uv" class="lk-stats__spin" aria-label="加载中" />
          <template v-else>{{ busuanziState.uv }}</template>
        </span>
      </li>
      <li class="lk-stats__row">
        <span class="lk-stats__key">本站总浏览量</span>
        <span class="lk-stats__val">
          <span v-if="!busuanziState.pv" class="lk-stats__spin" aria-label="加载中" />
          <template v-else>{{ busuanziState.pv }}</template>
        </span>
      </li>
      <li class="lk-stats__row">
        <span class="lk-stats__key">最后更新时间</span>
        <span class="lk-stats__val lk-stats__val--muted">{{ lastUpdateRelative }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { busuanziState, ensureBusuanzi } from '../utils/busuanziClient.js'
import { formatRelativeTimeZh } from '../utils/relativeTimeZh.js'

defineProps({
  /** sidebar: 与 Profile 同系深色面板；footer: 页脚浅色紧凑块 */
  variant: {
    type: String,
    default: 'sidebar',
    validator: (v) => v === 'sidebar' || v === 'footer',
  },
  /** 嵌入侧栏控制面板：扁平、全宽 */
  embedded: { type: Boolean, default: false },
})

const articleCount = __LK_ARTICLE_COUNT__
const buildTimeIso = __LK_BUILD_TIME_ISO__

const lastUpdateRelative = computed(() => formatRelativeTimeZh(buildTimeIso))

onMounted(() => {
  ensureBusuanzi()
})
</script>

<style scoped>
/* 与 ProfileCard 同系的深色玻璃面板，无阴影，侧栏窄宽度下纵向排布 */
.lk-stats {
  width: 100%;
  max-width: 260px;
  padding: 18px 16px 16px;
  background: linear-gradient(
    160deg,
    rgba(14, 28, 48, 0.85) 0%,
    rgba(22, 42, 68, 0.82) 100%
  );
  backdrop-filter: blur(22px) saturate(1.45);
  -webkit-backdrop-filter: blur(22px) saturate(1.45);
  border: 1px solid rgba(120, 165, 210, 0.32);
  border-radius: 24px;
  color: rgba(230, 235, 255, 0.92);
}

.lk-stats--embedded {
  max-width: 100%;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  background: transparent;
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  color: var(--lk-text);
}

.lk-stats--embedded .lk-stats__head:not(.lk-stats__head--band) {
  border-bottom-color: var(--lk-border);
}

.lk-stats--embedded .lk-stats__head-icon {
  color: var(--lk-primary);
}

.lk-stats--embedded .lk-stats__title {
  color: var(--lk-text);
}

/* 嵌入：顶栏浅黄、图标与标题水平居中 */
.lk-stats__head--band {
  justify-content: center;
  margin: 0;
  padding: 10px 12px;
  border-bottom: none;
  border-radius: 14px 14px 0 0;
  background: #fff4d4;
}

.lk-stats__head--band .lk-stats__head-icon {
  color: #b45309;
}

.lk-stats__head--band .lk-stats__title {
  color: #78350f;
  font-size: 0.8rem;
}

.lk-stats--embedded .lk-stats__list--embedded {
  padding: 8px 12px 10px;
}

.lk-stats--embedded .lk-stats__row {
  padding: 5px 0;
}

.lk-stats--embedded .lk-stats__row + .lk-stats__row {
  border-top-color: var(--lk-border);
}

.lk-stats--embedded .lk-stats__key {
  color: var(--lk-text-muted);
}

.lk-stats--embedded .lk-stats__val {
  color: var(--lk-text);
}

.lk-stats--embedded .lk-stats__val--muted {
  color: var(--lk-text-body);
}

.lk-stats--embedded .lk-stats__spin {
  border-color: var(--lk-primary-soft);
  border-top-color: var(--lk-primary);
}

.lk-stats__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(120, 165, 210, 0.28);
}

.lk-stats--embedded .lk-stats__head--band {
  margin-bottom: 0;
  padding-bottom: 10px;
}

.lk-stats__head-icon {
  color: color-mix(in srgb, var(--lk-primary) 85%, #fff);
  flex-shrink: 0;
}

.lk-stats__title {
  font-size: 0.88rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.02em;
}

.lk-stats__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.lk-stats__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: 0.75rem;
  line-height: 1.35;
  padding: 8px 0;
}

.lk-stats__row + .lk-stats__row {
  border-top: 1px solid rgba(120, 165, 210, 0.18);
}

.lk-stats__key {
  color: rgba(184, 206, 232, 0.88);
  font-weight: 500;
}

.lk-stats__key::after {
  content: none;
}

.lk-stats__val {
  font-weight: 700;
  color: #fff;
  min-height: 1.15em;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 0.9rem;
}

.lk-stats__val--muted {
  font-weight: 500;
  color: rgba(198, 214, 236, 0.82);
  font-size: 0.78rem;
  line-height: 1.4;
}

.lk-stats__spin {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--lk-primary-soft);
  border-top-color: color-mix(in srgb, var(--lk-primary) 85%, #fff);
  border-radius: 50%;
  animation: lk-stats-spin 0.7s linear infinite;
}

@keyframes lk-stats-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 页脚：流式布局、浅色、无阴影，与返回顶部按钮错开由外层 padding 负责 */
.lk-stats--footer {
  max-width: 260px;
  width: auto;
  margin: 0;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--lk-card) 92%, transparent);
  border: 1px solid var(--lk-border);
  border-radius: 12px;
  color: var(--lk-text-body);
  box-shadow: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease;
}

.lk-stats--footer .lk-stats__head {
  border-bottom-color: var(--lk-border);
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.lk-stats--footer .lk-stats__head-icon {
  color: var(--lk-primary);
}

.lk-stats--footer .lk-stats__title {
  color: var(--lk-text);
  font-size: 0.82rem;
}

.lk-stats--footer .lk-stats__row {
  padding: 6px 0;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 10px;
}

.lk-stats--footer .lk-stats__row + .lk-stats__row {
  border-top-color: var(--lk-border);
}

.lk-stats--footer .lk-stats__key {
  color: var(--lk-text-muted);
  font-size: 0.72rem;
}

.lk-stats--footer .lk-stats__key::after {
  content: none;
}

.lk-stats--footer .lk-stats__val {
  color: var(--lk-text);
  font-size: 0.8rem;
  justify-content: flex-end;
}

.lk-stats--footer .lk-stats__val--muted {
  color: var(--lk-text-body);
  font-size: 0.72rem;
  text-align: right;
  max-width: 100%;
}

.lk-stats--footer .lk-stats__spin {
  border-color: var(--lk-primary-soft);
  border-top-color: var(--lk-primary);
}
</style>

<style>
[data-theme='dark'] .lk-stats__head--band {
  background: rgba(251, 191, 36, 0.2);
}

[data-theme='dark'] .lk-stats__head--band .lk-stats__head-icon {
  color: #fcd34d;
}

[data-theme='dark'] .lk-stats__head--band .lk-stats__title {
  color: #fef3c7;
}
</style>
