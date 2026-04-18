/**
 * Vercel Serverless Function: 发布 Markdown 文件到 GitHub
 */

const ALLOWED_TARGETS = {
  article: 'docs/article',
  tech: 'docs/tech',
}

const GITHUB_API_BASE = 'https://api.github.com'

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  }
}

function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') return false
  const base = filename.toLowerCase()
  if (!base.endsWith('.md') && !base.endsWith('.markdown')) return false
  const nameWithoutExt = base.replace(/\.(md|markdown)$/, '')
  return /^[a-z0-9][a-z0-9-]{0,100}$/.test(nameWithoutExt)
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).json({})
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  // 环境变量
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const LK_SITE_USER = process.env.LK_SITE_USER
  const LK_SITE_PASS = process.env.LK_SITE_PASS
  const GITHUB_REPO = process.env.GITHUB_REPO
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

  if (!GITHUB_TOKEN || !LK_SITE_USER || !LK_SITE_PASS || !GITHUB_REPO) {
    console.error('Missing required environment variables')
    return res.status(500).json({ ok: false, error: 'Server misconfiguration' })
  }

  const body = req.body

  const { target, filename, content, commitMessage, authUser, authPass } = body

  // 用户鉴权
  if (authUser !== LK_SITE_USER || authPass !== LK_SITE_PASS) {
    return res.status(401).json({ ok: false, error: 'Authentication failed' })
  }

  // target 白名单校验
  if (!target || !ALLOWED_TARGETS[target]) {
    return res.status(400).json({
      ok: false,
      error: `Invalid target. Allowed: ${Object.keys(ALLOWED_TARGETS).join(', ')}`,
    })
  }

  // filename 格式校验
  if (!validateFilename(filename)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid filename. Must be lowercase letters, numbers, hyphens, ending with .md',
    })
  }

  // content 非空校验
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ ok: false, error: 'Content cannot be empty' })
  }

  // commitMessage 非空校验
  if (!commitMessage || typeof commitMessage !== 'string' || !commitMessage.trim()) {
    return res.status(400).json({ ok: false, error: 'Commit message is required' })
  }

  // 构建完整路径
  const dir = ALLOWED_TARGETS[target]
  const normalizedFilename = filename.toLowerCase().endsWith('.md')
    ? filename.toLowerCase()
    : `${filename.toLowerCase()}.md`
  const filePath = `${dir}/${normalizedFilename}`

  try {
    // 获取当前文件 SHA（用于更新）
    let currentSha = null
    const getShaUrl = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`

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
      return res.status(502).json({
        ok: false,
        error: ghData.message || `GitHub API error (${ghRes.status})`,
      })
    }

    return res.status(200).json({
      ok: true,
      path: filePath,
      sha: ghData.content?.sha || ghData.commit?.sha,
      url: ghData.content?.html_url,
    })
  } catch (err) {
    console.error('GitHub request failed:', err)
    return res.status(502).json({ ok: false, error: 'Failed to connect to GitHub' })
  }
}
