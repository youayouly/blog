# API 端点文档

本项目提供了一组用于内容管理的 Vercel Serverless Functions API 端点。

## 环境变量配置

在部署前，请确保配置以下环境变量：

### 必需变量
- `GITHUB_REPO`: GitHub 仓库地址 (格式: `username/repo`)
- `GITHUB_TOKEN`: GitHub Personal Access Token (需要 repo 权限)
- `GITHUB_BRANCH`: Git 分支名称 (默认: `main`)
- `LK_SITE_USER`: 站点管理用户名
- `LK_SITE_PASS`: 站点管理密码

### 可选变量 (封面生成功能)
- `DIFY_API_URL`: Dify API 地址
- `DIFY_API_KEY`: Dify API 密钥
- `SILICONFLOW_API_KEY`: 硅基流动 API 密钥 (推荐使用)
- `HUGGINGFACE_API_KEY`: Hugging Face API 密钥
- `STABILITY_API_KEY`: Stability AI API 密钥

## API 端点

### 1. 发布文章 (`/api/publish`)

**方法**: `POST`

**请求体**:
```json
{
  "target": "article",
  "filename": "my-new-post",
  "title": "文章标题",
  "excerpt": "文章摘要",
  "content": "文章内容",
  "cover": "https://example.com/cover.jpg",
  "commitMessage": "发布新文章",
  "authUser": "用户名",
  "authPass": "密码"
}
```

**响应**:
```json
{
  "ok": true,
  "path": "docs/article/my-new-post.md",
  "url": "https://github.com/username/repo/...",
  "listUpdated": true,
  "localSaved": true
}
```

### 2. 批量发布文章 (`/api/publish-batch`)

**方法**: `POST`

**请求体**:
```json
{
  "articles": [
    {
      "target": "article",
      "filename": "post1",
      "title": "第一篇",
      "excerpt": "摘要",
      "content": "内容",
      "cover": "https://..."
    }
  ],
  "commitMessage": "批量发布",
  "authUser": "用户名",
  "authPass": "密码"
}
```

**响应**:
```json
{
  "ok": true,
  "count": 1,
  "commitSha": "abc1234",
  "filesCount": 2
}
```

### 3. 删除文章 (`/api/delete`)

**方法**: `POST`

**请求体**:
```json
{
  "target": "article",
  "slugs": ["post1", "post2"],
  "authUser": "用户名",
  "authPass": "密码"
}
```

**响应**:
```json
{
  "ok": true,
  "deleted": 2,
  "errors": []
}
```

### 4. 批量删除文章 (`/api/delete-batch`)

**方法**: `POST`

**请求体**: 同 `/api/delete`

**响应**: 同 `/api/delete`

### 5. 生成文章封面 (`/api/cover`)

**方法**: `POST`

**请求体**:
```json
{
  "title": "文章标题",
  "keywords": ["技术", "AI", "编程"],
  "summary": "文章摘要",
  "backend": "siliconflow",
  "authUser": "用户名",
  "authPass": "密码"
}
```

**响应**:
```json
{
  "ok": true,
  "imageUrl": "https://...",
  "backend": "硅基流动",
  "localSaved": true,
  "localPath": "/gallery/..."
}
```

**支持的后端**:
- `dify`: Dify 工作流
- `siliconflow`: 硅基流动 (推荐)
- `huggingface`: Hugging Face
- `stability`: Stability AI

### 6. 查询文章历史 (`/api/history`)

**方法**: `POST`

**请求体**:
```json
{
  "target": "article",
  "filename": "post1",
  "authUser": "用户名",
  "authPass": "密码"
}
```

**响应**:
```json
{
  "ok": true,
  "commits": [
    {
      "sha": "abc1234",
      "message": "更新文章",
      "date": "2026-04-20",
      "htmlUrl": "https://github.com/..."
    }
  ]
}
```

### 7. 同步本地文件 (`/api/sync`)

**方法**: `POST`

**功能**: 执行 `git pull` 同步远程仓库（仅本地开发环境）

**响应**:
```json
{
  "ok": true,
  "message": "Synced successfully",
  "output": "..."
}
```

## 部署说明

1. **本地开发**:
   ```bash
   npm run dev
   ```
   API 文件会自动复制到根目录 `api/` 文件夹

2. **生产构建**:
   ```bash
   npm run build
   ```
   构建过程中会自动复制 API 文件

3. **Vercel 部署**:
   - 项目会自动识别根目录的 `api/` 文件夹
   - 环境变量需要在 Vercel 控制台配置
   - API 端点会自动映射到 `/api/*` 路径

## 安全注意事项

1. 所有 API 端点都需要认证 (除了 `/api/cover` 可选)
2. 请不要在代码中硬编码密钥
3. 使用环境变量管理敏感信息
4. 定期更新 GitHub Token 和其他 API 密钥

## 错误处理

所有 API 端点遵循统一的错误响应格式：

```json
{
  "ok": false,
  "error": "错误描述信息"
}
```

常见错误码：
- `400`: 请求参数错误
- `401`: 认证失败
- `405`: 请求方法不支持
- `500`: 服务器内部错误
- `502`: 外部 API 调用失败 (如 GitHub API)