<template>
  <section class="lk-proj-cards" aria-label="Projects list cards">
    <div class="lk-proj-filter" role="tablist" aria-label="Filter projects by role">
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
        v-for="(item, idx) in visibleItems"
        :key="item.title"
        :to="item.to"
        class="lk-proj-card"
        :style="cardSurfaceStyle(item, idx)"
        :aria-label="item.title"
      >
        <div class="lk-proj-card__scrim" aria-hidden="true" />
        <div class="lk-proj-card__body">
          <header class="lk-proj-card__top">
            <span class="lk-proj-card__role">{{ item.role }}</span>
            <h3 class="lk-proj-card__title">{{ item.title }}</h3>
            <p class="lk-proj-card__preview">{{ item.summary }}</p>
          </header>
        </div>
      </RouterLink>
    </div>

    <div v-if="filteredItems.length === 0" class="lk-proj-cards__empty">
      No projects in this role yet.
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { PROJECT_ROLES } from '../data/projectRoles.js'

const currentRole = ref('all')

const roleMapping = {
  'Product Operations': 'pm',
  'Education Product': 'pm',
  'Product Strategy': 'pm',
  'Portfolio IA': 'pm',
  'Content Product': 'pm',
  'AI Product': 'ai-product',
  'AI Productivity': 'ai-product',
  Frontend: 'frontend',
  'Portfolio Frontend': 'frontend',
  'Frontend Docs': 'frontend',
  'UX Systems': 'frontend',
  'Creator Tools': 'backend',
  Embedded: 'embedded',
  Robotics: 'embedded',
  'AI Infrastructure': 'ai-engineering',
  'AI Application': 'ai-engineering',
  'Edge ML': 'ml',
  'Machine Learning': 'ml',
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
  { title: 'Blog Publishing Workflow', role: 'Product Operations', to: '/article/git-release-map.html', summary: 'Turned publishing, preview, delete queue, and release checks into a repeatable content workflow.', cover: '/gallery/proj-card-blog-publishing-workflow-1776962147834.png' },
  { title: 'AI Cover Workflow', role: 'AI Product', to: '/article/ai-key-router-one-api-zcode-ccswitch.html', summary: 'Built a more reliable AI cover pipeline with fallback handling, visibility, and local asset persistence.', cover: '/gallery/proj-card-ai-cover-workflow-1776962183221.png' },
  { title: 'Study Abroad Planner', role: 'Education Product', to: '/study/', summary: 'Organized schools, projects, and application notes into a searchable and comparable decision system.', cover: '/gallery/proj-card-study-abroad-planner-1776962194851.png' },
  { title: 'PM Portfolio PRD', role: 'Product Strategy', to: '/article/pm-portfolio-prd.html', summary: 'Reframed the blog into a clearer portfolio entrance for hiring and product case communication.', cover: '/gallery/proj-card-pm-portfolio-prd-1776962204341.png' },
  { title: 'Projects Pagination', role: 'Portfolio IA', to: '/article/pm-projects-pagination-galaxy.html', summary: 'Reduced scan cost on the Projects page with better hierarchy, pagination, and role-based entry points.', cover: '/gallery/proj-card-projects-pagination-1776962214634.png' },
  { title: 'AI Key Router', role: 'AI Infrastructure', to: '/article/ai-key-router-one-api-zcode-ccswitch.html', summary: 'Clarified multi-model routing, key management, and provider switching across local AI workflows.', cover: '/gallery/proj-card-ai-key-router-1776962226315.png' },
  { title: 'Personal Blog System', role: 'Frontend', to: '/tech/my-blog.html', summary: 'Built a static site that carries articles, projects, and docs in one maintainable interface.', cover: '/gallery/proj-card-personal-blog-system-1776962234783.png' },
  { title: 'Article Batch Ops', role: 'Creator Tools', to: '/article/git-release-map.html', summary: 'Designed batch operations and preflight checks to reduce repetitive publishing cleanup work.', cover: '/gallery/proj-card-article-batch-ops-1776962249699.png' },
  { title: 'Projects Entry Grid', role: 'Portfolio Frontend', to: '/tech/', summary: 'Rebuilt project cards so each one communicates context, responsibility, and outcome at a glance.', cover: '/gallery/proj-card-projects-entry-grid-1776962264405.png' },
  { title: 'VuePress Stack Notes', role: 'Frontend Docs', to: '/article/vuepress-stack-notes.html', summary: 'Documented component registration, styling constraints, and page composition for reuse.', cover: '/gallery/proj-card-vuepress-stack-notes-1776962277275.png' },
  { title: 'Navigation Controls', role: 'UX Systems', to: '/tech/my-blog.html', summary: 'Improved navigation visibility, state feedback, and high-frequency browsing ergonomics.', cover: '/gallery/proj-card-navigation-controls-1776962287942.png' },
  { title: 'Article Index', role: 'Content Product', to: '/article/', summary: 'Turned the article page into a more productized index with tags, structure, and clearer discovery.', cover: '/gallery/proj-card-article-index-1776962304303.png' },
  { title: 'Xinke ICT Competition', role: 'Embedded', to: '/tech/xinke-sai.html', summary: 'Packaged hardware, control, and debugging work into a stronger engineering case study.', cover: '/gallery/proj-card-xinke-ict-competition-1776962319843.png' },
  { title: 'National Intelligent Car', role: 'Robotics', to: '/tech/smartcar-nationwide.html', summary: 'Translated robotics competition work into a readable embedded and control engineering project.', cover: '/gallery/proj-card-national-intelligent-car-1776962334677.png' },
  { title: 'Edge AI Inference', role: 'Edge ML', to: '/tech/ai-edge-inference.html', summary: 'Validated deployment tradeoffs for edge-side AI inference, quantization, and device testing.', cover: '/gallery/proj-card-edge-ai-inference-1776962344919.png' },
  { title: 'Vision ML Pipeline', role: 'Machine Learning', to: '/tech/ai-vision-pipeline.html', summary: 'Recorded the full training-to-deployment process for a reusable computer vision pipeline.', cover: '/gallery/proj-card-vision-ml-pipeline-1776962358492.png' },
  { title: 'LLM RAG Assistant', role: 'AI Application', to: '/tech/ai-llm-rag.html', summary: 'Used retrieval augmentation to make long-document Q&A more traceable and trustworthy.', cover: '/gallery/proj-card-llm-rag-assistant-1776962372073.png' },
  { title: 'Prompt Template Library', role: 'AI Productivity', to: '/article/ai模板.html', summary: 'Collected reusable prompt templates to make AI collaboration more stable and efficient.', cover: '/gallery/proj-card-prompt-template-library-1776962382574.png' },
]

const filteredItems = computed(() => {
  if (currentRole.value === 'all') return items
  return items.filter((item) => getProjectRoleId(item.role) === currentRole.value)
})

const visibleItems = computed(() => filteredItems.value)

function cardSurfaceStyle(item) {
  const style = {}
  if (item.cover) {
    style.backgroundImage = `linear-gradient(138deg, rgba(6, 16, 34, 0.92), rgba(7, 18, 40, 0.96)), url('${item.cover}')`
  }
  return style
}
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
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
  align-items: flex-start;
  align-content: flex-start;
}

.lk-proj-filter__tag {
  position: relative;
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
  line-height: 1;
  cursor: pointer;
  transition:
    all 0.16s ease,
    transform 0.08s ease;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.24);
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 100%;
}

.lk-proj-filter__tag:hover {
  background: rgba(51, 65, 85, 0.72);
  border-color: rgba(148, 163, 184, 0.52);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.32);
}

.lk-proj-filter__tag.is-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.38), rgba(37, 99, 235, 0.42));
  border-color: rgba(96, 165, 250, 0.68);
  color: #ffffff;
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.18),
    0 4px 14px rgba(37, 99, 235, 0.38);
  transform: translateY(-1px);
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

.lk-proj-filter__tag.is-active .lk-proj-filter__count {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
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
  min-height: 180px;
  border: 1px solid rgba(96, 165, 250, 0.28);
  border-radius: 14px;
  color: rgba(241, 245, 249, 0.96);
  box-shadow: 0 2px 16px rgba(2, 6, 23, 0.28);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  text-decoration: none;
  display: grid;
  grid-template-columns: 1fr auto;
  background-color: rgba(7, 18, 40, 0.96);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.lk-proj-card__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(2, 6, 23, 0.88) 0%, rgba(2, 6, 23, 0.6) 55%, rgba(2, 6, 23, 0.3) 100%);
}

.lk-proj-card__body {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 0.65rem;
  padding: 20px 24px;
  align-content: center;
}

.lk-proj-card__top {
  display: grid;
  gap: 0.45rem;
}

.lk-proj-card__role {
  color: #ccfbf1;
  font-size: 0.72rem;
  font-weight: 780;
  line-height: 1.35;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.72);
}

.lk-proj-card__title {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 820;
  line-height: 1.28;
  margin: 0;
  letter-spacing: 0;
  text-align: left;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.78);
}

.lk-proj-card__preview {
  margin: 0;
  color: rgba(241, 245, 249, 0.92);
  font-size: 0.88rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.lk-proj-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.5);
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.45);
}

.lk-proj-cards__empty {
  grid-column: 1 / -1;
  padding: 3rem 2rem;
  text-align: center;
  color: rgba(203, 213, 225, 0.86);
  font-size: 0.95rem;
  background: rgba(30, 41, 59, 0.38);
  border: 2px dashed rgba(148, 163, 184, 0.32);
  border-radius: 12px;
  margin-top: 1rem;
}
</style>
