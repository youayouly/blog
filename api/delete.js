/**
 * Vercel Serverless Function: 批量删除 Markdown 文件
 */

const ALLOWED_TARGETS = {
  article: 'docs/article',
  tech: 'docs/tech',
}

const GITHUB_API_BASE = 'https://api.github.com'

function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') return false
  return /^[a-z0-9][a-z0-9-]{0,100}$/.test(slug)
}

async function getFileSha(token, repo, path, branch) {
  try {
    const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${path}?ref=${branch}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'VuePress-Publish-API/1.0',
      },
    })
    if (res.ok) {
      const data = await res.json()
      return data.sha
    }
  } catch {}
  return null
}

async function deleteFile(token, repo, path, message, branch, sha) {
  const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${path}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VuePress-Publish-API/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sha,
      branch,
    }),
  })
  return res
}

async function getFileContent(token, repo, path, branch) {
  try {
    const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${path}?ref=${branch}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'VuePress-Publish-API/1.0',
      },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
    }
  } catch {}
  return null
}

function removeItemFromList(content, slug) {
  // 匹配并删除包含该 slug 的 <li> 元素
  // 使用更精确的正则，确保只匹配包含特定 href 的 li
  const lines = content.split('\n')
  const result = []
  let skipMode = false
  let depth = 0

  for (const line of lines) {
    // 检查是否是需要删除的文章
    if (line.includes(`<a class="lk-blog__card" href="/article/${slug}.html">`)) {
      skipMode = true
      depth = 0
    }

    if (skipMode) {
      // 计算 <li> 标签深度
      if (line.includes('<li')) depth++
      if (line.includes('</li>')) {
        depth--
        if (depth <= 0) {
          skipMode = false
        }
      }
      continue // 跳过当前行
    }

    result.push(line)
  }

  return result.join('\n')
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const LK_SITE_USER = process.env.LK_SITE_USER
    const LK_SITE_PASS = process.env.LK_SITE_PASS
    const GITHUB_REPO = process.env.GITHUB_REPO
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

    if (!GITHUB_TOKEN || !LK_SITE_USER || !LK_SITE_PASS || !GITHUB_REPO) {
      return res.status(500).json({ ok: false, error: 'Server misconfiguration' })
    }

    const body = req.body || {}
    const { target, slugs, authUser, authPass } = body

    // 用户鉴权
    if (authUser !== LK_SITE_USER || authPass !== LK_SITE_PASS) {
      return res.status(401).json({ ok: false, error: 'Authentication failed' })
    }

    // 校验
    if (!target || !ALLOWED_TARGETS[target]) {
      return res.status(400).json({ ok: false, error: 'Invalid target' })
    }
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return res.status(400).json({ ok: false, error: 'No slugs provided' })
    }

    // 验证每个 slug
    for (const slug of slugs) {
      if (!validateSlug(slug)) {
        return res.status(400).json({ ok: false, error: `Invalid slug: ${slug}` })
      }
    }

    const dir = ALLOWED_TARGETS[target]
    let deleted = 0
    const errors = []

    // 删除每个文件
    for (const slug of slugs) {
      const filePath = `${dir}/${slug}.md`
      const sha = await getFileSha(GITHUB_TOKEN, GITHUB_REPO, filePath, GITHUB_BRANCH)

      if (sha) {
        const delRes = await deleteFile(
          GITHUB_TOKEN, GITHUB_REPO, filePath,
          `删除文章: ${slug}`, GITHUB_BRANCH, sha
        )
        if (delRes.ok) {
          deleted++
        } else {
          errors.push(`${slug}: delete failed`)
        }
      } else {
        errors.push(`${slug}: not found`)
      }
    }

    // 如果是 article 分区，更新列表页
    if (target === 'article' && deleted > 0) {
      try {
        const listPath = 'docs/article/README.md'
        let listContent = await getFileContent(GITHUB_TOKEN, GITHUB_REPO, listPath, GITHUB_BRANCH)

        if (listContent) {
          // 移除每个被删除文章的列表项
          for (const slug of slugs) {
            listContent = removeItemFromList(listContent, slug)
          }

          const listSha = await getFileSha(GITHUB_TOKEN, GITHUB_REPO, listPath, GITHUB_BRANCH)
          if (listSha) {
            await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${listPath}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'VuePress-Publish-API/1.0',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `更新文章列表：删除 ${deleted} 篇文章`,
                content: Buffer.from(listContent).toString('base64'),
                sha: listSha,
                branch: GITHUB_BRANCH,
              }),
            })
          }
        }
      } catch (e) {
        console.error('Failed to update list:', e)
      }
    }

    return res.status(200).json({
      ok: true,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ ok: false, error: err.message || 'Internal server error' })
  }
}
