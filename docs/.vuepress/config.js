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
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue
      const full = join(dir, name)
      const st = statSync(full)
      if (st.isDirectory()) walk(full)
      else if (name.endsWith('.md') && normPath(full) !== readme) n++
    }
  }
  walk(rootDir)
  return n
}

const lkArticleCount = countArticleMarkdown(docsRoot)
const lkBuildTimeIso = new Date().toISOString()

export default defineUserConfig({
  bundler: viteBundler({
    viteOptions: {
      define: {
        __LK_ARTICLE_COUNT__: JSON.stringify(lkArticleCount),
        __LK_BUILD_TIME_ISO__: JSON.stringify(lkBuildTimeIso),
      },
    },
  }),
  lang: 'en-US',
  title: "Luke's Space",
  description: 'Incoming HKU ECIC Student · Tech, Study Abroad, Travel & Life',

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/avatar.jpg' }],
    ['meta', { name: 'theme-color', content: '#4A7AB8' }],
  ],

  theme: hopeTheme({
    themeColor: '#4A7AB8',
    logo: '/avatar.jpg',
    /** Light ↔ dark only; navbar shows theme toggle when enabled */
    darkmode: 'toggle',

    navbar: [
      { text: 'Home', link: '/' },
      { text: 'About Me', link: '/about' },
      { text: '💻 Projects', link: '/tech/' },
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
      { text: '📱 Daily', link: '/moments/' },
    ],

    sidebar: {
      '/tech/': 'structure',
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
      '/moments/': false,
      '/': 'structure',
    },

    plugins: {
      comment: {
        provider: 'Waline',
        // ── Replace with your real Waline server URL after deployment ────────
        serverURL: 'https://waline-test.example.com',
        // ────────────────────────────────────────────────────────────────────
        meta: ['nick', 'mail', 'link'],
        requiredMeta: ['nick'],
        login: 'disable',
        lang: 'zh-CN',
        emoji: [
          'https://unpkg.com/@waline/emojis@1.2.0/weibo',
        ],
        pageSize: 10,
        wordLimit: 0,
        reaction: true,
      },
    },
  }),
})
