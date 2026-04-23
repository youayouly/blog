<template>
  <section class="lk-proj-cards" aria-label="Projects list cards">
    <!-- 岗位筛选标签栏 -->
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
            <p class="lk-proj-card__preview">{{ previewText(item) }}</p>
          </header>

          <div class="lk-proj-card__details">
            <dl class="lk-proj-card__meta">
              <div class="lk-proj-card__meta-row">
                <dt>项目目标</dt>
                <dd>{{ item.goal }}</dd>
              </div>
              <div class="lk-proj-card__meta-row">
                <dt>我的贡献</dt>
                <dd>{{ item.contribution }}</dd>
              </div>
              <div class="lk-proj-card__meta-row">
                <dt>最终成果</dt>
                <dd>{{ item.outcome }}</dd>
              </div>
            </dl>

            <div class="lk-proj-card__tags">
              <div class="lk-proj-card__tag-group">
                <span
                  v-for="tag in item.techTags"
                  :key="`${item.title}-${tag}`"
                  class="lk-proj-card__tag lk-proj-card__tag--tech"
                >
                  {{ tag }}
                </span>
              </div>
              <div class="lk-proj-card__tag-group">
                <span
                  v-for="tag in item.businessTags"
                  :key="`${item.title}-${tag}`"
                  class="lk-proj-card__tag lk-proj-card__tag--business"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>

    <div v-if="filteredItems.length === 0" class="lk-proj-cards__empty">
      该分类下暂无项目，请尝试其他筛选条件。
    </div>

    <nav v-else class="lk-pager" aria-label="Projects pagination">
      <button
        v-for="page in totalPages"
        :key="page"
        type="button"
        class="lk-pager__button"
        :class="{ 'is-active': page === currentPage }"
        :aria-current="page === currentPage ? 'page' : undefined"
        @click="currentPage = page"
      >
        {{ page }}
      </button>
    </nav>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { PROJECT_ROLES } from '../data/projectRoles.js'

const pageSize = 9
const currentPage = ref(1)
const currentRole = ref('all')

// 岗位映射：将项目 role 字段映射到岗位分类
const roleMapping = {
  // 产品经理相关
  'Product Operations': 'pm',
  'AI Product': 'ai-product',
  'Education Product': 'pm',
  'Product Strategy': 'pm',
  'Portfolio IA': 'pm',

  // 前端相关
  'Frontend': 'frontend',
  'Portfolio Frontend': 'frontend',
  'Frontend Docs': 'frontend',
  'UX Systems': 'frontend',

  // 嵌入式相关
  'Embedded': 'embedded',
  'Robotics': 'embedded',
  'Edge ML': 'embedded',

  // AI 工程相关
  'AI Infrastructure': 'ai-engineering',
  'AI Application': 'ai-engineering',
  'AI Productivity': 'ai-engineering',

  // 机器学习相关
  'Machine Learning': 'ml',

  // 工具链/DevOps 相关
  'Creator Tools': 'devops',

  // 后端相关
  'Content Product': 'backend',

  // 系统架构相关
  'Portfolio Frontend': 'architecture',

  // 未分类
  'default': 'uncategorized'
}

// 构建筛选选项
const roleOptions = computed(() => {
  return [
    { id: 'all', label: '全部', count: items.length },
    ...PROJECT_ROLES.filter(r => r.label !== '未分类项目').map(role => ({
      id: roleToId(role.label),
      label: role.label.split(' / ')[0],
      count: role.count
    }))
  ]
})

// 将岗位标签转换为 ID
function roleToId(label) {
  const map = {
    '产品经理 / PM': 'pm',
    'AI 产品 / AI Product': 'ai-product',
    '前端 / Frontend': 'frontend',
    '嵌入式 / Embedded': 'embedded',
    '工具链 / DevOps': 'devops',
    'AI 工程 / AI Engineering': 'ai-engineering',
    '机器学习 / ML': 'ml',
    '后端 / Backend': 'backend',
    '系统架构 / Architecture': 'architecture',
    '未分类项目': 'uncategorized'
  }
  return map[label] || 'uncategorized'
}

// 根据项目 role 获取岗位 ID
function getProjectRoleId(role) {
  return roleMapping[role] || 'uncategorized'
}

// 筛选后的项目列表
const filteredItems = computed(() => {
  if (currentRole.value === 'all') {
    return items
  }
  return items.filter(item => getProjectRoleId(item.role) === currentRole.value)
})

// 监听筛选变化，重置到第一页
watch(currentRole, () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / pageSize))
const visibleItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function cardSurfaceStyle(item, idx) {
  const seed = hashString(`${item.title}\0${item.to}`)
  const rnd = mulberry32(seed)
  const row = Math.floor(idx / 3)
  const col = idx % 3
  const tintAlpha = 0.16 + rnd() * 0.1
  return {
    '--proj-cell-col': String(col),
    '--proj-cell-row': String(row),
    '--proj-tint': `rgba(6, 18, 38, ${tintAlpha.toFixed(3)})`,
  }
}

function previewText(item) {
  const text = `${item.goal} ${item.outcome}`
  return text.length > 60 ? `${text.slice(0, 60)}...` : text
}

const items = [
  {
    title: 'Blog Publishing Workflow',
    role: 'Product Operations',
    to: '/article/git-release-map.html',
    goal: '把内容发布、预览、删除和回滚整理成稳定的发布路径。',
    contribution: '设计发布步骤、梳理检查点，并把本地流程沉淀成可重复执行的操作台。',
    outcome: '形成更稳的内容交付链路，降低人工切换和发布失误。',
    techTags: ['VuePress', 'Git', 'Release'],
    businessTags: ['Content Ops', 'Workflow'],
  },
  {
    title: 'AI Cover Workflow',
    role: 'AI Product',
    to: '/article/ai-key-router-one-api-zcode-ccswitch.html',
    goal: '把封面生成从偶发尝试变成可维护的 AI 工作流。',
    contribution: '接入多模型与失败回退策略，补齐日志与资产保存。',
    outcome: '封面产出速度更快，且生成失败时可追踪、可重试。',
    techTags: ['AI API', 'Image Gen', 'Fallback'],
    businessTags: ['Creator Tools', 'Quality'],
  },
  {
    title: 'Study Abroad Planner',
    role: 'Education Product',
    to: '/study/',
    goal: '把学校、项目和申请信息整理成可搜索、可比较的决策面板。',
    contribution: '设计信息结构、筛选维度和申请材料输入路径。',
    outcome: '把零散调研转成可复用的选校与文书支持工具。',
    techTags: ['Search', 'RAG', 'Forms'],
    businessTags: ['Education', 'Decision Support'],
  },
  {
    title: 'PM Portfolio PRD',
    role: 'Product Strategy',
    to: '/article/pm-portfolio-prd.html',
    goal: '把博客内容重构成面向求职场景的作品集入口。',
    contribution: '定义岗位视角、案例结构和证据组织方式。',
    outcome: '个人站从技术记录页升级为更明确的求职展示面。',
    techTags: ['Portfolio', 'IA', 'UX'],
    businessTags: ['PM', 'Recruiting'],
  },
  {
    title: 'Projects Pagination',
    role: 'Portfolio IA',
    to: '/article/pm-projects-pagination-galaxy.html',
    goal: '解决 Projects 页面信息堆叠和浏览成本过高的问题。',
    contribution: '拆分页结构、重排项目顺序，并引入岗位视角分类。',
    outcome: '项目内容更易扫描，页面层次更适合招聘方快速浏览。',
    techTags: ['Vue', 'Pagination', 'Layout'],
    businessTags: ['Portfolio', 'Scanning'],
  },
  {
    title: 'AI Key Router',
    role: 'AI Infrastructure',
    to: '/article/ai-key-router-one-api-zcode-ccswitch.html',
    goal: '梳理多模型、多平台调用时的鉴权和转发问题。',
    contribution: '整合供应商 key、路由层和本地调用工具的关系。',
    outcome: '模型切换和调用链更清晰，后续扩展成本更低。',
    techTags: ['Routing', 'Keys', 'One API'],
    businessTags: ['Infra', 'Reliability'],
  },
  {
    title: 'Personal Blog System',
    role: 'Frontend',
    to: '/tech/my-blog.html',
    goal: '搭建一个能承载技术文章、项目页和案例页的静态站。',
    contribution: '完成主题定制、组件接入和页面信息架构设计。',
    outcome: '博客、项目和文档统一到一个可持续维护的站点系统。',
    techTags: ['VuePress', 'SCSS', 'Vite'],
    businessTags: ['Brand', 'Content'],
  },
  {
    title: 'Article Batch Ops',
    role: 'Creator Tools',
    to: '/article/git-release-map.html',
    goal: '减少文章发布时的重复确认和人工清理动作。',
    contribution: '设计批量删除预览、发布前检查和状态反馈。',
    outcome: '内容维护效率提升，批量操作的风险更可控。',
    techTags: ['Tooling', 'Validation', 'Automation'],
    businessTags: ['Operations', 'Efficiency'],
  },
  {
    title: 'Projects Entry Grid',
    role: 'Portfolio Frontend',
    to: '/tech/',
    goal: '让项目卡片同时表达背景、职责和成果，而不是只堆一段说明。',
    contribution: '重写卡片结构，加入 metadata 和标签分组。',
    outcome: '项目列表的可读性和筛选感更强，视觉也更干净。',
    techTags: ['Cards', 'Metadata', 'Responsive'],
    businessTags: ['Portfolio', 'Hiring'],
  },
  {
    title: 'VuePress Stack Notes',
    role: 'Frontend Docs',
    to: '/article/vuepress-stack-notes.html',
    goal: '沉淀 VuePress 组件、主题和全局样式的维护经验。',
    contribution: '记录组件注册、样式约束和页面装配方式。',
    outcome: '后续扩展页面时复用成本更低，也更不容易踩坑。',
    techTags: ['VuePress', 'Components', 'Docs'],
    businessTags: ['Knowledge Base', 'Maintainability'],
  },
  {
    title: 'Navigation Controls',
    role: 'UX Systems',
    to: '/tech/my-blog.html',
    goal: '让导航、状态切换和访问路径更适配高频浏览。',
    contribution: '设计导航显隐、状态反馈和轻量交互细节。',
    outcome: '站点在桌面和窄屏场景下都更顺手。',
    techTags: ['UX', 'State', 'Interaction'],
    businessTags: ['Ergonomics', 'Clarity'],
  },
  {
    title: 'Article Index',
    role: 'Content Product',
    to: '/article/',
    goal: '把文章页做成更易浏览的内容目录，而不是单列堆叠。',
    contribution: '加入侧栏目录、统计卡片和分页结构。',
    outcome: '文章入口的检索感和导航感更明显。',
    techTags: ['Index', 'Pagination', 'Sidebar'],
    businessTags: ['Content Discovery', 'Information Design'],
  },
  {
    title: 'Xinke ICT Competition',
    role: 'Embedded',
    to: '/tech/xinke-sai.html',
    goal: '整理竞赛项目里的工程方案与实现路径。',
    contribution: '归纳硬件、控制、调试和复盘信息。',
    outcome: '比赛经验被整理成更完整的可展示案例。',
    techTags: ['Embedded', 'Sensors', 'Control'],
    businessTags: ['Competition', 'Execution'],
  },
  {
    title: 'National Intelligent Car',
    role: 'Robotics',
    to: '/tech/smartcar-nationwide.html',
    goal: '展示自动控制和路径规划相关的项目能力。',
    contribution: '梳理控制逻辑、调参过程和系统验证。',
    outcome: '把竞赛项目翻译成更容易理解的工程案例。',
    techTags: ['Robotics', 'PID', 'Path Planning'],
    businessTags: ['Systems', 'Performance'],
  },
  {
    title: 'Edge AI Inference',
    role: 'Edge ML',
    to: '/tech/ai-edge-inference.html',
    goal: '验证端侧模型部署时的性能与精度平衡。',
    contribution: '整理量化、推理和设备验证路径。',
    outcome: '形成可复用的端侧 AI 部署检查清单。',
    techTags: ['Edge AI', 'Quantization', 'Inference'],
    businessTags: ['Optimization', 'Deployment'],
  },
  {
    title: 'Vision ML Pipeline',
    role: 'Machine Learning',
    to: '/tech/ai-vision-pipeline.html',
    goal: '打通视觉模型从训练到部署的完整流程。',
    contribution: '记录数据、训练、评估和导出的关键步骤。',
    outcome: '项目复盘更完整，也便于后续迁移复用。',
    techTags: ['Computer Vision', 'Training', 'Evaluation'],
    businessTags: ['Pipeline', 'Reuse'],
  },
  {
    title: 'LLM RAG Assistant',
    role: 'AI Application',
    to: '/tech/ai-llm-rag.html',
    goal: '用检索增强方式提升长文档问答的可信度。',
    contribution: '围绕切片、召回和引用结构组织方案。',
    outcome: '问答结果更容易追溯到原始材料。',
    techTags: ['LLM', 'RAG', 'Embeddings'],
    businessTags: ['Trust', 'Knowledge'],
  },
  {
    title: 'Prompt Template Library',
    role: 'AI Productivity',
    to: '/article/ai妯℃澘.html',
    goal: '沉淀可复用的提示词模板，减少重复写法。',
    contribution: '整理场景模板和输出约束。',
    outcome: 'AI 协作的稳定性和复用率更高。',
    techTags: ['Prompts', 'Templates', 'AI Workflow'],
    businessTags: ['Productivity', 'Standardization'],
  },
]

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
  padding: 1rem 0.5rem 0.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.42) 0%, rgba(15, 23, 42, 0.28) 100%);
  border-radius: 12px;
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
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  width: 100%;
  margin: 0;
}

@media (max-width: 1799px) {
  .lk-proj-cards__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1399px) {
  .lk-proj-cards__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1023px) {
  .lk-proj-cards__grid {
    grid-template-columns: 1fr;
  }
}

.lk-proj-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 280px;
  border: 1px solid rgba(96, 165, 250, 0.28);
  border-radius: 14px;
  color: rgba(241, 245, 249, 0.96);
  box-shadow: 0 2px 16px rgba(2, 6, 23, 0.28);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  text-decoration: none;
  display: block;
  background:
    url('/gallery/star-source.png'),
    linear-gradient(138deg, rgba(6, 16, 34, 0.98), rgba(7, 18, 40, 0.96));
  background-size:
    300% 300%,
    cover;
  background-position:
    calc(var(--proj-cell-col, 0) * 50%) calc(var(--proj-cell-row, 0) * 50%),
    center;
  background-repeat: no-repeat;
}

.lk-proj-card__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(168deg, rgba(2, 6, 23, 0.32), rgba(2, 6, 23, 0.82)),
    linear-gradient(0deg, var(--proj-tint), var(--proj-tint));
}

.lk-proj-card__body {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 0.85rem;
  min-height: 280px;
  padding: 16px 14px 14px;
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
  min-height: 2.8rem;
}

.lk-proj-card__details {
  display: grid;
  gap: 0.8rem;
  align-self: end;
}

.lk-proj-card__meta {
  display: grid;
  gap: 0.55rem;
  margin: 0;
}

.lk-proj-card__meta-row {
  display: grid;
  gap: 0.15rem;
}

.lk-proj-card__meta-row dt {
  font-size: 0.72rem;
  font-weight: 760;
  color: #93c5fd;
}

.lk-proj-card__meta-row dd {
  margin: 0;
  color: rgba(241, 245, 249, 0.95);
  font-size: 0.82rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.lk-proj-card__tags {
  display: grid;
  gap: 0.45rem;
}

.lk-proj-card__tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.lk-proj-card__tag {
  padding: 0.26rem 0.58rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 760;
  line-height: 1.2;
}

.lk-proj-card__tag--tech {
  color: #dbeafe;
  background: rgba(59, 130, 246, 0.22);
  border: 1px solid rgba(147, 197, 253, 0.4);
}

.lk-proj-card__tag--business {
  color: #dcfce7;
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid rgba(134, 239, 172, 0.34);
}

.lk-proj-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.5);
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.45);
}

.lk-proj-card:hover .lk-proj-card__meta-row dd {
  -webkit-line-clamp: unset;
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
