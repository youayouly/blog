<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useIsLoggedIn } from '../utils/authGate.js'
import { readSiteApiCreds } from '../utils/siteApiCreds.js'

const publishApiBase = String(
  typeof __LK_PUBLISH_API_URL__ !== 'undefined' ? __LK_PUBLISH_API_URL__ : '',
)

const isLoggedIn = useIsLoggedIn()
const open = ref(false) // 加号面板：添加文章
const pushSheetOpen = ref(false) // 箭头面板：推送管理

// 添加文章表单
const target = ref('article')
const slug = ref('')
const articleTitle = ref('')
const articleExcerpt = ref('')
const content = ref('')
const dragging = ref(false)
const message = ref('')
const messageKind = ref('info')

// 待推送队列
const pendingArticles = ref([])

// 待删除列表
const pendingDeletes = ref([])

// 推送面板
const commitMsg = ref('')
const busy = ref(false)
const pushMessage = ref('')
const pushMessageKind = ref('info')

// 历史记录
const historyRecords = ref([])
const historyExpanded = ref(false)
const historyBusy = ref(false)

// 展开编辑的文章ID
const expandedArticleId = ref(null)

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

function setMsg(text, kind = 'info') {
  message.value = text
  messageKind.value = kind
}

function setPushMsg(text, kind = 'info') {
  pushMessage.value = text
  pushMessageKind.value = kind
}

// 生成封面URL
function generateCoverUrl(title, excerpt) {
  const text = `${title} ${excerpt}`.toLowerCase()
  const keywords = []
  const keywordMap = {
    'ai': 'artificial-intelligence',
    '机器学习': 'machine-learning',
    '深度学习': 'deep-learning',
    '大模型': 'artificial-intelligence',
    'python': 'python-code',
    'javascript': 'javascript',
    'vue': 'vuejs',
    'react': 'react',
    '前端': 'web-design',
    '后端': 'server',
    '嵌入式': 'embedded',
    '部署': 'deployment',
  }
  for (const [key, value] of Object.entries(keywordMap)) {
    if (text.includes(key) && keywords.length < 2) {
      keywords.push(value)
    }
  }
  if (keywords.length === 0) {
    keywords.push('technology')
  }
  const seed = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  return `https://source.unsplash.com/1200x800/?${keywords.join(',')}&sig=${seed}`
}

// 从markdown提取标题
function extractTitle(text) {
  const fmMatch = text.match(/^---\n[\s\S]*?\ntitle:\s*["']?(.+?)["']?\n[\s\S]*?\n---/)
  if (fmMatch) return fmMatch[1].trim()
  const h1Match = text.match(/^#\s+(.+)$/m)
  if (h1Match) return h1Match[1].trim()
  return ''
}

// 从markdown提取摘要
function extractExcerpt(text) {
  let body = text.replace(/^---\n[\s\S]*?\n---\n*/, '')
  body = body.replace(/^#+\s+.*$/gm, '')
  const lines = body.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('<!--') && !trimmed.startsWith('![') && trimmed.length > 10) {
      return trimmed.slice(0, 80) + (trimmed.length > 80 ? '...' : '')
    }
  }
  return ''
}

// 拖入文件处理
function onDrop(e) {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!/\.md$/i.test(file.name)) {
    setMsg('请拖入 .md 文件', 'err')
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

async function readFile(file) {
  try {
    const text = await file.text()
    const extractedTitle = extractTitle(text)
    const extractedExcerpt = extractExcerpt(text)
    const fileSlug = file.name.replace(/\.md$/i, '').toLowerCase()

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

    pendingArticles.value.unshift(article)
    setMsg(`已添加「${article.title}」到待推送队列`, 'ok')
    open.value = false
  } catch {
    setMsg('读取文件失败', 'err')
  }
}

// 手动添加文章
function addManualArticle() {
  const s = slug.value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(s)) {
    setMsg('请填写有效的文件名', 'err')
    return
  }
  if (!articleTitle.value.trim()) {
    setMsg('请填写标题', 'err')
    return
  }
  if (!articleExcerpt.value.trim()) {
    setMsg('请填写摘要', 'err')
    return
  }

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 16).replace('T', ' ')
  const cover = generateCoverUrl(articleTitle.value, articleExcerpt.value)

  pendingArticles.value.unshift({
    id: `article-${Date.now()}`,
    slug: s,
    title: articleTitle.value.trim(),
    excerpt: articleExcerpt.value.trim(),
    content: content.value,
    date: dateStr,
    cover,
    target: target.value,
  })

  // 清空表单
  slug.value = ''
  articleTitle.value = ''
  articleExcerpt.value = ''
  content.value = ''

  setMsg('已添加到待推送队列', 'ok')
  open.value = false
}

function removePendingArticle(id) {
  pendingArticles.value = pendingArticles.value.filter(a => a.id !== id)
}

// 展开/收起文章编辑
function toggleExpandArticle(id) {
  expandedArticleId.value = expandedArticleId.value === id ? null : id
}

// 更新待推送文章
function updatePendingArticle(id, field, value) {
  const article = pendingArticles.value.find(a => a.id === id)
  if (article) {
    article[field] = value
  }
}

// 添加待删除文章（供外部调用）
function addPendingDelete(slug, title) {
  if (!pendingDeletes.value.find(d => d.slug === slug)) {
    pendingDeletes.value.push({ id: `del-${Date.now()}`, slug, title })
  }
}

// 移除待删除文章
function removePendingDelete(id) {
  pendingDeletes.value = pendingDeletes.value.filter(d => d.id !== id)
}

// 暴露给其他组件
defineExpose({
  addPendingDelete,
  pendingArticles,
  pendingDeletes
})

// 打开推送面板
function openPushSheet() {
  if (!isLoggedIn.value) return
  pushSheetOpen.value = true
  open.value = false
  loadHistory()
}

// 加载历史记录
async function loadHistory() {
  const { user, pass } = readSiteApiCreds()
  if (!user || !pass) {
    setPushMsg('请先登录', 'err')
    return
  }

  historyBusy.value = true
  try {
    // 获取最近的提交历史
    const res = await fetch('/api/git-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authUser: user, authPass: pass, count: 10 }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) {
      historyRecords.value = data.commits || []
    }
  } catch {
    // 忽略错误
  } finally {
    historyBusy.value = false
  }
}

// 推送到Vercel
async function doPush() {
  const cm = commitMsg.value.trim()
  if (!cm) {
    setPushMsg('请填写提交说明', 'err')
    return
  }
  const { user, pass } = readSiteApiCreds()
  if (!user || !pass) {
    setPushMsg('请先登录', 'err')
    return
  }

  busy.value = true
  setPushMsg('推送中...', 'info')

  try {
    let addCount = 0
    let delCount = 0
    let failCount = 0
    const errors = []

    // 推送待推送文章
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
            commitMessage: cm,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.ok) {
          addCount++
        } else {
          failCount++
          errors.push(`${article.title}: ${data.error || '失败'}`)
        }
      } catch (e) {
        failCount++
        errors.push(`${article.title}: 网络错误`)
      }
    }

    // 删除待删除文章
    if (pendingDeletes.value.length > 0) {
      const slugs = pendingDeletes.value.map(d => d.slug)
      try {
        const res = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authUser: user,
            authPass: pass,
            target: 'article',
            slugs,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.ok) {
          delCount = data.deleted || slugs.length
          // 从DOM中移除已删除的文章
          slugs.forEach(slug => {
            const item = document.querySelector(`.lk-blog__item[data-slug="${slug}"]`)
            if (item) item.remove()
          })
        } else {
          failCount += slugs.length
          errors.push(`删除失败: ${data.error || '未知错误'}`)
        }
      } catch (e) {
        failCount += slugs.length
        errors.push('删除请求失败')
      }
    }

    // 清空队列
    if (addCount > 0 || delCount > 0) {
      pendingArticles.value = []
      pendingDeletes.value = []
      commitMsg.value = ''

      const parts = []
      if (addCount > 0) parts.push(`新增${addCount}篇`)
      if (delCount > 0) parts.push(`删除${delCount}篇`)
      if (failCount > 0) parts.push(`失败${failCount}项`)

      setPushMsg(`推送成功：${parts.join('，')}`, failCount > 0 ? 'info' : 'ok')
      loadHistory()
    } else if (failCount > 0) {
      setPushMsg(`推送失败：${errors.join('；')}`, 'err')
    } else {
      // 没有待处理项，执行普通推送
      const res = await fetch('/api/git-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUser: user, authPass: pass, message: cm }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setPushMsg('推送成功！Vercel正在部署...', 'ok')
      } else {
        setPushMsg(data.error || '推送失败', 'err')
      }
    }
  } catch (e) {
    setPushMsg(e?.message || '网络错误', 'err')
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  // 从localStorage恢复待推送队列
  try {
    const saved = localStorage.getItem('lk_pending_articles')
    if (saved) {
      pendingArticles.value = JSON.parse(saved)
    }
    const savedDeletes = localStorage.getItem('lk_pending_deletes')
    if (savedDeletes) {
      pendingDeletes.value = JSON.parse(savedDeletes)
    }
  } catch {}

  // 监听删除事件
  window.addEventListener('add-pending-delete', (e) => {
    const { slug, title } = e.detail
    if (!pendingDeletes.value.find(d => d.slug === slug)) {
      pendingDeletes.value.push({ id: `del-${Date.now()}`, slug, title })
    }
  })

  // 监听清除删除事件
  window.addEventListener('clear-pending-deletes', () => {
    pendingDeletes.value = []
  })
})

watch(pendingArticles, (val) => {
  // 保存到localStorage
  try {
    localStorage.setItem('lk_pending_articles', JSON.stringify(val))
  } catch {}
}, { deep: true })

watch(pendingDeletes, (val) => {
  try {
    localStorage.setItem('lk_pending_deletes', JSON.stringify(val))
  } catch {}
}, { deep: true })
</script>

<template>
  <Teleport to="body">
    <div v-if="isLoggedIn" class="lk-publish-root">
      <!-- 按钮组 -->
      <div class="lk-publish-stack">
        <button
          type="button"
          class="lk-publish-fab"
          aria-label="添加文章"
          title="添加文章到本地预览"
          @click="open = !open; pushSheetOpen = false"
        >
          +
        </button>
        <button
          type="button"
          class="lk-publish-fab lk-publish-fab--push"
          :class="{ 'lk-publish-fab--pending': (pendingArticles.length + pendingDeletes.length) > 0 }"
          aria-label="推送管理"
          title="推送到Vercel"
          @click="openPushSheet"
        >
          ⇪
          <span v-if="(pendingArticles.length + pendingDeletes.length) > 0" class="lk-publish-badge">{{ pendingArticles.length + pendingDeletes.length }}</span>
        </button>
      </div>

      <!-- 添加文章面板 -->
      <Transition name="lk-publish-panel">
        <div v-if="open" class="lk-publish-backdrop" @click.self="open = false">
          <div class="lk-publish-panel" @click.stop>
            <div class="lk-publish-panel__head">
              <h2 class="lk-publish-panel__title">添加文章</h2>
              <button type="button" class="lk-publish-panel__close" @click="open = false">×</button>
            </div>

            <div class="lk-publish-panel__body">
              <p class="lk-publish-hint">拖入md文件自动提取信息，或手动填写后添加到本地预览</p>

              <div class="lk-publish-field">
                <label class="lk-publish-label">分区</label>
                <label class="lk-publish-radio">
                  <input v-model="target" type="radio" value="article" />
                  Article
                </label>
                <label class="lk-publish-radio">
                  <input v-model="target" type="radio" value="tech" />
                  Projects
                </label>
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label">文件名</label>
                <input v-model="slug" class="lk-publish-input" type="text" placeholder="例如 my-article" />
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label">标题</label>
                <input v-model="articleTitle" class="lk-publish-input" type="text" placeholder="文章标题" />
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label">摘要</label>
                <textarea v-model="articleExcerpt" class="lk-publish-input" rows="2" placeholder="简短描述" />
              </div>

              <div
                class="lk-publish-drop"
                :class="{ 'lk-publish-drop--active': dragging }"
                @drop="onDrop"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
              >
                <p>拖入 .md 文件</p>
                <label class="lk-publish-file">
                  <input type="file" accept=".md" @change="onFileInput" />
                  或选择文件
                </label>
              </div>

              <div class="lk-publish-field">
                <label class="lk-publish-label">正文（可选）</label>
                <textarea v-model="content" class="lk-publish-textarea" rows="6" />
              </div>

              <p v-if="message" class="lk-publish-msg" :class="`lk-publish-msg--${messageKind}`">{{ message }}</p>
            </div>

            <div class="lk-publish-actions">
              <button type="button" class="lk-publish-secondary" @click="open = false">取消</button>
              <button type="button" class="lk-publish-primary" @click="addManualArticle">添加到本地</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 推送管理面板 -->
      <Transition name="lk-publish-sheet">
        <div v-if="pushSheetOpen" class="lk-publish-backdrop lk-publish-backdrop--sheet" @click.self="pushSheetOpen = false">
          <div class="lk-publish-push-sheet" @click.stop>
            <div class="lk-publish-panel__head">
              <h2 class="lk-publish-panel__title">推送管理</h2>
              <button type="button" class="lk-publish-panel__close" @click="pushSheetOpen = false">×</button>
            </div>

            <!-- 待推送队列 -->
            <div v-if="pendingArticles.length > 0" class="lk-publish-queue">
              <div class="lk-publish-queue__head">
                <span>待推送 ({{ pendingArticles.length }})</span>
                <button type="button" class="lk-publish-queue__clear" @click="pendingArticles = []">清空</button>
              </div>
              <ul class="lk-publish-queue__list">
                <li v-for="article in pendingArticles" :key="article.id" class="lk-publish-queue__item">
                  <div class="lk-publish-queue__header" @click="toggleExpandArticle(article.id)">
                    <div class="lk-publish-queue__info">
                      <strong>{{ article.title }}</strong>
                      <span>{{ article.slug }}.md</span>
                    </div>
                    <div class="lk-publish-queue__actions">
                      <span class="lk-publish-queue__expand" :class="{ 'lk-publish-queue__expand--open': expandedArticleId === article.id }">▼</span>
                      <button type="button" class="lk-publish-queue__remove" @click.stop="removePendingArticle(article.id)">×</button>
                    </div>
                  </div>
                  <!-- 展开编辑 -->
                  <div v-if="expandedArticleId === article.id" class="lk-publish-queue__edit">
                    <input
                      v-model="article.title"
                      class="lk-publish-input lk-publish-input--sm"
                      placeholder="标题"
                    />
                    <input
                      v-model="article.excerpt"
                      class="lk-publish-input lk-publish-input--sm"
                      placeholder="摘要"
                    />
                    <input
                      v-model="article.slug"
                      class="lk-publish-input lk-publish-input--sm"
                      placeholder="文件名"
                    />
                  </div>
                </li>
              </ul>
            </div>

            <!-- 待删除列表 -->
            <div v-if="pendingDeletes.length > 0" class="lk-publish-queue lk-publish-queue--delete">
              <div class="lk-publish-queue__head">
                <span class="lk-publish-queue__delete-title">待删除 ({{ pendingDeletes.length }})</span>
                <button type="button" class="lk-publish-queue__clear" @click="pendingDeletes = []">清空</button>
              </div>
              <ul class="lk-publish-queue__list">
                <li v-for="item in pendingDeletes" :key="item.id" class="lk-publish-queue__item">
                  <div class="lk-publish-queue__header">
                    <div class="lk-publish-queue__info">
                      <strong>{{ item.title }}</strong>
                      <span>{{ item.slug }}.md</span>
                    </div>
                    <button type="button" class="lk-publish-queue__remove" @click="removePendingDelete(item.id)">×</button>
                  </div>
                </li>
              </ul>
            </div>

            <!-- 提交信息 -->
            <div class="lk-publish-field">
              <label class="lk-publish-label">提交说明</label>
              <textarea
                v-model="commitMsg"
                class="lk-publish-input"
                rows="2"
                placeholder="例如：添加新文章 / 更新配置"
              />
            </div>

            <button
              type="button"
              class="lk-publish-push-btn"
              :disabled="busy"
              @click="doPush"
            >
              {{ busy ? '推送中...' : (pendingArticles.length + pendingDeletes.length) > 0 ? `推送 ${pendingArticles.length > 0 ? `${pendingArticles.length}篇新增` : ''}${pendingArticles.length > 0 && pendingDeletes.length > 0 ? ' / ' : ''}${pendingDeletes.length > 0 ? `${pendingDeletes.length}篇删除` : ''}` : '推送所有改动' }}
            </button>

            <p v-if="pushMessage" class="lk-publish-msg" :class="`lk-publish-msg--${pushMessageKind}`">{{ pushMessage }}</p>

            <!-- 历史记录 -->
            <div v-if="historyRecords.length > 0" class="lk-publish-history">
              <button
                type="button"
                class="lk-publish-history__toggle"
                @click="historyExpanded = !historyExpanded"
              >
                <span>历史记录 ({{ historyRecords.length }})</span>
                <span class="lk-publish-history__arrow" :class="{ 'lk-publish-history__arrow--up': historyExpanded }">▼</span>
              </button>
              <ul v-if="historyExpanded" class="lk-publish-history__list">
                <li v-for="(c, i) in historyRecords" :key="i" class="lk-publish-history__item">
                  <div class="lk-publish-history__row">
                    <time>{{ c.date }}</time>
                    <code>{{ c.sha?.slice(0, 7) }}</code>
                  </div>
                  <div class="lk-publish-history__msg">{{ c.message }}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 预览卡片 -->
      <Teleport v-if="pendingArticles.length" to=".lk-blog__list">
        <li
          v-for="(article, index) in pendingArticles"
          :key="article.id"
          class="lk-blog__item lk-blog__item--preview"
          :class="{ 'lk-blog__item--reverse': index % 2 === 1 }"
        >
          <button type="button" class="lk-preview-delete" title="移除" @click="removePendingArticle(article.id)">×</button>
          <a class="lk-blog__card" :href="`/${article.target}/${article.slug}.html`">
            <template v-if="index % 2 === 0">
              <div class="lk-blog__text">
                <time class="lk-blog__date">{{ article.date }}</time>
                <h3 class="lk-blog__post-title">{{ article.title }}</h3>
                <p class="lk-blog__excerpt">{{ article.excerpt }}</p>
                <div class="lk-blog__meta">
                  <span class="lk-blog__tag">待推送</span>
                </div>
              </div>
              <img class="lk-blog__cover" :src="article.cover" alt="" />
            </template>
            <template v-else>
              <img class="lk-blog__cover" :src="article.cover" alt="" />
              <div class="lk-blog__text">
                <time class="lk-blog__date">{{ article.date }}</time>
                <h3 class="lk-blog__post-title">{{ article.title }}</h3>
                <p class="lk-blog__excerpt">{{ article.excerpt }}</p>
                <div class="lk-blog__meta">
                  <span class="lk-blog__tag">待推送</span>
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
  gap: 0.5rem;
}

.lk-publish-fab {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.15s;
}

.lk-publish-fab:hover {
  transform: scale(1.05);
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: var(--vp-c-brand-1);
}

.lk-publish-fab--push {
  font-size: 1.15rem;
}

.lk-publish-fab--pending {
  border-color: #f59e0b;
  background: #f59e0b;
  color: #fff;
}

.lk-publish-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.2rem;
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
}

.lk-publish-backdrop--sheet {
  align-items: flex-end;
  justify-content: flex-end;
}

.lk-publish-panel {
  width: min(32rem, 100%);
  max-height: 85vh;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lk-publish-push-sheet {
  width: min(24rem, 100vw - 4rem);
  max-height: 80vh;
  margin: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
}

.lk-publish-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.lk-publish-panel__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.lk-publish-panel__close {
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.lk-publish-panel__close:hover {
  background: var(--vp-c-default-soft);
}

.lk-publish-panel__body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.lk-publish-hint {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

.lk-publish-field {
  margin-bottom: 0.75rem;
}

.lk-publish-label {
  display: block;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.25rem;
}

.lk-publish-radio {
  margin-right: 1rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.lk-publish-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
}

.lk-publish-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-size: 0.8rem;
  font-family: var(--vp-font-family-mono);
  resize: vertical;
  min-height: 5rem;
}

.lk-publish-drop {
  padding: 1rem;
  border: 2px dashed var(--vp-c-divider);
  border-radius: 8px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  transition: all 0.15s;
}

.lk-publish-drop--active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-default-soft);
}

.lk-publish-file {
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-weight: 500;
}

.lk-publish-file input {
  display: none;
}

.lk-publish-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.lk-publish-secondary {
  padding: 0.45rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  cursor: pointer;
}

.lk-publish-primary {
  padding: 0.45rem 1rem;
  border-radius: 6px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}

.lk-publish-msg {
  margin: 0.5rem 0;
  font-size: 0.8rem;
}

.lk-publish-msg--err { color: #ef4444; }
.lk-publish-msg--ok { color: #22c55e; }
.lk-publish-msg--info { color: var(--vp-c-text-2); }

/* 待推送队列 */
.lk-publish-queue {
  margin-bottom: 0.75rem;
  padding: 0.6rem;
  background: var(--vp-c-default-soft);
  border-radius: 6px;
}

.lk-publish-queue__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.lk-publish-queue__clear {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.lk-publish-queue__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 6rem;
  overflow-y: auto;
}

.lk-publish-queue__item {
  font-size: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.lk-publish-queue__item:last-child {
  border-bottom: none;
}

.lk-publish-queue__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  cursor: pointer;
}

.lk-publish-queue__info {
  display: flex;
  flex-direction: column;
}

.lk-publish-queue__info span {
  color: var(--vp-c-text-3);
  font-size: 0.65rem;
}

.lk-publish-queue__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.lk-publish-queue__expand {
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  transition: transform 0.2s;
}

.lk-publish-queue__expand--open {
  transform: rotate(180deg);
}

.lk-publish-queue__remove {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.8);
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
}

.lk-publish-queue__edit {
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.lk-publish-input--sm {
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
}

/* 待删除队列 */
.lk-publish-queue--delete {
  border-left: 3px solid #ef4444;
}

.lk-publish-queue__delete-title {
  color: #ef4444;
}

/* 待删除文章卡片样式 */
:deep(.lk-blog__item--pending-delete) {
  opacity: 0.5;
  position: relative;
}

:deep(.lk-blog__item--pending-delete::after) {
  content: '待删除';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #ef4444;
  color: #fff;
  font-size: 0.6rem;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}

/* 推送按钮 */
.lk-publish-push-btn {
  width: 100%;
  padding: 0.6rem;
  border-radius: 6px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.lk-publish-push-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 历史记录 */
.lk-publish-history {
  margin-top: 0.75rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 0.5rem;
}

.lk-publish-history__toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  cursor: pointer;
}

.lk-publish-history__arrow {
  font-size: 0.65rem;
  transition: transform 0.2s;
}

.lk-publish-history__arrow--up {
  transform: rotate(180deg);
}

.lk-publish-history__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 10rem;
  overflow-y: auto;
}

.lk-publish-history__item {
  padding: 0.4rem 0;
  font-size: 0.7rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.lk-publish-history__row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.15rem;
}

.lk-publish-history__row time {
  color: var(--vp-c-text-3);
}

.lk-publish-history__row code {
  font-size: 0.65rem;
  color: var(--vp-c-brand-1);
}

.lk-publish-history__msg {
  color: var(--vp-c-text-1);
}

/* 预览卡片 */
.lk-blog__item--preview {
  position: relative;
  list-style: none;
}

.lk-blog__item--preview::before {
  content: '待推送';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #f59e0b;
  color: #fff;
  font-size: 0.6rem;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  z-index: 10;
}

.lk-preview-delete {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  z-index: 10;
}

/* 动画 */
.lk-publish-panel-enter-active,
.lk-publish-panel-leave-active {
  transition: opacity 0.15s;
}

.lk-publish-panel-enter-from,
.lk-publish-panel-leave-to {
  opacity: 0;
}
</style>
