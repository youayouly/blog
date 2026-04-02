---
name: nonhome-click-blur-fix
overview: Fix Edge non-home pages where after scroll stop and clicking empty center area, navbar/sidebar modules turn blurry until hover/micro-move; by forcing a brief recomposition nudge for backdrop-filter layers on scroll end/click.
todos: []
isProject: false
---

### Goal

Remove the remaining “scroll stop + click center whitespace => navbar/side modules blurry” issue on non-home pages (Projects / Album / Study Abroad). The blur should disappear without requiring additional scroll/hover.

### Observations to use

- Issue happens on non-home pages only.
- After scrolling stops near mid-page, clicking the center empty area re-triggers blur.
- Moving the mouse to the navbar/sidebar area makes it clear again.
- Up/down scrolling no longer triggers the original bug (already improved).

### Hypothesis

Even after isolating layers, Edge can leave `backdrop-filter` composites in a bad state after scroll-to-idle + pointer interactions. Hover forces Edge to recompose/re-sample the backdrop. We will explicitly trigger the same recomposition by temporarily disabling `backdrop-filter` for the key glass layers for one animation frame, then restoring immediately.

### Scope

- Code changes will be limited to:
  - `[docs/.vuepress/client.js](docs/.vuepress/client.js)` (event timing: scroll idle + click)
  - `[docs/.vuepress/styles/index.scss](docs/.vuepress/styles/index.scss)` (CSS override toggled by a class)
  - `[docs/.vuepress/components/SiteFooter.vue](docs/.vuepress/components/SiteFooter.vue)` if footer needs the same CSS hook

### Status

- Phase 1 (CSS hook + scroll-idle + center `pointerdown`) is **implemented** in the repo.
- User feedback: blur still appears when the pointer **stays in the main reading column** (“reading focus”); moving to navbar/sidebar clears it; returning to center brings blur back after a short time. Short **2-frame** `backdrop-filter` toggles and a **600ms** cooldown likely limit success rate.

### Phase 2 (execute in Agent mode — non-markdown files blocked in Plan mode)

All changes in `[docs/.vuepress/client.js](docs/.vuepress/client.js)`.

1. `**nudgeGlassLayers(reason, options)`**
  - Support `options.skipCooldown` and optional `options.cooldownMs` (default **400** instead of 600).
  - Replace the 2 nested `requestAnimationFrame` calls with a **5-frame** chain before removing `lk-glass-nudge--no-blur` (one `rAF` kickoff then `unwind` with depth counter) so Edge has time to tear down and rebuild backdrop composites.
2. `**isInsideMainReadingColumn(target)`**
  - `target.closest('.theme-hope-content, main.vp-page, .vp-page:not(.page-home)')`.
3. **Global `pointermove` (passive)** on non-home only:
  - Coalesce with a single `pointerMoveRaf` per frame.
  - Track `**pointerWasInGlass`**: when transitioning **glass → main** (`pointerWasInGlass && !inGlass`), call `nudgeGlassLayers('glass-to-content', { skipCooldown: true })`.
  - When pointer is in main reading column and **not** in glass, **debounce 750ms** (`setTimeout` in `mainIdleTimer`): on fire call `nudgeGlassLayers('main-column-idle')`; clear timer on unmount and when leaving the zone.
4. `**onUnmounted`**
  - Remove `pointermove` listener; `clearTimeout(mainIdleTimer)`; `cancelAnimationFrame(pointerMoveRaf)`.
5. **CSS (optional follow-up)**
  - If any glass panel still misbehaves, extend `html.lk-glass-nudge--no-blur` in `[docs/.vuepress/styles/index.scss](docs/.vuepress/styles/index.scss)` with extra selectors found in DevTools (e.g. mobile sidebar wrappers).

### Verification (manual)

- Non-home: scroll to mid-page, move pointer from **sidebar/nav → main**, leave it reading for several seconds — navbar/sidebar should stay crisp without requiring hover on glass.
- Repeat: center click, scroll idle — no regression.
- Home `/` — no nudge (existing `route.path === '/'` guards).

### Implementation detail: which layers to hook

- Start with:
  - `.vp-navbar`
  - `.lk-footer__meta-bar`
- If after verification the sidebar/backdrop layers are still the culprit, extend the CSS hook with the closest sidebar container selector you see in DevTools (we’ll locate it if needed).

