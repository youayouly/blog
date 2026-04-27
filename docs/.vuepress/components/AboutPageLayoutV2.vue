<script setup>
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  DEFAULT_HERO,
  DEFAULT_HOME_BG_DARK,
  DEFAULT_HOME_BG_LIGHT,
  useHomeBackgroundSrc,
} from '../utils/homeVisualPref.js'
import HomeTypewriterTagline from './HomeTypewriterTagline.vue'

const route = useRoute()
const currentBackground = useHomeBackgroundSrc()

const pageStyle = computed(() => {
  const background = currentBackground.value || DEFAULT_HERO
  return {
    '--lk-about-page-bg': `url("${background}")`,
    '--lk-about-page-bg-light': `url("${DEFAULT_HOME_BG_LIGHT}")`,
    '--lk-about-page-bg-dark': `url("${DEFAULT_HOME_BG_DARK}")`,
  }
})

function scrollToIntro() {
  if (typeof document === 'undefined') return
  document.getElementById('about-intro')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 导航为 `/about#about-intro` 时滚到首块内容（与 client.js afterEach 互补） */
function scrollToIntroIfHash() {
  if (typeof document === 'undefined') return
  if (route.hash !== '#about-intro') return
  nextTick(() => {
    document.getElementById('about-intro')?.scrollIntoView({ behavior: 'auto', block: 'start' })
  })
}

onMounted(scrollToIntroIfHash)
watch(() => route.hash, scrollToIntroIfHash)
</script>

<template>
  <div class="lk-about-fullbleed lk-about-v2" :style="pageStyle">
    <section class="lk-about-v2-hero" aria-label="关于我首屏">
      <div class="lk-about-v2-hero__overlay">
        <div class="lk-about-v2-hero__stack">
          <h1 class="lk-about-v2-hero__title">你好，我是 Luke</h1>
          <HomeTypewriterTagline class="lk-about-v2-hero__typewriter" text="Welcome to my blog!" />
          <div class="lk-about-v2-hero__actions" role="group" aria-label="快捷入口">
            <button
              type="button"
              class="lk-about-v2-hero__btn lk-about-v2-hero__btn--primary"
              @click="scrollToIntro"
            >
              <span class="lk-about-v2-hero__btn-label">了解我</span>
              <span class="lk-about-v2-hero__btn-arrow" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </button>
            <a
              class="lk-about-v2-hero__btn lk-about-v2-hero__btn--secondary"
              href="/article/"
            >
              <span class="lk-about-v2-hero__btn-label">查看文章</span>
              <span class="lk-about-v2-hero__btn-arrow" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section id="about-intro" class="lk-about-v2-main">
      <div class="lk-about-v2-main__grid lk-about-v2-main__grid--triple">
        <div class="lk-about-v2-main__col lk-about-v2-main__col--main">
          <div class="about-profile about-profile--vstack">
            <div class="about-left">
              <!-- 图 1 / 图 4 同款小卡片：方角头像 + Lu Yi • Luke + 3 个社交圆钮 -->
              <ProfileCard mini />
            </div>

            <div class="about-right">
              <div class="about-card about-card--intro">
                <h2>简介</h2>
                <p class="about-role-line">
                  即将入读 <strong>香港大学</strong>，关注产品、技术和跨文化体验。
                </p>
                <p class="about-bio">
                  我喜欢把复杂信息整理成更清晰的结构，也持续在嵌入式、前端和 AI 工具方向做项目实践。
                </p>
                <div class="about-tags-strip" aria-label="技能与兴趣">
                  <div class="about-tags about-tags--tech">
                    <span class="about-tag about-tag--embedded">嵌入式开发</span>
                    <span class="about-tag about-tag--frontend">前端体验</span>
                    <span class="about-tag about-tag--systems">系统工程</span>
                    <span class="about-tag about-tag--study">留学规划</span>
                    <span class="about-tag about-tag--travel">旅行记录</span>
                    <span class="about-tag about-tag--photo">摄影观察</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="lk-about-v2-main__projects">
            <AboutArticleRecommend />

            <blockquote class="about-outro">
              <p>欢迎联系我，不论是聊产品、技术、留学规划，还是香港生活都可以。</p>
            </blockquote>
          </div>
        </div>

        <aside class="lk-about-v2-main__col lk-about-v2-main__col--timeline" aria-label="动态时间线与归档">
          <AboutTimeline />
        </aside>
      </div>
    </section>
  </div>
</template>
