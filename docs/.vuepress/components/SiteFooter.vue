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
const year = new Date().getFullYear()
</script>

<style scoped>
.lk-footer {
  width: 100%;
  font-family: inherit;
  user-select: none;
}

.lk-footer__meta-bar {
  background: linear-gradient(92deg, var(--lk-primary) 0%, var(--lk-accent) 100%);
  color: rgba(255, 255, 255, 0.94);
  padding: 8px 20px;
  text-align: center;
  transition: filter 0.35s ease;
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
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  transition: opacity 0.2s;
}

.lk-footer__link:hover {
  opacity: 1;
  text-decoration: underline;
}
</style>
