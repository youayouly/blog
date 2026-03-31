# CURSOR.md

本文件用于指导在 Cursor / VS Code 中运行的 AI 助手（以及未来的你自己）快速理解本仓库的结构、关键文件和开发约定。

> 如果你在 Cursor 里开启一个新会话，优先阅读这里，可以少踩很多坑。

---

## 项目概览

- **类型**: 个人博客 / Portfolio
- **框架**: VuePress 2 + Vite bundler
- **主题**: `vuepress-theme-hope`（带自动深浅色切换）
- **部署**: Vercel（见 `vercel.json`）
- **评论系统**: Waline（`vuepress-theme-hope` 自带 `comment` 插件）

首页有较多自定义效果（滚动模糊、Typewriter、悬浮 Shapes、两列布局）；内页（About / Projects / Study / Album / Comments）主要通过 `pageClass` + 统一卡片样式控制视觉。

常用命令：

- 开发: `npm run dev`
- 构建: `npm run build`

---

## 目录与关键文件

### 配置与客户端逻辑

- `docs/.vuepress/config.js`
  - VuePress 站点配置 / 导航栏 / 侧边栏
  - 主题 `hopeTheme` 配置与插件（包括 Waline `comment` 插件）
  - Vite `define` 注入的全局常量（文章数、构建时间等）

- `docs/.vuepress/client.js`
  - 首页增强逻辑：
    - Hero 背景滚动模糊 & 壁纸轮播（`initScrollBlur` / `cleanupScrollBlur`）
    - 首页两列布局（主列 + 左侧 Profile/Notice/Stats）
    - 打字机文案组件挂载 / 卸载
    - 悬浮 Shapes 组件挂载 / 卸载
  - 全局滚动进度条（`initProgressBar`）
  - 全局组件注册（`ProjectNineGrid` / `ProjectCardsGrid` / `MockCommentsPreview` / `SiteFooter`）

### 样式

- `docs/.vuepress/styles/index.scss`
  - 首页 `.page-home` 及 Hero 覆层调优
  - 导航栏、页脚自定义样式
  - 每个顶层页面的背景色：
    - `.page-home` / `.page-about` / `.page-projects` / `.page-study` / `.page-travel` / `.page-comments`
  - Comments 页的整套 Waline + Mock 评论样式（`page-comments` 段）
  - About 页布局（`.about-*`）
  - WeChat Moments 组件样式（`.wm-*`）
  - 内页通用卡片体系：`.lk-card`（统一圆角 / 阴影 / padding）
  - Study 页目的地卡片与竖向时间线：`.study-*`

> 约定：新增内页组件优先考虑使用 `.lk-card` 或在其基础上轻量扩展，避免再造一套卡片阴影/圆角系统。

### 内容页面

- `docs/README.md` — 首页（由主题接管，配合 `client.js` 做增强）
- `docs/about.md` — About 页，使用 `.about-profile` 两列布局 + `.about-*` 样式
- `docs/tech/README.md` — Projects 页，使用 `<ProjectCardsGrid />` 展示项目列表
- `docs/study/README.md` — Study 首页，包含：
  - 三地概览：`<div class="lk-card study-dests"> ... </div>`
  - 通用申请时间线：`<div class="lk-card study-timeline"> ... </div>`
- `docs/travel/README.md` — Album 页，包含 `ProjectNineGrid` + `AlbumFeed` + 足迹/清单/贴士
- `docs/comments/README.md` — 评论页，仅负责：
  - 设置 `pageClass: page-comments`
  - 顶部文案 Hero：`.lk-comments-hero`
  - `comment: true` 交给主题挂载 Waline

### 组件

目录：`docs/.vuepress/components/`

- `ProjectNineGrid.vue` — 3×3 圆形图片九宫格，当前用于 Album 页面顶部
- `ProjectCardsGrid.vue` — 项目列表卡片（Projects 页主内容）
- `AlbumFeed.vue` — Album 页多地相册块（三组 3×3 图片）
- `HomeTypewriterTagline.vue` / `HomeSidePanel.vue` / `FloatingShapes.vue` — 首页特效与侧边栏组件
- `MockCommentsPreview.vue` — Comments 页顶部示例评论（假数据）
- `SiteFooter.vue` — 页脚 root component

---

## 开发约定

1. **页面背景与布局**
   - 顶层页面应通过 frontmatter 设置 `pageClass`（例如 `page-about` / `page-projects` / `page-study` 等），并在 `index.scss` 中定义对应背景与最外层布局。
   - 评论页使用 `page-comments` 作为样式作用域，务必保证实际 DOM 上存在 `.page-comments` 祖先类（当前通过在 `docs/comments/README.md` 内容外包一层 `<div class="page-comments">` 实现）。

2. **卡片体系**
   - 优先使用 `.lk-card` 作为通用卡片基类，必要时通过额外类（如 `.study-dest`、`.lk-album`）覆盖少量样式。
   - 避免在多个页面重复定义几乎相同的圆角/阴影/内边距。

3. **首页增强**
   - 所有首页专用逻辑（滚动模糊、两列布局、打字机、悬浮 shapes）都通过 `mountHome()` / `unmountHome()` 封装，并只在 `route.path === '/'` 时启用。
   - 新增首页特效时，应加入 `mountHome` / `unmountHome`，确保路由切换时能正确清理。

4. **Waline 评论**
   - 配置位置：`docs/.vuepress/config.js` 里的 `theme.plugins.comment`。
   - 样式约定：尽量在 `index.scss` 的 `.page-comments` 作用域内覆盖 Waline 样式，不再在 `config.js` 里注入额外 `<style>`。
   - `serverURL` 应指向你自己的 Waline 服务（当前开发阶段可使用公共测试地址，但上线前建议切换）。

5. **命名风格**
   - 组件类使用 `lk-*` 前缀（如 `.lk-home-body-grid`, `.lk-album`），方便在全局样式中定位与控制作用域。
   - 不再新增无前缀的「宽泛」类名，防止与主题内部样式冲突。

---

## 常见坑 & 调试提示

1. **`page-comments` 作用域**
   - 所有 Waline 与 Mock 评论样式都写在 `.page-comments` 作用域内，如果 DOM 中没有 `.page-comments` 祖先类，这些样式将全部失效。
   - 当前实现是在 `docs/comments/README.md` 里用 `<div class="page-comments"> ... </div>` 包裹 Hero + 评论挂载点。

2. **首页滚动模糊与性能**
   - 滚动模糊逻辑在 `initScrollBlur()` 里，通过 `window.addEventListener('scroll', scrollBlurHandler, { passive: true })` 注册。
   - 清理逻辑在 `cleanupScrollBlur()` 和 `unmountHome()` 中，路由从 `/` 离开时会移除监听并还原样式。
   - 如果感觉滚动有卡顿，可以优先检查：
     - 是否在 `scrollBlurHandler` 中频繁调用 `document.querySelector`（当前实现已有，但数量可接受）。
     - 浏览器 DevTools Performance 面板中是否有长时间的 `Recalculate Style / Layout` 与 `Paint`。

3. **全局滚动进度条**
   - 由 `initProgressBar()` 创建 `#lk-progress` 元素，并在滚动时更新其宽度。
   - 采用 `passive: true` 的滚动监听；若未来增加更多滚动处理逻辑，优先复用这一监听或通过 `requestAnimationFrame` 合并更新，避免多个高频匿名回调。

---

## 滚动性能初步结论（基于静态分析）

- 实际滚动监听点主要有两个：
  1. 首页 Hero 模糊与背景切换：`initScrollBlur()` 的 `scrollBlurHandler`。
  2. 全局顶部进度条：`initProgressBar()` 内部的 `window.addEventListener('scroll', ...)`。
- 两个监听都标记为 `passive: true`，不会阻塞滚动。
- 在路由切换时，首页相关监听会通过 `unmountHome()` → `cleanupScrollBlur()` 移除；进度条监听则是全局常驻的。

若后续在真实浏览器里确认存在明显「往下拖时越拖越慢」的问题，优先排查：

1. 是否在插件 / 浏览器扩展层面有额外滚动 Hook（例如第三方统计脚本）。  
2. 是否是 Waline 渲染大量评论节点导致的重排（可以通过减少一次渲染的评论数验证）。  
3. 是否有其它自定义脚本直接在 `window` 或 `document` 上注册了滚动监听（目前仓库内未见除上述两处之外的实现）。

