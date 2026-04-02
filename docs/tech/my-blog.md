---
title: Personal Blog
pageClass: page-projects
comment: false
---

# Personal Blog

This site is built with **VuePress 2** and **vuepress-theme-hope**: a static-first stack with Markdown pages, Vue SFC components for the home layout (hero, typewriter, album grid, project cards), and client-side enhancements in `docs/.vuepress/client.js`.

## Stack

- **VuePress 2** (Vite bundler) for content and build pipeline  
- **vuepress-theme-hope** for navbar, sidebar, dark mode, and comments (Waline) integration  
- **Sass** (`docs/.vuepress/styles/index.scss`) for global layout and Chromium-safe glass styles  
- Typical deploy targets: static hosts (e.g. Vercel, Netlify, Cloudflare Pages) with Git-triggered builds  

## What lives here

- Custom homepage grid (profile column + features)  
- Travel album with `AlbumFeed` and `ProjectNineGrid`  
- Tech hub with structured project pages under `/tech/`  

## Next steps

- Add a public repo link and deployment notes  
- Document key theme overrides and component map  
