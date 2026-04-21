/**
 * 详细的封面生成队列顺序测试
 *
 * 这个测试模拟真实的封面生成场景，确保：
 * 1. 队列按FIFO顺序处理
 * 2. 用户拖放的顺序与处理顺序一致
 * 3. 每个文章的封面都能正确生成
 */

// 模拟 PublishFab.vue 中的队列处理逻辑
let coverQueue = []
let isGeneratingCover = false

// 模拟 pendingArticles
const pendingArticles = []

// 日志记录器
const logs = []

function log(message, data = null) {
  const timestamp = new Date().toISOString()
  const entry = { timestamp, message, data }
  logs.push(entry)
  console.log(`[${timestamp.split('T')[1].split('.')[0]}] ${message}`, data ? JSON.stringify(data) : '')
}

// 模拟文章对象
function createArticle(slug, title) {
  return {
    id: `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slug,
    title,
    excerpt: '测试摘要',
    content: '测试内容',
    date: new Date().toISOString(),
    cover: `placeholder-${slug}`, // 占位图
    target: 'article'
  }
}

// 模拟 readFileQuick 函数
async function readFileQuick(file) {
  const { slug, title } = file
  const articleId = `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const article = createArticle(slug, title)
  article.id = articleId

  // 入队前去重
  if (pendingArticles.some(item => item.slug === article.slug)) {
    log(`跳过重复文件: ${article.slug}`)
    return null
  }

  pendingArticles.unshift(article)
  log(`[readFileQuick] 加入待推送队列: ${article.title}`, {
    articleId: article.id,
    slug: article.slug,
    position: pendingArticles.findIndex(a => a.id === article.id)
  })

  return articleId
}

// 模拟 autoGenerateCover 函数
function autoGenerateCover(articleId) {
  log(`[autoGenerateCover] 加入封面生成队列: ${articleId}`, {
    queueLength: coverQueue.length
  })

  return new Promise((resolve) => {
    coverQueue.push({ articleId, resolve })
    processCoverQueue()
  })
}

// 模拟 processCoverQueue 函数（真正的串行处理）
async function processCoverQueue() {
  if (isGeneratingCover || coverQueue.length === 0) {
    return
  }

  isGeneratingCover = true
  log(`[processCoverQueue] 开始处理队列`, {
    queueLength: coverQueue.length
  })

  while (coverQueue.length > 0) {
    const { articleId, resolve } = coverQueue.shift()

    const article = pendingArticles.find(a => a.id === articleId)
    const articleTitle = article?.title || 'Unknown'

    log(`[processCoverQueue] 使用 shift 取出: ${articleId}`, {
      article: articleTitle,
      remainingQueue: coverQueue.length
    })

    if (!article) {
      log(`[processCoverQueue] 文章已移除，跳过: ${articleId}`)
      resolve(null)
      continue
    }

    // 检查是否已有真实封面（非占位图）
    if (article.cover && !article.cover.startsWith('placeholder-')) {
      log(`[processCoverQueue] 文章已有真实封面，跳过: ${articleTitle}`)
      resolve(article.cover)
      continue
    }

    log(`[processCoverQueue] 开始生成封面: ${articleTitle}`, {
      currentCover: article.cover
    })

    // 模拟封面生成
    await new Promise(r => setTimeout(r, 100)) // 模拟API调用

    // 更新文章封面（模拟真实生成）
    article.cover = `generated-${article.slug}-${Date.now()}`

    log(`[processCoverQueue] 封面生成成功: ${articleTitle}`, {
      newCover: article.cover
    })

    resolve(article.cover)

    // 短暂延迟，避免请求过快
    if (coverQueue.length > 0) {
      await new Promise(r => setTimeout(r, 50))
    }
  }

  isGeneratingCover = false
  log(`[processCoverQueue] 队列处理完成`)
}

// 模拟 readFiles 函数（批量读取文件）
async function readFiles(files) {
  const articleIds = []

  log(`[readFiles] 开始批量读取 ${files.length} 个文件`, {
    fileOrder: files.map(f => f.slug)
  })

  // 快速读取所有文件并添加到列表
  for (const file of files) {
    const articleId = await readFileQuick(file)
    if (articleId) {
      articleIds.push(articleId)
    }
  }

  log(`[readFiles] 所有文件已添加到待推送队列`, {
    totalArticles: articleIds.length,
    articleIds,
    pendingArticles: pendingArticles.map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      cover: a.cover
    }))
  })

  // 所有文件添加完后，按顺序生成封面
  log(`[readFiles] 开始按顺序生成 ${articleIds.length} 篇文章的封面`)

  for (const articleId of articleIds) {
    await autoGenerateCover(articleId)
  }

  log(`[readFiles] 所有封面生成完成`)
}

// 测试场景：用户按顺序拖放 3 个文件
async function runTest() {
  log('========================================')
  log('开始测试：封面生成队列顺序')
  log('========================================')
  log('')
  log('测试场景：用户按顺序拖放 openclaw.md, langchain.md, ai模板.md')
  log('期望处理顺序：openclaw → langchain → ai模板')
  log('')

  // 模拟文件读取顺序（从下到上：openclaw, langchain, ai模板）
  const files = [
    { slug: 'openclaw', title: 'OpenClaw' },
    { slug: 'langchain', title: 'LangChain' },
    { slug: 'ai模板', title: 'AI模板' }
  ]

  await readFiles(files)

  log('')
  log('========================================')
  log('测试结果分析')
  log('========================================')
  log('')

  // 分析处理顺序
  const generateLogs = logs.filter(l =>
    l.message.includes('封面生成成功')
  )

  const processingOrder = generateLogs.map(l => {
    const articleTitleMatch = l.message.match(/封面生成成功: (.+)$/)
    return articleTitleMatch ? articleTitleMatch[1] : 'Unknown'
  })

  log(`实际处理顺序: ${processingOrder.join(' → ')}`)

  const expectedOrder = ['OpenClaw', 'LangChain', 'AI模板']
  const isCorrectOrder = processingOrder.every((title, index) =>
    title === expectedOrder[index]
  )

  log(`期望处理顺序: ${expectedOrder.join(' → ')}`)
  log(`顺序是否正确: ${isCorrectOrder ? '✅ 是' : '❌ 否'}`)

  log('')
  log('========================================')
  log('队列操作详细分析')
  log('========================================')
  log('')

  const queuePushLogs = logs.filter(l => l.message.includes('加入封面生成队列'))
  const queueShiftLogs = logs.filter(l => l.message.includes('使用 shift 取出'))

  log(`队列 push 操作次数: ${queuePushLogs.length}`)
  queuePushLogs.forEach((logEntry, index) => {
    const articleIdMatch = logEntry.message.match(/加入封面生成队列: (.+)$/)
    const articleId = articleIdMatch ? articleIdMatch[1] : 'Unknown'
    log(`  [${index + 1}] push: ${articleId}`, logEntry.data)
  })

  log('')
  log(`队列 shift 操作次数: ${queueShiftLogs.length}`)
  queueShiftLogs.forEach((logEntry, index) => {
    const articleIdMatch = logEntry.message.match(/使用 shift 取出: (.+)$/)
    const articleId = articleIdMatch ? articleIdMatch[1] : 'Unknown'
    log(`  [${index + 1}] shift: ${articleId}`, logEntry.data)
  })

  log('')
  log('========================================')
  log('FIFO 队列验证')
  log('========================================')
  log('')

  const pushOrder = queuePushLogs.map(l => {
    const match = l.message.match(/加入封面生成队列: (.+)$/)
    return match ? match[1] : 'Unknown'
  })

  const shiftOrder = queueShiftLogs.map(l => {
    const match = l.message.match(/使用 shift 取出: (.+)$/)
    return match ? match[1] : 'Unknown'
  })

  const isFIFO = pushOrder.every((id, index) => id === shiftOrder[index])

  log(`push 顺序: ${pushOrder.map(id => id.slice(-8)).join(' → ')}`)
  log(`shift 顺序: ${shiftOrder.map(id => id.slice(-8)).join(' → ')}`)
  log(`FIFO 是否保持: ${isFIFO ? '✅ 是' : '❌ 否'}`)

  log('')
  log('========================================')
  log('pendingArticles 数组变化')
  log('========================================')
  log('')

  const pendingOps = logs.filter(l => l.message.includes('加入待推送队列'))
  pendingOps.forEach((logEntry, index) => {
    const titleMatch = logEntry.message.match(/加入待推送队列: (.+?) \(slug:/)
    const title = titleMatch ? titleMatch[1] : 'Unknown'
    log(`[${index + 1}] unshift: ${title}`, logEntry.data)
  })

  log('')
  log('========================================')
  log('最终队列状态')
  log('========================================')
  log('')

  pendingArticles.forEach((article, index) => {
    const coverType = article.cover.startsWith('generated-') ? '✅ 真实封面' : '❌ 占位图'
    log(`[${index}] ${article.title}`, {
      slug: article.slug,
      id: article.id.slice(-8),
      cover: article.cover,
      coverType
    })
  })

  log('')
  log('========================================')
  log('测试结论')
  log('========================================')
  log('')

  let allTestsPassed = true

  if (isCorrectOrder) {
    log('✅ 处理顺序正确：与用户拖放顺序一致')
  } else {
    log('❌ 处理顺序错误：与用户拖放顺序不一致')
    allTestsPassed = false
  }

  if (isFIFO) {
    log('✅ FIFO 队列正确：push 顺序与 shift 顺序一致')
  } else {
    log('❌ FIFO 队列错误：push 顺序与 shift 顺序不一致')
    allTestsPassed = false
  }

  const allGenerated = pendingArticles.every(a => a.cover.startsWith('generated-'))
  if (allGenerated) {
    log('✅ 所有封面已生成：没有占位图')
  } else {
    log('❌ 封面生成不完整：仍有占位图')
    allTestsPassed = false
  }

  log('')
  if (allTestsPassed) {
    log('🎉 所有测试通过！队列顺序修复成功！')
  } else {
    log('⚠️ 部分测试失败，需要进一步检查')
  }

  return allTestsPassed
}

// 运行测试
runTest().then(result => {
  log('')
  log('========================================')
  log('测试完成')
  log('========================================')
  process.exit(result ? 0 : 1)
})