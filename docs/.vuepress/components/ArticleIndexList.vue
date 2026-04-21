<script setup>
const articles = [
  {
    slug: 'openclaw',
    href: '/article/openclaw.html',
    cover: '/gallery/article-cover-openclaw-1776786251288.svg',
    date: '2026-04-21T15:45:00.321Z',
    title: 'openclaw',
    excerpt: '如果你想在本地玩转大模型，这是最标准的起步流程：',
    tags: ['AI', 'Local'],
  },
  {
    slug: 'langchain',
    href: '/article/langchain.html',
    cover: '/gallery/article-cover-ai-infra-1776786248933.svg',
    date: '2026-04-21T15:45:00.878Z',
    title: 'ai infra',
    excerpt: '设计 Agent：决定 AI 什么时候该查资料，什么时候该写代码。',
    tags: ['Agent', 'Infra'],
  },
  {
    slug: 'ai模板',
    href: '/article/ai模板.html',
    cover: '/gallery/article-cover-ai模板-1776786246873.svg',
    date: '2026-04-21T15:45:01.300Z',
    title: 'ai模板',
    excerpt: '你是 [领域：例如资深前端 / VuePress / DevOps / 数据库] 工程师。优先给出**可验证**的结论与**可执行**的步骤；不确定时明确写「假...',
    tags: ['Prompt', 'Workflow'],
  },
  {
    slug: 'git-release-map',
    href: '/article/git-release-map.html',
    cover: '/gallery/article-cover-2.png',
    date: '2026-04-21',
    title: 'Git 发布流水线：从本地改动到 Vercel Release',
    excerpt:
      '把暂存、提交、同步、推送、部署和排错拆成几个稳定模块，记录图片、批量发布和 Vercel Release 踩过的坑。',
    tags: ['Pinned', 'Git', 'Release'],
    pinned: true,
  },
  {
    slug: 'edge-ai-sketch',
    href: '/article/edge-ai-sketch.html',
    cover:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    date: '2026-04-12 20:53',
    title: 'Edge AI 部署流水线的几笔记录',
    excerpt:
      '从模型导出、量化到设备端推理验证，整理一条最小可走的检查清单，方便以后项目复用。',
    tags: ['Embedded', 'ML'],
  },
  {
    slug: 'vuepress-stack-notes',
    href: '/article/vuepress-stack-notes.html',
    cover:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
    date: '2026-04-02 20:49',
    title: '用 VuePress 2 搭静态个人站',
    excerpt:
      '主题选型、目录约定、Sass 全局样式与少量客户端增强，和 Projects 里的长文互补。',
    tags: ['VuePress', 'Frontend'],
  },
  {
    slug: 'my-blog',
    href: '/tech/my-blog.html',
    cover:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    date: '2026-03-20 18:30',
    title: 'Personal Blog（Projects 文档）',
    excerpt:
      '本站技术栈与组件地图的完整说明，归类在 Projects 分区，列表里一并收录便于检索。',
    tags: ['Meta'],
    external: true,
  },
]

const sortedArticles = [...articles].sort((a, b) => {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
  return new Date(b.date).getTime() - new Date(a.date).getTime()
})

function isReverse(index) {
  return index % 2 === 1
}
</script>

<template>
  <div class="lk-blog">
    <p class="lk-blog__intro">
      工程笔记、工具链与项目随笔。置顶文章会优先展示，其余内容按时间倒序排列。
    </p>

    <ol class="lk-blog__list">
      <li
        v-for="(article, index) in sortedArticles"
        :key="article.href"
        class="lk-blog__item"
        :class="{ 'lk-blog__item--external': article.external, 'lk-blog__item--pinned': article.pinned }"
        :data-slug="article.slug"
      >
        <a class="lk-blog__card" :href="article.href">
          <img
            v-if="!isReverse(index)"
            class="lk-blog__cover"
            :src="article.cover"
            alt=""
            loading="lazy"
          />
          <div class="lk-blog__text">
            <time class="lk-blog__date" :datetime="article.date">{{ article.date }}</time>
            <h3 class="lk-blog__post-title">{{ article.title }}</h3>
            <p class="lk-blog__excerpt">{{ article.excerpt }}</p>
            <div class="lk-blog__meta">
              <span v-for="tag in article.tags" :key="tag" class="lk-blog__tag">{{ tag }}</span>
              <span class="lk-blog__read" aria-hidden="true">
                {{ article.external ? 'Open ->' : 'Read ->' }}
              </span>
            </div>
          </div>
          <img
            v-if="isReverse(index)"
            class="lk-blog__cover"
            :src="article.cover"
            alt=""
            loading="lazy"
          />
        </a>
      </li>
    </ol>
  </div>
</template>
