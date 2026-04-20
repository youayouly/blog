<script setup>
import { computed } from 'vue'
import { recommendedArticles } from '../data/aboutArticleFeed.js'

const articles = computed(() =>
  [...recommendedArticles]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4),
)
</script>

<template>
  <div class="lk-about-articles">
    <h3 class="lk-about-articles__heading">短文推荐</h3>
    <p class="lk-about-articles__lead">
      来自 <strong>Articles</strong> 的近期随笔；新文章会自动轮换到上面。
    </p>
    <ul class="lk-about-articles__list">
      <li v-for="(post, i) in articles" :key="i" class="lk-about-articles__card">
        <time class="lk-about-articles__date" :datetime="post.date">{{ post.date }}</time>
        <a class="lk-about-articles__title" :href="post.href">{{ post.title }}</a>
        <p class="lk-about-articles__excerpt">{{ post.excerpt }}</p>
        <div class="lk-about-articles__meta">
          <span v-for="(c, j) in post.categories" :key="j" class="lk-about-articles__tag">{{ c }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lk-about-articles {
  min-width: 0;
  --lk-about-card-bg: rgba(255, 255, 255, 0.78);
  --lk-about-card-border: rgba(37, 99, 235, 0.13);
  --lk-about-card-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
  --lk-about-accent: #2563eb;
  --lk-about-accent-soft: rgba(37, 99, 235, 0.11);
}

.lk-about-articles__heading {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--vp-c-text-1, #0f172a);
}

.lk-about-articles__lead {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--vp-c-text-2, #64748b);
}

.lk-about-articles__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.lk-about-articles__card {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(239, 246, 255, 0.58)),
    var(--lk-about-card-bg);
  border: 1px solid var(--lk-about-card-border);
  box-shadow: var(--lk-about-card-shadow);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.lk-about-articles__card:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.26);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
}

.lk-about-articles__date {
  display: block;
  font-size: 0.72rem;
  color: var(--vp-c-text-3, #94a3b8);
  margin-bottom: 0.35rem;
}

.lk-about-articles__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--lk-about-accent);
  text-decoration: none;
  line-height: 1.35;
}

.lk-about-articles__title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.lk-about-articles__excerpt {
  margin: 0.45rem 0 0.55rem;
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--vp-c-text-2, #475569);
}

.lk-about-articles__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.lk-about-articles__tag {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: var(--lk-about-accent-soft);
  color: var(--lk-about-accent);
  border: 1px solid rgba(37, 99, 235, 0.18);
}

[data-theme='dark'] .lk-about-articles {
  --lk-about-card-bg: rgba(15, 23, 42, 0.72);
  --lk-about-card-border: rgba(125, 211, 252, 0.18);
  --lk-about-card-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  --lk-about-accent: #7dd3fc;
  --lk-about-accent-soft: rgba(14, 165, 233, 0.14);
}

[data-theme='dark'] .lk-about-articles__card {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(8, 47, 73, 0.32)),
    var(--lk-about-card-bg);
  border-color: var(--lk-about-card-border);
}

[data-theme='dark'] .lk-about-articles__heading {
  color: #f1f5f9;
}

[data-theme='dark'] .lk-about-articles__lead {
  color: #cbd5e1;
}

[data-theme='dark'] .lk-about-articles__lead strong {
  color: #e2e8f0;
}

[data-theme='dark'] .lk-about-articles__excerpt {
  color: #94a3b8;
}
</style>
