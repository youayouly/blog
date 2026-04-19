<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useIsLoggedIn } from '../utils/authGate.js'
import { readSiteApiCreds } from '../utils/siteApiCreds.js'

function dbgLog(location, message, data, hypothesisId) {
  // #region agent log
  fetch('http://127.0.0.1:7288/ingest/3136d737-2eab-49d2-89cb-f2491c213577', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '97a5f3' },
    body: JSON.stringify({
      sessionId: '97a5f3',
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}

const publishApiBase = String(
  typeof __LK_PUBLISH_API_URL__ !== 'undefined' ? __LK_PUBLISH_API_URL__ : '',
)

const isLoggedIn = useIsLoggedIn()
const open = ref(false)
const pushSheetOpen = ref(false)
const target = ref('article')
const slug = ref('')
const articleTitle = ref('')
const articleExcerpt = ref('')
const content = ref('')
const commitMsg = ref('')
const dragging = ref(false)
const busy = ref(false)
const message = ref('')
const messageKind = ref('info')

const commits = ref([])
const historyBusy = ref(false)

// 待推送队列 - 存储所有预览的文章
const pendingArticles = ref([])

const apiUrl = computed(() => {
  const u = publishApiBase.trim()
  if (u) return u.replace(/\/+$/, '')
  return '/api/publish'
})

const historyUrl = computed(() => {
  const u = publishApiBase.trim()
  if (u) return u.replace(/\/?publish\/?$/i, '/history').replace(/\/+$/, '')
  return '/api/history'
})

watch(open, (v) => {
  if (v) {
    message.value = ''
  }
})

watch(pushSheetOpen, (v) => {
  if (v) {
    message.value = ''
    commits.value = []
  }
})

onMounted(() => {
  // #region agent log
  dbgLog(
    'PublishFab.vue:onMounted',
    'client mount',
    {
      isLoggedIn: !!isLoggedIn.value,
      publishApiBaseLen: publishApiBase.length,
      apiUrl: apiUrl.value,
      historyUrl: historyUrl.value,
      origin: typeof location !== 'undefined' ? location.origin : '',
      pathname: typeof location !== 'undefined' ? location.pathname : '',
      hasApiUser: !!readSiteApiCreds().user,
    },
    'H1-H3',
  )
  // #endregion
})

watch(
  () => isLoggedIn.value,
  (v) => {
    // #region agent log
    dbgLog('PublishFab.vue:watch(isLoggedIn)', 'auth flag changed', { isLoggedIn: !!v }, 'H1')
    // #endregion
  },
)

function setMsg(text, kind = 'info') {
  message.value = text
  messageKind.value = kind
}

function onFabClick() {
  if (!isLoggedIn.value) return
  open.value = !open.value
  if (open.value) pushSheetOpen.value = false
}

function closePanel() {
  open.value = false
}

function openPushSheet() {
  if (!isLoggedIn.value) return
  pushSheetOpen.value = true
  open.value = false
}

function closePushSheet() {
  pushSheetOpen.value = false
}

function generateCoverUrl(title, excerpt) {
  const text = `${title} ${excerpt}`.toLowerCase()
  const keywords = []
  const keywordMap = {
    'ai': 'artificial-intelligence',
    '机器学习': 'machine-learning',
    '深度学习': 'deep-learning',
    '神经网络': 'neural-network',
    'python': 'python-code',
    'javascript': 'javascript',
    'vue': 'vuejs',
    'react': 'react',
    '前端': 'web-design',
    '后端': 'server',
    '数据库': 'database',
    'docker': 'docker',
    'kubernetes': 'kubernetes',
    '云': 'cloud',
    '安全': 'cybersecurity',
    '测试': 'testing',
    '架构': 'architecture',
    '算法': 'algorithm',
    '数据': 'data',
    '网络': 'network',
    '嵌入式': 'embedded',
    '物联网': 'iot',
    '区块链': 'blockchain',
    '移动': 'mobile',
    '游戏': 'gaming',
    '设计': 'design',
    '工具': 'tools',
    '部署': 'deployment',
    '性能': 'performance',
    '优化': 'optimization',
  }
  for (const [key, value] of Object.entries(keywordMap)) {
    if (text.includes(key) && keywords.length < 2) {
      keywords.push(value)
    }
  }
  if (keywords.length === 0) {
    const randomKeywords = ['technology', 'coding', 'programming', 'computer', 'developer', 'software']
    keywords.push(randomKeywords[Math.floor(Math.random() * randomKeywords.length)])
  }
  const keywordStr = keywords.join(',')
  const seed = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  return `https://source.unsplash.com/1200x800/?${keywordStr}&sig=${seed}`
}

function doPreview() {
  message.value = ''

  // 如果没有待推送文章，从表单创建一个
  if (pendingArticles.value.length === 0) {
    const s = slug.value.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(s)) {
      setMsg('请填写文件名（slug）。', 'err')
      return
    }
    const title = articleTitle.value.trim()
    if (!title) {
      setMsg('请填写文章标题。', 'err')
      return
    }
    const excerpt = articleExcerpt.value.trim()
    if (!excerpt) {
      setMsg('请填写文章摘要。', 'err')
      return
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ')
    const cover = generateCoverUrl(title, excerpt)

    pendingArticles.value.unshift({
      id: `article-${Date.now()}`,
      slug: s,
      title,
      excerpt,
      content: content.value,
      date: dateStr,
      cover,
      target: target.value,
    })
  }

  setMsg(`当前待推送：${pendingArticles.value.length} 篇文章`, 'ok')
  closePanel()
}

function removePendingArticle(id) {
  pendingArticles.value = pendingArticles.value.filter(item => item.id !== id)
}

function onDrop(e) {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!/\.md$/i.test(file.name)) {
    setMsg('请拖入 .md 文件。', 'err')
    return
  }
  void readFile(file)
}

function onDragOver(e) {
  e.preventDefault()
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

function onFileInput(e) {
  const file = e.target?.files?.[0]
  if (file) void readFile(file)
  e.target.value = ''
}

// 从markdown内容中提取标题
function extractTitle(text) {
  // 先尝试从frontmatter中提取
  const frontmatterMatch = text.match(/^---\n[\s\S]*?\ntitle:\s*["']?(.+?)["']?\n[\s\S]*?\n---/)
  if (frontmatterMatch) return frontmatterMatch[1].trim()

  // 再尝试从第一个#标题提取
  const h1Match = text.match(/^#\s+(.+)$/m)
  if (h1Match) return h1Match[1].trim()

  return ''
}

// 从markdown内容中提取摘要
function extractExcerpt(text) {
  // 移除frontmatter
  let body = text.replace(/^---\n[\s\S]*?\n---\n*/, '')
  // 移除标题
  body = body.replace(/^#+\s+.*$/gm, '')
  // 获取第一段非空文本
  const lines = body.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('<!--') && !trimmed.startsWith('![') && trimmed.length > 10) {
      return trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : '')
    }
  }
  return ''
}

// 解析markdown文件并添加到待推送队列
async function readFile(file) {
  try {
    const text = await file.text()

    // 自动提取信息
    const extractedTitle = extractTitle(text)
    const extractedExcerpt = extractExcerpt(text)
    const fileSlug = file.name.replace(/\.md$/i, '').toLowerCase()

    // 创建待推送文章对象
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ')
    const cover = generateCoverUrl(extractedTitle || fileSlug, extractedExcerpt || '')

    const article = {
      id: `article-${Date.now()}`,
      slug: fileSlug,
      title: extractedTitle || fileSlug,
      excerpt: extractedExcerpt || '暂无摘要',
      content: text,
      date: dateStr,
      cover,
      target: target.value,
    }

    // 添加到待推送队列
    pendingArticles.value.unshift(article)

    // 更新表单显示当前文章（用于推送）
    slug.value = article.slug
    articleTitle.value = article.title
    articleExcerpt.value = article.excerpt
    content.value = text

    setMsg(`已添加「${article.title}」到待推送队列（共${pendingArticles.value.length}篇）`, 'ok')
  } catch {
    setMsg('读取文件失败。', 'err')
  }
}

function rememberLastPath(s) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      'lk_publish_last',
      JSON.stringify({ target: target.value, slug: s }),
    )
  } catch {
    /* ignore */
  }
}

async function loadHistory() {
  message.value = ''
  const s = slug.value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(s)) {
    setMsg('请先填写有效的文件名（slug）。', 'err')
    return
  }
  const { user, pass } = readSiteApiCreds()
  if (!user || !pass) {
    setMsg('请先在 About 页重新登录一次，以同步推送凭据。', 'err')
    return
  }

  historyBusy.value = true
  commits.value = []
  try {
    const res = await fetch(historyUrl.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authUser: user,
        authPass: pass,
        target: target.value,
        filename: `${s}.md`,
      }),
    })
    // #region agent log
    dbgLog(
      'PublishFab.vue:loadHistory',
      'history fetch response',
      {
        historyUrl: historyUrl.value,
        status: res.status,
        ok: res.ok,
        target: target.value,
        slug: s,
      },
      'H2-H3',
    )
    // #endregion
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      setMsg(data.error || `加载历史失败（HTTP ${res.status}）`, 'err')
      return
    }
    commits.value = Array.isArray(data.commits) ? data.commits : []
    if (!commits.value.length) {
      setMsg('暂无提交记录（或该路径在仓库中尚不存在）。', 'info')
    } else {
      setMsg(`已加载 ${commits.value.length} 条提交。`, 'ok')
    }
  } catch (e) {
    setMsg(e?.message || '网络错误。', 'err')
  } finally {
    historyBusy.value = false
  }
}

async function doPublish() {
  message.value = ''

  // 如果有待推送文章，批量推送
  if (pendingArticles.value.length > 0) {
    const cm = commitMsg.value.trim()
    if (!cm) {
      setMsg('请填写本次提交说明（对应 git commit -m）。', 'err')
      return
    }
    const { user, pass } = readSiteApiCreds()
    if (!user || !pass) {
      setMsg('请先在 About 页退出并重新登录一次，以保存推送凭据。', 'err')
      return
    }

    busy.value = true
    let successCount = 0
    let failCount = 0
    const errors = []

    for (const article of pendingArticles.value) {
      try {
        const res = await fetch(apiUrl.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authUser: user,
            authPass: pass,
            target: article.target,
            filename: `${article.slug}.md`,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            commitMessage: cm.slice(0, 500),
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.ok) {
          successCount++
        } else {
          failCount++
          errors.push(`${article.title}: ${data.error || '推送失败'}`)
        }
      } catch (e) {
        failCount++
        errors.push(`${article.title}: ${e?.message || '网络错误'}`)
      }
    }

    busy.value = false

    if (successCount > 0) {
      pendingArticles.value = []
      // 清空表单
      slug.value = ''
      articleTitle.value = ''
      articleExcerpt.value = ''
      content.value = ''
      commitMsg.value = ''

      const msg = failCount > 0
        ? `成功推送 ${successCount} 篇，失败 ${failCount} 篇。${errors.join('；')}`
        : `已成功推送 ${successCount} 篇文章！`
      setMsg(msg, failCount > 0 ? 'info' : 'ok')
      closePanel()
      closePushSheet()
    } else {
      setMsg(`推送失败：${errors.join('；')}`, 'err')
    }
    return
  }

  // 否则使用表单数据推送单篇
  const s = slug.value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(s)) {
    setMsg('文件名（slug）需为小写字母、数字、连字符。', 'err')
    return
  }
  const title = articleTitle.value.trim()
  if (!title) {
    setMsg('请填写文章标题。', 'err')
    return
  }
  const excerpt = articleExcerpt.value.trim()
  if (!excerpt) {
    setMsg('请填写文章摘要。', 'err')
    return
  }
  if (!content.value.trim()) {
    setMsg('正文为空。', 'err')
    return
  }
  const cm = commitMsg.value.trim()
  if (!cm) {
    setMsg('请填写本次提交说明（对应 git commit -m）。', 'err')
    return
  }
  const { user, pass } = readSiteApiCreds()
  if (!user || !pass) {
    setMsg('请先在 About 页退出并重新登录一次，以保存推送凭据。', 'err')
    return
  }

  busy.value = true
  try {
    const res = await fetch(apiUrl.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authUser: user,
        authPass: pass,
        target: target.value,
        filename: `${s}.md`,
        title,
        excerpt,
        content: content.value,
        commitMessage: cm.slice(0, 500),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      setMsg(data.error || `请求失败（HTTP ${res.status}）`, 'err')
      return
    }
    rememberLastPath(s)
    const base = `已推送：${data.path}。`
    let tail = ''
    if (data.listUpdated) {
      tail = data.url
        ? ' 远端已更新 Articles 列表；本机 dev 请 git pull 后刷新 /article/ 查看新卡片。'
        : ' 文章列表已同步更新。'
    } else if (data.url) {
      tail = ' 部署完成后即可访问。'
    }
    setMsg(base + tail, 'ok')
    closePanel()
    closePushSheet()
  } catch (e) {
    setMsg(e?.message || '网络错误（本地 dev 请配置 LK_PUBLISH_API_URL）。', 'err')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isLoggedIn" class="lk-publish-root">
      <div class="lk-publish-stack">
        <button
          type="button"
          class="lk-publish-fab"
          aria-label="编辑 Markdown 并推送"
          title="编辑正文、填写提交说明并推送到 GitHub"
          @click="onFabClick"
        >
          +
        </button>
        <button
          type="button"
          class="lk-publish-fab lk-publish-fab--git"
          aria-label="推送与提交历史"
          title="填写提交说明并一键推送；查看该文件在 GitHub 上的提交历史"
          @click="openPushSheet"
        >
          ⇪
        </button>
      </div>

      <Transition name="lk-publish-panel">
        <div v-if="open" class="lk-publish-backdrop" @click.self="closePanel">
          <div
            class="lk-publish-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lk-publish-title"
            @click.stop
          >
            <div class="lk-publish-panel__head">
              <h2 id="lk-publish-title" class="lk-publish-panel__title">编辑并推送</h2>
              <button type="button" class="lk-publish-panel__close" aria-label="关闭" @click="closePanel">
                ×
              </button>
            </div>

            <div class="lk-publish-panel__scroll">
              <p class="lk-publish-panel__hint">
                拖入 .md 文件自动提取标题和摘要。支持多篇文章批量预览和推送。
              </p>

              <!-- 待推送队列 -->
              <div v-if="pendingArticles.length > 0" class="lk-publish-queue">
                <div class="lk-publish-queue__head">
                  <span>待推送文章 ({{ pendingArticles.length }})</span>
                  <button type="button" class="lk-publish-queue__clear" @click="pendingArticles = []">清空</button>
                </div>
                <ul class="lk-publish-queue__list">
                  <li v-for="article in pendingArticles" :key="article.id" class="lk-publish-queue__item">
                    <div class="lk-publish-queue__info">
                      <strong>{{ article.title }}</strong>
                      <span class="lk-publish-queue__slug">{{ article.slug }}.md</span>
                    </div>
                    <button type="button" class="lk-publish-queue__remove" @click="removePendingArticle(article.id)">×</button>
                  </li>
                </ul>
              </div>

              <div class="lk-publish-field">
                <span class="lk-publish-label">分区</span>
                <label class="lk-publish-radio">
                  <input v-model="target" type="radio" value="article" />
                  Article
                </label>
                <label class="lk-publish-radio">
                  <input v-model="target" type="radio" value="tech" />
                  Projects（tech）
                </label>
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label" for="lk-publish-slug">文件名（不含 .md）</label>
                <input
                  id="lk-publish-slug"
                  v-model="slug"
                  class="lk-publish-input"
                  type="text"
                  autocomplete="off"
                  placeholder="例如 my-new-note"
                />
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label" for="lk-publish-title">文章标题</label>
                <input
                  id="lk-publish-title"
                  v-model="articleTitle"
                  class="lk-publish-input"
                  type="text"
                  autocomplete="off"
                  placeholder="例如：Edge AI 部署流水线记录"
                />
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label" for="lk-publish-excerpt">文章摘要</label>
                <textarea
                  id="lk-publish-excerpt"
                  v-model="articleExcerpt"
                  class="lk-publish-input"
                  rows="2"
                  placeholder="简短描述文章内容"
                />
              </div>

              <div
                class="lk-publish-drop"
                :class="{ 'lk-publish-drop--active': dragging }"
                @drop="onDrop"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
              >
                <p>拖入 .md 到此处，或</p>
                <label class="lk-publish-file">
                  <input type="file" accept=".md,text/markdown" @change="onFileInput" />
                  选择文件
                </label>
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label" for="lk-publish-body">正文（Markdown）</label>
                <textarea id="lk-publish-body" v-model="content" class="lk-publish-textarea" rows="10" />
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label" for="lk-publish-commit">本次提交说明</label>
                <textarea
                  id="lk-publish-commit"
                  v-model="commitMsg"
                  class="lk-publish-input lk-publish-input--commit"
                  rows="2"
                  placeholder="例如：补充 langchain 笔记第三节"
                />
              </div>

              <p v-if="message" class="lk-publish-msg" :class="`lk-publish-msg--${messageKind}`">{{ message }}</p>
            </div>

            <div class="lk-publish-actions">
              <button type="button" class="lk-publish-secondary" :disabled="busy" @click="closePanel">取消</button>
              <button type="button" class="lk-publish-primary" :disabled="busy" @click="doPublish">
                {{ busy ? '推送中…' : pendingArticles.length > 0 ? `推送 ${pendingArticles.length} 篇` : '推送' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="lk-publish-sheet">
        <div v-if="pushSheetOpen" class="lk-publish-backdrop lk-publish-backdrop--sheet" @click.self="closePushSheet">
          <div class="lk-publish-push-sheet" role="dialog" aria-modal="true" aria-labelledby="lk-push-title" @click.stop>
            <div class="lk-publish-panel__head">
              <h2 id="lk-push-title" class="lk-publish-panel__title">推送与历史</h2>
              <button type="button" class="lk-publish-panel__close" aria-label="关闭" @click="closePushSheet">×</button>
            </div>

            <p class="lk-publish-panel__hint">
              在
              <code>+</code>
              中准备好的正文会沿用此处；也可只在此处填说明后推送。下方可查看当前 slug 对应文件在 GitHub
              上的提交记录。
            </p>

            <div class="lk-publish-meta">
              <span>{{ target === 'article' ? 'docs/article' : 'docs/tech' }}/</span>
              <strong>{{ slug || '（未填 slug）' }}</strong>
              <span>.md</span>
            </div>

            <div class="lk-publish-field">
              <label class="lk-publish-label" for="lk-push-commit">本次提交说明</label>
              <textarea
                id="lk-push-commit"
                v-model="commitMsg"
                class="lk-publish-input lk-publish-input--commit"
                rows="3"
                placeholder="对应 git commit -m，必填"
              />
            </div>

            <div class="lk-publish-row">
              <button type="button" class="lk-publish-secondary" :disabled="historyBusy" @click="loadHistory">
                {{ historyBusy ? '加载中…' : '加载提交历史' }}
              </button>
              <button type="button" class="lk-publish-primary" :disabled="busy" @click="doPublish">
                {{ busy ? '推送中…' : '一键推送到 GitHub' }}
              </button>
            </div>

            <p v-if="message" class="lk-publish-msg" :class="`lk-publish-msg--${messageKind}`">{{ message }}</p>

            <div v-if="commits.length" class="lk-publish-history">
              <div class="lk-publish-history__title">最近提交</div>
              <ul class="lk-publish-history__list">
                <li v-for="(c, i) in commits" :key="i" class="lk-publish-history__item">
                  <div class="lk-publish-history__row">
                    <time class="lk-publish-history__time" :datetime="c.date">{{ c.date }}</time>
                    <code class="lk-publish-history__sha">{{ c.sha }}</code>
                    <a
                      v-if="c.htmlUrl"
                      class="lk-publish-history__link"
                      :href="c.htmlUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      >GitHub</a
                    >
                  </div>
                  <div class="lk-publish-history__msg">{{ c.message }}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 预览卡片 - 插入到文章列表顶部 -->
      <Teleport v-if="pendingArticles.length" to=".lk-blog__list">
        <li
          v-for="(article, index) in pendingArticles"
          :key="article.id"
          class="lk-blog__item lk-blog__item--preview"
          :class="{ 'lk-blog__item--reverse': index % 2 === 1 }"
        >
          <button
            type="button"
            class="lk-preview-delete"
            title="删除预览"
            @click="removePendingArticle(article.id)"
          >×</button>
          <a class="lk-blog__card" :href="`/${article.target}/${article.slug}.html`">
            <template v-if="index % 2 === 0">
              <div class="lk-blog__text">
                <time class="lk-blog__date" :datetime="article.date">{{ article.date }}</time>
                <h3 class="lk-blog__post-title">{{ article.title }}</h3>
                <p class="lk-blog__excerpt">{{ article.excerpt }}</p>
                <div class="lk-blog__meta">
                  <span class="lk-blog__tag">预览</span>
                  <span class="lk-blog__read" aria-hidden="true">Read →</span>
                </div>
              </div>
              <img class="lk-blog__cover" :src="article.cover" alt="" />
            </template>
            <template v-else>
              <img class="lk-blog__cover" :src="article.cover" alt="" />
              <div class="lk-blog__text">
                <time class="lk-blog__date" :datetime="article.date">{{ article.date }}</time>
                <h3 class="lk-blog__post-title">{{ article.title }}</h3>
                <p class="lk-blog__excerpt">{{ article.excerpt }}</p>
                <div class="lk-blog__meta">
                  <span class="lk-blog__tag">预览</span>
                  <span class="lk-blog__read" aria-hidden="true">Read →</span>
                </div>
              </div>
            </template>
          </a>
        </li>
      </Teleport>
    </div>
  </Teleport>
</template>

<style scoped>
.lk-publish-root {
  position: relative;
}

.lk-publish-stack {
  position: fixed;
  top: calc(var(--navbar-height, 3.5rem) + 0.5rem);
  right: max(0.75rem, env(safe-area-inset-right, 0px));
  z-index: 10050;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.lk-publish-fab {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  font-size: 1.65rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.lk-publish-fab--git {
  font-size: 1.25rem;
}

.lk-publish-fab:hover {
  transform: scale(1.05);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  border-color: var(--vp-c-brand-1);
}

.lk-publish-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10060;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: auto;
}

.lk-publish-backdrop--sheet {
  align-items: flex-end;
  justify-content: flex-end;
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
  padding-right: max(0.5rem, env(safe-area-inset-right, 0px));
}

.lk-publish-panel {
  width: min(34rem, 100%);
  max-height: 80vh;
  margin-top: 1rem;
  padding: 0;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: #fff;
  color: #333;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}

[data-theme='dark'] .lk-publish-panel {
  background: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}

.lk-publish-push-sheet {
  width: min(22rem, 100vw - 4.5rem);
  max-height: 80vh;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
}

.lk-publish-panel__scroll {
  flex: 0 1 auto;
  max-height: calc(80vh - 150px);
  min-height: 100px;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 0.5rem;
}

.lk-publish-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.5rem;
  flex-shrink: 0;
}

.lk-publish-push-sheet .lk-publish-panel__head {
  margin-bottom: 0.5rem;
}

.lk-publish-panel__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.lk-publish-push-sheet .lk-publish-panel__title {
  font-size: 1.05rem;
}

.lk-publish-panel__close {
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
}

.lk-publish-panel__close:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.lk-publish-panel__hint {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  line-height: 1.45;
}

.lk-publish-push-sheet .lk-publish-panel__hint {
  font-size: 0.75rem;
}

.lk-publish-panel__hint code {
  font-size: 0.8em;
}

/* 待推送队列样式 */
.lk-publish-queue {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--vp-c-default-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.lk-publish-queue__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.lk-publish-queue__clear {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.lk-publish-queue__clear:hover {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
  border-color: var(--vp-c-danger-1);
}

.lk-publish-queue__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 8rem;
  overflow-y: auto;
}

.lk-publish-queue__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.8rem;
}

.lk-publish-queue__item:last-child {
  border-bottom: none;
}

.lk-publish-queue__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.lk-publish-queue__info strong {
  color: var(--vp-c-text-1);
}

.lk-publish-queue__slug {
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
  font-family: var(--vp-font-family-mono);
}

.lk-publish-queue__remove {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.8);
  color: #fff;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lk-publish-queue__remove:hover {
  background: #dc2626;
}

.lk-publish-meta {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.75rem;
  word-break: break-all;
}

.lk-publish-meta strong {
  color: var(--vp-c-text-1);
}

.lk-publish-field {
  margin-bottom: 1rem;
}

.lk-publish-push-sheet .lk-publish-field {
  margin-bottom: 0.65rem;
}

.lk-publish-label {
  display: block;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.35rem;
}

.lk-publish-radio {
  margin-right: 1rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.lk-publish-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
}

.lk-publish-input--commit {
  font-family: inherit;
  resize: vertical;
  min-height: 2.75rem;
  line-height: 1.4;
}

.lk-publish-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-family: var(--vp-font-family-mono);
  resize: vertical;
  min-height: 8rem;
}

.lk-publish-drop {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 2px dashed var(--vp-c-divider);
  border-radius: 10px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.lk-publish-drop--active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-default-soft);
}

.lk-publish-drop p {
  margin: 0 0 0.5rem;
}

.lk-publish-file {
  display: inline-block;
  position: relative;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-weight: 500;
}

.lk-publish-file input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.lk-publish-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.lk-publish-row .lk-publish-primary,
.lk-publish-row .lk-publish-secondary {
  flex: 1;
  min-width: 6rem;
}

.lk-publish-msg {
  margin: 0 0 0.65rem;
  font-size: 0.82rem;
  line-height: 1.45;
}

.lk-publish-msg--err {
  color: #c94b4b;
}

.lk-publish-msg--ok {
  color: var(--vp-c-brand-1);
}

.lk-publish-msg--info {
  color: var(--vp-c-text-2);
}

.lk-publish-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

[data-theme='dark'] .lk-publish-actions {
  border-top-color: #334155;
  background: #0f172a;
}

.lk-publish-primary,
.lk-publish-secondary {
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #ddd;
  background: #f5f5f5;
  color: #333;
  transition: all 0.2s ease;
}

.lk-publish-primary {
  background: #4a90d9 !important;
  border-color: #4a90d9 !important;
  color: #fff !important;
}

.lk-publish-primary:hover {
  background: #357abd !important;
}

.lk-publish-preview {
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #4a90d9;
  background: #fff;
  color: #4a90d9;
  transition: all 0.2s ease;
}

.lk-publish-preview:hover {
  background: #e8f4fd;
}

.lk-publish-preview:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 预览卡片样式 */
.lk-blog__item--preview {
  position: relative;
  list-style: none;
}

.lk-blog__item--preview::before {
  content: '预览';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #f59e0b;
  color: #fff;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  z-index: 10;
}

.lk-preview-delete {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, background 0.15s;
}

.lk-preview-delete:hover {
  transform: scale(1.1);
  background: #dc2626;
}

.lk-publish-primary:disabled,
.lk-publish-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.lk-publish-history {
  margin-top: 0.5rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--vp-c-divider);
}

.lk-publish-history__title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 0.4rem;
}

.lk-publish-history__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 11rem;
  overflow-y: auto;
}

.lk-publish-history__item {
  font-size: 0.72rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.lk-publish-history__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-bottom: 0.2rem;
}

.lk-publish-history__time {
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.lk-publish-history__sha {
  font-family: var(--vp-font-family-mono);
  font-size: 0.7rem;
  color: var(--vp-c-brand-1);
}

.lk-publish-history__msg {
  color: var(--vp-c-text-1);
  font-size: 0.78rem;
  line-height: 1.35;
}

.lk-publish-history__link {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--vp-c-brand-1);
}

.lk-publish-panel-enter-active,
.lk-publish-panel-leave-active,
.lk-publish-sheet-enter-active,
.lk-publish-sheet-leave-active {
  transition: opacity 0.18s ease;
}

.lk-publish-panel-enter-from,
.lk-publish-panel-leave-to,
.lk-publish-sheet-enter-from,
.lk-publish-sheet-leave-to {
  opacity: 0;
}
</style>
