<template>
  <section class="lk-notice" :class="{ 'lk-notice--embedded': embedded }" aria-label="站点公告">
    <h2 class="lk-notice__title" :class="{ 'lk-notice__title--band': embedded }">
      <span class="lk-notice__title-inner">📢 公告</span>
    </h2>
    <ul class="lk-notice__list">
      <li class="lk-notice__item">
        <span class="lk-notice__icon" aria-hidden="true">⚙️</span>
        <span class="lk-notice__text"><strong>框架核心：</strong>VuePress 2</span>
      </li>
      <li class="lk-notice__item">
        <span class="lk-notice__icon" aria-hidden="true">🛡️</span>
        <span class="lk-notice__text"><strong>安全保障：</strong>HTTPS</span>
      </li>
      <li class="lk-notice__item">
        <span class="lk-notice__icon" aria-hidden="true">📼</span>
        <span class="lk-notice__text"><strong>服务器：</strong>Vercel</span>
      </li>
      <li class="lk-notice__item">
        <span class="lk-notice__icon" aria-hidden="true">🎲</span>
        <span class="lk-notice__text"><strong>CDN 加速：</strong>Vercel CDN</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
defineProps({
  embedded: { type: Boolean, default: false },
})
</script>

<style scoped>
.lk-notice {
  width: 100%;
  max-width: 260px;
  padding: 16px 16px 14px;
  background: linear-gradient(
    160deg,
    rgba(14, 28, 48, 0.85) 0%,
    rgba(22, 42, 68, 0.82) 100%
  );
  backdrop-filter: blur(22px) saturate(1.45);
  -webkit-backdrop-filter: blur(22px) saturate(1.45);
  border: 1px solid rgba(120, 165, 210, 0.32);
  border-radius: 24px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  color: rgba(230, 235, 255, 0.92);
}

.lk-notice--embedded {
  max-width: 100%;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  background: transparent;
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  color: var(--lk-text);
}

.lk-notice__title {
  margin: 0 0 12px;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(120, 165, 210, 0.28);
  color: #fff;
}

.lk-notice--embedded .lk-notice__title {
  margin: 0;
  padding: 0;
  border: none;
}

/* 嵌入：顶栏粉彩、图标+标题居中 */
.lk-notice__title--band {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: #fde2f0;
  border-radius: 14px 14px 0 0;
}

.lk-notice__title-inner {
  letter-spacing: 0.02em;
}

.lk-notice__title--band .lk-notice__title-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #9d174d;
  white-space: nowrap;
}

.lk-notice__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lk-notice--embedded .lk-notice__list {
  padding: 10px 12px 12px;
  gap: 8px;
}

.lk-notice__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(198, 214, 236, 0.9);
}

.lk-notice--embedded .lk-notice__item {
  color: var(--lk-text-body);
}

.lk-notice__icon {
  flex-shrink: 0;
  line-height: 1.4;
}

.lk-notice__text strong {
  color: rgba(190, 212, 240, 0.95);
  font-weight: 600;
}

.lk-notice--embedded .lk-notice__text strong {
  color: var(--lk-text);
  font-weight: 600;
}
</style>

<style>
[data-theme='dark'] .lk-notice__title--band {
  background: rgba(236, 72, 153, 0.22);
}

[data-theme='dark'] .lk-notice__title-inner {
  color: #fbcfe8;
}
</style>
