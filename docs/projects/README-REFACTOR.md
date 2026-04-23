---
title: Projects Refactor Note
comment: false
toc: false
sidebar: false
---

# Projects Refactor Note

当前方向：不再维护独立 PM Portfolio 页面。

PM 相关内容已经并入 `/tech/` 的 Projects 页面，并通过 `ProductManagerCases` 组件展示在“产品经理作品集”板块中。

主要文件：

- `docs/tech/README.md`
- `docs/.vuepress/components/ProductManagerCases.vue`
- `docs/.vuepress/client.js`

保留原则：

- `/tech/` 仍然是 Projects 主入口。
- 原有项目列表继续保留。
- PM 案例使用和项目列表接近的三列卡片排版。
- 不新增 `/pm/` 独立页面入口。
