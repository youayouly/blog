/**
 * Vercel Serverless Function: 发布 Markdown 文件到 GitHub
 * 同时更新文章列表页
 */

const ALLOWED_TARGETS = {
  article: 'docs/article',
  tech: 'docs/tech',
}

const GITHUB_API_BASE = 'https://api.github.com'

function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') return false
  const base = filename.toLowerCase()
  if (!base.endsWith('.md') && !base.endsWith('.markdown')) return false
  const nameWithoutExt = base.replace(/\.(md|markdown)$/, '')
  return /^[a-z0-9][a-z0-9-]{0,100}$/.test(nameWithoutExt)
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

async function updateFile(token, repo, path, content, message, branch, sha) {
  const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${path}`
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  }
  if (sha) body.sha = sha

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VuePress-Publish-API/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res
}

function generateArticleListItem(slug, title, excerpt, date, itemIndex) {
  // 默认封面图
  const defaultCover = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'

  // 交替布局：偶数索引文字在左图片在右，奇数索引图片在左文字在右
  const isEven = itemIndex % 2 === 0

  if (isEven) {
    // 文字在左，图片在右
    return `    <li class="lk-blog__item">
      <a class="lk-blog__card" href="/article/${slug}.html">
        <div class="lk-blog__text">
          <time class="lk-blog__date" datetime="${date}">${date}</time>
          <h3 class="lk-blog__post-title">${title}</h3>
          <p class="lk-blog__excerpt">${excerpt}</p>
          <div class="lk-blog__meta">
            <span class="lk-blog__read" aria-hidden="true">Read →</span>
          </div>
        </div>
        <img class="lk-blog__cover" src="${defaultCover}" alt="" />
      </a>
    </li>`
  } else {
    // 图片在左，文字在右
    return `    <li class="lk-blog__item">
      <a class="lk-blog__card" href="/article/${slug}.html">
        <img class="lk-blog__cover" src="${defaultCover}" alt="" />
        <div class="lk-blog__text">
          <time class="lk-blog__date" datetime="${date}">${date}</time>
          <h3 class="lk-blog__post-title">${title}</h3>
          <p class="lk-blog__excerpt">${excerpt}</p>
          <div class="lk-blog__meta">
            <span class="lk-blog__read" aria-hidden="true">Read →</span>
          </div>
        </div>
      </a>
    </li>`
  }
}

function updateArticleList(originalContent, newItem) {
  // 找到 </ol> 标签，在其前面插入新条目（添加到列表末尾）
  const listEnd = originalContent.indexOf('</ol>')
  if (listEnd === -1) return null

  const before = originalContent.slice(0, listEnd)
  const after = originalContent.slice(listEnd)

  return before + '\n' + newItem + '\n' + after
}

function countExistingItems(content) {
  // 计算 <li class="lk-blog__item"> 的数量
  const matches = content.match(/<li class="lk-blog__item/g)
  return matches ? matches.length : 0
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
    const { target, filename, title, excerpt, content, commitMessage, authUser, authPass } = body

    // 用户鉴权
    if (authUser !== LK_SITE_USER || authPass !== LK_SITE_PASS) {
      return res.status(401).json({ ok: false, error: 'Authentication failed' })
    }

    // 校验
    if (!target || !ALLOWED_TARGETS[target]) {
      return res.status(400).json({ ok: false, error: 'Invalid target' })
    }
    if (!validateFilename(filename)) {
      return res.status(400).json({ ok: false, error: 'Invalid filename' })
    }
    if (!title || !excerpt || !content || !commitMessage) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' })
    }

    const dir = ALLOWED_TARGETS[target]
    const normalizedFilename = filename.toLowerCase().endsWith('.md')
      ? filename.toLowerCase()
      : `${filename.toLowerCase()}.md`
    const slug = normalizedFilename.replace(/\.md$/, '')
    const filePath = `${dir}/${normalizedFilename}`

    // 获取当前日期
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ')

    // 1. 创建/更新文章文件
    let articleSha = await getFileSha(GITHUB_TOKEN, GITHUB_REPO, filePath, GITHUB_BRANCH)

    // 添加 frontmatter
    const articleContent = `---
title: ${title}
date: ${dateStr}
---

${content}`

    const articleRes = await updateFile(
      GITHUB_TOKEN, GITHUB_REPO, filePath, articleContent,
      `${commitMessage} (创建文章: ${title})`, GITHUB_BRANCH, articleSha
    )

    if (!articleRes.ok) {
      const err = await articleRes.json().catch(() => ({}))
      return res.status(502).json({ ok: false, error: err.message || 'Failed to create article' })
    }

    // 2. 如果是 article 分区，更新列表页
    let listUpdated = false
    if (target === 'article') {
      try {
        const listPath = 'docs/article/README.md'
        const listContent = await getFileContent(GITHUB_TOKEN, GITHUB_REPO, listPath, GITHUB_BRANCH)

        if (listContent) {
          const existingCount = countExistingItems(listContent)
          const newItem = generateArticleListItem(slug, title, excerpt, dateStr, existingCount)
          const updatedList = updateArticleList(listContent, newItem)

          if (updatedList) {
            const listSha = await getFileSha(GITHUB_TOKEN, GITHUB_REPO, listPath, GITHUB_BRANCH)
            await updateFile(
              GITHUB_TOKEN, GITHUB_REPO, listPath, updatedList,
              `更新文章列表: ${title}`, GITHUB_BRANCH, listSha
            )
            listUpdated = true
          }
        }
      } catch (e) {
        console.error('Failed to update list:', e)
      }
    }

    const articleData = await articleRes.json()

    return res.status(200).json({
      ok: true,
      path: filePath,
      url: articleData.content?.html_url,
      listUpdated,
    })
  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ ok: false, error: err.message || 'Internal server error' })
  }
}
