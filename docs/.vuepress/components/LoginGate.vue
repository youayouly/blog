<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { normPath, setAuthed, syncAuthedFromStorage, useIsLoggedIn } from '../utils/authGate.js'
import {
  AVATAR_PREF_EVENT,
  AVATAR_PREF_KEY,
  avatarChoices,
  readAvatar,
  syncAvatarFromStorage,
  useAvatarSrc,
  writeAvatar,
} from '../utils/avatarPref.js'

const EXPECT_USER = 'youayouly'
const EXPECT_PASS = 'LUyi@541000'

const route = useRoute()
const router = useRouter()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const logoutAnchorReady = ref(false)
const showLoginModal = ref(false)
const showAvatarModal = ref(false)
const isLoggedIn = useIsLoggedIn()
const currentAvatar = useAvatarSrc()

const showLoginEntry = computed(() => {
  if (isLoggedIn.value) return false
  const p = normPath(route.path)
  return p === '/about' || p.startsWith('/about/')
})

function closeLoginModal() {
  showLoginModal.value = false
}

function closeAvatarModal() {
  showAvatarModal.value = false
}

function openLoginModal() {
  if (!showLoginEntry.value) return
  showLoginModal.value = true
}

function openAvatarModal() {
  if (!isLoggedIn.value) return
  syncAvatarFromStorage()
  showAvatarModal.value = true
}

function onAccountEntryClick() {
  if (isLoggedIn.value) openAvatarModal()
  else openLoginModal()
}

function onSubmit(e) {
  e.preventDefault()
  errorMsg.value = ''
  if (username.value === EXPECT_USER && password.value === EXPECT_PASS) {
    setAuthed(true)
    username.value = ''
    password.value = ''
    showLoginModal.value = false
    return
  }
  errorMsg.value = '用户名或密码不正确'
}

async function logout() {
  closeAvatarModal()
  try {
    await router.replace('/about')
  } catch {
    /* ignore navigation failure */
  }
  setAuthed(false)
}

const ANCHOR_ID = 'lk-logout-anchor'
let brandLinkEl = null
let brandLogoCaptureHandler = null

function applyAvatarToDom(src) {
  if (typeof document === 'undefined') return
  const avatar = src || readAvatar()

  for (const img of document.querySelectorAll('img.vp-nav-logo')) {
    img.setAttribute('src', avatar)
  }
  for (const img of document.querySelectorAll('.about-avatar-large, .lk-card__avatar')) {
    img.setAttribute('src', avatar)
  }

  const icon = document.querySelector('link[rel="icon"]')
  if (icon) {
    icon.setAttribute('href', avatar)
    const isSvg = avatar.endsWith('.svg')
    const isPng = avatar.endsWith('.png')
    icon.setAttribute('type', isSvg ? 'image/svg+xml' : isPng ? 'image/png' : 'image/jpeg')
  }
}

function syncAvatarEverywhere() {
  syncAvatarFromStorage()
  applyAvatarToDom(currentAvatar.value)
}

function selectAvatar(src) {
  if (!isLoggedIn.value) return
  writeAvatar(src)
  syncAvatarEverywhere()
}

function handleNavbarBrandLogoClick(e) {
  const t = e.target
  if (!t || typeof t.matches !== 'function' || !t.matches('img.vp-nav-logo')) return
  e.preventDefault()
  e.stopPropagation()
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation()
  onAccountEntryClick()
}

function bindNavbarLogoTrigger() {
  if (typeof document === 'undefined') return
  if (brandLinkEl && brandLogoCaptureHandler) {
    brandLinkEl.removeEventListener('click', brandLogoCaptureHandler, true)
    brandLinkEl = null
    brandLogoCaptureHandler = null
  }
  const link = document.querySelector('#navbar a.vp-brand')
  if (!link) return
  brandLogoCaptureHandler = handleNavbarBrandLogoClick
  brandLinkEl = link
  brandLinkEl.addEventListener('click', brandLogoCaptureHandler, true)
}

function ensureLogoutAnchor() {
  if (typeof document === 'undefined') return
  bindNavbarLogoTrigger()
  const sw = document.getElementById('color-mode-switch')
  if (!sw) {
    logoutAnchorReady.value = false
    return
  }
  const item = sw.closest('.vp-nav-item')
  if (!item) {
    logoutAnchorReady.value = false
    return
  }
  item.classList.add('lk-logout-slot-col')
  let el = document.getElementById(ANCHOR_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = ANCHOR_ID
    item.appendChild(el)
  }
  logoutAnchorReady.value = true
}

let navbarObserver = null
let anchorRaf = null

function scheduleEnsureLogoutAnchor() {
  if (typeof document === 'undefined') return
  if (typeof requestAnimationFrame === 'function') {
    if (anchorRaf != null) cancelAnimationFrame(anchorRaf)
    anchorRaf = requestAnimationFrame(() => {
      anchorRaf = null
      ensureLogoutAnchor()
      syncAvatarEverywhere()
    })
  } else {
    nextTick(() => {
      ensureLogoutAnchor()
      syncAvatarEverywhere()
    })
  }
}

function onAvatarStorage(e) {
  if (!e || e.key === AVATAR_PREF_KEY || e.key === null) syncAvatarEverywhere()
}

onMounted(() => {
  syncAuthedFromStorage()
  syncAvatarEverywhere()
  nextTick(ensureLogoutAnchor)
  if (typeof MutationObserver !== 'undefined') {
    const nav = document.getElementById('navbar')
    if (nav) {
      navbarObserver = new MutationObserver(() => {
        scheduleEnsureLogoutAnchor()
      })
      navbarObserver.observe(nav, { childList: true, subtree: true })
    }
  }
  window.addEventListener('storage', onAvatarStorage)
  window.addEventListener(AVATAR_PREF_EVENT, syncAvatarEverywhere)
})

watch(
  () => route.fullPath,
  () => {
    closeLoginModal()
    closeAvatarModal()
    scheduleEnsureLogoutAnchor()
  },
)

watch(isLoggedIn, (v) => {
  if (!v) closeAvatarModal()
  scheduleEnsureLogoutAnchor()
})

watch(showLoginEntry, (v) => {
  if (!v) closeLoginModal()
})

onUnmounted(() => {
  if (brandLinkEl && brandLogoCaptureHandler) {
    brandLinkEl.removeEventListener('click', brandLogoCaptureHandler, true)
    brandLinkEl = null
    brandLogoCaptureHandler = null
  }
  if (anchorRaf != null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(anchorRaf)
    anchorRaf = null
  }
  if (navbarObserver) {
    navbarObserver.disconnect()
    navbarObserver = null
  }
  window.removeEventListener('storage', onAvatarStorage)
  window.removeEventListener(AVATAR_PREF_EVENT, syncAvatarEverywhere)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showLoginEntry && showLoginModal"
      class="lk-login-modal-wrap"
      role="dialog"
      aria-modal="true"
      aria-label="登录"
      @click.self="closeLoginModal"
    >
      <div class="lk-login-entry-card">
        <button type="button" class="lk-login-close" aria-label="关闭登录框" @click="closeLoginModal">
          ×
        </button>
        <h2 class="lk-login-entry-title">登录</h2>
        <p class="lk-login-entry-hint">
          登录后可访问首页、留学、相册等，也可以在顶部图标区控制其他页面访问权限和隐藏导航页面。
        </p>
        <form class="lk-login-entry-form" @submit="onSubmit">
          <label class="lk-login-entry-label">
            <span>用户名</span>
            <input
              v-model="username"
              class="lk-login-entry-input"
              type="text"
              name="username"
              autocomplete="username"
              required
            />
          </label>
          <label class="lk-login-entry-label">
            <span>密码</span>
            <input
              v-model="password"
              class="lk-login-entry-input"
              type="password"
              name="password"
              autocomplete="current-password"
              required
            />
          </label>
          <p v-if="errorMsg" class="lk-login-entry-error" role="alert">{{ errorMsg }}</p>
          <button type="submit" class="lk-login-entry-submit">登录</button>
        </form>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="isLoggedIn && showAvatarModal"
      class="lk-login-modal-wrap"
      role="dialog"
      aria-modal="true"
      aria-label="切换头像"
      @click.self="closeAvatarModal"
    >
      <div class="lk-login-entry-card lk-avatar-card">
        <button type="button" class="lk-login-close" aria-label="关闭头像选择框" @click="closeAvatarModal">
          ×
        </button>
        <h2 class="lk-login-entry-title">切换头像</h2>
        <p class="lk-login-entry-hint">登录后可在这里切换头像，未登录时不可修改。</p>
        <div class="lk-avatar-grid">
          <button
            v-for="item in avatarChoices"
            :key="item.src"
            type="button"
            class="lk-avatar-option"
            :class="{ 'is-active': currentAvatar === item.src }"
            :title="item.label"
            @click="selectAvatar(item.src)"
          >
            <img :src="item.src" :alt="item.label" />
            <span>{{ item.label }}</span>
          </button>
        </div>
        <div class="lk-avatar-actions">
          <button type="button" class="lk-logout-nav-btn" title="退出登录" @click="logout">
            退出登录
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</template>

<style scoped>
.lk-login-modal-wrap {
  position: fixed;
  inset: 0;
  z-index: 99990;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(2, 6, 23, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.lk-login-entry-card {
  position: relative;
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.1rem 1rem 1rem;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.lk-login-close {
  position: absolute;
  right: 0.55rem;
  top: 0.45rem;
  width: 1.4rem;
  height: 1.4rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  color: rgba(226, 232, 240, 0.9);
  background: rgba(51, 65, 85, 0.7);
}

.lk-login-entry-title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.96);
}

.lk-login-entry-hint {
  margin: 0 0 0.85rem;
  font-size: 0.72rem;
  line-height: 1.4;
  color: rgba(148, 163, 184, 0.95);
}

.lk-login-entry-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.lk-login-entry-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: rgba(203, 213, 225, 0.9);
}

.lk-login-entry-input {
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  border: 1px solid rgba(100, 116, 139, 0.45);
  background: rgba(15, 23, 42, 0.65);
  color: rgba(248, 250, 252, 0.96);
  font-size: 0.88rem;
}

.lk-login-entry-input:focus {
  outline: none;
  border-color: rgba(74, 144, 217, 0.75);
  box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2);
}

.lk-login-entry-error {
  margin: 0;
  font-size: 0.72rem;
  color: #fca5a5;
}

.lk-login-entry-submit {
  margin-top: 0.15rem;
  padding: 0.5rem 0.85rem;
  border: none;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.92);
  background: linear-gradient(135deg, #7eb8ea 0%, #4a90d9 100%);
}

.lk-login-entry-submit:hover {
  filter: brightness(1.06);
}

.lk-avatar-card {
  width: min(15rem, calc(100vw - 2.25rem));
  padding: 0.7rem 0.65rem 0.65rem;
  border-radius: 10px;
}

.lk-avatar-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
  margin-top: 0.2rem;
}

.lk-avatar-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.25rem;
  border-radius: 7px;
  border: 1px solid rgba(100, 116, 139, 0.42);
  background: rgba(15, 23, 42, 0.55);
  color: rgba(226, 232, 240, 0.96);
  cursor: pointer;
}

.lk-avatar-option img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
}

.lk-avatar-option span {
  font-size: 0.6rem;
  line-height: 1.2;
}

.lk-avatar-option.is-active {
  border-color: rgba(74, 144, 217, 0.85);
  box-shadow: 0 0 0 1px rgba(74, 144, 217, 0.22);
}

.lk-avatar-actions {
  margin-top: 0.45rem;
  display: flex;
  justify-content: flex-end;
}
</style>

<style>
.vp-nav-item.lk-logout-slot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

#lk-logout-anchor {
  display: flex;
  justify-content: center;
  width: 100%;
  line-height: 1;
}

.lk-account-nav-btn,
.lk-logout-nav-btn {
  margin: 0;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: rgba(226, 232, 240, 0.88);
  background: rgba(30, 41, 59, 0.75);
  white-space: nowrap;
}

.lk-account-nav-btn:hover,
.lk-logout-nav-btn:hover {
  border-color: rgba(148, 163, 184, 0.55);
  color: rgba(248, 250, 252, 0.96);
  background: rgba(51, 65, 85, 0.88);
}

[data-theme='light'] .lk-login-entry-card {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(100, 116, 139, 0.25);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

[data-theme='light'] .lk-login-entry-title {
  color: rgba(15, 23, 42, 0.92);
}

[data-theme='light'] .lk-login-entry-hint {
  color: rgba(71, 85, 105, 0.95);
}

[data-theme='light'] .lk-login-entry-label {
  color: rgba(51, 65, 85, 0.9);
}

[data-theme='light'] .lk-login-entry-input {
  border-color: rgba(148, 163, 184, 0.55);
  background: rgba(248, 250, 252, 0.95);
  color: rgba(15, 23, 42, 0.92);
}

[data-theme='light'] .lk-account-nav-btn,
[data-theme='light'] .lk-logout-nav-btn {
  border-color: rgba(100, 116, 139, 0.35);
  color: rgba(51, 65, 85, 0.9);
  background: rgba(241, 245, 249, 0.9);
}

[data-theme='light'] .lk-account-nav-btn:hover,
[data-theme='light'] .lk-logout-nav-btn:hover {
  border-color: rgba(71, 85, 105, 0.45);
  background: rgba(226, 232, 240, 0.95);
}

[data-theme='light'] .lk-avatar-option {
  background: rgba(248, 250, 252, 0.9);
  color: rgba(30, 41, 59, 0.94);
  border-color: rgba(148, 163, 184, 0.45);
}
</style>
