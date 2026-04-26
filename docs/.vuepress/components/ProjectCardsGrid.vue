<template>
  <section class="lk-proj-cards" aria-label="Projects list cards">
    <div class="lk-proj-filter" role="tablist" aria-label="按角色筛选项目">
      <button
        v-for="role in roleOptions"
        :key="role.id"
        type="button"
        class="lk-proj-filter__tag"
        :class="{ 'is-active': currentRole === role.id }"
        role="tab"
        :aria-selected="currentRole === role.id"
        :aria-label="`${role.label} (${role.count})`"
        @click="currentRole = role.id"
      >
        {{ role.label }}
        <span class="lk-proj-filter__count">{{ role.count }}</span>
      </button>
    </div>

    <div class="lk-proj-cards__grid">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.title"
        :to="item.to"
        class="lk-proj-card"
        :aria-label="item.title"
      >
        <img v-if="item.cover" class="lk-proj-card__bg" :src="item.cover" alt="" aria-hidden="true" />
        <div class="lk-proj-card__body">
          <header class="lk-proj-card__top">
            <div class="lk-proj-card__heading">
              <span class="lk-proj-card__role">{{ item.role }}</span>
              <h3 class="lk-proj-card__title">{{ item.title }}</h3>
            </div>
            <span class="lk-proj-card__arrow" aria-hidden="true">↗</span>
          </header>

          <p class="lk-proj-card__preview">{{ item.summary }}</p>

          <div class="lk-proj-card__bottom">
            <span class="lk-proj-card__tag">{{ item.tag }}</span>
          </div>
        </div>
      </RouterLink>
    </div>

    <div v-if="filteredItems.length === 0" class="lk-proj-cards__empty">
      这个角色下还没有项目。
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { PROJECT_ROLES } from '../data/projectRoles.js'

const currentRole = ref('all')

const roleMapping = {
  产品运营: 'pm',
  教育产品: 'pm',
  产品策略: 'pm',
  作品集信息架构: 'pm',
  内容产品: 'pm',
  'AI 产品': 'ai-product',
  'AI 效率工具': 'ai-product',
  前端开发: 'frontend',
  作品集前端: 'frontend',
  前端文档: 'frontend',
  交互系统: 'frontend',
  创作者工具: 'backend',
  嵌入式: 'embedded',
  机器人: 'embedded',
  'AI 基础设施': 'ai-engineering',
  'AI 应用': 'ai-engineering',
  边缘机器学习: 'ml',
  机器学习: 'ml',
}

const roleOptions = computed(() => [
  { id: 'all', label: '全部', count: items.length },
  ...PROJECT_ROLES.map((role) => ({
    id: roleToId(role.label),
    label: role.label.split(' / ')[0],
    count: role.count,
  })),
])

function roleToId(label) {
  const map = {
    'PM / Product Manager': 'pm',
    'AI Product / AI Product': 'ai-product',
    'Frontend / Frontend': 'frontend',
    'Backend / Backend': 'backend',
    'Embedded / Embedded': 'embedded',
    'AI Engineer / AI Engineering': 'ai-engineering',
    'ML Engineer / ML': 'ml',
  }

  return map[label] || 'pm'
}

function getProjectRoleId(role) {
  return roleMapping[role] || 'pm'
}

const items = [
  { title: '博客发布工作流', role: '产品运营', tag: '发布系统', to: '/article/git-release-map.html', summary: '把发布链路整理成一套可重复执行的流程。', cover: '/gallery/proj-card-blog-publishing-workflow-1776962147834.png' },
  { title: 'AI 封面生成工作流', role: 'AI 产品', tag: 'AI 生图', to: '/article/ai-key-router-one-api-zcode-ccswitch.html', summary: '让封面生成更稳定，也更容易沉淀本地素材。', cover: '/gallery/proj-card-ai-cover-workflow-1776962183221.png' },
  { title: '留学信息规划器', role: '教育产品', tag: '决策工具', to: '/study/', summary: '把学校与申请信息整理成更易比较的结构。', cover: '/gallery/proj-card-study-abroad-planner-1776962194851.png' },
  { title: 'PM 作品集 PRD', role: '产品策略', tag: '作品集', to: '/article/pm-portfolio-prd.html', summary: '把博客转成更适合招聘语境的作品集入口。', cover: '/gallery/proj-card-pm-portfolio-prd-1776962204341.png' },
  { title: 'Projects 分页设计', role: '作品集信息架构', tag: '信息架构', to: '/article/pm-projects-pagination-galaxy.html', summary: '用分页和层级降低 Projects 页面的扫描成本。', cover: '/gallery/proj-card-projects-pagination-1776962214634.png' },
  { title: 'AI Key Router', role: 'AI 基础设施', tag: '模型路由', to: '/article/ai-key-router-one-api-zcode-ccswitch.html', summary: '梳理多模型调用、密钥管理和供应商切换。', cover: '/gallery/proj-card-ai-key-router-1776962226315.png' },
  { title: '个人博客系统', role: '前端开发', tag: '静态站点', to: '/tech/my-blog.html', summary: '统一承载文章、项目和文档的前端系统。', cover: '/gallery/proj-card-personal-blog-system-1776962234783.png' },
  { title: '文章批量操作', role: '创作者工具', tag: '批量操作', to: '/article/git-release-map.html', summary: '用批量动作和校验减少重复性的发布工作。', cover: '/gallery/proj-card-article-batch-ops-1776962249699.png' },
  { title: '项目入口卡片', role: '作品集前端', tag: '项目展示', to: '/tech/', summary: '让每张项目卡片都能更快传达背景与结果。', cover: '/gallery/proj-card-projects-entry-grid-1776962264405.png' },
  { title: 'VuePress 技术笔记', role: '前端文档', tag: '技术文档', to: '/article/vuepress-stack-notes.html', summary: '沉淀组件注册、样式约束和页面拼装经验。', cover: '/gallery/proj-card-vuepress-stack-notes-1776962277275.png' },
  { title: '导航与控制设计', role: '交互系统', tag: '导航体验', to: '/tech/my-blog.html', summary: '提升导航反馈和高频浏览时的操作效率。', cover: '/gallery/proj-card-navigation-controls-1776962287942.png' },
  { title: '文章索引设计', role: '内容产品', tag: '内容发现', to: '/article/', summary: '把文章页变成更清晰的索引和发现入口。', cover: '/gallery/proj-card-article-index-1776962304303.png' },
  { title: '信科 ICT 比赛', role: '嵌入式', tag: '工程案例', to: '/tech/xinke-sai.html', summary: '把硬件、控制和调试整理成完整项目案例。', cover: '/gallery/proj-card-xinke-ict-competition-1776962319843.png' },
  { title: '全国智能车', role: '机器人', tag: '控制系统', to: '/tech/smartcar-nationwide.html', summary: '把竞赛经历转译成更好理解的机器人项目。', cover: '/gallery/proj-card-national-intelligent-car-1776962334677.png' },
  { title: '边缘 AI 推理', role: '边缘机器学习', tag: '边缘部署', to: '/tech/ai-edge-inference.html', summary: '验证边缘侧 AI 推理和设备测试中的关键取舍。', cover: '/gallery/proj-card-edge-ai-inference-1776962344919.png' },
  { title: '视觉 ML 流水线', role: '机器学习', tag: '视觉模型', to: '/tech/ai-vision-pipeline.html', summary: '记录从训练到部署的完整视觉项目链路。', cover: '/gallery/proj-card-vision-ml-pipeline-1776962358492.png' },
  { title: 'LLM RAG 助手', role: 'AI 应用', tag: '检索增强', to: '/tech/ai-llm-rag.html', summary: '提升长文档问答的可追溯性和可靠性。', cover: '/gallery/proj-card-llm-rag-assistant-1776962372073.png' },
  { title: '提示词模板库', role: 'AI 效率工具', tag: '提示词', to: '/article/ai妯℃澘.html', summary: '整理可复用模板，让 AI 协作输出更稳定。', cover: '/gallery/proj-card-prompt-template-library-1776962382574.png' },
]

const filteredItems = computed(() => {
  if (currentRole.value === 'all') return items
  return items.filter((item) => getProjectRoleId(item.role) === currentRole.value)
})

const visibleItems = computed(() => filteredItems.value)
</script>

<style scoped>
.lk-proj-cards {
  padding: 0.25rem 0 1.25rem;
}

.lk-proj-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 1.5rem;
  padding: 1rem 0 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.42) 0%, rgba(15, 23, 42, 0.28) 100%);
  border-radius: 12px;
}

.lk-proj-filter__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.56);
  color: rgba(226, 232, 240, 0.92);
  font-size: 0.85rem;
  font-weight: 620;
  cursor: pointer;
}

.lk-proj-filter__tag.is-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.38), rgba(37, 99, 235, 0.42));
  border-color: rgba(96, 165, 250, 0.68);
  color: #ffffff;
}

.lk-proj-filter__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.62);
  font-size: 0.72rem;
  font-weight: 720;
  color: rgba(203, 213, 225, 0.96);
}

.lk-proj-cards__grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.lk-proj-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 196px;
  border: 1px solid rgba(96, 165, 250, 0.28);
  border-radius: 18px;
  color: rgba(241, 245, 249, 0.96);
  box-shadow: 0 2px 16px rgba(2, 6, 23, 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  text-decoration: none;
}

.lk-proj-card__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.lk-proj-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1rem;
  min-height: 196px;
  padding: 1.45rem 1.6rem 1.35rem;
}

.lk-proj-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.lk-proj-card__heading {
  display: grid;
  gap: 0.45rem;
}

.lk-proj-card__role {
  color: #ecfeff;
  font-size: 0.74rem;
  font-weight: 780;
  line-height: 1.35;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.72);
}

.lk-proj-card__title {
  color: #ffffff;
  font-size: 1.36rem;
  font-weight: 860;
  line-height: 1.22;
  margin: 0;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.82);
}

.lk-proj-card__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.9rem;
  height: 2.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
  flex-shrink: 0;
}

.lk-proj-card__preview {
  align-self: center;
  margin: 0;
  max-width: 40rem;
  color: rgba(248, 250, 252, 0.96);
  font-size: 0.92rem;
  line-height: 1.65;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.72);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

.lk-proj-card__bottom {
  display: flex;
  align-items: flex-end;
  margin-top: auto;
}

.lk-proj-card__tag {
  display: inline-flex;
  align-items: center;
  padding: 0.34rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-size: 0.78rem;
  font-weight: 760;
  line-height: 1;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
}

.lk-proj-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.5);
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.45);
}

.lk-proj-card,
.lk-proj-card:hover,
.lk-proj-card:focus,
.lk-proj-card:active,
.lk-proj-card *,
.lk-proj-card *:hover,
.lk-proj-card *:focus,
.lk-proj-card *:active {
  text-decoration: none !important;
  -webkit-text-decoration: none !important;
}

.lk-proj-cards__empty {
  padding: 3rem 2rem;
  text-align: center;
  color: rgba(203, 213, 225, 0.86);
  font-size: 0.95rem;
  background: rgba(30, 41, 59, 0.38);
  border: 2px dashed rgba(148, 163, 184, 0.32);
  border-radius: 12px;
  margin-top: 1rem;
}

@media (max-width: 719px) {
  .lk-proj-card__body {
    padding: 1.1rem;
  }

  .lk-proj-card__title {
    font-size: 1.12rem;
  }

  .lk-proj-card__arrow {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }
}

[data-theme='light'] .lk-proj-card {
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
}

[data-theme='light'] .lk-proj-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

[data-theme='light'] .lk-proj-filter {
  background: rgba(241, 245, 249, 0.7);
  border-bottom-color: rgba(15, 23, 42, 0.08);
}

[data-theme='light'] .lk-proj-filter__tag {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(15, 23, 42, 0.1);
  color: #334155;
}
</style>
