import { PROJECT_ROLES } from './projectRoles.js'

export { PROJECT_ROLES }

export const roleMapping = {
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

export function roleToId(label) {
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

export function getProjectRoleId(role) {
  return roleMapping[role] || 'pm'
}

/** 故事视角标签：与职位正交，用于「你想强调的能力叙事」 */
export const PROJECT_FACETS = [
  {
    id: 'ai',
    label: 'AI',
    test(item) {
      const hay = `${item.title}${item.summary}${item.tag}${item.role}`
      return /AI|Agent|LLM|Prompt|生图|模型|RAG|路由|OpenClaw|Infra|机器学习|ML|推理|流水线/i.test(hay)
    },
  },
  {
    id: 'system',
    label: '系统',
    test(item) {
      const hay = `${item.title}${item.summary}${item.tag}${item.role}`
      return /系统|发布|工作流|Infra|Workflow|静态|VuePress|导航|索引|批量|Key|One API/i.test(hay)
    },
  },
  {
    id: 'data',
    label: '数据',
    test(item) {
      const hay = `${item.title}${item.summary}${item.tag}${item.role}`
      return /数据|检索|决策|学校|申请|留学|索引|内容发现/i.test(hay)
    },
  },
  {
    id: 'vision',
    label: '视觉',
    test(item) {
      const hay = `${item.title}${item.summary}${item.tag}${item.role}`
      return /视觉|封面|生图|竞赛|智能车|ICT|边缘|推理|流水线|图像/i.test(hay)
    },
  },
]

/**
 * sortDate：仅用于「最新优先」排序（ISO 日期字符串）。
 * featuredRank：数字越小越靠前，用于「精选项目」。
 */
export const projectItems = [
  { title: '博客发布工作流', role: '产品运营', tag: '发布系统', to: '/article/git-release-map.html', summary: '把发布链路整理成一套可重复执行的流程。', cover: '/gallery/proj-card-blog-publishing-workflow-1776962147834.png', sortDate: '2026-04-22', featuredRank: 1 },
  { title: 'AI 封面生成工作流', role: 'AI 产品', tag: 'AI 生图', to: '/article/ai-key-router-one-api-zcode-ccswitch.html', summary: '让封面生成更稳定，也更容易沉淀本地素材。', cover: '/gallery/proj-card-ai-cover-workflow-1776962183221.png', sortDate: '2026-04-21', featuredRank: 3 },
  { title: '留学信息规划器', role: '教育产品', tag: '决策工具', to: '/study/', summary: '把学校与申请信息整理成更易比较的结构。', cover: '/gallery/proj-card-study-abroad-planner-1776962194851.png', sortDate: '2026-04-18', featuredRank: 22 },
  { title: 'PM 作品集 PRD', role: '产品策略', tag: '作品集', to: '/article/pm-portfolio-prd.html', summary: '把博客转成更适合招聘语境的作品集入口。', cover: '/gallery/proj-card-pm-portfolio-prd-1776962204341.png', sortDate: '2026-04-21', featuredRank: 2 },
  { title: 'Projects 分页设计', role: '作品集信息架构', tag: '信息架构', to: '/article/pm-projects-pagination-galaxy.html', summary: '用分页和层级降低 Projects 页面的扫描成本。', cover: '/gallery/proj-card-projects-pagination-1776962214634.png', sortDate: '2026-04-20', featuredRank: 4 },
  { title: 'AI Key Router', role: 'AI 基础设施', tag: '模型路由', to: '/article/ai-key-router-one-api-zcode-ccswitch.html', summary: '梳理多模型调用、密钥管理和供应商切换。', cover: '/gallery/proj-card-ai-key-router-1776962226315.png', sortDate: '2026-04-19', featuredRank: 9 },
  { title: '个人博客系统', role: '前端开发', tag: '静态站点', to: '/tech/my-blog.html', summary: '统一承载文章、项目和文档的前端系统。', cover: '/gallery/proj-card-personal-blog-system-1776962234783.png', sortDate: '2026-04-15', featuredRank: 14 },
  { title: '文章批量操作', role: '创作者工具', tag: '批量操作', to: '/article/git-release-map.html', summary: '用批量动作和校验减少重复性的发布工作。', cover: '/gallery/proj-card-article-batch-ops-1776962249699.png', sortDate: '2026-04-14', featuredRank: 16 },
  { title: '项目入口卡片', role: '作品集前端', tag: '项目展示', to: '/tech/', summary: '让每张项目卡片都能更快传达背景与结果。', cover: '/gallery/proj-card-projects-entry-grid-1776962264405.png', sortDate: '2026-04-13', featuredRank: 15 },
  { title: 'VuePress 技术笔记', role: '前端文档', tag: '技术文档', to: '/article/vuepress-stack-notes.html', summary: '沉淀组件注册、样式约束和页面拼装经验。', cover: '/gallery/proj-card-vuepress-stack-notes-1776962277275.png', sortDate: '2026-04-12', featuredRank: 18 },
  { title: '导航与控制设计', role: '交互系统', tag: '导航体验', to: '/tech/my-blog.html', summary: '提升导航反馈和高频浏览时的操作效率。', cover: '/gallery/proj-card-navigation-controls-1776962287942.png', sortDate: '2026-04-11', featuredRank: 19 },
  { title: '文章索引设计', role: '内容产品', tag: '内容发现', to: '/article/', summary: '把文章页变成更清晰的索引和发现入口。', cover: '/gallery/proj-card-article-index-1776962304303.png', sortDate: '2026-04-17', featuredRank: 6 },
  { title: '信科 ICT 比赛', role: '嵌入式', tag: '工程案例', to: '/tech/xinke-sai.html', summary: '把硬件、控制和调试整理成完整项目案例。', cover: '/gallery/proj-card-xinke-ict-competition-1776962319843.png', sortDate: '2026-04-10', featuredRank: 11 },
  { title: '全国智能车', role: '机器人', tag: '控制系统', to: '/tech/smartcar-nationwide.html', summary: '把竞赛经历转译成更好理解的机器人项目。', cover: '/gallery/proj-card-national-intelligent-car-1776962334677.png', sortDate: '2026-04-09', featuredRank: 10 },
  { title: '边缘 AI 推理', role: '边缘机器学习', tag: '边缘部署', to: '/tech/ai-edge-inference.html', summary: '验证边缘侧 AI 推理和设备测试中的关键取舍。', cover: '/gallery/proj-card-edge-ai-inference-1776962344919.png', sortDate: '2026-04-08', featuredRank: 12 },
  { title: '视觉 ML 流水线', role: '机器学习', tag: '视觉模型', to: '/tech/ai-vision-pipeline.html', summary: '记录从训练到部署的完整视觉项目链路。', cover: '/gallery/proj-card-vision-ml-pipeline-1776962358492.png', sortDate: '2026-04-07', featuredRank: 13 },
  { title: 'LLM RAG 助手', role: 'AI 应用', tag: '检索增强', to: '/tech/ai-llm-rag.html', summary: '提升长文档问答的可追溯性和可靠性。', cover: '/gallery/proj-card-llm-rag-assistant-1776962372073.png', sortDate: '2026-04-16', featuredRank: 8 },
  { title: '提示词模板库', role: 'AI 效率工具', tag: '提示词', to: '/article/ai妯℃澘.html', summary: '整理可复用模板，让 AI 协作输出更稳定。', cover: '/gallery/proj-card-prompt-template-library-1776962382574.png', sortDate: '2026-04-06', featuredRank: 20 },
]

export function itemsAfterRole(items, roleId) {
  if (roleId === 'all') return items
  return items.filter((item) => getProjectRoleId(item.role) === roleId)
}

export function itemsAfterFacet(items, facetId) {
  if (facetId == null) return items
  const facet = PROJECT_FACETS.find((f) => f.id === facetId)
  if (!facet) return items
  return items.filter((item) => facet.test(item))
}

export function applySort(items, sortMode) {
  const arr = [...items]
  if (sortMode === 'featured') {
    arr.sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999))
    return arr
  }
  arr.sort((a, b) => {
    const ta = new Date(a.sortDate || 0).getTime()
    const tb = new Date(b.sortDate || 0).getTime()
    return tb - ta
  })
  return arr
}
