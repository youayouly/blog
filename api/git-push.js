/**
 * Local dev API: commit and push tracked repository changes.
 *
 * This route is intentionally conservative: it stages tracked changes only
 * (`git add -u`) so debug files, backups, and .env files are not accidentally
 * published by the "push all changes" button.
 */

const { execFileSync } = require('child_process')

function runGit(args, options = {}) {
  const safeDir = process.cwd().replace(/\\/g, '/')
  return execFileSync('git', ['-c', `safe.directory=${safeDir}`, ...args], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout || 30000,
  }).trim()
}

function parseStatusPath(line) {
  const raw = line.slice(3).trim()
  const renamed = raw.match(/^(.+?) -> (.+)$/)
  return renamed ? renamed[2] : raw
}

function shouldPublishPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/')
  if (normalized.startsWith('.claude/')) return false
  if (normalized.startsWith('.cursor/')) return false
  if (normalized === '.env' || normalized.endsWith('.env')) return false
  if (/debug-|\.log$/i.test(normalized)) return false
  return true
}

function getTrackedChangePaths() {
  const status = runGit(['status', '--porcelain', '--untracked-files=no'])
  if (!status) return []
  return status
    .split(/\r?\n/)
    .map(parseStatusPath)
    .filter(Boolean)
    .filter(shouldPublishPath)
}

function hasTrackedChanges() {
  return getTrackedChangePaths().length > 0
}

function assertAuthed(body) {
  const expectedUser = process.env.LK_SITE_USER
  const expectedPass = process.env.LK_SITE_PASS
  if (!expectedUser || !expectedPass) return
  if (body.authUser !== expectedUser || body.authPass !== expectedPass) {
    const err = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    assertAuthed(body)

    const message = String(body.message || '').trim() || '更新站点内容'

    if (!hasTrackedChanges()) {
      return res.status(200).json({
        ok: true,
        noChanges: true,
        message: '没有改动需要推送',
      })
    }

    const files = getTrackedChangePaths()
    if (files.length === 0) {
      return res.status(200).json({
        ok: true,
        noChanges: true,
        message: '没有改动需要推送',
      })
    }

    runGit(['add', '--', ...files])

    if (!hasTrackedChanges()) {
      return res.status(200).json({
        ok: true,
        noChanges: true,
        message: '没有改动需要推送',
      })
    }

    runGit(['commit', '-m', message], { timeout: 60000 })
    const sha = runGit(['rev-parse', '--short', 'HEAD'])
    const pushOutput = runGit(['push', 'origin', 'main'], { timeout: 120000 })

    return res.status(200).json({
      ok: true,
      noChanges: false,
      commitSha: sha,
      message: '推送成功',
      output: pushOutput,
    })
  } catch (err) {
    const status = err.statusCode || 500
    const stderr = err.stderr ? String(err.stderr).trim() : ''
    const stdout = err.stdout ? String(err.stdout).trim() : ''
    const detail = stderr || stdout || err.message || '推送失败'

    if (/nothing to commit|no changes added|working tree clean/i.test(detail)) {
      return res.status(200).json({
        ok: true,
        noChanges: true,
        message: '没有改动需要推送',
      })
    }

    return res.status(status).json({
      ok: false,
      error: detail,
    })
  }
}
