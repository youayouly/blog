import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { hopeTheme } from 'vuepress-theme-hope'  // 保持导入

export default defineUserConfig({
  bundler: viteBundler(),
  lang: 'zh-CN',
  title: '我的博客',
  description: '记录学习与项目',
  head: [
    ['link', { rel: 'stylesheet', href: '/custom.css' }]  // 保持：手动 CSS
  ],
  theme: hopeTheme({  // 切换：用 hopeTheme，迁移你的选项
    // navbar：保持不变
    navbar: [
      { text: '首页', link: '/' },
      { text: '日常日志', link: '/riji' }
    ],
    // logo：保持不变
    logo: '/avatar.jpg',
    // 暗黑模式：保持不变（hopeTheme 支持更好）
    colorMode: 'auto',
    colorModeSwitch: true,
    // sidebar：hopeTheme 语法类似，保持你的配置（全局 auto + riji 自定义）
    sidebar: {
      '/': 'auto',  // 全局自动侧边栏
      '/riji': [
        {
          text: '日志内容',
          collapsible: false,  // 默认展开
          children: [
            { text: '2025-10-05 日常', link: '/riji' }
          ]
        }
      ]
    }
  })
})