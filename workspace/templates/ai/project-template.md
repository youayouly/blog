# 项目模板 - VuePress + Vercel

## 项目概述
这是一个基于 VuePress 2.x 的静态网站项目，部署在 Vercel 上。

## 技术栈
- VuePress 2.x
- VuePress Theme Hope
- Vite bundler
- Vercel deployment
- Node.js

## 开发环境

### 快速启动
```bash
# 安装依赖
npm install

# 本地开发
npm run dev
# 访问: http://localhost:8080

# 完整测试（需要 API）
vercel dev
# 访问: http://localhost:3000
```

### 构建和部署
```bash
# 生产构建
npm run build

# 批量发布文章
npm run publish:batch

# 推送到 GitHub
npm run push
```

## 项目结构

### 核心目录
- `docs/` - Markdown 内容文件
- `docs/.vuepress/` - VuePress 配置
- `api/` - API 路由
- `scripts/` - 工具脚本
- `workspace/` - 工作区配置

### 关键配置
- `docs/.vuepress/config.js` - 主要配置
- `vercel.json` - Vercel 部署配置
- `package.json` - 项目依赖和脚本

## 特色功能

### 1. 文章发布系统
- 支持单篇文章发布
- 支持批量发布
- AI 自动生成封面

### 2. 交互功能
- Live2D 看板娘
- 粒子背景效果
- 文章封面队列系统

### 3. 开发工具
- 本地开发服务器
- Vercel 调试环境
- 自动化部署

## 环境变量

### 开发环境
```env
LK_PUBLISH_API_URL=http://localhost:8080/api
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your-api-key
```

### 生产环境
```env
LK_PUBLISH_API_URL=https://your-domain.com/api
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your-production-key
```

## 最佳实践

### 开发流程
1. 使用 `npm run dev` 进行快速开发
2. 需要测试 API 时使用 `vercel dev`
3. 累积多个改动后统一提交
4. 推送到 GitHub 触发自动部署

### 代码规范
- 使用 `.vuepress/components/` 存放组件
- 样式文件放在 `.vuepress/styles/`
- 使用 lk- 前缀定义自定义样式

## 部署说明

### Vercel 部署
1. 连接 GitHub 仓库
2. 自动检测 VuePress 项目
3. 每次推送自动部署

### 自定义配置
- 修改 `vercel.json` 调整构建配置
- 设置环境变量管理密钥
- 配置域名和自定义路由

## 故障排除

### 常见问题
1. **构建失败**：检查 `node_modules` 是否完整
2. **样式不生效**：确认 `index.scss` 路径正确
3. **API 404**：确保文件在 `api/` 目录下

### 调试技巧
```bash
# 查看 VuePress 配置
node -e "console.log(require('./docs/.vuepress/config.js'))"

# 清理缓存
rm -rf .vuepress/dist && npm run build
```

## 更新日志
- 2026-04-21: 创建模板文件
- 支持多 AI 工具使用