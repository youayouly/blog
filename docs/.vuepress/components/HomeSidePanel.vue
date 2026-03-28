<template>
  <div class="lk-home-side-panel">
    <div class="lk-home-side-panel__shell">
      <VisitorWelcomeCard class="lk-home-side-panel__block" />
      <ProfileCard embedded class="lk-home-side-panel__block" />
      <NoticeCard embedded class="lk-home-side-panel__block" />
      <SiteStatsCard variant="sidebar" embedded class="lk-home-side-panel__block" />
    </div>
  </div>
</template>

<script setup>
import VisitorWelcomeCard from './VisitorWelcomeCard.vue'
import ProfileCard from './ProfileCard.vue'
import NoticeCard from './NoticeCard.vue'
import SiteStatsCard from './SiteStatsCard.vue'
</script>

<style scoped>
.lk-home-side-panel {
  width: 100%;
  max-width: 100%;
}

/* 明亮毛玻璃控制面板（与右侧内容区顶对齐） */
.lk-home-side-panel__shell {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
  padding: 12px 12px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(28px) saturate(1.8);
  -webkit-backdrop-filter: blur(28px) saturate(1.8);
  box-shadow:
    0 8px 40px rgba(15, 23, 42, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.90);
  box-sizing: border-box;
}

.lk-home-side-panel__block {
  width: 100%;
  min-width: 0;
}
</style>
