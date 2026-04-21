# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev        # Start dev server (localhost:8080)
npm run build      # Production build with cache cleanup
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
