<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useIsLoggedIn } from '../utils/authGate.js'
import { readSiteApiCreds } from '../utils/siteApiCreds.js'

const isLoggedIn = useIsLoggedIn()
const batchMode = ref(false)
const selectedItems = ref(new Set())
const deleting = ref(false)
const message = ref('')
const mounted = ref(false)

const selectedCount = computed(() => selectedItems.value.size)

function toggleBatchMode() {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    selectedItems.value.clear()
    updateCheckboxes()
  }
  updateCheckboxVisibility()
}

function toggleItem(slug) {
  if (selectedItems.value.has(slug)) {
    selectedItems.value.delete(slug)
  } else {
    selectedItems.value.add(slug)
  }
  updateCheckboxes()
}

function selectAll() {
  const items = document.querySelectorAll('.lk-blog__item[data-slug]')
  items.forEach(item => {
    const slug = item.getAttribute('data-slug')
    if (slug) selectedItems.value.add(slug)
  })
  updateCheckboxes()
}

function clearSelection() {
  selectedItems.value.clear()
  updateCheckboxes()
}

function updateCheckboxes() {
  const items = document.querySelectorAll('.lk-blog__item[data-slug]')
  items.forEach(item => {
    const slug = item.getAttribute('data-slug')
    const checkbox = item.querySelector('.lk-batch-checkbox')
    if (checkbox && slug) {
      checkbox.checked = selectedItems.value.has(slug)
    }
  })
}

async function batchDelete() {
  if (selectedCount.value === 0) {
    message.value = '请先选择要删除的文章'
    return
  }

  const slugs = Array.from(selectedItems.value)
  const confirmed = confirm(`将 ${slugs.length} 篇文章标记为待删除？\n\n${slugs.join('\n')}\n\n删除将在推送时生效`)
  if (!confirmed) return

  // 获取文章标题并添加到待删除列表
  slugs.forEach(slug => {
    const item = document.querySelector(`.lk-blog__item[data-slug="${slug}"]`)
    const titleEl = item?.querySelector('.lk-blog__post-title')
    const title = titleEl?.textContent || slug

    // 调用PublishFab的addPendingDelete方法
    const fab = document.querySelector('.lk-publish-root')?.__vueParentComponent?.proxy
    if (fab?.addPendingDelete) {
      fab.addPendingDelete(slug, title)
    } else {
      // 备用方案：使用事件
      window.dispatchEvent(new CustomEvent('add-pending-delete', { detail: { slug, title } }))
    }

    // 添加删除标记样式和标志
    if (item) {
      item.classList.add('lk-blog__item--pending-delete')

      // 添加"即将删除"标志（如果不存在）
      if (!item.querySelector('.lk-delete-badge')) {
        const badge = document.createElement('span')
        badge.className = 'lk-delete-badge'
        badge.textContent = '即将删除'
        badge.style.cssText = `
          position: absolute;
          top: 8px;
          left: 8px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          z-index: 10;
          font-weight: 500;
        `
        item.style.position = 'relative'
        item.insertBefore(badge, item.firstChild)
      }
    }
  })

  message.value = `已标记 ${slugs.length} 篇文章为待删除，点击推送按钮完成删除`
  selectedItems.value.clear()
  batchMode.value = false
}

function batchPrint() {
  if (selectedCount.value === 0) {
    message.value = '请先选择要打印的文章'
    return
  }

  const slugs = Array.from(selectedItems.value)
  slugs.forEach((slug, index) => {
    setTimeout(() => {
      const win = window.open(`/article/${slug}.html`, '_blank')
      if (win) {
        win.onload = () => {
          win.print()
        }
      }
    }, index * 500)
  })
}

function injectCheckboxes() {
  // 选中所有文章项，包括 external 的
  const items = document.querySelectorAll('.lk-blog__item')
  items.forEach(item => {
    if (item.querySelector('.lk-batch-checkbox')) return

    const link = item.querySelector('a.lk-blog__card')
    if (!link) return

    const href = link.getAttribute('href') || ''
    // 匹配 /article/xxx.html 或 /tech/xxx.html
    const match = href.match(/\/(article|tech)\/(.+)\.html/)
    if (!match) return
    const slug = match[2] // 获取文件名部分

    item.setAttribute('data-slug', slug)

    const checkboxWrapper = document.createElement('div')
    checkboxWrapper.className = 'lk-batch-checkbox-wrapper'
    checkboxWrapper.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 20;
      display: ${batchMode.value ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    `

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'lk-batch-checkbox'
    checkbox.style.cssText = `
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #4a90d9;
    `
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation()
      toggleItem(slug)
    })

    checkboxWrapper.appendChild(checkbox)
    item.style.position = 'relative'
    item.insertBefore(checkboxWrapper, item.firstChild)

    // 点击卡片也可以选中
    link.style.cursor = batchMode.value ? 'pointer' : ''
    link.addEventListener('click', (e) => {
      if (batchMode.value) {
        e.preventDefault()
        toggleItem(slug)
      }
    })
  })
}

function updateCheckboxVisibility() {
  const wrappers = document.querySelectorAll('.lk-batch-checkbox-wrapper')
  wrappers.forEach(wrapper => {
    wrapper.style.display = batchMode.value ? 'flex' : 'none'
  })
}

// 在 article 页面才显示
const isArticlePage = ref(false)

function checkPage() {
  if (typeof window === 'undefined') return
  const path = window.location.pathname
  isArticlePage.value = path === '/article/' || path === '/article' || path.startsWith('/article/')
}

onMounted(() => {
  mounted.value = true
  checkPage()
  setTimeout(injectCheckboxes, 500)
  setInterval(checkPage, 1000)

  const observer = new MutationObserver(() => {
    injectCheckboxes()
  })
  observer.observe(document.body, { childList: true, subtree: true })
})
</script>

<template>
  <Teleport v-if="mounted && isArticlePage && isLoggedIn" to=".vp-sidebar-links">
    <li class="lk-batch-sidebar-card">
      <div class="lk-batch-card">
        <div class="lk-batch-card__head">
          <span class="lk-batch-card__title">批量操作</span>
          <span v-if="batchMode" class="lk-batch-card__count">{{ selectedCount }} 项</span>
        </div>

        <div v-if="!batchMode" class="lk-batch-card__single">
          <button type="button" class="lk-batch-card__btn lk-batch-card__btn--primary" @click="toggleBatchMode">
            开始选择
          </button>
        </div>

        <div v-else class="lk-batch-card__actions">
          <div class="lk-batch-card__row">
            <button type="button" class="lk-batch-card__btn lk-batch-card__btn--small" @click="selectAll">全选</button>
            <button type="button" class="lk-batch-card__btn lk-batch-card__btn--small" @click="clearSelection">清空</button>
          </div>
          <div class="lk-batch-card__row">
            <button
              type="button"
              class="lk-batch-card__btn lk-batch-card__btn--delete"
              :disabled="deleting || selectedCount === 0"
              @click="batchDelete"
            >{{ deleting ? '删除中...' : '删除' }}</button>
            <button
              type="button"
              class="lk-batch-card__btn lk-batch-card__btn--print"
              :disabled="selectedCount === 0"
              @click="batchPrint"
            >打印</button>
          </div>
          <button type="button" class="lk-batch-card__btn lk-batch-card__btn--cancel" @click="toggleBatchMode">
            取消选择
          </button>
        </div>

        <p v-if="message" class="lk-batch-card__msg">{{ message }}</p>
      </div>
    </li>
  </Teleport>
</template>

<style scoped>
.lk-batch-sidebar-card {
  list-style: none;
  margin: 1rem 0;
  padding: 0;
}

.lk-batch-card {
  background: #f6f8fa;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.85rem;
}

[data-theme='dark'] .lk-batch-card {
  background: #1e293b;
  border-color: #64748b;
}

.lk-batch-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #d1d5db;
}

[data-theme='dark'] .lk-batch-card__head {
  border-bottom-color: #64748b;
}

.lk-batch-card__title {
  font-weight: 600;
  color: #1f2937;
}

[data-theme='dark'] .lk-batch-card__title {
  color: #f1f5f9;
}

.lk-batch-card__count {
  font-size: 0.75rem;
  color: #374151;
  background: #e5e7eb;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

[data-theme='dark'] .lk-batch-card__count {
  background: #475569;
  color: #e2e8f0;
}

.lk-batch-card__single {
  display: flex;
}

.lk-batch-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.lk-batch-card__row {
  display: flex;
  gap: 0.4rem;
}

.lk-batch-card__btn {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #9ca3af;
  background: #fff;
  color: #1f2937;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

[data-theme='dark'] .lk-batch-card__btn {
  background: #334155;
  border-color: #64748b;
  color: #f1f5f9;
}

.lk-batch-card__btn:hover:not(:disabled) {
  background: #f3f4f6;
}

[data-theme='dark'] .lk-batch-card__btn:hover:not(:disabled) {
  background: #475569;
}

.lk-batch-card__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lk-batch-card__btn--primary {
  background: #4a90d9;
  border-color: #4a90d9;
  color: #fff;
}

[data-theme='dark'] .lk-batch-card__btn--primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.lk-batch-card__btn--primary:hover {
  background: #357abd;
}

[data-theme='dark'] .lk-batch-card__btn--primary:hover {
  background: #2563eb;
}

.lk-batch-card__btn--small {
  padding: 0.3rem 0.5rem;
  font-size: 0.75rem;
}

.lk-batch-card__btn--delete {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

[data-theme='dark'] .lk-batch-card__btn--delete {
  background: #7f1d1d;
  border-color: #f87171;
  color: #fca5a5;
}

.lk-batch-card__btn--delete:hover:not(:disabled) {
  background: #fecaca;
}

[data-theme='dark'] .lk-batch-card__btn--delete:hover:not(:disabled) {
  background: #991b1b;
}

.lk-batch-card__btn--print {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #2563eb;
}

[data-theme='dark'] .lk-batch-card__btn--print {
  background: #1e3a5f;
  border-color: #60a5fa;
  color: #93c5fd;
}

.lk-batch-card__btn--print:hover:not(:disabled) {
  background: #bfdbfe;
}

[data-theme='dark'] .lk-batch-card__btn--print:hover:not(:disabled) {
  background: #1e40af;
}

.lk-batch-card__btn--cancel {
  margin-top: 0.2rem;
  font-size: 0.75rem;
}

.lk-batch-card__msg {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

[data-theme='dark'] .lk-batch-card__msg {
  color: #9ca3af;
}
</style>
