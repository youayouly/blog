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
- `docs/.vuepress/composables/` - Shared reactive state (e.g. `useProjectsHub` for cross-component role filtering)
- `docs/.vuepress/data/` - Static data files (e.g. `projectsCatalog.js`, `projectRoles.js`)
- `docs/.vuepress/utils/` - Shared utilities (auth, preferences, avatar, navigation)
- `docs/.vuepress/styles/` - Global SCSS (`index.scss` + `palette.scss`)

**Key Patterns**:

1. **Client Entry** (`docs/.vuepress/client.js`): Registers root components and handles route-based logic including Live2D widget, scroll effects, home page enhancements, and route-to-hash scrolling. Uses `defineClientConfig` with `rootComponents` array for site-wide Vue components. Key behaviors:
   - `scrollToRouteHash()` — ensures navigation to hash anchors (e.g. `/about#about-intro`) scrolls correctly
   - `syncRouteDataAttr()` — sets `<html data-lk-route>` for CSS route-based styling during transitions
   - `HomeTypewriterTagline` — mounted as a separate Vue app into the Hope theme hero slot

2. **Global Components**: Registered in `enhance()` and usable directly in markdown:
   - `AboutPageLayoutV2` — hub/homepage layout (used at site root `/`)
   - `AboutMePage` — personal about page (used at `/about`)
   - `ProjectCardsGrid`, `ProjectsSidebarFilters` — projects hub with sidebar role filtering
   - `ProfileCard`, `SiteAvatar`, `SiteFooter`, `ProductManagerCases`, etc.

3. **Build-time Variables**: Injected via Vite's `define` in `config.js`:
   - `__LK_ARTICLE_COUNT__` - Total markdown article count
   - `__LK_TECH_COUNT__` - Tech/project page count
   - `__LK_BUILD_TIME_ISO__` - Build timestamp
   - `__LK_SITE_YEAR__` - Current year for footer
   - `__LK_SITE_ONLINE_SINCE_ISO__` - Site launch date for "running X days" footer (default or `LK_SITE_ONLINE_SINCE` env var)

4. **Navigation Control**: `navPrefs.js` manages navbar visibility and access control via localStorage events. Pages can be hidden/protected through `navbarPageOptions` and `accessControlledPageOptions`.

5. **Projects Hub**: `useProjectsHub()` composable provides reactive role filtering shared between `ProjectsSidebarFilters` and `ProjectCardsGrid`. Role IDs: `all`, `pm`, `ai-product`, `frontend`, `backend`, `embedded`, `ai-engineering`, `ml`. Synced from URL `?role=` query param via `syncHubRoleFromRoute()`.

6. **Styling Conventions**:
   - CSS classes prefixed with `lk-` for custom styles
   - Use `.lk-` classes in `index.scss` to override theme defaults
   - `data-lk-route` attribute on `<html>` for route-based CSS targeting
   - Components use scoped styles with `<style scoped>`

**Routing**:
- Site root `/` (README.md) = hub/homepage using `AboutPageLayoutV2`
- `/about` = personal about page using `AboutMePage`
- `/tech/` = projects hub with sidebar role filters
- `/article/` = blog article list
- Navbar: 首页 → `/`, 项目 → `/tech/`, 文章 → `/article/`, 生活(留学/相册/统计), 关于我 → `/about#about-intro`

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
- `scripts/gen-china-outline.mjs` - Generates China map outline data for `VisitedChinaFootprints`

### Article Cover Generation:
- Uses Dify AI API to generate covers
- Queued processing (serial generation)
- Covers stored in `docs/.vuepress/public/gallery/`
- Supports batch generation with manual application

## Development Notes

### Environment Variables:
- `LK_PUBLISH_API_URL` - Custom API endpoint for publishing
- `LK_SITE_ONLINE_SINCE` - Override site launch date (ISO 8601, e.g. `2026-03-27T00:00:00+08:00`)
- `DIFY_API_URL` / `DIFY_API_KEY` - For AI cover generation

### Vercel Deployment:
- API files are copied to root before build via `copy-api.mjs`
- Build process uses `--max-old-space-size=8192` for memory optimization
- The root `/` now serves as the main hub page (not a redirect to `/about`)

### Styling System:
- Theme uses CSS variables for colors (`--vp-c-brand-1`, etc.)
- Custom styles in `index.scss` override theme defaults
- Glassmorphism effects throughout with backdrop-filter
- Responsive design with mobile-first approach
- `data-lk-route` on `<html>` enables route-specific CSS without page class flicker

### Special Features:
- Live2D widget (toggleable in navbar)
- Network particle background effects
- Custom navbar with accessibility controls
- WeChat Moments-style travel pages
- Dynamic article cover generation
- China visited footprints map (`VisitedChinaFootprints`)
- Home page typewriter tagline effect
- Site footer with "running X years X days" counter
