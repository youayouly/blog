/**
 * Vercel Serverless Function: 批量删除 Markdown 文件
 * 一次性删除多篇文章，只创建一个 commit
 */

const fs = require('fs')
const path = require('path')

const ALLOWED_TARGETS = {
  article: 'docs/article',
  tech: 'docs/tech',
}

const GITHUB_API_BASE = 'https://api.github.com'

function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') return false
  return /^[a-z0-9\u4e00-\u9fa5][a-z0-9\u4e00-\u9fa5-]{0,100}$/.test(slug)
}

// 获取文件 SHA
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

// 使用 GitHub Trees API 批量删除文件
async function createBatchDeleteCommit(token, repo, branch, message, filesToDelete, filesToUpdate) {
  // 1. 获取当前分支的最新 commit
  const refUrl = `${GITHUB_API_BASE}/repos/${repo}/git/refs/heads/${branch}`
  const refRes = await fetch(refUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VuePress-Publish-API/1.0',
    },
  })
  if (!refRes.ok) {
    throw new Error('Failed to get branch ref')
  }
  const refData = await refRes.json()
  const latestCommitSha = refData.object.sha

  // 2. 获取最新 commit 的 tree
  const commitUrl = `${GITHUB_API_BASE}/repos/${repo}/git/commits/${latestCommitSha}`
  const commitRes = await fetch(commitUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VuePress-Publish-API/1.0',
    },
  })
  if (!commitRes.ok) {
    throw new Error('Failed to get commit')
  }
  const commitData = await commitRes.json()
  const baseTreeSha = commitData.tree.sha

  // 3. 创建新的 tree
  // 对于要删除的文件，设置为 null
  // 对于要更新的文件，提供新内容
  const treeItems = []

  // 删除文件：SHA 设为 null
  for (const file of filesToDelete) {
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: null, // null 表示删除
    })
  }

  // 更新文件：提供新内容
  for (const file of filesToUpdate) {
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content,
    })
  }

  const treeUrl = `${GITHUB_API_BASE}/repos/${repo}/git/trees`
  const treeRes = await fetch(treeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VuePress-Publish-API/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  })
  if (!treeRes.ok) {
    const err = await treeRes.text()
    throw new Error(`Failed to create tree: ${err}`)
  }
  const treeData = await treeRes.json()
  const newTreeSha = treeData.sha

  // 4. 创建新的 commit
  const newCommitUrl = `${GITHUB_API_BASE}/repos/${repo}/git/commits`
  const newCommitRes = await fetch(newCommitUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VuePress-Publish-API/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      tree: newTreeSha,
      parents: [latestCommitSha],
    }),
  })
  if (!newCommitRes.ok) {
    const err = await newCommitRes.text()
    throw new Error(`Failed to create commit: ${err}`)
  }
  const newCommitData = await newCommitRes.json()
  const newCommitSha = newCommitData.sha

  // 5. 更新分支引用
  const updateRefRes = await fetch(refUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'VuePress-Publish-API/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sha: newCommitSha,
      force: false,
    }),
  })
  if (!updateRefRes.ok) {
    const err = await updateRefRes.text()
    throw new Error(`Failed to update ref: ${err}`)
  }

  return newCommitSha
}

function removeItemFromList(content, slug) {
  const targetHref = `/article/${slug}.html`
  const lines = content.split('\n')
  const result = []
  let skipMode = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检测 <li class="lk-blog__item"> 开始
    if (line.includes('<li') && line.includes('lk-blog__item') && !line.includes('</li>')) {
      // 检查接下来的几行是否包含目标 href
      let hasTarget = false
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        if (lines[j].includes(targetHref)) {
          hasTarget = true
          break
        }
        if ((lines[j].includes('<li') && j > i) || lines[j].includes('</li>')) {
          break
        }
      }

      if (hasTarget) {
        skipMode = true
        continue
      }
    }

    if (skipMode) {
      if (line.includes('</li>')) {
        skipMode = false
      }
      continue
    }

    result.push(line)
  }

  return result.join('\n')
}

function isLocalDev() {
  return process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === 'development'
}

function deleteLocal(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
  } catch (e) {
    console.error('删除本地文件失败:', e.message)
  }
  return false
}

function saveToLocal(filePath, content) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    fs.writeFileSync(fullPath, content, 'utf-8')
    return true
  } catch (e) {
    console.error('保存本地文件失败:', e.message)
    return false
  }
}

function readLocal(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8')
    }
  } catch (e) {
    console.error('读取本地文件失败:', e.message)
  }
  return null
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

    console.log(`[Delete-Batch] 开始批量删除 ${slugs.length} 篇文章`)

    const dir = ALLOWED_TARGETS[target]
    const filesToDelete = []
    const succeededSlugs = []

    // 获取每个文件的 SHA
    for (const slug of slugs) {
      const filePath = `${dir}/${slug}.md`
      const sha = await getFileSha(GITHUB_TOKEN, GITHUB_REPO, filePath, GITHUB_BRANCH)

      if (sha) {
        filesToDelete.push({ path: filePath, sha })
        succeededSlugs.push(slug)
        console.log(`[Delete-Batch] 准备删除: ${slug}`)
      } else {
        // 本地文件可能存在
        const fullPath = path.join(process.cwd(), filePath)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
          succeededSlugs.push(slug)
          console.log(`[Delete-Batch] 仅删除本地: ${slug}`)
        }
      }
    }

    if (filesToDelete.length === 0 && succeededSlugs.length === 0) {
      return res.status(200).json({
        ok: true,
        deleted: 0,
        message: '没有需要删除的文件',
      })
    }

    const filesToUpdate = []

    // 如果是 article 分区，更新列表页
    if (target === 'article' && succeededSlugs.length > 0) {
      const listPath = 'docs/article/README.md'
      let listContent = isLocalDev() ? readLocal(listPath) : null
      if (!listContent) {
        listContent = await getFileContent(GITHUB_TOKEN, GITHUB_REPO, listPath, GITHUB_BRANCH)
      }

      if (listContent) {
        // 移除已删除文章的列表项
        for (const slug of succeededSlugs) {
          listContent = removeItemFromList(listContent, slug)
        }

        // 安全检查
        const hasValidStructure = listContent.includes('<ol class="lk-blog__list">') &&
                                  listContent.includes('</ol>') &&
                                  listContent.includes('---')

        if (hasValidStructure) {
          filesToUpdate.push({
            path: listPath,
            content: listContent,
          })

          // 保存到本地
          if (isLocalDev()) {
            saveToLocal(listPath, listContent)
          }

          console.log(`[Delete-Batch] 准备更新 README，移除 ${succeededSlugs.length} 篇文章`)
        }
      }
    }

    // 如果有需要提交的文件，一次性提交
    let commitSha = null
    if (filesToDelete.length > 0 || filesToUpdate.length > 0) {
      commitSha = await createBatchDeleteCommit(
        GITHUB_TOKEN,
        GITHUB_REPO,
        GITHUB_BRANCH,
        `批量删除 ${succeededSlugs.length} 篇文章: ${succeededSlugs.join(', ')}`,
        filesToDelete,
        filesToUpdate
      )
      console.log(`[Delete-Batch] 提交成功: ${commitSha}`)
    }

    // 删除本地文件
    if (isLocalDev()) {
      for (const slug of succeededSlugs) {
        deleteLocal(`${dir}/${slug}.md`)
      }
    }

    return res.status(200).json({
      ok: true,
      deleted: succeededSlugs.length,
      commitSha,
      slugs: succeededSlugs,
    })
  } catch (err) {
    console.error('[Delete-Batch] Error:', err)
    return res.status(500).json({ ok: false, error: err.message || 'Internal server error' })
  }
}
