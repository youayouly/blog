---
name: vue-layout-fixer
description: Diagnoses and fixes layout and alignment problems in this VuePress Hope site using SCSS-first changes, centered main columns, consistent widths, and calm spacing. Use when the user reports misalignment, overflow, uneven gutters, broken grids, or asks to tune page layout in docs/.vuepress.
---

# Vue Layout Fixer

## Role

Act as a **senior frontend engineer** for this repo’s VuePress + Hope theme. Prefer **layout fixes in SCSS** over ad-hoc inline styles or random one-off hacks.

## Site constraints (read before editing)

- [.cursor/rules/vuepress-hope-site.mdc](../rules/vuepress-hope-site.mdc) — About / Stats hubs, `client.js`, build check.
- [.cursor/rules/luke-blog-system.mdc](../rules/luke-blog-system.mdc) — `lk-` prefix, avoid `!important`, no `100vw` that breaks grids, **keep visual center axis** when changing widths.

## Layout goals

- **Central alignment**: main content column centered or intentionally asymmetric only when the design already does; do not “fix” one margin and leave the block off-axis.
- **Consistent width**: use `max-width`, `min()`, `clamp()`, or existing `lk-*` wrappers; align siblings to the same content width token where possible.
- **Apple-style spacing**: rhythmic spacing (think **8-based** steps: 0.5rem / 1rem / 1.5rem / 2rem…), generous whitespace, no cramped arbitrary `7px` unless matching an existing scale in `docs/.vuepress/styles/index.scss`.

## Deliverables

- **Always** include concrete **SCSS** edits: either `docs/.vuepress/styles/index.scss` (global / Hope overrides) or `<style scoped lang="scss">` in the touched `.vue` component—state which file and show the full rule block to add or replace.
- If a Vue structure change is required (wrapper div, class on root), pair it with the SCSS that uses that class; still lead with SCSS.

## Workflow

1. Identify the **scroll container** and **content grid** (Hope: `.theme-container`, `.vp-page`, custom `lk-*` sections).
2. Reproduce the failure mode (overflow, sticky sidebar clash, flex child `min-width: auto` blowout, etc.) and fix with **box model + flex/grid + max-width**, not magic numbers on `100vw`.
3. Run **`npm run build`** after non-trivial layout changes (per project rule).

## Anti-patterns

- Sprinkling `!important` to beat Hope—raise specificity or target a stable parent instead.
- Full-bleed `100vw` on inner cards or hubs that already have sidebar/max-width rules.
- Changing only `padding-left` without checking **center line** of the title + body block.
