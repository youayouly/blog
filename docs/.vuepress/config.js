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
    darkmode: 'toggle',
    pure: false,
    appearance: 'dark', // ✅ 默认暗黑
    backToTop: false,

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
      '/tech/': [
        { text: 'Overview', link: '/tech/' },
        { text: 'Personal Blog', link: '/tech/my-blog.html' },
        { text: 'Xinke ICT Competition', link: '/tech/xinke-sai.html' },
        { text: 'National Intelligent Car Competition', link: '/tech/smartcar-nationwide.html' },
        { text: 'Electronic Design Contest', link: '/tech/edc.html' },
        { text: 'LLM RAG Assistant', link: '/tech/ai-llm-rag.html' },
        { text: 'Edge AI Inference', link: '/tech/ai-edge-inference.html' },
        { text: 'Vision ML Pipeline', link: '/tech/ai-vision-pipeline.html' },
      ],
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
      // Waline comment system (Comments page)
      // TODO: replace `serverURL` with your actual Waline backend address
      comment: {
        provider: 'Waline',
        serverURL: 'https://your-waline-server.example.com',
        // Avoid dynamic import of @waline/client/waline-meta (extra chunk; 404 if deploy/HTML out of sync).
        metaIcon: false,
        comment: true,
        reaction: true,
        pageview: true,
      },
    },
  }),
})
