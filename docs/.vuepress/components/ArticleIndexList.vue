<script setup>
import { computed, ref } from 'vue'

const pageSize = 5
const currentPage = ref(1)

// 响应式状态管理
const showLeftSidebar = ref(true)
const showRightSidebar = ref(true)
const isMobile = ref(false)
const isTablet = ref(false)

// 检测屏幕尺寸
function checkScreenSize() {
  const width = window.innerWidth
  isMobile.value = width < 768
  isTablet.value = width >= 768 && width < 1200

  // 根据屏幕尺寸自动控制侧边栏显示
  if (width < 768) {
    showLeftSidebar.value = false
    showRightSidebar.value = false
  } else if (width < 1200) {
    showLeftSidebar.value = false
    showRightSidebar.value = true
  } else if (width < 1600) {
    showLeftSidebar.value = false
    showRightSidebar.value = true
  } else {
    showLeftSidebar.value = true
    showRightSidebar.value = true
  }
}

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
}

const articles = [
  {
    slug: 'pm-projects-pagination-galaxy',
    href: '/article/pm-projects-pagination-galaxy.html',
    cover: '/gallery/article-cover-pm-ai-operations-galaxy-background-1776845342410.png',
    date: '2026-04-22T07:10:00.000Z',
    title: 'Projects 作品集分页：把岗位、项目和文章串成招聘入口',
    excerpt: '记录这次把 PM 作品集前置、项目按岗位分页、文章列表分页，以及用 SiliconFlow 星系图做本地背景的迭代。',
    tags: ['PM', 'Projects', 'Portfolio'],
  },
  {
    slug: 'ai-key-router-one-api-zcode-ccswitch',
    href: '/article/ai-key-router-one-api-zcode-ccswitch.html',
    cover: '/gallery/article-cover-ai-key-router-one-api-zcode-ccswitch-1776831294920.png',
    date: '2026-04-22T05:38:00.000Z',
    title: 'AI Key 路由：SiliconFlow、DeepSeek、Qwen、One API、ZCode 和 CCSwitch',
    excerpt: '把模型供应商 Key、One API 中转平台和 Claude Code 适配工具串成一套可维护的 AI 开发调用链。',
    tags: ['AI', 'Infra', 'Workflow'],
  },
  {
    slug: 'pm-portfolio-prd',
    href: '/article/pm-portfolio-prd.html',
    cover: '/gallery/article-cover-product-manager-portfolio-prd-1776831264136.png',
    date: '2026-04-22T05:35:00.000Z',
    title: '产品经理作品集改造 PRD：把博客变成求职入口',
    excerpt: '从招聘方视角重构个人站，把技术博客、案例文章和简历信息整理成产品经理作品集。',
    tags: ['PM', 'Portfolio', 'PRD'],
  },
  {
    slug: 'openclaw',
    href: '/article/openclaw.html',
    cover: '/gallery/article-cover-local-ai-compute-core-1776832789468.png',
    date: '2026-04-22T04:00:59.216Z',
    title: 'OpenClaw Local Setup',
    excerpt: '如果想在本地玩转大模型，这是一条尽量标准、可复查的起步流程。',
    tags: ['AI', 'Local'],
  },
  {
    slug: 'langchain',
    href: '/article/langchain.html',
    cover: '/gallery/article-cover-agent-workflow-neural-mesh-1776832699716.png',
    date: '2026-04-22T04:01:01.517Z',
    title: 'AI Infra Notes',
    excerpt: '设计 Agent：决定 AI 什么时候该查资料，什么时候该写代码，什么时候该交给人工确认。',
    tags: ['Agent', 'Infra'],
  },
  {
    slug: 'ai模板',
    href: '/article/ai模板.html',
    cover: '/gallery/article-cover-prompt-workflow-crystal-grid-1776832732128.png',
    date: '2026-04-22T04:01:02.375Z',
    title: 'AI Prompt Template',
    excerpt: '沉淀可复用提示词结构，让 AI 协作输出更稳定、更容易验证。',
    tags: ['Prompt', 'Workflow'],
  },
  {
    slug: 'git-release-map',
    href: '/article/git-release-map.html',
    cover: '/gallery/article-cover-abstract-release-river-lights-1776832409153.png',
    date: '2026-04-21',
    title: 'Git 发布流水线：从本地改动到 Vercel Release',
    excerpt: '把暂存、提交、同步、推送、部署和排错拆成稳定模块，记录图片、批量发布和 Vercel Release 踩过的坑。',
    tags: ['Pinned', 'Git', 'Release'],
    pinned: true,
  },
  {
    slug: 'edge-ai-sketch',
    href: '/article/edge-ai-sketch.html',
    cover: '/gallery/article-cover-edge-ai-silicon-landscape-1776832435287.png',
    date: '2026-04-12 20:53',
    title: 'Edge AI 部署流水线的几笔记录',
    excerpt: '从模型导出、量化到设备端推理验证，整理一条最小可走的检查清单，方便以后项目复用。',
    tags: ['Embedded', 'ML'],
  },
  {
    slug: 'vuepress-stack-notes',
    href: '/article/vuepress-stack-notes.html',
    cover: '/gallery/article-cover-static-site-component-constellation-1776832464149.png',
    date: '2026-04-02 20:49',
    title: '用 VuePress 2 搭静态个人站',
    excerpt: '主题选型、目录约定、Sass 全局样式与少量客户端增强，和 Projects 里的长文互补。',
    tags: ['VuePress', 'Frontend'],
  },
  {
    slug: 'my-blog',
    href: '/tech/my-blog.html',
    cover: '/gallery/article-cover-personal-knowledge-garden-1776832492231.png',
    date: '2026-03-20 18:30',
    title: 'Personal Blog：Projects 文档',
    excerpt: '本站技术栏与组件地图的完整说明，归类在 Projects 分区，列表里一并收录便于检索。',
    tags: ['Meta'],
    external: true,
  },
]

const sortedArticles = computed(() =>
  [...articles].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  }),
)

const tagCounts = computed(() => {
  const counts = {}
  for (const article of articles) {
    for (const tag of article.tags) counts[tag] = (counts[tag] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})

const totalPages = computed(() => Math.ceil(sortedArticles.value.length / pageSize))
const visibleArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedArticles.value.slice(start, start + pageSize)
})

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toISOString().slice(0, 10)
}
</script>

<template>
  <div class="lk-blog lk-blog-fullbleed lk-article-three">
    <!-- 移动端侧边栏控制按钮 -->
    <div v-if="isMobile || isTablet" class="lk-article-three__controls">
      <button
        v-if="!showLeftSidebar"
        class="lk-article-three__control-btn"
        type="button"
        @click="showLeftSidebar = true"
        aria-label="显示左侧导航"
      >
        <span class="icon">☰</span>
        <span>导航</span>
      </button>
      <button
        v-if="!showRightSidebar"
        class="lk-article-three__control-btn"
        type="button"
        @click="showRightSidebar = true"
        aria-label="显示目录和标签"
      >
        <span class="icon">≡</span>
        <span>目录</span>
      </button>
    </div>

    <!-- 左侧导航抽屉（移动端） -->
    <Teleport to="body">
      <Transition name="lk-drawer">
        <div
          v-if="showLeftSidebar && isMobile"
          class="lk-article-three__drawer lk-article-three__drawer--left"
        >
          <button
            class="lk-article-three__drawer-close"
            type="button"
            @click="showLeftSidebar = false"
            aria-label="关闭"
          >
            ×
          </button>
          <div class="lk-article-three__panel">
            <div class="lk-article-three__panel-head">
              <h3>左侧导航</h3>
              <p>小卡片列表</p>
            </div>
            <nav class="lk-article-three__mini-list">
              <a
                v-for="article in sortedArticles"
                :key="`left-${article.slug}`"
                :href="article.href"
                class="lk-article-three__mini-card"
                :class="{ 'is-pinned': article.pinned }"
                @click="showLeftSidebar = false"
              >
                <span class="lk-article-three__mini-title">{{ article.title }}</span>
                <span class="lk-article-three__mini-date">{{ formatDate(article.date) }}</span>
              </a>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 右侧目录和标签抽屉（移动端） -->
    <Teleport to="body">
      <Transition name="lk-drawer">
        <div
          v-if="showRightSidebar && isMobile"
          class="lk-article-three__drawer lk-article-three__drawer--right"
        >
          <button
            class="lk-article-three__drawer-close"
            type="button"
            @click="showRightSidebar = false"
            aria-label="关闭"
          >
            ×
          </button>
          <div class="lk-article-three__panel">
            <div class="lk-article-three__panel-head">
              <h3>目录</h3>
              <p>快速导航</p>
            </div>
            <nav class="lk-article-three__toc">
              <a
                v-for="article in sortedArticles"
                :key="`toc-${article.slug}`"
                :href="article.href"
                class="lk-article-three__toc-item"
                @click="showRightSidebar = false"
              >
                {{ article.title }}
              </a>
            </nav>
          </div>
          <div class="lk-article-three__panel">
            <div class="lk-article-three__panel-head">
              <h3>标签</h3>
              <p>按主题分类</p>
            </div>
            <div class="lk-article-three__tag-cloud">
              <a
                v-for="[tag, count] in tagCounts"
                :key="tag"
                href="#"
                class="lk-article-three__tag-pill"
              >
                {{ tag }} <span class="lk-article-three__tag-count">{{ count }}</span>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 抽屉遮罩层 -->
    <Transition name="lk-overlay">
      <div
        v-if="(showLeftSidebar && isMobile) || (showRightSidebar && isMobile)"
        class="lk-article-three__overlay"
        @click="() => { showLeftSidebar = false; showRightSidebar = false }"
      ></div>
    </Transition>

    <p class="lk-article-three__intro">
      工程笔记、工具链与项目随笔。左侧放导航卡片，中间放文章大卡，右侧保留目录与标签。
    </p>

    <div class="lk-article-three__content">
      <aside
        v-show="showLeftSidebar || !isMobile"
        class="lk-article-three__left"
        :class="{ 'is-hidden': !showLeftSidebar }"
      >
        <div class="lk-article-three__panel">
          <div class="lk-article-three__panel-head">
            <h3>左侧导航</h3>
            <p>小卡片列表</p>
          </div>

          <nav class="lk-article-three__mini-list">
            <a
              v-for="article in sortedArticles"
              :key="`left-${article.slug}`"
              :href="article.href"
              class="lk-article-three__mini-card"
              :class="{ 'is-pinned': article.pinned }"
            >
              <span class="lk-article-three__mini-title">{{ article.title }}</span>
              <span class="lk-article-three__mini-date">{{ formatDate(article.date) }}</span>
            </a>
          </nav>
        </div>
      </aside>

      <main class="lk-article-three__middle">
        <ol class="lk-article-three__list">
          <li
            v-for="article in visibleArticles"
            :key="article.href"
            class="lk-article-three__item"
            :class="{
              'is-pinned': article.pinned,
              'is-external': article.external,
            }"
          >
            <a class="lk-article-three__card" :href="article.href">
              <div class="lk-article-three__text">
                <time class="lk-article-three__date" :datetime="article.date">{{ formatDate(article.date) }}</time>
                <h3 class="lk-article-three__title">{{ article.title }}</h3>
                <p class="lk-article-three__excerpt">{{ article.excerpt }}</p>
                <div class="lk-article-three__meta">
                  <span v-for="tag in article.tags" :key="tag" class="lk-article-three__tag">{{ tag }}</span>
                </div>
                <span class="lk-article-three__read">{{ article.external ? 'Open ->' : 'Read ->' }}</span>
              </div>

              <div class="lk-article-three__cover-wrap">
                <img
                  v-if="article.cover"
                  class="lk-article-three__cover"
                  :src="article.cover"
                  :alt="article.title"
                />
              </div>
            </a>
          </li>
        </ol>

        <nav class="lk-article-three__pager" aria-label="Articles pagination">
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="lk-article-three__pager-button"
            :class="{ 'is-active': page === currentPage }"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </nav>
      </main>

      <aside
        v-show="showRightSidebar || !isMobile"
        class="lk-article-three__right"
        :class="{ 'is-hidden': !showRightSidebar }"
      >
        <div class="lk-article-three__panel">
          <div class="lk-article-three__panel-head">
            <h3>目录</h3>
            <p>快速导航</p>
          </div>
          <nav class="lk-article-three__toc">
            <a
              v-for="article in sortedArticles"
              :key="`toc-${article.slug}`"
              :href="article.href"
              class="lk-article-three__toc-item"
            >
              {{ article.title }}
            </a>
          </nav>
        </div>

        <div class="lk-article-three__panel">
          <div class="lk-article-three__panel-head">
            <h3>标签</h3>
            <p>按主题分类</p>
          </div>
          <div class="lk-article-three__tag-cloud">
            <a
              v-for="[tag, count] in tagCounts"
              :key="tag"
              href="#"
              class="lk-article-three__tag-pill"
            >
              {{ tag }} <span class="lk-article-three__tag-count">{{ count }}</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style>
.lk-article-three {
  width: 100%;
  box-sizing: border-box;
}

.lk-article-three__intro {
  max-width: 58rem;
  margin: 0 auto 1.5rem;
  text-align: center;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.7;
}

.lk-article-three__content {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 280px;
  gap: 1.5rem;
  align-items: start;
}

.lk-article-three__left {
  position: sticky;
  top: 84px;
}

.lk-article-three__middle {
  min-width: 0;
}

.lk-article-three__right {
  position: sticky;
  top: 84px;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.lk-article-three__panel {
  border: 1px solid rgba(110, 231, 223, 0.18);
  border-radius: 20px;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(11, 19, 35, 0.94), rgba(12, 20, 37, 0.9));
  box-shadow: 0 20px 48px rgba(2, 6, 23, 0.24);
}

.lk-article-three__panel-head {
  margin-bottom: 0.9rem;
}

.lk-article-three__panel-head h3 {
  margin: 0 0 0.35rem;
  color: #67e8f9;
  font-size: 1rem;
}

.lk-article-three__panel-head p {
  margin: 0;
  color: rgba(148, 163, 184, 0.86);
  font-size: 0.82rem;
}

.lk-article-three__mini-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.lk-article-three__mini-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.8rem 0.9rem;
  border-radius: 16px;
  text-decoration: none;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.14);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.lk-article-three__mini-card:hover {
  transform: translateY(-1px);
  border-color: rgba(103, 232, 249, 0.34);
  background: rgba(11, 28, 45, 0.94);
}

.lk-article-three__mini-card.is-pinned {
  border-color: rgba(45, 212, 191, 0.28);
}

.lk-article-three__mini-title {
  color: #f8fafc;
  line-height: 1.42;
  font-size: 0.9rem;
}

.lk-article-three__mini-date {
  color: rgba(148, 163, 184, 0.88);
  font-size: 0.76rem;
}

.lk-article-three__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1.1rem;
}

.lk-article-three__item {
  margin: 0;
}

.lk-article-three__card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  overflow: hidden;
  border-radius: 24px;
  text-decoration: none;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(12, 20, 36, 0.92));
  box-shadow: 0 22px 56px rgba(2, 6, 23, 0.28);
  min-height: 200px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.lk-article-three__card:hover {
  transform: translateY(-4px);
  border-color: rgba(125, 211, 252, 0.38);
  box-shadow: 0 28px 72px rgba(15, 23, 42, 0.44);
}

.lk-article-three__item.is-pinned .lk-article-three__card {
  border-color: rgba(45, 212, 191, 0.34);
}

.lk-article-three__item.is-external .lk-article-three__card {
  border-color: rgba(96, 165, 250, 0.32);
}

.lk-article-three__text {
  display: flex;
  flex-direction: column;
  gap: 0.72rem;
  padding: 1.2rem 1.25rem 1.15rem;
  min-width: 0;
}

.lk-article-three__date {
  color: rgba(148, 163, 184, 0.95);
  font-size: 0.82rem;
  font-weight: 600;
}

.lk-article-three__title {
  margin: 0;
  color: #f8fafc;
  font-size: 1.28rem;
  line-height: 1.42;
}

.lk-article-three__excerpt {
  margin: 0;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.62;
  font-size: 0.94rem;
}

.lk-article-three__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: auto;
}

.lk-article-three__tag {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.76rem;
  color: #dbeafe;
  background: rgba(37, 99, 235, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.22);
}

.lk-article-three__read {
  align-self: flex-end;
  color: #67e8f9;
  font-weight: 700;
}

.lk-article-three__cover-wrap {
  min-width: 0;
  height: 100%;
  background: rgba(9, 14, 26, 0.94);
}

.lk-article-three__cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lk-article-three__toc {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.lk-article-three__toc-item {
  padding: 0.55rem 0.65rem;
  border-radius: 12px;
  text-decoration: none;
  color: rgba(226, 232, 240, 0.9);
  font-size: 0.86rem;
  line-height: 1.42;
  transition: background 0.18s ease, color 0.18s ease;
}

.lk-article-three__toc-item:hover {
  background: rgba(103, 232, 249, 0.12);
  color: #67e8f9;
}

.lk-article-three__tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.lk-article-three__tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-decoration: none;
  color: rgba(226, 232, 240, 0.92);
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.22);
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.lk-article-three__tag-pill:hover {
  background: rgba(103, 232, 249, 0.15);
  border-color: rgba(103, 232, 249, 0.38);
  color: #67e8f9;
}

.lk-article-three__tag-count {
  margin-left: 0.35rem;
  color: rgba(148, 163, 184, 0.7);
  font-size: 0.74rem;
}

.lk-article-three__pager {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.lk-article-three__pager-button {
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  font-weight: 700;
  cursor: pointer;
}

.lk-article-three__pager-button.is-active {
  background: #67e8f9;
  color: #082032;
  border-color: transparent;
}

@media (max-width: 1400px) {
  .lk-article-three__content {
    grid-template-columns: 220px minmax(0, 1fr) 260px;
  }

  .lk-article-three__card {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}

/* 标准（1200-1600px）：隐藏左侧导航，保留中间+右侧 */
@media (max-width: 1600px) {
  .lk-article-three__content {
    grid-template-columns: 0 minmax(0, 1fr) 280px;
  }

  .lk-article-three__left {
    display: none;
  }

  .lk-article-three__middle {
    order: 1;
  }

  .lk-article-three__right {
    order: 2;
  }
}

/* 小屏（768-1200px）：两列布局（左侧隐藏，右侧显示） */
@media (max-width: 1199px) {
  .lk-article-three__content {
    grid-template-columns: 0 minmax(0, 1fr) 260px;
  }

  .lk-article-three__left {
    display: none;
  }

  .lk-article-three__right {
    position: static;
  }

  .lk-article-three__middle {
    order: 1;
  }

  .lk-article-three__right {
    order: 2;
  }

  .lk-article-three__card {
    grid-template-columns: 1fr;
  }

  .lk-article-three__cover-wrap {
    height: 200px;
  }
}

/* 移动端（<768px）：单列布局 */
@media (max-width: 767px) {
  .lk-article-three__content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .lk-article-three__left,
  .lk-article-three__right {
    display: none;
  }

  .lk-article-three__middle {
    order: 1;
  }

  .lk-article-three__card {
    grid-template-columns: 1fr;
    border-radius: 18px;
  }

  .lk-article-three__cover-wrap {
    height: 180px;
  }

  .lk-article-three__text {
    padding: 1rem;
  }

  .lk-article-three__title {
    font-size: 1.15rem;
  }

  .lk-article-three__excerpt {
    font-size: 0.9rem;
    -webkit-line-clamp: 2;
  }

  .lk-article-three__intro {
    font-size: 0.88rem;
    margin-bottom: 1rem;
  }
}

/* 移动端控制按钮 */
.lk-article-three__controls {
  display: none;
  position: sticky;
  top: 70px;
  z-index: 10;
  margin-bottom: 1rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 1199px) {
  .lk-article-three__controls {
    display: flex;
  }
}

.lk-article-three__control-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.85);
  color: rgba(241, 245, 249, 0.92);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.lk-article-three__control-btn:hover {
  background: rgba(30, 58, 138, 0.5);
  border-color: rgba(125, 211, 252, 0.5);
  transform: translateY(-1px);
}

.lk-article-three__control-btn .icon {
  font-size: 1rem;
  font-weight: bold;
}

/* 抽屉遮罩层 */
.lk-article-three__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 998;
}

.lk-overlay-enter-active,
.lk-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.lk-overlay-enter-from,
.lk-overlay-leave-to {
  opacity: 0;
}

/* 抽屉样式 */
.lk-article-three__drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 85%;
  max-width: 350px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(12, 20, 37, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  z-index: 999;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lk-article-three__drawer--left {
  left: 0;
  border-right: 1px solid rgba(148, 163, 184, 0.3);
}

.lk-article-three__drawer--right {
  right: 0;
  border-left: 1px solid rgba(148, 163, 184, 0.3);
}

.lk-drawer-enter-active,
.lk-drawer-leave-active {
  transition: transform 0.3s ease;
}

.lk-drawer-enter-from,
.lk-drawer-leave-to {
  transform: translateX(-100%);
}

.lk-article-three__drawer--right.lk-drawer-enter-from,
.lk-article-three__drawer--right.lk-drawer-leave-to {
  transform: translateX(100%);
}

/* 抽屉关闭按钮 */
.lk-article-three__drawer-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.8);
  color: rgba(241, 245, 249, 0.92);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lk-article-three__drawer-close:hover {
  background: rgba(220, 38, 38, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  transform: rotate(90deg);
}

/* 隐藏状态 */
.lk-article-three__left.is-hidden,
.lk-article-three__right.is-hidden {
  display: none;
}
</style>
