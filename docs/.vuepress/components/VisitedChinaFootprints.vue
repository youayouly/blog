<script setup>
/**
 * 2D 中国足迹图：台州为辐射中心；左侧城市列表展示各地时间/天气；地图支持滚轮缩放与拖拽平移。
 */
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { CHINA_MAP_BOUNDS, CHINA_SVG_PATH_D } from '../data/chinaMapOutline.generated.js'

/** 虚线辐射起点（家乡坐标） */
const HUB_ID = 'taizhou'
/** 默认详情展示城市 */
const DEFAULT_ACTIVE_ID = 'taizhou'

const cityList = [
  { id: 'beijing', name: '北京', lat: 39.9042, lng: 116.4074, tz: 'Asia/Shanghai', wttr: 'Beijing' },
  { id: 'shanghai', name: '上海', lat: 31.2304, lng: 121.4737, tz: 'Asia/Shanghai', wttr: 'Shanghai' },
  { id: 'hangzhou', name: '浙江 · 杭州', lat: 30.2741, lng: 120.1551, tz: 'Asia/Shanghai', wttr: 'Hangzhou' },
  { id: 'wenzhou', name: '浙江 · 温州', lat: 27.9938, lng: 120.699, tz: 'Asia/Shanghai', wttr: 'Wenzhou' },
  { id: 'taizhou', name: '浙江 · 台州', lat: 28.6561, lng: 121.4208, tz: 'Asia/Shanghai', wttr: 'Taizhou' },
  { id: 'fuzhou', name: '福建 · 福州', lat: 26.0745, lng: 119.2965, tz: 'Asia/Shanghai', wttr: 'Fuzhou' },
  { id: 'xian', name: '陕西 · 西安', lat: 34.3416, lng: 108.9398, tz: 'Asia/Shanghai', wttr: 'Xian' },
  { id: 'changsha', name: '湖南 · 长沙', lat: 28.2278, lng: 112.9388, tz: 'Asia/Shanghai', wttr: 'Changsha' },
  { id: 'guangzhou', name: '广东 · 广州', lat: 23.1291, lng: 113.2644, tz: 'Asia/Shanghai', wttr: 'Guangzhou' },
  { id: 'shenzhen', name: '广东 · 深圳', lat: 22.5431, lng: 114.0579, tz: 'Asia/Shanghai', wttr: 'Shenzhen' },
  { id: 'hongkong', name: '香港', lat: 22.3193, lng: 114.1694, tz: 'Asia/Hong_Kong', wttr: 'HongKong' },
  { id: 'bangkok', name: '🇹🇭 泰国 · 曼谷', lat: 13.7563, lng: 100.5018, tz: 'Asia/Bangkok', wttr: 'Bangkok' },
]

/** 与城市标点共用：由 scripts/gen-china-outline.mjs 自 GeoJSON 生成 */
function llToSvg(lng, lat) {
  const { L, R, B, T } = CHINA_MAP_BOUNDS
  const x = ((lng - L) / (R - L)) * 1000
  const y = 720 - ((lat - B) / (T - B)) * 720
  return { x, y }
}

function shortMapLabel(name) {
  const s = name.replace(/^🇹🇭\s*/, '').trim()
  const i = s.indexOf('·')
  if (i >= 0) return s.slice(i + 1).trim()
  return s
}

function curvePath(x0, y0, x1, y1, bulge = 36) {
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const cx = mx + (-dy / len) * bulge
  const cy = my + (dx / len) * bulge
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
}

const cities = ref(
  cityList.map((c) => ({
    ...c,
    time: '',
    weather: '加载中…',
    weatherEmoji: '⛅',
  })),
)

const activeId = ref(DEFAULT_ACTIVE_ID)
let timer = null

/** 地图缩放平移（视口 CSS 像素，transform-origin: 0 0） */
const zoomShellRef = ref(null)
const zoomInnerRef = ref(null)
const mapZoom = ref(1)
const mapPanX = ref(0)
const mapPanY = ref(0)
const ZOOM_MIN = 0.48
const ZOOM_MAX = 3.6

let mapPanPointerId = null
let mapPanStart = null
/** 本次按下后若发生过平移，则忽略随后的标点 click */
let mapDragSuppressClick = false

function selectCity(cityId) {
  activeId.value = cityId
}

function centerMapInShell() {
  const shell = zoomShellRef.value
  const inner = zoomInnerRef.value
  if (!shell || !inner) return
  const sw = shell.clientWidth
  const sh = shell.clientHeight
  const iw = inner.scrollWidth
  const ih = inner.scrollHeight
  const z = mapZoom.value
  mapPanX.value = (sw - iw * z) / 2
  mapPanY.value = (sh - ih * z) / 2
}

function stepZoom(factor) {
  const shell = zoomShellRef.value
  if (!shell) return
  const mx = shell.clientWidth / 2
  const my = shell.clientHeight / 2
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, mapZoom.value * factor))
  const k = next / mapZoom.value
  mapPanX.value = mx - (mx - mapPanX.value) * k
  mapPanY.value = my - (my - mapPanY.value) * k
  mapZoom.value = next
}

function resetMapView() {
  mapZoom.value = 1
  nextTick(() => centerMapInShell())
}

function onMapWheel(e) {
  const shell = zoomShellRef.value
  if (!shell) return
  const rect = shell.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const delta = -e.deltaY * 0.0012
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, mapZoom.value * (1 + delta)))
  const k = next / mapZoom.value
  mapPanX.value = mx - (mx - mapPanX.value) * k
  mapPanY.value = my - (my - mapPanY.value) * k
  mapZoom.value = next
}

function onMapPointerDown(e) {
  if (e.button !== 0) return
  mapPanPointerId = e.pointerId
  mapDragSuppressClick = false
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch (_) {}
  mapPanStart = { x: e.clientX, y: e.clientY, px: mapPanX.value, py: mapPanY.value }
}

function onMapPointerMove(e) {
  if (mapPanPointerId == null || e.pointerId !== mapPanPointerId || !mapPanStart) return
  const dx = e.clientX - mapPanStart.x
  const dy = e.clientY - mapPanStart.y
  if (Math.hypot(dx, dy) > 4) mapDragSuppressClick = true
  mapPanX.value = mapPanStart.px + dx
  mapPanY.value = mapPanStart.py + dy
}

function onMapPointerUp(e) {
  if (mapPanPointerId != null && e.pointerId === mapPanPointerId) {
    try {
      e.currentTarget.releasePointerCapture(mapPanPointerId)
    } catch (_) {}
    mapPanPointerId = null
    mapPanStart = null
  }
}

const mapCities = computed(() =>
  cities.value
    .filter((c) => c.id !== 'bangkok')
    .map((c) => {
      const { x, y } = llToSvg(c.lng, c.lat)
      return { ...c, mapX: x, mapY: y, mapLabel: shortMapLabel(c.name) }
    }),
)

const hub = computed(() => mapCities.value.find((c) => c.id === HUB_ID))

const connectionPaths = computed(() => {
  const h = hub.value
  if (!h) return []
  return mapCities.value
    .filter((c) => c.id !== HUB_ID)
    .map((c) => ({ id: c.id, d: curvePath(h.mapX, h.mapY, c.mapX, c.mapY) }))
})

function openCityFromMap(cityId) {
  if (mapDragSuppressClick) {
    mapDragSuppressClick = false
    return
  }
  selectCity(cityId)
}

function labelOffset(c) {
  if (c.id === 'shanghai') return { dx: 8, dy: -14 }
  if (c.id === 'hangzhou') return { dx: 8, dy: 4 }
  if (c.id === 'wenzhou' || c.id === 'taizhou') return { dx: -36, dy: 4 }
  if (c.id === 'fuzhou') return { dx: 8, dy: 6 }
  if (c.id === 'guangzhou' || c.id === 'shenzhen' || c.id === 'hongkong') return { dx: 8, dy: 14 }
  if (c.id === 'changsha') return { dx: -40, dy: 0 }
  if (c.id === 'xian') return { dx: -36, dy: -8 }
  return { dx: 10, dy: -12 }
}

function fmtTime(tz) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date())
  } catch {
    return '—'
  }
}

function tickTimes() {
  for (const c of cities.value) c.time = fmtTime(c.tz)
}

const WEATHER_EMOJI = {
  '☀️': '☀️',
  '🌞': '☀️',
  Sunny: '☀️',
  '⛅': '⛅',
  Partly: '⛅',
  '☁️': '☁️',
  Cloudy: '☁️',
  Overcast: '☁️',
  '🌧': '🌧',
  Rain: '🌧',
  '❄️': '❄️',
  Snow: '❄️',
  '🌫': '🌫',
  Fog: '🌫',
  Mist: '🌫',
}

function pickEmoji(text) {
  if (!text) return '⛅'
  for (const k of Object.keys(WEATHER_EMOJI)) {
    if (text.includes(k)) return WEATHER_EMOJI[k]
  }
  return '⛅'
}

function applyWeather(idx, line, emojiSource) {
  if (idx < 0) return
  cities.value[idx].weather = line
  cities.value[idx].weatherEmoji = pickEmoji(emojiSource || line)
}

async function fetchWeather(city) {
  const idx = cities.value.findIndex((c) => c.id === city.id)
  try {
    const url = `https://wttr.in/${encodeURIComponent(city.wttr)}?format=j1&lang=zh`
    const res = await fetch(url, {
      mode: 'cors',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('weather http ' + res.status)
    const raw = (await res.text()).trim()
    if (!raw || raw.startsWith('<') || raw.toLowerCase().includes('<!doctype')) {
      throw new Error('weather html body')
    }
    const data = JSON.parse(raw)
    const cur = data.current_condition?.[0]
    if (!cur) throw new Error('weather empty')
    const desc =
      cur.lang_zh?.[0]?.value || cur.weatherDesc?.[0]?.value || '—'
    const temp = cur.temp_C != null ? `${cur.temp_C}°C` : ''
    const feel = cur.FeelsLikeC != null ? `体感 ${cur.FeelsLikeC}°C` : ''
    const line = [desc, temp, feel].filter(Boolean).join(' · ')
    applyWeather(idx, line || '—', desc)
  } catch {
    try {
      const url = `https://wttr.in/${encodeURIComponent(city.wttr)}?format=%c+%C+%t&lang=zh`
      const res = await fetch(url, {
        mode: 'cors',
        headers: { Accept: 'text/plain' },
      })
      if (!res.ok) throw new Error('fallback http')
      const text = (await res.text()).trim()
      if (!text || text.startsWith('<') || text.toLowerCase().includes('<!doctype')) {
        throw new Error('weather html body')
      }
      applyWeather(idx, text, text)
    } catch {
      applyWeather(idx, '天气暂不可用', '')
    }
  }
}

onMounted(() => {
  tickTimes()
  timer = setInterval(tickTimes, 1000)
  cityList.reduce(
    (p, city) => p.then(() => fetchWeather(city)).catch(() => {}),
    Promise.resolve(),
  )
  nextTick(() => {
    centerMapInShell()
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="lk-cnfp">
    <div class="lk-cnfp__layout">
      <aside class="lk-cnfp__side" aria-label="城市列表：当地时间与天气">
        <p class="lk-cnfp__side-intro">
          点选城市查看地图高亮；时间与天气来自 wttr.in。
        </p>
        <ul class="lk-cnfp__city-list" role="list">
          <li v-for="c in cities" :key="c.id">
            <button
              type="button"
              class="lk-cnfp__city-row"
              :class="{ 'lk-cnfp__city-row--active': c.id === activeId }"
              @click="selectCity(c.id)"
            >
              <span class="lk-cnfp__city-row-head">
                <span class="lk-cnfp__city-row-name">{{ c.name }}</span>
                <span class="lk-cnfp__city-row-emoji" aria-hidden="true">{{ c.weatherEmoji }}</span>
              </span>
              <span class="lk-cnfp__city-row-time">{{ c.time || '--:--:--' }}</span>
              <span class="lk-cnfp__city-row-weather">{{ c.weather }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <div class="lk-cnfp__map-wrap">
        <header class="lk-cnfp__map-head">
          <h3 class="lk-cnfp__map-title">足迹 · 中国</h3>
          <p class="lk-cnfp__map-sub">每一个去过的地方，都是成长的坐标</p>
        </header>

        <div class="lk-cnfp__map-panel" role="img" aria-label="中国地图上的到访城市">
          <div class="lk-cnfp__zoom-tools">
            <button
              type="button"
              class="lk-cnfp__zoom-btn"
              aria-label="放大"
              @click.stop="stepZoom(1.18)"
            >
              +
            </button>
            <button
              type="button"
              class="lk-cnfp__zoom-btn"
              aria-label="缩小"
              @click.stop="stepZoom(1 / 1.18)"
            >
              −
            </button>
            <button
              type="button"
              class="lk-cnfp__zoom-btn lk-cnfp__zoom-btn--text"
              aria-label="重置缩放与位置"
              @click.stop="resetMapView"
            >
              复位
            </button>
          </div>
          <p class="lk-cnfp__zoom-hint">滚轮缩放 · 拖拽平移 · 点标点或左侧列表选城市</p>
          <div
            ref="zoomShellRef"
            class="lk-cnfp__zoom-shell"
            @wheel.prevent="onMapWheel"
            @pointerdown="onMapPointerDown"
            @pointermove="onMapPointerMove"
            @pointerup="onMapPointerUp"
            @pointerleave="onMapPointerUp"
            @pointercancel="onMapPointerUp"
          >
            <div
              ref="zoomInnerRef"
              class="lk-cnfp__zoom-inner"
              :style="{
                transform: `translate(${mapPanX}px, ${mapPanY}px) scale(${mapZoom})`,
              }"
            >
              <div class="lk-cnfp__map-scale">
                <svg
                  class="lk-cnfp__svg"
                  viewBox="0 0 1000 720"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid meet"
                >
              <defs>
                <linearGradient id="lk-cnfp-land" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#eef2ff" />
                  <stop offset="100%" stop-color="#e0e7ff" />
                </linearGradient>
                <filter id="lk-cnfp-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path :d="CHINA_SVG_PATH_D" class="lk-cnfp__china-fill" />

              <g class="lk-cnfp__routes" fill="none" stroke-linecap="round">
                <path
                  v-for="seg in connectionPaths"
                  :key="seg.id"
                  :d="seg.d"
                  class="lk-cnfp__route"
                  stroke-dasharray="4 7"
                />
              </g>

              <g
                v-for="c in mapCities"
                :key="c.id"
                class="lk-cnfp__marker-g"
                :class="{ 'lk-cnfp__marker-g--active': c.id === activeId }"
                @click="openCityFromMap(c.id)"
              >
                <g :transform="`translate(${c.mapX}, ${c.mapY})`" class="lk-cnfp__marker">
                  <circle r="7" class="lk-cnfp__ripple lk-cnfp__ripple--3" />
                  <circle r="7" class="lk-cnfp__ripple lk-cnfp__ripple--2" />
                  <circle r="7" class="lk-cnfp__ripple lk-cnfp__ripple--1" />
                  <circle :r="c.id === activeId ? 6.5 : 5.2" class="lk-cnfp__dot" />
                </g>
                <text
                  :x="c.mapX + labelOffset(c).dx"
                  :y="c.mapY + labelOffset(c).dy"
                  class="lk-cnfp__label"
                  :class="{ 'lk-cnfp__label--active': c.id === activeId }"
                >
                  {{ c.mapLabel }}
                </text>
              </g>

              <g class="lk-cnfp__inset" transform="translate(818, 548)">
                <rect x="0" y="0" width="168" height="118" rx="8" class="lk-cnfp__inset-box" />
                <text x="84" y="68" text-anchor="middle" class="lk-cnfp__inset-cap">南海诸岛</text>
              </g>
                </svg>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="lk-cnfp__overseas"
            :class="{ 'lk-cnfp__overseas--pulse': activeId === 'bangkok' }"
            @click="openCityFromMap('bangkok')"
          >
            海外：泰国 · 曼谷
          </button>
        </div>
      </div>
    </div>

    <div class="lk-cnfp__legend" aria-label="说明">
      <span class="lk-cnfp__legend-item">虚线自浙江台州向外辐射；紫色标点为到访城市</span>
      <span class="lk-cnfp__legend-item lk-cnfp__legend-item--hint">左侧列表与地图标点联动；地图可缩放拖拽浏览</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lk-cnfp {
  width: 100%;
}

.lk-cnfp__layout {
  display: grid;
  grid-template-columns: minmax(232px, 280px) minmax(0, 1fr);
  gap: 0.85rem 1rem;
  align-items: start;
}

.lk-cnfp__side {
  position: relative;
  min-height: 120px;
  max-height: min(520px, 62vh);
  padding: 0.15rem 0.25rem 0 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.lk-cnfp__side-intro {
  margin: 0 0 0.45rem;
  font-size: 0.72rem;
  line-height: 1.45;
  color: rgba(15, 23, 42, 0.48);
  letter-spacing: 0.02em;
}

[data-theme='dark'] .lk-cnfp__side-intro {
  color: rgba(226, 232, 240, 0.48);
}

.lk-cnfp__city-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-height: 0;
  scrollbar-gutter: stable;
}

.lk-cnfp__city-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.12rem;
  width: 100%;
  margin: 0;
  padding: 0.42rem 0.5rem 0.48rem;
  border-radius: 11px;
  border: 1px solid rgba(99, 102, 241, 0.14);
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  box-sizing: border-box;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.lk-cnfp__city-row:hover {
  border-color: rgba(124, 58, 237, 0.35);
  background: rgba(245, 243, 255, 0.92);
}

.lk-cnfp__city-row--active {
  border-color: rgba(124, 58, 237, 0.55);
  background: linear-gradient(145deg, #f5f3ff 0%, #ede9fe 100%);
  box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.22);
}

[data-theme='dark'] .lk-cnfp__city-row {
  background: rgba(30, 41, 59, 0.55);
  border-color: rgba(148, 163, 184, 0.2);
}

[data-theme='dark'] .lk-cnfp__city-row:hover {
  background: rgba(49, 46, 129, 0.35);
  border-color: rgba(196, 181, 253, 0.35);
}

[data-theme='dark'] .lk-cnfp__city-row--active {
  background: linear-gradient(145deg, rgba(76, 29, 149, 0.45) 0%, rgba(30, 41, 59, 0.75) 100%);
  border-color: rgba(196, 181, 253, 0.45);
}

.lk-cnfp__city-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.lk-cnfp__city-row-name {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #4c1d95;
  line-height: 1.25;
}

[data-theme='dark'] .lk-cnfp__city-row-name {
  color: #e9d5ff;
}

.lk-cnfp__city-row-emoji {
  font-size: 1.05rem;
  line-height: 1;
  flex-shrink: 0;
}

.lk-cnfp__city-row-time {
  font-family: var(--lk-font-mono, ui-monospace, monospace);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: rgba(15, 23, 42, 0.72);
}

[data-theme='dark'] .lk-cnfp__city-row-time {
  color: rgba(226, 232, 240, 0.82);
}

.lk-cnfp__city-row-weather {
  font-size: 0.7rem;
  line-height: 1.4;
  color: rgba(15, 23, 42, 0.58);
}

[data-theme='dark'] .lk-cnfp__city-row-weather {
  color: rgba(226, 232, 240, 0.62);
}

@media (max-width: 720px) {
  .lk-cnfp__layout {
    grid-template-columns: 1fr;
  }

  .lk-cnfp__side {
    min-height: 0;
    max-height: min(260px, 42vh);
    padding: 0 0 0.35rem;
    order: -1;
  }

  .lk-cnfp__map-panel {
    min-height: 300px;
  }

  .lk-cnfp__zoom-hint {
    padding-right: 0;
  }

  .lk-cnfp__zoom-tools {
    position: static;
    max-width: none;
    justify-content: flex-start;
    margin-bottom: 0.35rem;
  }
}

.lk-cnfp__map-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
}

.lk-cnfp__map-head {
  padding: 0 0.15rem;
}

.lk-cnfp__map-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #5b21b6;
  line-height: 1.25;
}

[data-theme='dark'] .lk-cnfp__map-title {
  color: #c4b5fd;
}

.lk-cnfp__map-sub {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: rgba(91, 33, 182, 0.72);
  letter-spacing: 0.02em;
}

[data-theme='dark'] .lk-cnfp__map-sub {
  color: rgba(196, 181, 253, 0.75);
}

.lk-cnfp__map-panel {
  position: relative;
  flex: 1;
  min-height: min(340px, 44vh);
  border-radius: 18px;
  padding: 0.5rem 0.55rem 2rem;
  background: linear-gradient(165deg, #ffffff 0%, #f8fafc 42%, #f1f5f9 100%);
  border: 1px solid rgba(99, 102, 241, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 12px 40px -24px rgba(91, 33, 182, 0.22);
}

[data-theme='dark'] .lk-cnfp__map-panel {
  background: linear-gradient(165deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.88) 100%);
  border-color: rgba(167, 139, 250, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 16px 48px -20px rgba(0, 0, 0, 0.45);
}

.lk-cnfp__zoom-tools {
  position: absolute;
  top: 0.4rem;
  right: 0.45rem;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.28rem;
  max-width: 52%;
}

.lk-cnfp__zoom-btn {
  appearance: none;
  margin: 0;
  min-width: 1.65rem;
  height: 1.65rem;
  padding: 0 0.35rem;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.28);
  background: rgba(255, 255, 255, 0.88);
  color: #5b21b6;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.lk-cnfp__zoom-btn--text {
  min-width: auto;
  padding: 0 0.45rem;
  font-size: 0.68rem;
  font-weight: 700;
}

.lk-cnfp__zoom-btn:hover {
  border-color: rgba(124, 58, 237, 0.45);
  background: #f5f3ff;
}

[data-theme='dark'] .lk-cnfp__zoom-btn {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(167, 139, 250, 0.35);
  color: #e9d5ff;
}

[data-theme='dark'] .lk-cnfp__zoom-btn:hover {
  background: rgba(76, 29, 149, 0.35);
}

.lk-cnfp__zoom-hint {
  margin: 0 0 0.4rem;
  padding-right: 6.5rem;
  font-size: 0.68rem;
  line-height: 1.4;
  color: rgba(91, 33, 182, 0.52);
  letter-spacing: 0.02em;
}

[data-theme='dark'] .lk-cnfp__zoom-hint {
  color: rgba(196, 181, 253, 0.55);
}

.lk-cnfp__zoom-shell {
  overflow: hidden;
  border-radius: 13px;
  min-height: min(300px, 38vh);
  max-height: min(420px, 52vh);
  touch-action: none;
  cursor: grab;
  background: rgba(248, 250, 252, 0.5);
}

[data-theme='dark'] .lk-cnfp__zoom-shell {
  background: rgba(15, 23, 42, 0.35);
}

.lk-cnfp__zoom-shell:active {
  cursor: grabbing;
}

.lk-cnfp__zoom-inner {
  transform-origin: 0 0;
  will-change: transform;
  display: inline-block;
  vertical-align: top;
}

.lk-cnfp__map-scale {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lk-cnfp__svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 380px;
}

.lk-cnfp__china-fill {
  fill: url(#lk-cnfp-land);
  stroke: rgba(99, 102, 241, 0.22);
  stroke-width: 1.2;
}

[data-theme='dark'] .lk-cnfp__china-fill {
  fill: rgba(49, 46, 129, 0.42);
  stroke: rgba(167, 139, 250, 0.35);
}

.lk-cnfp__route {
  stroke: rgba(124, 58, 237, 0.38);
  stroke-width: 1.15;
}

[data-theme='dark'] .lk-cnfp__route {
  stroke: rgba(196, 181, 253, 0.45);
}

.lk-cnfp__marker-g {
  cursor: pointer;
}

.lk-cnfp__ripple {
  fill: none;
  stroke: rgba(124, 58, 237, 0.45);
  stroke-width: 1.4;
  transform-box: fill-box;
  transform-origin: center;
  animation: lk-cnfp-ripple 2.85s ease-out infinite;
}

.lk-cnfp__ripple--2 {
  animation-delay: 0.55s;
  stroke: rgba(167, 139, 250, 0.38);
}

.lk-cnfp__ripple--3 {
  animation-delay: 1.1s;
  stroke: rgba(196, 181, 253, 0.32);
}

.lk-cnfp__marker-g--active .lk-cnfp__ripple {
  stroke: rgba(139, 92, 246, 0.85);
  stroke-width: 1.75;
}

.lk-cnfp__marker-g--active .lk-cnfp__ripple--2 {
  stroke: rgba(167, 139, 250, 0.75);
}

.lk-cnfp__marker-g--active .lk-cnfp__ripple--3 {
  stroke: rgba(221, 214, 254, 0.65);
}

.lk-cnfp__dot {
  fill: #7c3aed;
  stroke: #faf5ff;
  stroke-width: 1.6;
  filter: url(#lk-cnfp-glow);
}

.lk-cnfp__marker-g--active .lk-cnfp__dot {
  fill: #6d28d9;
  stroke: #ede9fe;
}

.lk-cnfp__label {
  font-size: 13px;
  font-weight: 600;
  fill: rgba(30, 27, 75, 0.82);
  pointer-events: none;
}

[data-theme='dark'] .lk-cnfp__label {
  fill: rgba(226, 232, 240, 0.88);
}

.lk-cnfp__label--active {
  fill: #5b21b6;
  font-weight: 800;
}

[data-theme='dark'] .lk-cnfp__label--active {
  fill: #e9d5ff;
}

.lk-cnfp__inset-box {
  fill: rgba(255, 255, 255, 0.55);
  stroke: rgba(99, 102, 241, 0.28);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

[data-theme='dark'] .lk-cnfp__inset-box {
  fill: rgba(15, 23, 42, 0.5);
  stroke: rgba(167, 139, 250, 0.35);
}

.lk-cnfp__inset-cap {
  font-size: 11px;
  fill: rgba(71, 85, 105, 0.75);
  font-weight: 600;
}

[data-theme='dark'] .lk-cnfp__inset-cap {
  fill: rgba(203, 213, 225, 0.75);
}

.lk-cnfp__overseas {
  appearance: none;
  position: absolute;
  right: 0.85rem;
  bottom: 0.55rem;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
  text-align: right;
  font-size: 0.76rem;
  font-weight: 600;
  color: rgba(91, 33, 182, 0.72);
  letter-spacing: 0.02em;
}

.lk-cnfp__overseas:hover {
  color: #6d28d9;
  text-decoration: underline;
  text-underline-offset: 3px;
}

[data-theme='dark'] .lk-cnfp__overseas {
  color: rgba(196, 181, 253, 0.8);
}

.lk-cnfp__overseas--pulse {
  color: #7c3aed;
  text-shadow: 0 0 12px rgba(167, 139, 250, 0.65);
}

[data-theme='dark'] .lk-cnfp__overseas--pulse {
  color: #e9d5ff;
}

.lk-cnfp__legend {
  margin-top: 0.65rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.85rem;
  font-size: 0.82rem;
  color: rgba(15, 23, 42, 0.78);
}

[data-theme='dark'] .lk-cnfp__legend {
  color: rgba(226, 232, 240, 0.85);
}

.lk-cnfp__legend-item--hint {
  margin-left: auto;
  font-weight: 600;
  opacity: 0.9;
}

@media (max-width: 720px) {
  .lk-cnfp__legend-item--hint {
    margin-left: 0;
  }
}

@keyframes lk-cnfp-ripple {
  0% {
    transform: scale(0.35);
    opacity: 0.88;
  }
  100% {
    transform: scale(5.2);
    opacity: 0;
  }
}
</style>
