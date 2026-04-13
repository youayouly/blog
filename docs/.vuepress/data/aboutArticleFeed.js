/**
 * About 页：文章推荐 + 时间线数据源（与 docs/article 下短文保持一致，新增文章时请同步更新）。
 */
export const recommendedArticles = [
  {
    title: 'Edge AI 部署流水线的几笔记录',
    href: '/article/edge-ai-sketch.html',
    date: '2026-04-12',
    excerpt:
      '从模型导出、量化到设备端推理验证，整理一条最小可走的检查清单，方便以后项目复用。',
    categories: ['Embedded', 'ML'],
  },
  {
    title: '用 VuePress 2 搭静态个人站',
    href: '/article/vuepress-stack-notes.html',
    date: '2026-04-02',
    excerpt:
      '主题选型、目录约定、Sass 全局样式与少量客户端增强 — 和 Projects 里的长文互补的短文版。',
    categories: ['VuePress', 'Frontend'],
  },
]

/** 时间线条目（日期倒序；与推荐区可重叠） */
export const timelineItems = [
  {
    date: '2026-04-12',
    title: 'Edge AI 部署流水线的几笔记录',
    href: '/article/edge-ai-sketch.html',
    category: 'Embedded',
  },
  {
    date: '2026-04-02',
    title: '用 VuePress 2 搭静态个人站',
    href: '/article/vuepress-stack-notes.html',
    category: 'VuePress',
  },
]
