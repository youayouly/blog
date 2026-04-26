import { readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { hopeTheme } from 'vuepress-theme-hope'

const configDir = dirname(fileURLToPath(import.meta.url))
const docsRoot = join(configDir, '..')

function normPath(p) {
  return p.replace(/\\/g, '/')
}

function countArticleMarkdown(rootDir) {
  const readme = normPath(join(rootDir, 'README.md'))
  let n = 0

  const walk = (dir) => {
    let names
    try {
      names = readdirSync(dir)
    } catch {
      return
    }

    for (const name of names) {
      if (name.startsWith('.')) continue
      if (name === 'agents' || name === 'skills') continue

      const full = join(dir, name)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }

      if (st.isDirectory()) {
        walk(full)
        continue
      }

      if (
        name.endsWith('.md') &&
        !name.endsWith('_backup.md') &&
        !name.startsWith('test-') &&
        normPath(full) !== readme
      ) {
        n++
      }
    }
  }

  walk(rootDir)
  return n
}

const lkArticleCount = countArticleMarkdown(docsRoot)
const lkBuildTimeIso = new Date().toISOString()
const lkSiteYear = new Date().getFullYear()

/** `docs/tech/` 下技术/项目文档页（不含 README 索引） */
function countTechMarkdown(techDir) {
  const readme = normPath(join(techDir, 'README.md'))
  let n = 0
  let names
  try {
    names = readdirSync(techDir)
  } catch {
    return 0
  }
  for (const name of names) {
    if (!name.endsWith('.md') || name.endsWith('_backup.md') || name.startsWith('test-')) continue
    const full = join(techDir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (!st.isFile()) continue
    if (normPath(full) === readme) continue
    n++
  }
  return n
}

const lkTechCount = countTechMarkdown(join(docsRoot, 'tech'))

function lkBuildTracePlugin() {
  return {
    name: 'lk-build-trace',
    extendsPage: async (page) => {
      if (process.env.LK_BUILD_TRACE === '1') {
        const rel = page.filePathRelative ?? '(virtual)'
        console.error(`[lk-build] extendsPage -> ${rel}  route=${page.path}`)
      }
    },
  }
}

export default defineUserConfig({
  pagePatterns: [
    '**/*.md',
    '!.vuepress',
    '!agents/**',
    '!skills/**',
    '!**/*_backup.md',
    '!**/test-*.md',
  ],
  plugins: [lkBuildTracePlugin()],
  bundler: viteBundler({
    viteOptions: {
      define: {
        __LK_ARTICLE_COUNT__: JSON.stringify(lkArticleCount),
        __LK_TECH_COUNT__: JSON.stringify(lkTechCount),
        __LK_BUILD_TIME_ISO__: JSON.stringify(lkBuildTimeIso),
        __LK_SITE_YEAR__: JSON.stringify(lkSiteYear),
        __LK_PUBLISH_API_URL__: JSON.stringify(process.env.LK_PUBLISH_API_URL || ''),
      },
    },
  }),
  lang: 'zh-CN',
  title: 'Luke 的空间',
  description: '关于产品、技术、留学与生活的个人站点',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/gallery/avatar-bread-light.svg' }],
    ['meta', { name: 'theme-color', content: '#4a90d9' }],
  ],

  theme: hopeTheme({
    logo: '/gallery/avatar-bread-light.svg',
    darkmode: 'toggle',
    pure: false,
    appearance: 'light',
    navbar: [
      { text: '关于我', link: '/about' },
      { text: '项目', link: '/tech/' },
      { text: '文章', link: '/article/' },
      {
        text: '更多',
        children: [
          { text: '留学', link: '/study/' },
          { text: '相册', link: '/travel/' },
        ],
      },
      { text: '统计', link: '/stats/' },
    ],

    sidebar: {
      '/about': false,
      '/about.html': false,
      '/stats/': false,
      '/stats.html': false,
      '/tech/': false,
      '/tech.html': false,
      '/study/': [
        {
          text: '留学',
          children: [
            { text: '总览', link: '/study/' },
            { text: '中国香港', link: '/study/hk' },
            { text: '英国', link: '/study/uk' },
            { text: '新加坡', link: '/study/singapore' },
          ],
        },
      ],
      '/travel/': 'structure',
      '/article/': [
        { text: '文章列表', link: '/article/' },
        { text: 'Projects 作品集分页', link: '/article/pm-projects-pagination-galaxy.html' },
        { text: '产品经理作品集 PRD', link: '/article/pm-portfolio-prd.html' },
        { text: 'AI Key Router 路由系统', link: '/article/ai-key-router-one-api-zcode-ccswitch.html' },
        { text: 'Git 发布流程图', link: '/article/git-release-map.html' },
        { text: 'OpenClaw 本地搭建', link: '/article/openclaw.html' },
        { text: 'AI 基础设施笔记', link: '/article/langchain.html' },
        { text: 'AI 提示词模板', link: '/article/ai妯℃澘.html' },
        { text: '边缘 AI 草图', link: '/article/edge-ai-sketch.html' },
        { text: 'VuePress 架构笔记', link: '/article/vuepress-stack-notes.html' },
      ],
      '/': 'structure',
    },

    plugins: {
      redirect: {
        config: {
          '/article.html': '/article/',
          '/stats': '/stats/',
          '/stats.html': '/stats/',
          '/home': '/about',
          '/home.html': '/about',
          '/comments/': '/article/',
          '/comments': '/article/',
        },
      },
      comment: false,
    },
  }),
})
