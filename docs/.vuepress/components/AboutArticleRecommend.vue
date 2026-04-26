<script setup>
import { computed } from 'vue'
import { recommendedArticles } from '../data/aboutArticleFeed.js'

const defaultCover = '/gallery/about-bg-bright-starfield.svg'

const articles = computed(() =>
  [...recommendedArticles]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4),
)

function coverFor(post) {
  return post.cover || defaultCover
}

function primaryCategory(post) {
  return post.categories?.[0] || '随笔'
}
</script>

<template>
  <div class="lk-about-articles">
    <h3 class="lk-about-articles__heading">短文推荐</h3>
    <p class="lk-about-articles__lead">
      来自 <strong>Articles</strong> 的近期随笔。卡片改成上图下文，留出更宽的阅读空间。
    </p>
    <ul class="lk-about-articles__list">
      <li v-for="(post, i) in articles" :key="i" class="lk-about-articles__card">
        <a class="lk-about-articles__media" :href="post.href" tabindex="-1" aria-hidden="true">
          <img class="lk-about-articles__cover" :src="coverFor(post)" alt="" loading="lazy" />
        </a>
        <div class="lk-about-articles__body">
          <a class="lk-about-articles__title" :href="post.href">{{ post.title }}</a>
          <p class="lk-about-articles__excerpt">{{ post.excerpt }}</p>
          <div class="lk-about-articles__foot">
            <span class="lk-about-articles__foot-left">
              <span class="lk-about-articles__foot-item">{{ post.date }}</span>
              <span class="lk-about-articles__foot-dot" aria-hidden="true">·</span>
              <span class="lk-about-articles__foot-item">{{ primaryCategory(post) }}</span>
            </span>
            <a class="lk-about-articles__read" :href="post.href">阅读全文 ></a>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lk-about-articles {
  min-width: 0;
  --lk-about-card-border: rgba(37, 99, 235, 0.14);
  --lk-about-card-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  --lk-about-accent: #2563eb;
}

.lk-about-articles__heading {
  margin: 0 0 0.35rem;
  font-size: 1.08rem;
  font-weight: 760;
  color: var(--vp-c-text-1, #0f172a);
}

.lk-about-articles__lead {
  margin: 0 0 1rem;
  font-size: 0.84rem;
  line-height: 1.6;
  color: var(--vp-c-text-2, #64748b);
}

.lk-about-articles__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  width: 100%;
}

.lk-about-articles__card {
  display: grid;
  grid-template-rows: minmax(130px, 180px) auto;
  min-height: 0;
  width: 100%;
  max-width: none;
  margin-inline: auto;
  margin: 0;
  padding: 0;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid var(--lk-about-card-border);
  box-shadow: var(--lk-about-card-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.lk-about-articles__card:hover {
  transform: translateY(-3px);
  border-color: rgba(37, 99, 235, 0.22);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.14);
}

.lk-about-articles__media {
  display: block;
  min-height: 130px;
  max-height: 180px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%);
}

.lk-about-articles__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
  display: block;
}

.lk-about-articles__body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.55rem;
  min-height: 118px;
  padding: 0.65rem 0.95rem 0.75rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.45) 0%, rgba(255, 255, 255, 0.96) 34%);
}

.lk-about-articles__title {
  display: block;
  font-size: 1rem;
  font-weight: 780;
  color: var(--lk-about-accent);
  text-decoration: none;
  line-height: 1.4;
}

.lk-about-articles__title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.lk-about-articles__excerpt {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--vp-c-text-2, #475569);
}

.lk-about-articles__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  font-size: 0.76rem;
  color: var(--vp-c-text-3, #64748b);
}

.lk-about-articles__foot-left {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.24rem;
}

.lk-about-articles__foot-dot {
  opacity: 0.55;
}

.lk-about-articles__read {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--lk-about-accent);
  text-decoration: none;
  white-space: nowrap;
}

.lk-about-articles__read:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 719px) {
  .lk-about-articles__card {
    grid-template-rows: minmax(130px, 170px) auto;
  }

  .lk-about-articles__body {
    gap: 0.5rem;
    min-height: 112px;
    padding-inline: 0.9rem;
  }

  .lk-about-articles__title {
    font-size: 0.98rem;
  }

  .lk-about-articles__excerpt {
    font-size: 0.84rem;
  }
}

[data-theme='dark'] .lk-about-articles__card {
  background: rgba(15, 23, 42, 0.64);
  border-color: rgba(125, 211, 252, 0.18);
  --lk-about-card-shadow: 0 18px 44px rgba(0, 0, 0, 0.3);
  --lk-about-accent: #7dd3fc;
}

[data-theme='dark'] .lk-about-articles__body {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.76) 36%);
}

[data-theme='dark'] .lk-about-articles__heading {
  color: #f1f5f9;
}

[data-theme='dark'] .lk-about-articles__lead {
  color: #cbd5e1;
}

[data-theme='dark'] .lk-about-articles__excerpt {
  color: #cbd5e1;
}

[data-theme='dark'] .lk-about-articles__foot {
  border-top-color: rgba(148, 163, 184, 0.2);
}
</style>
