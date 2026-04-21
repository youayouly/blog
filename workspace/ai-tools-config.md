# AI 工具配置

## 支持的 AI 工具

### 1. Claude Code
**配置位置**: `.claude/`（项目级）和 `workflows/`（工作流）

**特色功能**:
- 完整的 superpowers 支持
- 工作流管理
- 任务跟踪
- 记忆系统

**使用方式**:
```bash
# 标准 Claude Code 工作流
npm run dev              # 快速开发
vercel dev               # 完整测试
npm run publish:batch    # 批量发布
```

### 2. Codex
**配置位置**: `workspace/configs/universal-config.json`

**特色功能**:
- 通用配置适配
- 项目模板支持
- 路径映射
- 环境变量管理

**使用方式**:
```bash
# Codex 会自动读取 universal-config.json
# 支持快速启动和项目理解
```

### 3. Cursor
**配置位置**: `.cursor/`（已存在）

**特色功能**:
- IDE 集成
- 快捷键配置
- 调试工具

### 4. 其他 AI 助手
**配置位置**: `workspace/` 通用文件

**特色功能**:
- 模板化提示
- 项目结构说明
- 配置文件共享

## 配置文件说明

### 核心配置文件
- `workspace/configs/universal-config.json` - 通用配置
- `workspace/templates/ai/project-template.md` - 项目模板
- `workspace/README.md` - 工作区说明

### 工具特定配置
- `.claude/settings.local.json` - Claude Code 本地设置
- `.cursor/` - Cursor 配置目录
- `workspace/agents/` - Agent 配置
- `workspace/skills/` - Skills 配置

## 使用建议

### 开发者选择

#### Claude Code 用户
- 使用完整的 superpowers 工作流
- 享受任务跟踪和记忆系统
- 使用 `workflows/vuepress-vercel-workflow.md`

#### Codex 用户
- 使用通用配置快速启动
- 读取项目模板理解结构
- 利用环境变量管理

#### Cursor 用户
- 使用 IDE 集成功能
- 配置自定义快捷键
- 利用调试工具

#### 其他 AI 助手用户
- 使用通用模板和配置
- 参考项目结构说明
- 使用标准化提示词

### 工作流程

#### 新项目启动
1. **所有工具**: 阅读 `workspace/README.md`
2. **配置**: 查看 `workspace/configs/universal-config.json`
3. **模板**: 参考 `workspace/templates/ai/project-template.md`

#### 日常开发
1. **Claude Code**: 使用 `workflows/vuepress-vercel-workflow.md`
2. **Codex**: 自动读取配置，无需额外设置
3. **Cursor**: 使用 IDE 集成功能

#### 部署和发布
1. **所有工具**: 参考通用配置中的部署说明
2. **使用脚本**: `workspace/tools/` 中的工具脚本
3. **查看报告**: `workspace/archives/reports/` 中的测试报告

## 配置更新

### 添加新工具支持
1. 在 `workspace/configs/` 中添加配置文件
2. 更新 `universal-config.json`
3. 在 `ai-tools-config.md` 中添加说明

### 更新项目模板
1. 编辑 `workspace/templates/ai/project-template.md`
2. 更新最佳实践部分
3. 同步更新其他配置文件

## 注意事项

1. **不要修改**: 项目根目录的 `.claude/` 配置
2. **可以修改**: `workspace/` 中的所有文件
3. **备份重要**: 在修改配置前备份相关文件
4. **测试验证**: 修改后测试各 AI 工具的兼容性

---
*最后更新: 2026-04-21*
*兼容性: Claude Code, Codex, Cursor, 其他 AI 助手*