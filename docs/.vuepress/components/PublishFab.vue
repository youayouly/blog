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
const content = ref('')
const commitMsg = ref('')
const dragging = ref(false)
const busy = ref(false)
const message = ref('')
const messageKind = ref('info')

const commits = ref([])
const historyBusy = ref(false)

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

async function readFile(file) {
  try {
    const text = await file.text()
    content.value = text
    if (!slug.value) {
      const base = file.name.replace(/\.md$/i, '').toLowerCase()
      if (/^[a-z0-9][a-z0-9-]*$/.test(base)) slug.value = base
    }
    setMsg(`已读取「${file.name}」。`, 'ok')
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
  const s = slug.value.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(s)) {
    setMsg('文件名（slug）需为小写字母、数字、连字符。', 'err')
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
    setMsg(
      data.url
        ? `已推送：${data.path}。部署完成后即可访问；列表/侧栏若需展示请自行改 README。`
        : `已推送：${data.path}。`,
      'ok',
    )
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
                对应
                <code>git add</code>
                的文件内容与路径；推送时使用下方「提交说明」作为
                <code>git commit -m</code>
                ，由服务器写入 GitHub（等价一步完成 push）。无需单独「发布密钥」，凭据与 About
                登录一致并在登录时写入会话。
              </p>

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
                {{ busy ? '推送中…' : '一键推送到 GitHub' }}
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
  max-height: 90vh;
  margin-top: 1rem;
  padding: 0;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
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
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 0.5rem;
}

.lk-publish-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  padding-bottom: 0;
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
  padding: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.lk-publish-primary,
.lk-publish-secondary {
  border-radius: 8px;
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}

.lk-publish-primary {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
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
