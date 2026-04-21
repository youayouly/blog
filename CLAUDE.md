# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev        # Start dev server (localhost:8080)
npm run build      # Production build with cache cleanup
npm run build:trace # Build with page-by-page logging for debugging
```

## Architecture Overview

**Stack**: VuePress 2.x with `vuepress-theme-hope` theme, Vite bundler.

**Directory Structure**:
- `docs/` - Markdown content (pages are auto-routed from file paths)
- `docs/.vuepress/components/` - Vue components registered globally via `client.js`
- `docs/.vuepress/utils/` - Shared utilities (auth, preferences, etc.)
- `docs/.vuepress/styles/` - Global SCSS (`index.scss` + `palette.scss`)

**Key Patterns**:

1. **Client Entry** (`docs/.vuepress/client.js`): Registers root components and handles route-based logic including Live2D widget, scroll effects, and home page enhancements. Uses `defineClientConfig` with `rootComponents` array for site-wide Vue components.

2. **Global Components**: Components like `ProjectNineGrid`, `AboutTimeline`, `SiteAvatar` are registered in `enhance()` and can be used directly in markdown files.

3. **Build-time Variables**: Injected via Vite's `define` in `config.js`:
   - `__LK_ARTICLE_COUNT__` - Total markdown article count
   - `__LK_BUILD_TIME_ISO__` - Build timestamp
   - `__LK_SITE_YEAR__` - Current year for footer

4. **Navigation Control**: `navPrefs.js` manages navbar visibility and access control via localStorage events. Pages can be hidden/protected through `navbarPageOptions` and `accessControlledPageOptions`.

5. **Styling Conventions**:
   - CSS classes prefixed with `lk-` for custom styles
   - Use `.lk-` classes in `index.scss` to override theme defaults
   - Components use scoped styles with `<style scoped>`

**Root Redirect**: The site root `/` redirects to `/about`. The themed homepage is at `/home`.

## Article Publishing System

The site includes a custom article publishing system with the following workflows:

### API Endpoints (in `api/` and `docs/api/`):
- `/api/publish` - Publish single article
- `/api/publish-batch` - Publish multiple articles in one commit
- `/api/delete` - Delete single article
- `/api/delete-batch` - Delete multiple articles in one commit
- `/api/cover` - Generate article covers using Dify AI

### Key Scripts:
- `scripts/copy-api.mjs` - Copies API files to root for Vercel deployment
- `scripts/article.mjs` - CLI tool for article management (create, push, status)
- `scripts/push.mjs` - Git push utility with commit message formatting
- `scripts/sync-article-readme-to-github.mjs` - Syncs README with GitHub

### Article Cover Generation:
- Uses Dify AI API to generate covers
- Queued processing (serial generation)
- Covers stored in `docs/.vuepress/public/gallery/`
- Supports batch generation with manual application

## Development Notes

### Environment Variables:
- `LK_PUBLISH_API_URL` - Custom API endpoint for publishing
- `DIFY_API_URL` / `DIFY_API_KEY` - For AI cover generation

### Vercel Deployment:
- API files are copied to root before build via `copy-api.mjs`
- Build process uses `--max-old-space-size=8192` for memory optimization
- The root `/` redirects to `/about` in VuePress config

### Styling System:
- Theme uses CSS variables for colors (`--vp-c-brand-1`, etc.)
- Custom styles in `index.scss` override theme defaults
- Glassmorphism effects throughout with backdrop-filter
- Responsive design with mobile-first approach

### Special Features:
- Live2D widget (toggleable in navbar)
- Network particle background effects
- Custom navbar with accessibility controls
- WeChat Moments-style travel pages
- Dynamic article cover generation