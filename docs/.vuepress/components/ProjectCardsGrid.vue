<template>
  <section class="lk-proj-cards" aria-label="Projects list cards">
    <div class="lk-proj-cards__grid">
      <RouterLink
        v-for="item in items"
        :key="item.title"
        :to="item.to"
        class="lk-proj-card"
        :aria-label="item.title"
      >
        <header
          class="lk-proj-card__top"
          :class="{ 'lk-proj-card__top--noicon': !item.href }"
        >
          <h3 class="lk-proj-card__title">{{ item.title }}</h3>

          <a
            v-if="item.href"
            class="lk-proj-card__icon"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="item.iconLabel || 'Open external link'"
            @click.stop
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.86-.01-1.69-2.78.62-3.37-1.38-3.37-1.38-.46-1.19-1.12-1.51-1.12-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.58 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.15-4.56-5.13 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05.8-.23 1.66-.35 2.52-.35.86 0 1.72.12 2.52.35 1.9-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.77 0 3.99-2.35 4.86-4.58 5.12.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49 3.96-1.36 6.83-5.2 6.83-9.73C22 6.58 17.52 2 12 2Z"
              />
            </svg>
          </a>
        </header>

        <p class="lk-proj-card__desc">
          {{ item.summary }}
        </p>

        <footer
          v-if="item.stats || (item.tags && item.tags.length)"
          class="lk-proj-card__bottom"
        >
          <div class="lk-proj-card__stats">
            <template v-if="item.stats">
              <div class="lk-proj-card__statrow">
                <span
                  v-if="typeof item.stats.star === 'number'"
                  class="lk-proj-card__stat"
                >
                  <span class="lk-proj-card__stat-ico" aria-hidden="true">★</span>
                  {{ item.stats.star }}
                </span>
                <span
                  v-if="typeof item.stats.fork === 'number'"
                  class="lk-proj-card__stat"
                >
                  <span class="lk-proj-card__stat-ico" aria-hidden="true">🍴</span>
                  {{ item.stats.fork }}
                </span>
              </div>
            </template>

            <div v-if="item.tags && item.tags.length" class="lk-proj-card__tags">
              <span v-for="t in item.tags" :key="t" class="lk-proj-card__tag">
                {{ t }}
              </span>
            </div>
          </div>
        </footer>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const items = [
  {
    title: 'Personal Blog',
    to: '/tech/my-blog.html',
    summary:
      'VuePress 2 + vuepress-theme-hope static site: custom home, album, tech hub, and deploy story.',
  },
  {
    title: 'Xinke ICT Competition',
    to: '/tech/xinke-sai.html',
    summary:
      'National new-generation ICT contest (信科赛): 5G/embedded tracks, engineering practice and innovation.',
  },
  {
    title: 'National Intelligent Car Competition',
    to: '/tech/smartcar-nationwide.html',
    summary:
      'NXP Cup–style autonomous model cars: full-model and vision-class work in one write-up.',
  },
  {
    title: 'Electronic Design Contest',
    to: '/tech/edc.html',
    summary:
      'National Undergraduate Electronic Design Contest: analog/digital systems and timed prototyping.',
  },
  {
    title: 'LLM RAG Assistant',
    to: '/tech/ai-llm-rag.html',
    summary:
      'Retrieval-augmented LLM: chunking, embeddings, vector store, and grounded Q&A.',
  },
  {
    title: 'Edge AI Inference',
    to: '/tech/ai-edge-inference.html',
    summary:
      'On-device neural nets: quantization, TFLite/ONNX runtimes, and latency-focused benchmarks.',
  },
  {
    title: 'Vision ML Pipeline',
    to: '/tech/ai-vision-pipeline.html',
    summary:
      'Label, train, evaluate, and export for CV models and small demos.',
  },
]
</script>

<style scoped>
.lk-proj-cards {
  /* 让它在内容区里有“卡片卡片”的呼吸感 */
  padding: 0.25rem 0 1.25rem;
}

.lk-proj-cards__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 980px;
  margin: 0 auto;
}

@media (max-width: 959px) {
  .lk-proj-cards__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 719px) {
  .lk-proj-cards__grid {
    grid-template-columns: 1fr;
  }
}

.lk-proj-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(59, 43, 119, 0.08);
  border-radius: 14px;
  padding: 16px 14px 14px;
  color: #2f2b74; /* 深紫/深蓝灰优雅文字色 */
  box-shadow: 0 2px 16px rgba(45, 43, 111, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  text-decoration: none;
  display: block;
}

.lk-proj-card:hover {
  transform: translateY(-3px);
  border-color: rgba(59, 43, 119, 0.18);
  box-shadow: 0 14px 34px rgba(45, 43, 111, 0.14);
}

.lk-proj-card__top {
  position: relative;
  display: block;
  margin-bottom: 10px;
  padding-right: 24px; /* reserved for top-right icon */
}

.lk-proj-card__top--noicon {
  padding-right: 0;
}

.lk-proj-card__title {
  font-size: 15.5px;
  font-weight: 750;
  line-height: 1.25;
  margin: 0;
  letter-spacing: 0.01em;
  text-align: left;
}

.lk-proj-card__icon {
  position: absolute;
  right: 0;
  top: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(47, 43, 116, 0.78);
  text-decoration: none;
  transition: color 0.18s ease;
}

.lk-proj-card:hover .lk-proj-card__icon {
  color: rgba(47, 43, 116, 0.98);
}

.lk-proj-card__icon--disabled {
  cursor: default;
  opacity: 0.45;
}

.lk-proj-card__icon:focus-visible {
  outline: 2px solid rgba(59, 43, 119, 0.35);
  outline-offset: 2px;
}

.lk-proj-card__desc {
  margin: 0;
  color: rgba(45, 43, 111, 0.82);
  font-size: 13.5px;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; /* 限制行数，保证整齐 */
  overflow: hidden;
}

.lk-proj-card__bottom {
  margin-top: 12px;
}

.lk-proj-card__stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lk-proj-card__statrow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.lk-proj-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1;
  color: rgba(47, 43, 116, 0.82);
}

.lk-proj-card__stat-ico {
  font-size: 12px;
}

.lk-proj-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lk-proj-card__tag {
  font-size: 12px;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 999px;
  color: rgba(47, 43, 116, 0.92);
  background: rgba(47, 43, 116, 0.06);
  border: 1px solid rgba(47, 43, 116, 0.12);
}

[data-theme='dark'] .lk-proj-card {
  background: rgba(15, 23, 42, 0.62);
  border-color: rgba(148, 163, 184, 0.18);
  color: rgba(226, 232, 240, 0.92);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.18);
}

[data-theme='dark'] .lk-proj-card__desc {
  color: rgba(226, 232, 240, 0.74);
}

[data-theme='dark'] .lk-proj-card__stat {
  color: rgba(226, 232, 240, 0.78);
}

[data-theme='dark'] .lk-proj-card__tag {
  color: rgba(226, 232, 240, 0.86);
  background: rgba(226, 232, 240, 0.06);
  border-color: rgba(226, 232, 240, 0.14);
}

[data-theme='dark'] .lk-proj-card__icon {
  color: rgba(226, 232, 240, 0.72);
}

[data-theme='dark'] .lk-proj-card:hover .lk-proj-card__icon {
  color: rgba(226, 232, 240, 0.92);
}
</style>
