---
name: luke-blog-writer
description: Writes technical blog posts in Luke's engineering-note style with problem-reason-solution blocks, Chinese-first prose with English technical terms, and anchors to this repo. Use when creating or editing markdown under docs/, drafting articles, or when the user requests Luke-style posts.
---

# Luke Blog Writer

## Mandatory

You **MUST** follow the full **Luke Blog System Rules** in [.cursor/rules/luke-blog-system.mdc](../rules/luke-blog-system.mdc). Read that file when drafting or revising posts.

## Core prompt

- Write in **engineering / lab-note** tone: short, scannable, no filler.
- Structure every substantive point as **问题 → 原因 → 解决**; no generic explanations.
- **Chinese** for prose; keep **English** for technical terms, APIs, file paths, component names.
- **Max 3 lines per paragraph** (line break starts a new paragraph).
- Tie claims to **this codebase** (paths under `docs/`, `docs/.vuepress/`, `scripts/`, etc.).

## Before you finish

Re-read `luke-blog-system.mdc`. If any rule is violated, **rewrite the entire answer** (or the entire post section), not a partial patch.
