---
home: true  # 启用默认首页布局（包含英雄区、功能列表等）
hero:
  name: 我的博客
  text: 记录学习与项目
  tagline: 欢迎来到我的个人博客
  image: /hero.png  # 可选：添加英雄图片（放在 public 文件夹）
  actions:
    - theme: brand
      text: 开始阅读
      link: /guide/
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/your-username/your-repo
features:
  - title: 简洁
    details: 基于 VuePress 的简单配置。
  - title: 响应式
    details: 支持移动端。
  - title: 中文
    details: 随时修改

# footer: MIT Licensed | Copyright © 2025 Your Name  # 可选
---

# 欢迎来到我的博客  # 正文从这里开始

## **1 常见注意点**

1. YAML 缩进严格：每层缩进一般 2 个空格
2. 数组元素必须与 `-` 对齐，不能多缩进
3. Hero / Features 数据由主题模板渲染成 HTML
4. 左右排列是 **主题默认行为**，无需额外配置
5. `tagline` = 简短口号 / 标语，通常在 Hero 区标题下方显示
