<script setup>
import { recommendedArticles } from '../data/aboutArticleFeed.js'

const articles = recommendedArticles
</script>

<template>
  <div class="lk-about-articles">
    <h3 class="lk-about-articles__heading">短文推荐</h3>
    <p class="lk-about-articles__lead">
      来自 <strong>Articles</strong> 的随笔与杂谈；完整项目仍见 <strong>Projects</strong>。
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
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
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
  color: #4a90d9;
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
  background: rgba(74, 144, 217, 0.12);
  color: #4a90d9;
  border: 1px solid rgba(74, 144, 217, 0.22);
}

[data-theme='dark'] .lk-about-articles__card {
  background: rgba(30, 41, 59, 0.55);
  border-color: rgba(148, 163, 184, 0.2);
}

[data-theme='dark'] .lk-about-articles__title {
  color: #7eb8ea;
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

[data-theme='dark'] .lk-about-articles__tag {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  border-color: rgba(96, 165, 250, 0.28);
}
</style>
