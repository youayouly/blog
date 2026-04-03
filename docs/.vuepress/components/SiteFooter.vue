<template>
  <footer class="lk-footer">
    <div class="lk-footer__meta-bar">
      <div class="lk-footer__meta-text">
        © 2025–{{ year }} Luke's Space
        <span class="lk-footer__pipe">|</span>
        <span class="lk-footer__tech">VuePress · vuepress-theme-hope</span>
        <span class="lk-footer__pipe">|</span>
        <a href="/privacy" class="lk-footer__link">隐私政策</a>
        <span class="lk-footer__pipe">|</span>
        <a href="/license" class="lk-footer__link">版权协议</a>
        <span class="lk-footer__pipe">|</span>
        <a href="/sitemap.xml" class="lk-footer__link">站点地图</a>
        <span class="lk-footer__pipe">|</span>
        <a href="/rss.xml" class="lk-footer__link">RSS</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Build-time constant (vite define); do not use new Date() here — SSR vs client could differ.
const year = __LK_SITE_YEAR__
</script>

<style scoped>
.lk-footer {
  width: 100%;
  font-family: inherit;
  user-select: none;
}

.lk-footer__meta-bar {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  color: rgba(15, 23, 42, 0.66);
  padding: 8px 20px;
  text-align: center;
  position: relative;
  z-index: 1;
  /* Isolate compositing to reduce scroll-time global blur artifacts. */
  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;
}

.lk-footer__meta-text {
  font-size: 0.72rem;
  line-height: 1.65;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.lk-footer__pipe {
  opacity: 0.45;
  padding: 0 8px;
}

.lk-footer__tech {
  opacity: 0.88;
}

.lk-footer__link {
  color: rgba(15, 23, 42, 0.72);
  text-decoration: none;
  transition: opacity 0.2s;
}

.lk-footer__link:hover {
  opacity: 1;
  text-decoration: underline;
}

[data-theme='dark'] .lk-footer__meta-bar {
  background: rgba(2, 6, 23, 0.38);
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  color: rgba(226, 232, 240, 0.72);
}

[data-theme='dark'] .lk-footer__link {
  color: rgba(226, 232, 240, 0.82);
}
</style>
