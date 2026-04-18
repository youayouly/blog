/**
 * Vercel Serverless Function: 发布 Markdown 文件到 GitHub
 *
 * 请求体: { target, filename, content, commitMessage, authUser, authPass }
 * 响应: { ok: boolean, path?: string, url?: string, error?: string }
 *
 * 环境变量:
 * - GITHUB_TOKEN: GitHub Personal Access Token (需要 repo 权限)
 * - GITHUB_REPO: 仓库名 (owner/repo 格式)
 * - GITHUB_BRANCH: 分支名 (可选，默认 main)
 * - LK_SITE_USER: 站点登录用户名
 * - LK_SITE_PASS: 站点登录密码
 */

const ALLOWED_TARGETS = {
  article: 'docs/article',
  tech: 'docs/tech',
}

const ALLOWED_EXTENSIONS = ['.md', '.markdown']
const GITHUB_API_BASE = 'https://api.github.com'

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') return false
  const base = filename.toLowerCase()
  if (!ALLOWED_EXTENSIONS.some((ext) => base.endsWith(ext))) return false
  const nameWithoutExt = base.replace(/\.(md|markdown)$/, '')
  return /^[a-z0-9][a-z0-9-]{0,100}$/.test(nameWithoutExt)
}

export default async function handler(request) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return json(204, {})
  }

  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  // 环境变量校验
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const LK_SITE_USER = process.env.LK_SITE_USER
  const LK_SITE_PASS = process.env.LK_SITE_PASS
  const GITHUB_REPO = process.env.GITHUB_REPO
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

  if (!GITHUB_TOKEN || !LK_SITE_USER || !LK_SITE_PASS || !GITHUB_REPO) {
    console.error('Missing required environment variables')
    return json(500, { ok: false, error: 'Server misconfiguration' })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { target, filename, content, commitMessage, authUser, authPass } = body

  // 用户鉴权
  if (authUser !== LK_SITE_USER || authPass !== LK_SITE_PASS) {
    return json(401, { ok: false, error: 'Authentication failed' })
  }

  // target 白名单校验
  if (!target || !ALLOWED_TARGETS[target]) {
    return json(400, {
      ok: false,
      error: `Invalid target. Allowed: ${Object.keys(ALLOWED_TARGETS).join(', ')}`,
    })
  }

  // filename 格式校验
  if (!validateFilename(filename)) {
    return json(400, {
      ok: false,
      error: 'Invalid filename. Must be lowercase letters, numbers, hyphens, ending with .md',
    })
  }

  // content 非空校验
  if (!content || typeof content !== 'string' || !content.trim()) {
    return json(400, { ok: false, error: 'Content cannot be empty' })
  }

  // commitMessage 非空校验
  if (!commitMessage || typeof commitMessage !== 'string' || !commitMessage.trim()) {
    return json(400, { ok: false, error: 'Commit message is required' })
  }

  // 构建完整路径
  const dir = ALLOWED_TARGETS[target]
  const normalizedFilename = filename.toLowerCase().endsWith('.md')
    ? filename.toLowerCase()
    : `${filename.toLowerCase()}.md`
  const filePath = `${dir}/${normalizedFilename}`

  // 获取当前文件 SHA（用于更新）
  let currentSha = null
  const getShaUrl = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`

  try {
    const shaRes = await fetch(getShaUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'VuePress-Publish-API/1.0',
      },
    })
    if (shaRes.ok) {
      const shaData = await shaRes.json()
      currentSha = shaData.sha
    }
  } catch {
    // 文件不存在，创建新文件
  }

  // GitHub Contents API 请求
  const putUrl = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`
  const putBody = {
    message: commitMessage.slice(0, 500),
    content: Buffer.from(content).toString('base64'),
    branch: GITHUB_BRANCH,
  }
  if (currentSha) {
    putBody.sha = currentSha
  }

  try {
    const ghRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'VuePress-Publish-API/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    })

    const ghData = await ghRes.json()

    if (!ghRes.ok) {
      console.error('GitHub API error:', ghData)
      return json(502, {
        ok: false,
        error: ghData.message || `GitHub API error (${ghRes.status})`,
      })
    }

    return json(200, {
      ok: true,
      path: filePath,
      sha: ghData.content?.sha || ghData.commit?.sha,
      url: ghData.content?.html_url,
    })
  } catch (err) {
    console.error('GitHub request failed:', err)
    return json(502, { ok: false, error: 'Failed to connect to GitHub' })
  }
}
