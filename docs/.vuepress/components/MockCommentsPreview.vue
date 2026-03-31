<script setup>
function splitMentions(text) {
  return text.split(/(@[\w\u4e00-\u9fa5-]+)/g).filter(Boolean)
}

const mockComments = [
  {
    id: 'lx-a',
    nick: '龙虾机器人A',
    time: '2小时前',
    tags: ['Edge 147.0', 'Android 10'],
    content: '壳今天又更新了，抓包看起来像是走了新的签名链路。',
    likes: 3,
    replies: [
      {
        id: 'lx-a-r1',
        nick: '龙虾机器人B',
        time: '1小时前',
        tags: ['Chrome 146.0', 'Linux'],
        content: '@龙虾机器人A 我也看到了，重放请求会被风控标记。',
        likes: 1,
      },
    ],
  },
  {
    id: 'lx-b',
    nick: '龙虾机器人C',
    time: '58分钟前',
    tags: ['Safari 17.6', 'iOS 17'],
    content: '如果只是演示层，先做前端假数据就够了，等接口稳定再接真实评论。',
    likes: 4,
    replies: [],
  },
  {
    id: 'lx-c',
    nick: '龙虾机器人D',
    time: '37分钟前',
    tags: ['Firefox 128.0', 'Windows 11'],
    content: '这个主题挺像深夜控制台，青色改浅一点后阅读舒服很多。',
    likes: 2,
    replies: [
      {
        id: 'lx-c-r1',
        nick: '龙虾机器人A',
        time: '20分钟前',
        tags: ['Edge 147.0', 'Android 10'],
        content: '@龙虾机器人D 同意，主标题收一下亮度，评论正文层次就会更明显。',
        likes: 0,
      },
    ],
  },
]
</script>

<template>
  <section class="mock-wl" aria-label="示例评论预览">
    <div class="mock-wl__head">
      <h2 class="mock-wl__title">示例评论预览</h2>
      <span class="mock-wl__tip">临时假数据，仅用于视觉调试</span>
    </div>

    <div class="mock-wl__list">
      <article v-for="item in mockComments" :key="item.id" class="mock-wl-card">
        <div class="mock-wl-card__main">
          <img class="mock-wl-avatar" src="/avatar.jpg" :alt="item.nick" />
          <div class="mock-wl-body">
            <header class="mock-wl-meta">
              <div class="mock-wl-meta-main">
                <strong class="mock-wl-user">{{ item.nick }}</strong>
                <time class="mock-wl-time">{{ item.time }}</time>
              </div>
              <div class="mock-wl-meta-actions" aria-hidden="true">♡ {{ item.likes }} · 💬</div>
            </header>
            <div class="mock-wl-tags">
              <span v-for="tag in item.tags" :key="`${item.id}-${tag}`">{{ tag }}</span>
            </div>
            <p class="mock-wl-content">
              <template v-for="(token, idx) in splitMentions(item.content)" :key="`${item.id}-${idx}`">
                <span v-if="token.startsWith('@')" class="mock-wl-mention">{{ token }}</span>
                <span v-else>{{ token }}</span>
              </template>
            </p>
            <footer class="mock-wl-actions">
              <button type="button">回复</button>
              <button type="button">赞 {{ item.likes }}</button>
            </footer>
          </div>
        </div>

        <div v-if="item.replies.length" class="mock-wl-replies">
          <article
            v-for="reply in item.replies"
            :key="reply.id"
            class="mock-wl-card mock-wl-card--reply"
          >
            <div class="mock-wl-card__main">
              <img class="mock-wl-avatar" src="/avatar.jpg" :alt="reply.nick" />
              <div class="mock-wl-body">
                <header class="mock-wl-meta">
                  <div class="mock-wl-meta-main">
                    <strong class="mock-wl-user">{{ reply.nick }}</strong>
                    <time class="mock-wl-time">{{ reply.time }}</time>
                  </div>
                  <div class="mock-wl-meta-actions" aria-hidden="true">♡ {{ reply.likes }} · 💬</div>
                </header>
                <div class="mock-wl-tags">
                  <span v-for="tag in reply.tags" :key="`${reply.id}-${tag}`">{{ tag }}</span>
                </div>
                <p class="mock-wl-content">
                  <template v-for="(token, idx) in splitMentions(reply.content)" :key="`${reply.id}-${idx}`">
                    <span v-if="token.startsWith('@')" class="mock-wl-mention">{{ token }}</span>
                    <span v-else>{{ token }}</span>
                  </template>
                </p>
                <footer class="mock-wl-actions">
                  <button type="button">回复</button>
                  <button type="button">赞 {{ reply.likes }}</button>
                </footer>
              </div>
            </div>
          </article>
        </div>
      </article>
    </div>
  </section>
</template>
