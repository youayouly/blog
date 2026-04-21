# VuePress + Vercel 开发工作流

## 概述
这个工作流专门针对 VuePress 项目 + Vercel 部署场景，优化开发效率，减少不必要的部署次数。

## 开发策略

### 1. 快速预览阶段
```bash
# 本地开发服务器（无 API 依赖）
npm run dev
# 访问: http://localhost:8080
```
- **用途**：快速查看页面效果、测试组件样式
- **特点**：启动快，适合频繁测试
- **时机**：日常开发、样式调整、组件测试

### 2. 完整测试阶段
```bash
# Vercel 调试环境（接近生产）
vercel dev
# 或者如果需要端口指定
vercel dev --port 3000
```
- **用途**：需要 API 路由、环境变量、生产配置测试
- **特点**：模拟真实生产环境
- **时机**：功能完成前、API 测试、环境变量验证

### 3. 部署优化策略

#### 核心原则
- **减少部署次数**：累积多个改动后统一提交
- **避免频繁推送**：小改动不要立即推送到 GitHub
- **批量发布**：使用 `git commit -am` 一次性提交多个改动

#### 工作流程
```bash
# 开发阶段
git checkout -b feature/new-feature
# ... 开码 ...

# 本地快速测试
npm run dev

# 完整环境测试
vercel dev

# 累积改动（不推送到远程）
git add .
git commit -m "feat: 新增功能描述"

# 最终推送到生产
git push origin main
```

## 环境配置

### 本地开发环境变量
在 `.env` 文件中配置：
```env
# 开发 API 地址（可选）
LK_PUBLISH_API_URL=http://localhost:8080/api

# AI 封面生成（仅在生产环境使用）
# DIFY_API_URL=https://api.dify.ai/v1
# DIFY_API_KEY=your-api-key
```

### Vercel 配置
创建 `vercel.json`：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".vuepress/dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

## 发布策略

### 1. 文章发布
- 使用 `scripts/article.mjs` 进行批量操作
- 累积多篇文章后使用 `npm run publish:batch`
- 减少单篇文章单独发布

### 2. 代码发布
- 每日最多推送 2-3 次
- 使用有意义的 commit message
- 关键功能完成后才推送

## 性能优化

### 构建优化
```bash
# 清理缓存重新构建
npm run build:trace

# 大内存构建
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### 调试技巧
```bash
# 查看 VuePress 构建日志
npm run build -- --debug

# 检查路由配置
node -e "console.log(require('./docs/.vuepress/config.js').router)"
```

## 最佳实践

### 开发检查清单
- [ ] 使用 `npm run dev` 快速测试
- [ ] 使用 `vercel dev` 完整测试
- [ ] 检查所有页面路由正常
- [ ] 验证 API 路由（如有）
- [ ] 测试响应式设计
- [ ] 累积改动后统一提交

### 常见问题
1. **样式不生效**：检查 `docs/.vuepress/styles/index.scss`
2. **路由错误**：验证文件路径和配置
3. **API 404**：确认 `api/` 文件位置正确
4. **构建失败**：清理 node_modules 重新安装

## 快速命令参考
```bash
# 开发
npm run dev              # 快速预览
vercel dev               # 完整测试

# 构建
npm run build             # 生产构建
npm run build:trace       # 构建调试

# 发布
npm run publish:batch     # 批量发布文章
npm run push              # 推送到 GitHub
```

---
*最后更新：2026-04-21*
*适用于：VuePress 2.x + Vercel 部署项目*