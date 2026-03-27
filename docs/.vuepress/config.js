import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { hopeTheme } from 'vuepress-theme-hope'

export default defineUserConfig({
  bundler: viteBundler(),
  lang: 'en-US',
  title: "Luke's Space",
  description: 'Incoming HKU ECIC Student · Tech, Study Abroad, Travel & Life',

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
      { text: '📍 Check-ins', link: '/travel/' },
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
