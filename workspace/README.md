# Workspace 目录结构

## 概述
这个 workspace 目录用于存放项目的配置、工具、模板和归档文件，与项目的主要代码目录分离。

## 目录结构

```
workspace/
├── agents/           # Agent 配置文件
│   └── AGENTS.md    # Agent 使用说明
├── skills/           # Skills 配置
│   └── （预留）      # Skills 相关配置
├── cloud/            # Cloud 相关文件
│   ├── logs/         # 日志文件
│   │   └── debug-16cc0b.log
│   └── temp/         # 临时文件
│       ├── item.id
│       ├── main
│       ├── noop.md
│       └── powershell
├── configs/          # 配置文件
│   ├── env/          # 环境配置
│   │   ├── .env
│   │   ├── .env.example
│   │   └── .env.local
│   └── docs/         # 文档配置
│       └── API.md
├── templates/        # 模板和提示词
│   ├── ai/          # AI 模板
│   └── prompts/     # 提示词模板
├── archives/         # 归档文件
│   ├── reports/     # 测试和报告文件
│   │   ├── 二次质量检测报告.md
│   │   ├── 文章封面生成质量验证报告.md
│   │   └── 文章封面生成队列顺序测试报告.md
│   └── backups/      # 备份文件
└── tools/            # 工具和脚本
    ├── test-cover-queue-detailed.js
    └── test-cover-queue-order.js
```

## 使用说明

### Agent 和 Skills
- Agents 配置已放在 `workspace/agents/` 目录
- Skills 配置已放在 `workspace/skills/` 目录
- 这些与项目中的 `.claude` 配置并列使用

### Cloud 相关
- 日志文件自动存放在 `cloud/logs/`
- 临时文件存放在 `cloud/temp/`
- Cloud Code 的工作成果会放在相应目录

### 配置文件
- 环境配置已移动到 `configs/env/`
- 文档配置已移动到 `configs/docs/`
- 这些配置可以在不同环境中复用

### 模板和提示词
- 预留了 `templates/ai/` 和 `templates/prompts/` 目录
- 可以存放通用的 AI 模板和提示词

### 归档文件
- 测试报告和归档文件存放在 `archives/` 目录
- 保持项目根目录整洁

## 通用配置

本工作区配置支持：
- Claude Code
- Codex
- 其他 AI 编程助手

## 更新时间
2026-04-21