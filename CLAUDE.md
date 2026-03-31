# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog/portfolio site built with VuePress 2 and `vuepress-theme-hope`. It features a custom homepage with scroll-based visual effects, Waline comment system integration, visitor statistics, and custom styling.

## Common Commands

- **Development**: `npm run dev` – Starts local dev server with hot reload
- **Build**: `npm run build` – Builds static site to `docs/.vuepress/dist/`
- **Deployment**: The site is configured for Vercel deployment (see `vercel.json`)

## Architecture

### Core Structure
- **VuePress 2** with Vite bundler
- **Theme**: `vuepress-theme-hope` (beta 166) with auto color mode switching
- **Custom components** in `docs/.vuepress/components/` enhance homepage and pages
- **Custom client-side logic** in `docs/.vuepress/client.js` handles:
  - Hero wallpaper rotation and scroll blur effects
  - Dark mode detection
  - Waline comment system initialization
- **Configuration**: `docs/.vuepress/config.js` defines site structure, navigation, and Waline settings

### Key Features
1. **Homepage Enhancements**
   - Scroll-triggered wallpaper cycling (multiple background images)
   - Blur and scale effects on hero section during scroll
   - Typewriter tagline animation
   - Floating shapes background

2. **Comment System**
   - Waline integration with custom "white line" (白描) styling
   - Left/right split layout mimicking traditional forum/BBS style
   - Custom CSS injected via config.js that overrides default Waline styles

3. **Content Sections**
   - Tech projects (tech/) with grid/card views
   - Study abroad notes (study/) for HK, UK, Singapore
   - Travel photo albums (travel/) in 3×3 grid
   - Comments page (comments/) with Waline

4. **Statistics & Utilities**
   - Visitor counting via `visitorClient.js`
   - Busuanzi page views via `busuanziClient.js`
   - Relative time formatting in Chinese via `relativeTimeZh.js`

### Styling System
- **Custom SCSS**: `docs/.vuepress/styles/index.scss` – main custom styles
- **CSS Injection**: Waline-specific styles injected directly in config.js
- **Public assets**: `docs/.vuepress/public/` – images, custom.css
- **Theme variables**: `docs/.vuepress/styles/palette.scss` – color definitions

### Build & Deployment
- **Output directory**: `docs/.vuepress/dist/` (gitignored)
- **Vercel config**: `vercel.json` specifies build commands
- **Cache directories**: `docs/.vuepress/.cache/` and `.temp/` (gitignored)

## Important Notes for Development

1. **Waline Styling**: The custom CSS for Waline comments is embedded in `config.js` under the `head` section. This uses aggressive `!important` overrides to ensure the "white line" aesthetic.

2. **Homepage Effects**: The scroll-based wallpaper rotation and blur effects are implemented in `client.js`. These depend on external image URLs; fallback local backgrounds are used when images fail to load.

3. **Component Usage**: Custom Vue components are registered globally in `client.js` and can be used in markdown files via standard VuePress component syntax.

4. **Article Counting**: The config.js includes a custom function `countArticleMarkdown()` that counts .md files (excluding README.md) for display in site statistics.

5. **Environment Variables**: Build-time values (`__LK_ARTICLE_COUNT__`, `__LK_BUILD_TIME_ISO__`) are injected via Vite's `define` option in config.js.