<template>
  <section class="lk-proj-side" aria-label="按职位筛选与站点概览">
    <div class="lk-proj-side__sticky">
      <div class="lk-proj-side__shell">
        <div class="lk-proj-side__pills" role="tablist" aria-label="按职位筛选项目">
          <button
            v-for="opt in roleOptions"
            :key="opt.id"
            type="button"
            class="lk-proj-side__pill"
            :class="{ 'is-active': hub.currentRole === opt.id }"
            role="tab"
            :aria-selected="hub.currentRole === opt.id"
            @click="selectRole(opt.id)"
          >
            <span class="lk-proj-side__pill-text">{{ opt.label }}</span>
            <span class="lk-proj-side__count">{{ opt.count }}</span>
          </button>
        </div>

        <div class="lk-proj-side__divider" aria-hidden="true" />

        <div class="lk-proj-side__stats" aria-label="概览与活跃状态">
          <div class="lk-proj-side__stats-row">
            <span class="lk-proj-side__stats-emoji" aria-hidden="true">📊</span>
            <span class="lk-proj-side__stats-label">概览</span>
            <span class="lk-proj-side__stats-value">{{ projectCount }} 项目 · {{ articleCount }} 文章</span>
          </div>
          <div class="lk-proj-side__stats-row">
            <span class="lk-proj-side__stats-emoji" aria-hidden="true">🟢</span>
            <span class="lk-proj-side__stats-label">活跃</span>
            <span class="lk-proj-side__stats-value lk-proj-side__stats-value--active">{{ lastUpdateRelative }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PROJECT_ROLES, projectItems, getProjectRoleId, roleToId } from '../data/projectsCatalog.js'
import { useProjectsHub, syncHubRoleFromRoute } from '../composables/useProjectsHub.js'
import { formatRelativeTimeZh } from '../utils/relativeTimeZh.js'

/** 职位 pill：仅英文（与 URL id 一致） */
const ROLE_PILL_LABELS = {
  all: 'All',
  pm: 'PM',
  'ai-product': 'AI Product',
  frontend: 'Frontend',
  backend: 'Backend',
  embedded: 'Embedded',
  'ai-engineering': 'AI Engineer',
  ml: 'ML',
}

const articleCount = __LK_ARTICLE_COUNT__
const buildTimeIso = __LK_BUILD_TIME_ISO__
const projectCount = projectItems.length

const lastUpdateRelative = computed(() => formatRelativeTimeZh(buildTimeIso))

const hub = useProjectsHub()
const route = useRoute()
const router = useRouter()

const roleOptions = computed(() => [
  { id: 'all', label: ROLE_PILL_LABELS.all, count: projectItems.length },
  ...PROJECT_ROLES.map((role) => {
    const id = roleToId(role.label)
    return {
      id,
      label: ROLE_PILL_LABELS[id] || id,
      count: projectItems.filter((item) => getProjectRoleId(item.role) === id).length,
    }
  }),
])

function selectRole(id) {
  hub.currentRole = id
  const query = { ...route.query }
  query.role = id
  router.replace({ path: route.path, query })
}

onMounted(() => {
  syncHubRoleFromRoute(route)
  // #region agent log
  if (typeof window !== 'undefined') {
    const post = (location, message, data, hypothesisId) => {
      try {
        fetch('http://127.0.0.1:7444/ingest/8151afca-3cbb-432c-8ca6-b350f90331a3', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'f28ed7',
          },
          body: JSON.stringify({
            sessionId: 'f28ed7',
            location,
            message,
            data,
            hypothesisId,
            timestamp: Date.now(),
          }),
        }).catch(() => {})
      } catch (_) {
        /* ignore */
      }
    }
    const collectAncestors = (start) => {
      const out = []
      let el = start
      let depth = 0
      while (el && el !== document.documentElement && depth < 14) {
        const cs = getComputedStyle(el)
        const flag =
          cs.overflow !== 'visible' ||
          cs.overflowX !== 'visible' ||
          cs.overflowY !== 'visible' ||
          (cs.transform && cs.transform !== 'none') ||
          (cs.filter && cs.filter !== 'none') ||
          (cs.contain && cs.contain !== 'none') ||
          (cs.willChange && cs.willChange !== 'auto')
        if (flag) {
          out.push({
            tag: el.tagName,
            cls: (el.className && String(el.className).slice(0, 100)) || '',
            position: cs.position,
            ovf: cs.overflow,
            ovfY: cs.overflowY,
            tr: cs.transform,
            fl: cs.filter,
            ctn: cs.contain,
            wc: cs.willChange,
          })
        }
        el = el.parentElement
        depth += 1
      }
      return out
    }
    const snapshot = (runId) => {
      const card = document.querySelector('.lk-proj-side__sticky')
      const shell = document.querySelector('.lk-proj-side__shell')
      const section = document.querySelector('section.lk-proj-side')
      const portfolio = document.querySelector('.lk-proj-hub-layout__portfolio')
      const ribbon = document.querySelector('.lk-proj-hub-layout__ribbon')
      const layout = document.querySelector('.lk-proj-hub-layout')
      const main = document.querySelector('.lk-proj-hub-layout__main')
      const sectionRect = section ? section.getBoundingClientRect() : null
      const sectionCS = section ? getComputedStyle(section) : null
      const cardCS = card ? getComputedStyle(card) : null
      const portCS = portfolio ? getComputedStyle(portfolio) : null
      const layoutCS = layout ? getComputedStyle(layout) : null
      const cardRect = card ? card.getBoundingClientRect() : null
      const shellRect = shell ? shell.getBoundingClientRect() : null
      const portRect = portfolio ? portfolio.getBoundingClientRect() : null
      const ribRect = ribbon ? ribbon.getBoundingClientRect() : null
      const mainRect = main ? main.getBoundingClientRect() : null
      post(
        'ProjectsSidebarFilters.vue:snapshot',
        'sticky-snapshot',
        {
          runId,
          scrollY: window.scrollY,
          viewportH: window.innerHeight,
          navbarH:
            getComputedStyle(document.documentElement).getPropertyValue('--navbar-height') || '',
          card: card
            ? {
                position: cardCS.position,
                top: cardCS.top,
                z: cardCS.zIndex,
                rectTop: cardRect.top,
                rectBottom: cardRect.bottom,
                rectH: cardRect.height,
                shellH: shellRect ? shellRect.height : null,
              }
            : null,
          portfolio: portfolio
            ? {
                position: portCS.position,
                rectTop: portRect.top,
                rectBottom: portRect.bottom,
                rectH: portRect.height,
              }
            : null,
          section: section
            ? {
                display: sectionCS.display,
                flex: sectionCS.flex,
                rectTop: sectionRect.top,
                rectBottom: sectionRect.bottom,
                rectH: sectionRect.height,
              }
            : null,
          ribbon: ribbon
            ? { rectTop: ribRect.top, rectBottom: ribRect.bottom, rectH: ribRect.height }
            : null,
          mainRect: mainRect ? { top: mainRect.top, bottom: mainRect.bottom, h: mainRect.height } : null,
          layoutGrid: layoutCS ? { alignItems: layoutCS.alignItems, gridTemplateColumns: layoutCS.gridTemplateColumns } : null,
          ancestorsBreakingSticky: collectAncestors(card),
        },
        'H1+H2+H3+H4+H5',
      )
    }
    requestAnimationFrame(() => snapshot('mount'))
    let lastLog = 0
    let scrollCount = 0
    const onScroll = () => {
      const now = Date.now()
      if (now - lastLog < 200) return
      lastLog = now
      scrollCount += 1
      if (scrollCount > 12) return
      snapshot('scroll-' + scrollCount)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
  }
  // #endregion
})

watch(
  () => route.query.role,
  () => {
    syncHubRoleFromRoute(route)
  },
)
</script>

<style scoped>
.lk-proj-side {
  margin-top: 0.35rem;
  width: 100%;
  /* 让 section 在 portfolio (display: flex; column) 里拉伸到 row 高度，
     这样内层 .lk-proj-side__sticky 才有足够「可吸空间」。 */
  flex: 1 1 auto;
  align-self: stretch;
  min-height: 0;
}

/* 整列与 ribbon 一起吸顶，自然高度，不做内部滚动也不限制 max-height —— 卡片不再被切割 */
.lk-proj-side__sticky {
  position: sticky;
  top: calc(
    var(--navbar-height, 3.5rem) + var(--lk-proj-ribbon-h, 3.6rem) +
      var(--lk-proj-sticky-gap, 0.5rem) + 0.5rem
  );
  align-self: flex-start;
  z-index: 4;
  width: 100%;
}

.lk-proj-side__shell {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
  padding: 0.7rem 0.65rem 0.75rem;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.52);
  box-shadow: 0 12px 40px rgba(2, 6, 23, 0.35);
  backdrop-filter: blur(14px) saturate(1.25);
  -webkit-backdrop-filter: blur(14px) saturate(1.25);
}

[data-theme='light'] .lk-proj-side__shell {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(15, 23, 42, 0.1);
  box-shadow: 0 10px 36px rgba(15, 23, 42, 0.1);
}

.lk-proj-side__pills {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.32rem;
}

.lk-proj-side__divider {
  height: 1px;
  margin: 0.45rem 0 0.4rem;
  border: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(148, 163, 184, 0.45) 10%,
    rgba(148, 163, 184, 0.45) 90%,
    transparent
  );
}

[data-theme='light'] .lk-proj-side__divider {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(15, 23, 42, 0.12) 10%,
    rgba(15, 23, 42, 0.12) 90%,
    transparent
  );
}

/* stats：两行紧凑布局，确保连同 pills 一起在常见视口里完整显示 */
.lk-proj-side__stats {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0 0.1rem;
}

.lk-proj-side__stats-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  line-height: 1.35;
  color: rgba(226, 232, 240, 0.92);
}

[data-theme='light'] .lk-proj-side__stats-row {
  color: #475569;
}

.lk-proj-side__stats-emoji {
  flex-shrink: 0;
  font-size: 0.78rem;
  line-height: 1;
}

.lk-proj-side__stats-label {
  flex-shrink: 0;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: rgba(226, 232, 240, 0.96);
}

[data-theme='light'] .lk-proj-side__stats-label {
  color: #0f766e;
}

.lk-proj-side__stats-value {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-family: var(--lk-font-mono, ui-monospace, monospace);
}

.lk-proj-side__stats-value--active {
  color: rgba(167, 243, 208, 0.95);
}

[data-theme='light'] .lk-proj-side__stats-value--active {
  color: #047857;
}

.lk-proj-side__pill {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.32rem 0.5rem;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(30, 41, 59, 0.45);
  color: rgba(248, 250, 252, 0.92);
  font-size: 0.76rem;
  font-weight: 600;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.lk-proj-side__pill-text {
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}

[data-theme='light'] .lk-proj-side__pill {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(15, 23, 42, 0.08);
  color: #334155;
}

.lk-proj-side__pill:hover {
  border-color: rgba(125, 211, 252, 0.45);
  background: rgba(30, 41, 59, 0.62);
}

[data-theme='light'] .lk-proj-side__pill:hover {
  background: #fff;
  border-color: rgba(59, 130, 246, 0.25);
}

.lk-proj-side__pill.is-active {
  background: #f3b03e;
  border-color: rgba(180, 120, 40, 0.55);
  color: #0f172a;
}

.lk-proj-side__pill.is-active:hover {
  background: #f5bd52;
  color: #0f172a;
}

.lk-proj-side__count {
  flex-shrink: 0;
  min-width: 1.4rem;
  text-align: right;
  font-family: var(--lk-font-mono, ui-monospace, monospace);
  font-size: 0.7rem;
  font-weight: 700;
  opacity: 0.85;
  line-height: 1.3;
}
</style>
