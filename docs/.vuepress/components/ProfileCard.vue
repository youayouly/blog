<template>
  <aside class="lk-card" :class="{ 'lk-card--embedded': embedded }">
    <!-- Avatar — click/hover rotates clockwise; release reverses counter-clockwise -->
    <div class="lk-card__avatar-wrap">
      <img class="lk-card__avatar" src="/avatar.jpg" alt="Luke · 陆毅" />
    </div>

    <!-- Name with gradient text -->
    <div class="lk-card__name">Luke · 陆毅</div>
    <div class="lk-card__sub">Incoming HKU ECIC</div>

    <!-- Tags -->
    <div class="lk-card__tags">
      <span class="lk-card__tag">Tech</span>
      <span class="lk-card__tag">Travel</span>
      <span class="lk-card__tag">Study Abroad</span>
    </div>

    <div class="lk-card__divider" />

    <!-- Social dock -->
    <nav class="lk-card__dock" aria-label="Social links">

      <a class="lk-card__dock-btn" href="/" title="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 12v9h18v-9"/>
        </svg>
      </a>

      <a class="lk-card__dock-btn" href="https://github.com/youayouly"
        target="_blank" rel="noopener noreferrer" title="GitHub">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      </a>

      <a class="lk-card__dock-btn" href="https://space.bilibili.com/"
        target="_blank" rel="noopener noreferrer" title="Bilibili">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .356-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
        </svg>
      </a>

      <a class="lk-card__dock-btn" href="mailto:youayouly@gmail.com" title="Email">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      </a>

      <span class="lk-card__dock-sep" aria-hidden="true"></span>

      <a class="lk-card__dock-btn" href="https://qm.qq.com/"
        target="_blank" rel="noopener noreferrer" title="QQ">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.003 2c-4.265 0-8.006 2.59-8.006 7.723 0 2.25.765 3.767 1.572 4.838C5.07 15.44 4.5 16.632 4.5 17.4c0 1.29.876 1.63 1.73 1.63.278 0 .674-.03 1.064-.09C7.83 20.51 9.765 22 12.003 22c2.238 0 4.173-1.49 4.71-3.06.39.06.786.09 1.064.09.854 0 1.73-.34 1.73-1.63 0-.768-.57-1.96-1.069-2.839.807-1.071 1.572-2.588 1.572-4.838C20.01 4.59 16.268 2 12.003 2zM9.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
        </svg>
      </a>

      <!-- WeChat — hover shows QR popup -->
      <div class="lk-card__wechat-wrap">
        <button class="lk-card__dock-btn lk-card__dock-btn--wechat" title="微信">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-3.623-6.348-7.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.064-6.088v-.034zm-2.01 3.1c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983zm4.017 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983z"/>
          </svg>
        </button>
        <!-- QR popup card -->
        <div class="lk-card__wechat-popup">
          <!-- 将 /wechat-qr.jpg 放入 docs/.vuepress/public/ 即可显示 -->
          <img class="lk-card__wechat-qr" :src="qrSrc" alt="微信二维码"
            @error="onQrError" />
          <div v-if="qrFailed" class="lk-card__wechat-qr-ph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/>
              <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/>
              <rect x="18" y="19" width="3" height="2"/>
            </svg>
            <span>请放置二维码图片</span>
          </div>
          <p class="lk-card__wechat-label">扫码添加好友</p>
          <!-- speech bubble arrow -->
          <div class="lk-card__wechat-arrow" />
        </div>
      </div>

    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  /** 嵌入侧栏控制面板时：去大阴影与 min-height，占满所在列 */
  embedded: { type: Boolean, default: false },
})

// Put your WeChat QR image at docs/.vuepress/public/wechat-qr.jpg
const qrSrc = ref('/wechat-qr.jpg')
const qrFailed = ref(false)

function onQrError(e) {
  e.target.style.display = 'none'
  qrFailed.value = true
}
</script>

<style scoped>
/* ── Card shell — dark gradient glass ──────────────────────────── */
.lk-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 10px 18px 20px;
  box-sizing: border-box;
  background: linear-gradient(
    160deg,
    rgba(12, 18, 52, 0.82) 0%,
    rgba(48, 18, 72, 0.8) 100%
  );
  backdrop-filter: blur(22px) saturate(1.6);
  -webkit-backdrop-filter: blur(22px) saturate(1.6);
  border: 1px solid rgba(180, 140, 255, 0.28);
  border-radius: 24px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
  color: white;
}

.lk-card:not(.lk-card--embedded) {
  max-width: 260px;
  min-height: 420px;
}

@media (min-width: 1440px) {
  .lk-card:not(.lk-card--embedded) {
    min-height: 460px;
    padding-top: 6px;
  }
}

.lk-card--embedded {
  min-height: 0;
  max-width: 100%;
  width: 100%;
  padding: 12px 12px 14px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  color: #0f172a;
}

/* Dark mode: embedded card (homepage sidebar) should match overall theme. */
[data-theme='dark'] .lk-card--embedded {
  box-shadow: 0 2px 18px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
  background: rgba(15, 23, 42, 0.62) !important;
  border: 1px solid rgba(148, 163, 184, 0.22) !important;
  color: rgba(226, 232, 240, 0.98) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__dock {
  background: rgba(2, 6, 23, 0.25) !important;
  border-color: rgba(148, 163, 184, 0.2) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__name {
  color: rgba(199, 210, 254, 0.98) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__sub {
  color: rgba(148, 163, 184, 0.98) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__tag {
  color: rgba(196, 181, 253, 0.98) !important;
  background: rgba(99, 102, 241, 0.16) !important;
  border-color: rgba(99, 102, 241, 0.35) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__dock-btn {
  color: rgba(199, 210, 254, 0.95) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__dock-btn:hover {
  color: rgba(255, 255, 255, 0.98) !important;
  background: rgba(99, 102, 241, 0.22) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__dock-sep {
  background: rgba(148, 163, 184, 0.35) !important;
}

[data-theme='dark'] .lk-card--embedded .lk-card__divider {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(148, 163, 184, 0.3),
    transparent
  ) !important;
}

.lk-card--embedded .lk-card__avatar-wrap {
  margin-bottom: 10px;
}

.lk-card--embedded .lk-card__sub {
  margin-bottom: 8px;
}

.lk-card--embedded .lk-card__tags {
  margin-bottom: 10px;
}

.lk-card--embedded .lk-card__divider {
  margin-bottom: 10px;
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.45), transparent);
}

.lk-card--embedded .lk-card__avatar-wrap {
  width: 82px;
  height: 82px;
}

.lk-card--embedded .lk-card__dock {
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 4px;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.45);
  border-color: rgba(148, 163, 184, 0.35);
}

.lk-card--embedded .lk-card__name {
  background: none;
  -webkit-text-fill-color: unset;
  color: #312e81;
  filter: none;
}

.lk-card--embedded .lk-card__sub {
  color: #475569;
}

.lk-card--embedded .lk-card__tag {
  color: #4338ca;
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.28);
}

.lk-card--embedded .lk-card__dock-btn {
  color: #4338ca;
}

.lk-card--embedded .lk-card__dock-btn:hover {
  color: #1e1b4b;
  background: rgba(99, 102, 241, 0.15);
}

.lk-card--embedded .lk-card__dock-sep {
  background: rgba(148, 163, 184, 0.45);
}

.lk-card--embedded .lk-card__divider {
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.45), transparent);
}

/* ── Avatar — circle + clockwise spin on hover（头像 crop 偏上显眼部）── */
.lk-card__avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #7dd3fc, #a78bfa, #f472b6);
  margin-top: 0;
  margin-bottom: 14px;
  box-shadow: 0 4px 20px rgba(167, 139, 250, 0.45);
  cursor: pointer;
  transition: transform 0.85s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

@media (min-width: 1440px) {
  .lk-card__avatar-wrap {
    margin-top: 2px;
  }
}

.lk-card__avatar-wrap:hover {
  transform: rotate(360deg);               /* clockwise; CSS reverses on mouse-leave */
}

.lk-card__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  object-position: 50% 22%;
  display: block;
}

/* ── Name — gradient text ──────────────────────────────────────── */
.lk-card__name {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin-bottom: 4px;
  background: linear-gradient(90deg, #93c5fd, #c4b5fd, #f9a8d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 1px 6px rgba(0, 0, 0, 0.5));
}

.lk-card__sub {
  font-size: 0.78rem;
  color: rgba(200, 210, 255, 0.82);
  margin-bottom: 12px;
}

/* ── Tags ──────────────────────────────────────────────────────── */
.lk-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  margin-bottom: 14px;
}

.lk-card__tag {
  font-size: 0.68rem;
  font-weight: 500;
  color: #c4b5fd;
  background: rgba(167, 139, 250, 0.18);
  border: 1px solid rgba(167, 139, 250, 0.35);
  border-radius: 100px;
  padding: 2px 9px;
}

/* ── Divider ───────────────────────────────────────────────────── */
.lk-card__divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(180, 140, 255, 0.4), transparent);
  margin-bottom: 14px;
}

/* ── Dock ──────────────────────────────────────────────────────── */
.lk-card__dock {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(180, 140, 255, 0.22);
  border-radius: 100px;
  padding: 7px 12px;
}

.lk-card__dock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: rgba(200, 210, 255, 0.85);
  transition: color 0.18s, background 0.18s;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.lk-card__dock-btn:hover {
  color: #fff;
  background: rgba(167, 139, 250, 0.28);
}

.lk-card__dock-btn svg {
  width: 17px;
  height: 17px;
}

.lk-card__dock-sep {
  display: inline-block;
  width: 1px;
  height: 18px;
  background: rgba(180, 140, 255, 0.35);
  margin: 0 3px;
}

/* ── WeChat popup ──────────────────────────────────────────────── */
.lk-card__wechat-wrap {
  position: relative;
  display: flex;
}

.lk-card__wechat-popup {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  width: 158px;
  padding: 12px 12px 8px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
  transform: translateX(-50%) translateY(6px);
  z-index: 100;
}

.lk-card__wechat-wrap:hover .lk-card__wechat-popup {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

.lk-card__wechat-qr {
  width: 134px;
  height: 134px;
  object-fit: contain;
  border-radius: 8px;
  display: block;
}

/* placeholder shown when QR image fails to load */
.lk-card__wechat-qr-ph {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 134px;
  height: 134px;
  background: #f3f4f6;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.7rem;
  gap: 6px;
  text-align: center;
}

.lk-card__wechat-qr-ph svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.lk-card__wechat-label {
  font-size: 0.72rem;
  color: #4b5563;
  margin: 0;
}

/* speech-bubble arrow */
.lk-card__wechat-arrow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.96);
}
</style>
