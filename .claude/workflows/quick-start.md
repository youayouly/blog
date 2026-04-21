# 快速启动指南

## 当你想开始开发时

1. **打开项目目录**
   ```bash
   cd E:\network\page
   ```

2. **查看当前工作流**
   ```bash
   cat .claude/workflows/vuepress-vercel-workflow.md
   ```

3. **根据需求选择启动方式**
   - **快速预览**：`npm run dev`
   - **完整测试**：`vercel dev`

## 工作流文件位置

```
E:\network\page\.claude\
├── workflows/
│   ├── vuepress-vercel-workflow.md    # 详细工作流说明
│   ├── config.json                  # 工作流配置
│   └── quick-start.md               # 快速启动指南
```

## 使用提示

- 工作流文件放在 `.claude/workflows/` 下，不会影响项目结构
- Claude 会自动检测到这是一个 VuePress + Vercel 项目
- 你可以随时查看和修改这些文件
- 不会影响其他项目或全局配置