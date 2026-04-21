#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    if (!key.startsWith('--')) continue
    const name = key.slice(2)
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
    args[name] = value
  }
  return args
}

function stamp(date) {
  const pad = n => String(n).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
  ].join('-')
}

function section(title, body) {
  return `## ${title}\n${body && body.trim() ? body.trim() : 'Not recorded.'}\n`
}

const args = parseArgs(process.argv.slice(2))
const task = args.task || 'task-handoff'
const root = process.cwd()
const dir = path.join(root, 'workspace', 'checkpoints')
fs.mkdirSync(dir, { recursive: true })

const filename = `${stamp(new Date())}-${task.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-|-$/g, '') || 'checkpoint'}.md`
const filePath = path.join(dir, filename)

const content = [
  `# Checkpoint: ${task}`,
  '',
  section('State', args.state),
  section('Decisions', args.decisions),
  section('Evidence', args.evidence),
  section('Next', args.next),
  section('Avoid', args.avoid),
].join('\n')

fs.writeFileSync(filePath, content, 'utf8')
console.log(filePath)
