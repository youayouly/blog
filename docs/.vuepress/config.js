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

/** Count `.md` pages under `docs/`, excluding root `docs/README.md` (home). */
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
      const full = join(dir, name)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) walk(full)
      else if (name.endsWith('.md') && normPath(full) !== readme) n++
    }
  }
  walk(rootDir)
  return n
}

const lkArticleCount = countArticleMarkdown(docsRoot)
const lkBuildTimeIso = new Date().toISOString()
/** Same on SSR and client to avoid hydration mismatch in footer copyright year. */
const lkSiteYear = new Date().getFullYear()

/** Set `LK_BUILD_TRACE=1` (e.g. `npm run build:trace`) to log each page as it passes `extendsPage`. */
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
  plugins: [lkBuildTracePlugin()],
  bundler: viteBundler({
    viteOptions: {
      define: {
        __LK_ARTICLE_COUNT__: JSON.stringify(lkArticleCount),
        __LK_BUILD_TIME_ISO__: JSON.stringify(lkBuildTimeIso),
        __LK_SITE_YEAR__: JSON.stringify(lkSiteYear),
        __LK_PUBLISH_API_URL__: JSON.stringify(process.env.LK_PUBLISH_API_URL || ''),
      },
    },
  }),
  lang: 'en-US',
  title: "Luke's Space",
  description: 'Incoming HKU ECIC Student · Tech, Study Abroad, Travel & Life',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/gallery/avatar-bread.svg' }],
    ['meta', { name: 'theme-color', content: '#4a90d9' }],
  ],

  theme: hopeTheme({
    logo: '/gallery/avatar-bread.svg',
    darkmode: 'toggle',
    pure: false,
    appearance: 'dark', // ✅ 默认暗黑
    backToTop: false,

    navbar: [
      { text: 'Home', link: '/home' },
      { text: 'About Me', link: '/about' },
      { text: '💻 Projects', link: '/tech/' },
      { text: '📝 Article', link: '/article/' },
      {
        text: '🎓 Study Abroad',
        prefix: '/study/',
        children: [
          { text: 'Overview', link: '' },
          { text: '🇭🇰 Hong Kong', link: 'hk' },
          { text: '🇬🇧 United Kingdom', link: 'uk' },
          { text: '🇸🇬 Singapore', link: 'singapore' },
        ],
      },
      { text: '📷 Album', link: '/travel/' },
    ],

    sidebar: {
      '/about': false,
      '/about.html': false,
      '/tech/': false,
      '/tech.html': false,
      '/study/': [
        {
          text: '🎓 Study Abroad',
          children: [
            { text: 'Overview', link: '/study/' },
            { text: '🇭🇰 Hong Kong', link: '/study/hk' },
            { text: '🇬🇧 United Kingdom', link: '/study/uk' },
            { text: '🇸🇬 Singapore', link: '/study/singapore' },
          ],
        },
      ],
      '/travel/': 'structure',
      '/article/': [
        { text: 'Articles', link: '/article/' },
        { text: 'Edge AI 随笔', link: '/article/edge-ai-sketch.html' },
        { text: 'VuePress 短文', link: '/article/vuepress-stack-notes.html' },
      ],
      '/': 'structure',
    },

    plugins: {
      redirect: {
        config: {
          '/comments/': '/article/',
          '/comments': '/article/',
        },
      },
      comment: false,
    },
  }),
})
