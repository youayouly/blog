/**
 * Vercel Serverless Function: 查询文件提交历史
 *
 * 请求体: { target, filename, authUser, authPass }
 * 响应: { ok: boolean, commits?: Array, error?: string }
 *
 * 环境变量:
 * - GITHUB_TOKEN: GitHub Personal Access Token (需要 repo 权限)
 * - GITHUB_REPO: 仓库名 (owner/repo 格式)
 * - LK_SITE_USER: 站点登录用户名
 * - LK_SITE_PASS: 站点登录密码
 */

const ALLOWED_TARGETS = {
  article: 'docs/article',
  tech: 'docs/tech',
}

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
  if (!base.endsWith('.md') && !base.endsWith('.markdown')) return false
  const nameWithoutExt = base.replace(/\.(md|markdown)$/, '')
  return /^[a-z0-9][a-z0-9-]{0,100}$/.test(nameWithoutExt)
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return json(204, {})
  }

  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const LK_SITE_USER = process.env.LK_SITE_USER
  const LK_SITE_PASS = process.env.LK_SITE_PASS
  const GITHUB_REPO = process.env.GITHUB_REPO

  if (!GITHUB_TOKEN || !LK_SITE_USER || !LK_SITE_PASS || !GITHUB_REPO) {
    return json(500, { ok: false, error: 'Server misconfiguration' })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { target, filename, authUser, authPass } = body

  // 用户鉴权
  if (authUser !== LK_SITE_USER || authPass !== LK_SITE_PASS) {
    return json(401, { ok: false, error: 'Authentication failed' })
  }

  // target 校验
  if (!target || !ALLOWED_TARGETS[target]) {
    return json(400, { ok: false, error: 'Invalid target' })
  }

  // filename 校验
  if (!validateFilename(filename)) {
    return json(400, { ok: false, error: 'Invalid filename' })
  }

  const dir = ALLOWED_TARGETS[target]
  const normalizedFilename = filename.toLowerCase().endsWith('.md')
    ? filename.toLowerCase()
    : `${filename.toLowerCase()}.md`
  const filePath = `${dir}/${normalizedFilename}`

  // GitHub Commits API
  const commitsUrl = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/commits?path=${encodeURIComponent(filePath)}&per_page=20`

  try {
    const ghRes = await fetch(commitsUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'VuePress-Publish-API/1.0',
      },
    })

    if (!ghRes.ok) {
      const errData = await ghRes.json().catch(() => ({}))
      return json(502, {
        ok: false,
        error: errData.message || `GitHub API error (${ghRes.status})`,
      })
    }

    const commits = await ghRes.json()

    const formatted = commits.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit?.message?.split('\n')[0] || '',
      date: c.commit?.author?.date?.slice(0, 10) || '',
      htmlUrl: c.html_url,
    }))

    return json(200, { ok: true, commits: formatted })
  } catch (err) {
    console.error('GitHub request failed:', err)
    return json(502, { ok: false, error: 'Failed to connect to GitHub' })
  }
}
