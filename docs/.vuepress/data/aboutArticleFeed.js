/**
 * About page article recommendations and timeline.
 *
 * Keep this list aligned with the public article index.
 */
export const recommendedArticles = [
  {
    title: 'Git 发布流水线：从本地改动到 Vercel Release',
    href: '/article/git-release-map.html',
    date: '2026-04-21',
    excerpt:
      '把暂存、提交、同步、推送、部署和排错拆成几个稳定模块，方便以后回看每段时间到底在做什么。',
    categories: ['Git', 'Release'],
  },
  {
    title: 'Edge AI 部署流水线的几笔记录',
    href: '/article/edge-ai-sketch.html',
    date: '2026-04-12',
    excerpt: '从模型导出、量化到设备端推理验证，整理一条最小可走的检查清单。',
    categories: ['Embedded', 'ML'],
  },
  {
    title: 'openclaw',
    href: '/article/openclaw.html',
    date: '2026-04-21',
    excerpt: '如果想在本地玩转大模型，这是一条更标准、更可复用的起步流程。',
    categories: ['AI', 'Local'],
  },
  {
    title: 'ai infra',
    href: '/article/langchain.html',
    date: '2026-04-21',
    excerpt: '设计 Agent、Memory、Chains 与 MCP 交互时，先拆清楚 AI 什么时候查资料、什么时候写代码。',
    categories: ['Agent', 'Infra'],
  },
  {
    title: 'ai模板',
    href: '/article/ai模板.html',
    date: '2026-04-21',
    excerpt: '把可验证结论、可执行步骤和不确定性说明写进模板，让 AI 输出更稳定。',
    categories: ['Prompt', 'Workflow'],
  },
  {
    title: '用 VuePress 2 搭静态个人站',
    href: '/article/vuepress-stack-notes.html',
    date: '2026-04-02',
    excerpt: '主题选型、目录约定、Sass 全局样式与少量客户端增强的短文版记录。',
    categories: ['VuePress', 'Frontend'],
  },
]

/**
 * Timeline items are intentionally broader than article recommendations:
 * articles, batch publish/delete operations, and release fixes can all appear
 * here so the About page works like a compact project activity log.
 */
export const timelineItems = [
  {
    date: '2026-04-21',
    title: '整理 Git / Release 操作说明，补齐发布流水线文档',
    href: '/article/git-release-map.html',
    category: 'Docs',
  },
  {
    date: '2026-04-21',
    title: '修复生成封面随文章一起发布，避免 Vercel 找不到图片',
    category: 'Release',
  },
  {
    date: '2026-04-21',
    title: '收敛 blog-v1：删除测试短文，保留可发布文章索引',
    category: 'Article',
  },
  {
    date: '2026-04-21',
    title: '批量发布 openclaw、ai infra、ai模板 三篇短文',
    href: '/article/openclaw.html',
    category: 'Article',
  },
  {
    date: '2026-04-20',
    title: '提交封面图片资源，解决云端构建缺失文件问题',
    category: 'Deploy',
  },
  {
    date: '2026-04-12',
    title: 'Edge AI 部署流水线的几笔记录',
    href: '/article/edge-ai-sketch.html',
    category: 'Article',
  },
  {
    date: '2026-04-02',
    title: '用 VuePress 2 搭静态个人站',
    href: '/article/vuepress-stack-notes.html',
    category: 'Article',
  },
]
