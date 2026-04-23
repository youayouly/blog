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
          <p>{{ pmCase.summary }}</p>
          <div class="lk-pm-card__tags" aria-label="案例亮点">
            <span v-for="tag in pmCase.tags" :key="tag">{{ tag }}</span>
          </div>
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
    summary: '把文章上传、预览、删除队列和本地发布串成一个更稳定的内容生产流程。',
    tags: ['批量发布', '删除队列', '发布校验'],
    to: '/article/git-release-map.html',
    image: '/gallery/article-cover-pm-creator-tools-galaxy-background-1776845225450.png',
  },
  {
    title: 'AI 封面生成工作流',
    area: 'AI Operations',
    role: '体验与质量',
    summary: '接入 SiliconFlow 生图能力，解决封面 fallback、乱码文字和本地资产沉淀问题。',
    tags: ['AI 生图', '本地存储', '失败可见'],
    to: '/article/ai-key-router-one-api-zcode-ccswitch.html',
    image: '/gallery/article-cover-pm-ai-operations-galaxy-background-1776845342410.png',
  },
  {
    title: '留学信息规划器',
    area: 'Education',
    role: '信息架构',
    summary: '把分散的国家、申请路径和个人研究整理成可比较、可复用的决策信息层。',
    tags: ['信息架构', '决策支持', '内容组织'],
    to: '/study/',
    image: '/gallery/article-cover-pm-education-planner-galaxy-background-1776845371967.png',
  },
  {
    title: 'PM Portfolio PRD',
    area: 'Portfolio',
    role: '求职叙事',
    summary: '把博客内容重构成更适合招聘方理解的产品经理作品集入口，突出问题、方案与结果。',
    tags: ['作品集', '招聘叙事', '案例结构'],
    to: '/article/pm-portfolio-prd.html',
    image: '/gallery/article-cover-product-manager-portfolio-prd-1776831264136.png',
  },
  {
    title: 'Projects Pagination',
    area: 'Portfolio',
    role: '信息架构',
    summary: '把项目入口拆成更容易扫描的结构，方便快速理解能力范围和案例深度。',
    tags: ['分页', '信息架构', '浏览效率'],
    to: '/article/pm-projects-pagination-galaxy.html',
    image: '/gallery/article-cover-pm-ai-operations-galaxy-background-1776845342410.png',
  },
  {
    title: 'Article Index Design',
    area: 'Content',
    role: '内容产品',
    summary: '把文章页做成更清晰的目录入口，让标签、分页和入口层级更接近产品化浏览体验。',
    tags: ['内容产品', '标签体系', '目录设计'],
    to: '/article/',
    image: '/gallery/article-cover-personal-knowledge-garden-1776832492231.png',
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
    radial-gradient(circle at 18% 18%, rgba(20, 184, 166, 0.25), transparent 34%),
    linear-gradient(160deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.68) 58%, rgba(2, 6, 23, 0.78));
}

.lk-pm-card__body {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 0.7rem;
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

.lk-pm-card p {
  margin: 0;
  color: rgba(241, 245, 249, 0.95);
  font-size: 0.9rem;
  line-height: 1.7;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.78);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.lk-pm-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-self: end;
}

.lk-pm-card__tags span {
  max-width: 100%;
  padding: 0.2rem 0.52rem;
  border-radius: 999px;
  border: 1px solid rgba(204, 251, 241, 0.42);
  background: rgba(15, 23, 42, 0.58);
  color: #ccfbf1;
  font-size: 0.72rem;
  font-weight: 760;
  line-height: 1.35;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.28);
}

.lk-pm-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.64);
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.5);
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
</style>
