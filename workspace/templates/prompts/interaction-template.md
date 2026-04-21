# 交互式提示词模板

## 概述
这个模板用于 AI 助手半自动化的提示词处理，通过问答式交互补全信息，同时保持对话的自然流畅。

## 交互流程

```
用户提出问题 → 模板化处理 → 信息补全 → AI 处理 → 输出结果
```

## 交互式处理步骤

### 第1步：理解用户意图
- AI 分析用户问题的核心
- 判断需要哪些背景信息
- 确定任务类型（开发/调试/优化等）

### 第2步：智能信息补全
- **自动提取**：从项目文件中获取已知信息
- **主动询问**：对缺失的关键信息提问
- **可选确认**：对已获得的信息进行确认

### 第3步：生成背景任务
```yaml
Background: 
  - Project: VuePress 2.x + Vercel
  - Context: 当前开发状态
  - Constraints: 已知的限制条件
  - User: 用户角色描述
  - Environment: 运行环境
```

### 第4步：任务处理
- 根据补全的信息执行任务
- 保持交互的自然性
- 提供清晰的输出

## 信息收集策略

### 必填信息（自动获取）
```javascript
const autoInfo = {
  project: {
    name: "network-page",
    type: "vuepress",
    techStack: ["VuePress 2.x", "theme-hope", "Vite"]
  },
  environment: {
    dev: "localhost:8080",
    prod: "vercel",
    hasApi: true
  },
  files: {
    config: ".vuepress/config.js",
    scripts: "scripts/",
    api: "api/"
  }
};
```

### 条件信息（按需询问）
```javascript
const conditionalInfo = {
  development: {
    changes: "最近改动了什么？",
    environment: "当前在哪个环境？",
    symptoms: "具体出现了什么问题？"
  },
  debugging: {
    error: "错误信息是什么？",
    steps: "如何复现问题？",
    timeframe: "什么时候开始出现的？"
  },
  deployment: {
    target: "部署到哪个环境？",
    requirements: "有什么特殊要求？",
    rollback: "需要回滚策略吗？"
  }
};
```

### 用户信息（智能推断）
```javascript
const userInfo = {
  role: "开发者", // 从项目文件和上下文推断
  expertise: "VuePress", // 从技术栈推断
  goals: "完成当前任务", // 从问题描述推断
  constraints: "时间/资源限制" // 需要确认
};
```

## 具体交互示例

### 示例1：开发新功能
```
用户："添加一个搜索功能"

AI：
"我来帮你添加搜索功能。为了更好地理解需求，需要了解一些信息：

1. 搜索的范围是什么？（全站搜索/文章搜索/标签搜索）
2. 需要实时搜索还是搜索后提交？
3. 对搜索性能有什么要求吗？

根据你的项目信息：
- 项目类型：VuePress 2.x + Vercel
- 已有配置：theme-hope 主题
- API 支持：有 API 路由功能

请提供以上信息，我会为你实现。"
```

### 示例2：修复 bug
```
用户："登录页面加载很慢"

AI：
"我来帮你优化登录页面性能。让我先了解一下情况：

已知信息：
- 项目：VuePress 2.x + Vercel
- 环境：可能在线上

需要确认：
1. 页面完全加载需要多长时间？
2. 是首次加载慢还是每次都慢？
3. 有其他异常现象吗？（如白屏、错误等）

请提供这些信息，我会帮你定位和修复问题。"
```

## 背景任务生成模板

```markdown
## Background Context

**Project:** {{project.name}} - {{project.type}}  
**Environment:** {{environment.current}}  
**User Role:** {{user.role}}  
**Task Type:** {{task.type}}  
**Timeline:** {{task.timeline}}  
**Constraints:** {{task.constraints}}

## Available Information
- Tech Stack: {{project.techStack}}
- File Structure: {{project.files}}
- Dependencies: {{project.dependencies}}
- Current State: {{current.state}}
```

## 处理策略

### 1. 智能推断
- 从项目结构推断技术栈
- 从文件修改时间推断开发进度
- 从错误日志推断问题类型

### 2. 渐进式收集
- 先收集最关键的信息
- 根据任务复杂度决定需要多少细节
- 保持对话的自然流畅

### 3. 上下文记忆
- 记住之前对话的信息
- 避免重复询问
- 在多个任务间复用信息

## 用户体验优化

### 1. 减少认知负担
- 一次只问一个问题
- 提供默认选项
- 用自然语言提问

### 2. 实时反馈
- 告知用户进度
- 解释为什么需要某些信息
- 预估处理时间

### 3. 灵活性
- 允许用户随时提供更多信息
- 可以跳过非关键问题
- 支持多轮交互

## 技术实现

### 自动信息收集
```javascript
// 从项目文件中自动收集信息
function collectProjectInfo() {
  return {
    package: readPackageJson(),
    config: readVuePressConfig(),
    scripts: listScripts(),
    api: listApiRoutes()
  };
}

// 从环境信息中收集
function collectEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: os.platform(),
    cwd: process.cwd()
  };
}
```

### 智能提问
```javascript
function askSmartQuestions(taskType, context) {
  const questions = {
    development: getDevelopmentQuestions(context),
    debugging: getDebuggingQuestions(context),
    deployment: getDeploymentQuestions(context)
  };
  
  return filterRelevantQuestions(questions[taskType], context);
}
```

---
*最后更新: 2026-04-21*  
*适用于: Claude Code, Codex, Cursor 等AI工具*