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

/**
 * 页脚「已运行 X 年 X 天…」的起算时刻（**请改成你本人建站/首次上线**的本地时间）。
 * - 在下方改 `lkSiteOnlineSinceIso` 的默认值，或
 * - 构建/部署时设环境变量 `LK_SITE_ONLINE_SINCE=2024-03-20T00:00:00+08:00`（覆盖默认值）
 * 时区用 `+08:00` 与内地一致；不要用裸 `Z` 除非你真的按 UTC 记。
 * 未设 `LK_SITE_ONLINE_SINCE` 时默认用本仓库**最早一次提交**的日期（00:00 +08:00）——可改成你实际上线日。
 */
const lkSiteOnlineSinceIso =
  process.env.LK_SITE_ONLINE_SINCE || '2026-03-27T00:00:00+08:00'

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
        __LK_SITE_ONLINE_SINCE_ISO__: JSON.stringify(lkSiteOnlineSinceIso),
        __LK_PUBLISH_API_URL__: JSON.stringify(process.env.LK_PUBLISH_API_URL || ''),
      },
    },
  }),
  lang: 'zh-CN',
  title: 'Luke 的空间',
  description: '关于产品、技术、留学与生活的个人站点',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/gallery/avatar-bread-light.svg' }],
    ['meta', { name: 'theme-color', content: '#343a40' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap',
      },
    ],
    // Cloudflare Web Analytics — 免费国家级别访客来源统计
    // Token: 请在 https://dash.cloudflare.com → Web Analytics 创建站点后替换为真实 token
    [
      'script',
      {
        defer: '',
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': '{"token": "REPLACE_WITH_YOUR_CF_TOKEN"}',
      },
    ],
  ],

  theme: hopeTheme({
    logo: '/gallery/avatar-bread-light.svg',
    darkmode: 'toggle',
    pure: false,
    appearance: 'light',
    // 全局禁用 Hope 主题正文底部的「最近更新 / 贡献者」两行（PC + 移动端均生效）
    lastUpdated: false,
    contributors: false,
    navbar: [
      { text: '首页', link: '/' },
      { text: '项目', link: '/tech/' },
      { text: '文章', link: '/article/' },
      { text: '关于我', link: '/about#about-intro' },
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
          '/home': '/',
          '/home.html': '/',
          '/comments/': '/article/',
          '/comments': '/article/',
        },
      },
      comment: false,
    },
  }),
})
