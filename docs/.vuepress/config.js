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
    ['meta', { name: 'theme-color', content: '#4a90d9' }],
  ],

  theme: hopeTheme({
    logo: '/avatar.jpg',
    colorMode: 'auto',
    colorModeSwitch: true,

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
      { text: '💬 Comments', link: '/comments/' },
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
      '/comments/': false,
      '/': 'structure',
    },

    plugins: {
      comment: {
        // 启用 Waline 评论系统
        provider: 'Waline',
        // 请替换为你的 Waline 服务器地址
        // 例如: 'https://waline.your-domain.com'
        serverURL: 'https://waline.js.org', // 临时使用公共测试地址
        // 可选配置
        // emoji: ['https://cdn.jsdelivr.net/gh/walinejs/emojis@latest/weibo'],
        // dark: 'auto',
        // requiredMeta: ['nick', 'mail'],
        // locale: { ... },
      },
    },
  }),
})
