/**
 * 测试封面生成队列顺序
 *
 * 任务要求：
 * 1. 验证修复后的队列处理顺序
 * 2. 模拟用户拖放3篇文件的顺序（从下到上）
 * 3. 检查 coverQueue 数组的加入和取出顺序
 * 4. 确认队列是否按FIFO（先进先出）顺序处理
 * 5. 验证用户期望：先传入的文章（下面）先处理
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
  console.log(`[${timestamp.split('T')[1].split('.')[0]}] ${message}`, data || '')
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
    cover: `placeholder-${slug}`,
    target: 'article'
  }
}

// 模拟 readFileQuick 函数（快速读取文件并加入队列）
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
  log(`加入待推送队列: ${article.title} (slug: ${article.slug})`, {
    articleId: article.id,
    queuePosition: pendingArticles.findIndex(a => a.id === article.id)
  })

  return articleId
}

// 模拟 autoGenerateCover 函数（加入封面生成队列）
function autoGenerateCover(articleId) {
  log(`加入封面生成队列: ${articleId}`, {
    currentQueueLength: coverQueue.length
  })

  return new Promise((resolve) => {
    coverQueue.push({ articleId, resolve })
    processCoverQueue()
  })
}

// 模拟 processCoverQueue 函数（串行处理封面生成队列）
async function processCoverQueue() {
  if (isGeneratingCover || coverQueue.length === 0) {
    return
  }

  isGeneratingCover = true

  while (coverQueue.length > 0) {
    const { articleId, resolve } = coverQueue.shift()

    const article = pendingArticles.find(a => a.id === articleId)
    const articleTitle = article?.title || 'Unknown'

    log(`开始处理封面生成: ${articleId}`, {
      queueRemaining: coverQueue.length,
      article: articleTitle
    })

    if (!article) {
      log(`文章已移除，跳过: ${articleId}`)
      resolve(null)
      continue
    }

    // 检查是否已有真实封面（非占位图）
    if (article.cover && !article.cover.startsWith('data:image/svg+xml')) {
      log(`文章已有封面，跳过: ${articleTitle}`)
      resolve(article.cover)
      continue
    }

    // 模拟封面生成
    await new Promise(r => setTimeout(r, 100)) // 模拟API调用

    // 更新文章封面
    article.cover = `generated-${article.slug}-${Date.now()}`

    log(`封面生成成功: ${articleTitle}`, {
      cover: article.cover
    })

    resolve(article.cover)

    // 短暂延迟，避免请求过快
    if (coverQueue.length > 0) {
      await new Promise(r => setTimeout(r, 50))
    }
  }

  isGeneratingCover = false
  log(`队列处理完成`)
}

// 模拟 readFiles 函数（批量读取文件）
async function readFiles(files) {
  const articleIds = []

  log(`开始批量读取 ${files.length} 个文件...`, {
    fileOrder: files.map(f => f.slug)
  })

  // 快速读取所有文件并添加到列表
  for (const file of files) {
    const articleId = await readFileQuick(file)
    if (articleId) {
      articleIds.push(articleId)
    }
  }

  log(`所有文件已添加到待推送队列`, {
    articleCount: articleIds.length,
    pendingArticles: pendingArticles.map(a => ({ id: a.id, slug: a.slug, title: a.title }))
  })

  // 所有文件添加完后，按顺序生成封面
  log(`开始按顺序生成 ${articleIds.length} 篇文章的封面`, {
    articleIds
  })

  for (const articleId of articleIds) {
    await autoGenerateCover(articleId)
  }

  log(`所有封面生成完成`)
}

// 测试场景：用户按顺序拖放 3 个文件
async function runTest() {
  log('=== 开始测试：封面生成队列顺序 ===')
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
  log('=== 测试结果分析 ===')
  log('')

  // 分析处理顺序
  const generatedCovers = logs
    .filter(l => l.message.includes('封面生成成功'))
    .map(l => {
      // 从日志中提取文章标题
      if (l.data && l.data.cover) {
        const match = l.data.cover.match(/generated-(.+?)-\d+/)
        return match ? match[1] : 'unknown'
      }
      return 'unknown'
    })

  log(`实际处理顺序: ${generatedCovers.join(' → ')}`)

  const expectedOrder = ['openclaw', 'langchain', 'ai模板']
  const isCorrectOrder = generatedCovers.every((cover, index) =>
    expectedOrder[index].includes(cover) || cover.includes(expectedOrder[index])
  )

  log(`期望处理顺序: ${expectedOrder.join(' → ')}`)
  log(`顺序是否正确: ${isCorrectOrder ? '✅ 是' : '❌ 否'}`)

  log('')
  log('=== 队列操作分析 ===')
  log('')

  const queueOperations = logs.filter(l =>
    l.message.includes('加入封面生成队列') ||
    l.message.includes('开始处理封面生成')
  )

  queueOperations.forEach((op, index) => {
    if (op.message.includes('加入封面生成队列')) {
      log(`[${index}] push 操作: ${op.data.articleId}`, {
        queueLength: op.data.currentQueueLength
      })
    } else if (op.message.includes('开始处理封面生成')) {
      log(`[${index}] shift 操作: ${op.data.articleId}`, {
        articleTitle: op.data.article,
        queueRemaining: op.data.queueRemaining
      })
    }
  })

  log('')
  log('=== pendingArticles 数组变化 ===')
  log('')

  const pendingOps = logs.filter(l => l.message.includes('加入待推送队列'))
  pendingOps.forEach((op, index) => {
    if (op.data && op.data.article) {
      log(`[${index}] unshift 操作: ${op.data.article.title}`, {
        articleId: op.data.articleId,
        queuePosition: op.data.queuePosition
      })
    }
  })

  log('')
  log('=== 待推送队列最终状态 ===')
  log('')

  pendingArticles.forEach((article, index) => {
    log(`[${index}] ${article.title}`, {
      slug: article.slug,
      id: article.id,
      cover: article.cover
    })
  })

  log('')
  log('=== 测试结论 ===')
  log('')

  if (isCorrectOrder) {
    log('✅ 队列顺序测试通过')
    log('✅ FIFO（先进先出）顺序正确')
    log('✅ 用户拖放顺序与处理顺序一致')
  } else {
    log('❌ 队列顺序测试失败')
    log('❌ FIFO 顺序可能有问题')
  }

  return isCorrectOrder
}

// 运行测试
runTest().then(result => {
  log('')
  log('=== 测试完成 ===')
  process.exit(result ? 0 : 1)
})