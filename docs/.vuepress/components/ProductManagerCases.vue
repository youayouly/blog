<template>
  <section class="lk-pm-grid" aria-label="产品经理作品集">
    <div class="lk-pm-grid__grid">
      <RouterLink
        v-for="pmCase in pmCases"
        :key="pmCase.title"
        :to="pmCase.to"
        class="lk-pm-card"
        :style="{ '--pm-card-bg': `url('${pmCase.image}')` }"
      >
        <div class="lk-pm-card__scrim" aria-hidden="true" />
        <div class="lk-pm-card__body">
          <div class="lk-pm-card__top">
            <span>{{ pmCase.area }}</span>
            <strong>{{ pmCase.role }}</strong>
          </div>
          <h3>{{ pmCase.title }}</h3>
          <p class="lk-pm-card__summary">{{ pmCase.summary }}</p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const pmCases = [
  {
    title: '博客发布工作流',
    area: 'Creator Tools',
    role: '需求到发布',
    summary: '把上传、预览、删除队列和本地发布串成一条更稳定的内容生产流程。',
    to: '/article/git-release-map.html',
    image: '/gallery/proj-card-pm-blog-publishing-workflow-1777018373147.png',
  },
  {
    title: 'AI 封面生成工作流',
    area: 'AI Operations',
    role: '体验与质量',
    summary: '接入 SiliconFlow 生图能力，补齐封面 fallback、可见性和本地素材沉淀。',
    to: '/article/ai-key-router-one-api-zcode-ccswitch.html',
    image: '/gallery/proj-card-pm-ai-cover-workflow-1777018390268.png',
  },
  {
    title: '留学信息规划器',
    area: 'Education',
    role: '信息架构',
    summary: '把国家、申请路径和个人研究整理成更易比较和复用的决策信息层。',
    to: '/study/',
    image: '/gallery/proj-card-pm-study-abroad-planner-1777018410083.png',
  },
  {
    title: 'PM 作品集 PRD',
    area: 'Portfolio',
    role: '求职叙事',
    summary: '把博客内容重构成更适合招聘方理解的问题、方案与结果入口。',
    to: '/article/pm-portfolio-prd.html',
    image: '/gallery/proj-card-pm-portfolio-prd-1777018426515.png',
  },
  {
    title: 'Projects 分页设计',
    area: 'Portfolio',
    role: '信息架构',
    summary: '把项目入口拆成更易扫描的结构，降低浏览成本并强化案例层次。',
    to: '/article/pm-projects-pagination-galaxy.html',
    image: '/gallery/proj-card-pm-projects-pagination-1777018443481.png',
  },
  {
    title: '文章索引设计',
    area: 'Content',
    role: '内容产品',
    summary: '把文章页做成更清晰的目录入口，让标签、分页和层级更接近产品体验。',
    to: '/article/',
    image: '/gallery/proj-card-pm-article-index-design-1777018459314.png',
  },
]
</script>

<style scoped>
.lk-pm-grid {
  padding: 0;
  max-height: min(68vh, 860px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.35rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}

.lk-pm-grid::-webkit-scrollbar {
  width: 6px;
}

.lk-pm-grid::-webkit-scrollbar-track {
  background: transparent;
}

.lk-pm-grid::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.4);
  border-radius: 3px;
}

.lk-pm-grid::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.6);
}

.lk-pm-grid__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.lk-pm-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: block;
  min-height: 196px;
  color: #f8fafc;
  text-decoration: none;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 14px;
  box-shadow: 0 10px 32px rgba(2, 6, 23, 0.3);
  background:
    var(--pm-card-bg),
    linear-gradient(138deg, rgba(4, 47, 46, 0.98), rgba(8, 47, 73, 0.96));
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.lk-pm-card__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 18%, rgba(20, 184, 166, 0.2), transparent 34%),
    linear-gradient(160deg, rgba(2, 6, 23, 0.76), rgba(2, 6, 23, 0.42) 58%, rgba(2, 6, 23, 0.54));
}

.lk-pm-card__body {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 0.85rem;
  min-height: 196px;
  padding: 18px 16px 16px;
}

.lk-pm-card__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
  font-size: 0.75rem;
  line-height: 1.35;
  color: rgba(226, 232, 240, 0.94);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65);
}

.lk-pm-card__top strong {
  font-weight: 800;
  color: #ccfbf1;
}

.lk-pm-card h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 820;
  line-height: 1.28;
  letter-spacing: 0;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
  overflow-wrap: anywhere;
}

.lk-pm-card__summary {
  margin: auto 0 0;
  color: rgba(241, 245, 249, 0.96);
  font-size: 0.92rem;
  line-height: 1.7;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.72);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.lk-pm-card__summary::after {
  content: '';
}

[data-theme='light'] .lk-pm-card__summary {
  margin-top: auto;
  color: rgba(241, 245, 249, 0.96);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.68);
}

.lk-pm-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.64);
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.5);
  text-decoration: none;
}

.lk-pm-card,
.lk-pm-card:hover,
.lk-pm-card:focus,
.lk-pm-card:active,
.lk-pm-card *,
.lk-pm-card *:hover,
.lk-pm-card *:focus,
.lk-pm-card *:active {
  text-decoration: none !important;
}

@media (max-width: 719px) {
  .lk-pm-grid {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .lk-pm-grid__grid {
    grid-template-columns: 1fr;
  }
}

[data-theme='light'] .lk-pm-card {
  background:
    var(--pm-card-bg),
    linear-gradient(138deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.94));
  border-color: rgba(15, 23, 42, 0.1);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}

[data-theme='light'] .lk-pm-card__scrim {
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.52), rgba(15, 23, 42, 0.28) 58%, rgba(15, 23, 42, 0.38));
}

[data-theme='light'] .lk-pm-card__top {
  color: rgba(248, 250, 252, 0.96);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.62);
}

[data-theme='light'] .lk-pm-card__top strong {
  color: #99f6e4;
}

[data-theme='light'] .lk-pm-card h3 {
  color: #ffffff;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.72);
}

[data-theme='light'] .lk-pm-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
}
</style>
