<template>
  <div class="lk-home-side-panel">
    <div class="lk-home-side-panel__shell">
      <VisitorWelcomeCard
        class="lk-home-side-panel__block lk-home-side-panel__block--welcome"
      />
      <ProfileCard
        embedded
        class="lk-home-side-panel__block lk-home-side-panel__block--profile"
      />
      <NoticeCard
        embedded
        class="lk-home-side-panel__block lk-home-side-panel__block--notice"
      />
      <SiteStatsCard
        variant="sidebar"
        embedded
        class="lk-home-side-panel__block lk-home-side-panel__block--stats"
      />
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
  max-width: 320px;
  min-width: 0;
  margin-inline: auto;
  box-sizing: border-box;
}

/* 透明外壳：仅堆叠卡片，无二次玻璃框 */
.lk-home-side-panel__shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-sizing: border-box;
}

/* 白卡片：无左侧色条；内边距由各模块标题栏 + 正文区自行控制 */
.lk-home-side-panel__block {
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border-radius: 14px;
  background: var(--lk-card) !important;
  border: 1px solid var(--lk-border) !important;
  box-shadow:
    0 1px 2px var(--lk-shadow-soft),
    0 6px 18px var(--lk-shadow-soft) !important;
  box-sizing: border-box;
  transition:
    box-shadow 0.3s ease,
    background-color 0.35s ease,
    border-color 0.35s ease;
}
</style>
