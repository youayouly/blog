<script setup>
/**
 * 2D 世界足迹图（中国省份描边）：台州为辐射中心；左侧城市列表展示各地时间/天气；
 * 地图支持滚轮缩放与拖拽平移；列表点击会自动放大并把该城市移到画面中心。
 */
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  WORLD_MAP_BOUNDS,
  WORLD_VIEWBOX,
  WORLD_SVG_PATH_D,
  CHINA_PROVINCES_PATH_D,
} from '../data/worldMapOutline.generated.js'

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
  { id: 'xiamen', name: '福建 · 厦门', lat: 24.4798, lng: 118.0894, tz: 'Asia/Shanghai', wttr: 'Xiamen' },
  { id: 'zhangzhou', name: '福建 · 漳州', lat: 24.5108, lng: 117.647, tz: 'Asia/Shanghai', wttr: 'Zhangzhou' },
  { id: 'xian', name: '陕西 · 西安', lat: 34.3416, lng: 108.9398, tz: 'Asia/Shanghai', wttr: 'Xian' },
  { id: 'changsha', name: '湖南 · 长沙', lat: 28.2278, lng: 112.9388, tz: 'Asia/Shanghai', wttr: 'Changsha' },
  { id: 'guangzhou', name: '广东 · 广州', lat: 23.1291, lng: 113.2644, tz: 'Asia/Shanghai', wttr: 'Guangzhou' },
  { id: 'shenzhen', name: '广东 · 深圳', lat: 22.5431, lng: 114.0579, tz: 'Asia/Shanghai', wttr: 'Shenzhen' },
  { id: 'hongkong', name: '香港', lat: 22.3193, lng: 114.1694, tz: 'Asia/Hong_Kong', wttr: 'HongKong' },
  { id: 'bangkok', name: '🇹🇭 泰国 · 曼谷', lat: 13.7563, lng: 100.5018, tz: 'Asia/Bangkok', wttr: 'Bangkok' },
]

/** 与城市标点共用：plate carrée 投影到 WORLD_VIEWBOX */
function llToSvg(lng, lat) {
  const { L, R, B, T } = WORLD_MAP_BOUNDS
  const x = ((lng - L) / (R - L)) * WORLD_VIEWBOX.w
  const y = WORLD_VIEWBOX.h - ((lat - B) / (T - B)) * WORLD_VIEWBOX.h
  return { x, y }
}

function shortMapLabel(name) {
  const s = name.replace(/^🇹🇭\s*/, '').trim()
  const i = s.indexOf('·')
  if (i >= 0) return s.slice(i + 1).trim()
  return s
}

function curvePath(x0, y0, x1, y1, bulge = 8) {
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
const ZOOM_MIN = 1
const ZOOM_MAX = 22
/** 左侧列表点击后聚焦时使用的目标缩放（世界视图下覆盖城市附近 ~40°×16°） */
const FOCUS_ZOOM = 9

let mapPanPointerId = null
let mapPanStart = null
/** 本次按下后若发生过平移，则忽略随后的标点 click */
let mapDragSuppressClick = false

/** 仅在「聚焦城市 / 复位」时短暂开启的 transform 过渡 */
const mapTransition = ref(false)
let mapTransitionTimer = null

function enableMapTransition(durationMs = 420) {
  mapTransition.value = true
  if (mapTransitionTimer) clearTimeout(mapTransitionTimer)
  mapTransitionTimer = setTimeout(() => {
    mapTransition.value = false
  }, durationMs)
}

function selectCity(cityId) {
  activeId.value = cityId
}

function getShellSize() {
  const shell = zoomShellRef.value
  if (!shell) return null
  const sw = shell.clientWidth
  const sh = shell.clientHeight
  if (!sw || !sh) return null
  return { sw, sh }
}

/**
 * 计算 inner 内超宽 SVG 的 slice 几何。
 * inner box = 3*sw × sh，SVG viewBox = 3*W × H，preserveAspectRatio="xMidYMid slice"。
 * 返回当前 zoom 下「一份地图」对应的 shell 像素宽度（period）以及投影 scale / offset。
 */
function computeMapMetrics() {
  const sz = getShellSize()
  if (!sz) return null
  const innerW = sz.sw * 3
  const innerH = sz.sh
  const svgW = WORLD_VIEWBOX.w * 3
  const svgH = WORLD_VIEWBOX.h
  const innerRatio = innerW / innerH
  const svgRatio = svgW / svgH
  // slice = "覆盖 / cover": scale 取 max，铺满 inner，超出方向被裁
  const scale = innerRatio >= svgRatio ? innerW / svgW : innerH / svgH
  const drawnW = svgW * scale
  const drawnH = svgH * scale
  const offsetX = (innerW - drawnW) / 2
  const offsetY = (innerH - drawnH) / 2
  return { sw: sz.sw, sh: sz.sh, innerW, innerH, scale, drawnW, drawnH, offsetX, offsetY }
}

/**
 * 把中间地图的 SVG 局部坐标 (svgX∈[0,W], svgY∈[0,H]) 投影到 inner 的物理像素。
 * 因为中间地图被 transform translate(W 0) 放置在超宽 viewBox 的 [W, 2W] 区段，
 * 所以全局 viewBox x = W + svgX。
 */
function svgToInnerPx(svgX, svgY) {
  const m = computeMapMetrics()
  if (!m) return null
  const px = (WORLD_VIEWBOX.w + svgX) * m.scale + m.offsetX
  const py = svgY * m.scale + m.offsetY
  return { px, py }
}

/**
 * 横向 wrap：让 panX 始终落在「中间地图覆盖 shell 中心」的 ±半周期范围。
 * period = 一份地图在 shell 中的像素宽度 = W * slice_scale * zoom。
 * 因 SVG 内部 3 份地图坐标连续，相邻 ±period 等价于经度 ±360°，视觉无缝。
 */
function wrapPanX() {
  const m = computeMapMetrics()
  if (!m) return
  const period = WORLD_VIEWBOX.w * m.scale * mapZoom.value
  if (!period) return
  // 中间地图视觉中心（viewBox x = 1.5W）对应的 panX
  const centerInnerPx = 1.5 * WORLD_VIEWBOX.w * m.scale + m.offsetX
  const centerPanX = m.sw / 2 - centerInnerPx * mapZoom.value
  while (mapPanX.value > centerPanX + period * 0.5) mapPanX.value -= period
  while (mapPanX.value < centerPanX - period * 0.5) mapPanX.value += period
}

/** 防止纵向露白：纵向不循环，只允许 panY 落在能让 inner 继续覆盖 shell 上下边界的范围 */
function clampPanY() {
  const sz = getShellSize()
  if (!sz) return
  const scaledH = sz.sh * mapZoom.value
  if (scaledH <= sz.sh) {
    mapPanY.value = (sz.sh - scaledH) / 2
  } else {
    mapPanY.value = Math.min(0, Math.max(sz.sh - scaledH, mapPanY.value))
  }
}

/** 把 (svgX, svgY) 平移到 shell 中心并按指定 zoom 放大 */
function focusToSvgPoint(svgX, svgY, zoom) {
  const m = computeMapMetrics()
  const pt = svgToInnerPx(svgX, svgY)
  if (!m || !pt) return
  enableMapTransition()
  mapZoom.value = zoom
  mapPanX.value = m.sw / 2 - pt.px * zoom
  mapPanY.value = m.sh / 2 - pt.py * zoom
  wrapPanX()
  clampPanY()
}

function focusCityOnMap(cityId) {
  const city = mapCities.value.find((c) => c.id === cityId)
  if (!city) return
  focusToSvgPoint(city.mapX, city.mapY, FOCUS_ZOOM)
}

function selectCityFromList(cityId) {
  selectCity(cityId)
  nextTick(() => focusCityOnMap(cityId))
}

/** 初始视图：把东亚-东南亚区域居中（中国 + 曼谷的"重心"附近） */
function focusInitialAsia() {
  const { x, y } = llToSvg(112, 28)
  focusToSvgPoint(x, y, 3.6)
}

function centerMapInShell() {
  const m = computeMapMetrics()
  if (!m) return
  // 默认让中间地图视觉中心 (viewBox x=1.5W) 落在 shell 中央
  const centerInnerPx = 1.5 * WORLD_VIEWBOX.w * m.scale + m.offsetX
  mapPanX.value = m.sw / 2 - centerInnerPx * mapZoom.value
  mapPanY.value = 0
  wrapPanX()
  clampPanY()
}

function stepZoom(factor) {
  const sz = getShellSize()
  if (!sz) return
  const mx = sz.sw / 2
  const my = sz.sh / 2
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, mapZoom.value * factor))
  const k = next / mapZoom.value
  mapPanX.value = mx - (mx - mapPanX.value) * k
  mapPanY.value = my - (my - mapPanY.value) * k
  mapZoom.value = next
  wrapPanX()
  clampPanY()
}

function resetMapView() {
  // 「复位」= 回到默认聚焦中国（与首次进入页面一致），而非缩到全球
  nextTick(() => focusInitialAsia())
}

function onMapWheel(e) {
  const shell = zoomShellRef.value
  if (!shell) return
  mapTransition.value = false
  const rect = shell.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const delta = -e.deltaY * 0.0012
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, mapZoom.value * (1 + delta)))
  const k = next / mapZoom.value
  mapPanX.value = mx - (mx - mapPanX.value) * k
  mapPanY.value = my - (my - mapPanY.value) * k
  mapZoom.value = next
  wrapPanX()
  clampPanY()
}

function onMapPointerDown(e) {
  if (e.button !== 0) return
  mapTransition.value = false
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
  wrapPanX()
  clampPanY()
  // 基线每帧推进到当前点 + 当前(已 wrap)panX，下一帧仅按单帧增量积分，避免 wrap 累积偏移
  mapPanStart.x = e.clientX
  mapPanStart.y = e.clientY
  mapPanStart.px = mapPanX.value
  mapPanStart.py = mapPanY.value
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
  cities.value.map((c) => {
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
  if (c.id === 'shanghai') return { dx: 6, dy: -10 }
  if (c.id === 'hangzhou') return { dx: 6, dy: 4 }
  if (c.id === 'wenzhou' || c.id === 'taizhou') return { dx: -28, dy: 4 }
  if (c.id === 'xiamen') return { dx: 6, dy: 5 }
  if (c.id === 'zhangzhou') return { dx: -34, dy: 5 }
  if (c.id === 'guangzhou') return { dx: -34, dy: -2 }
  if (c.id === 'shenzhen') return { dx: 6, dy: -10 }
  if (c.id === 'hongkong') return { dx: 6, dy: 12 }
  if (c.id === 'changsha') return { dx: -30, dy: 0 }
  if (c.id === 'xian') return { dx: -28, dy: -6 }
  if (c.id === 'bangkok') return { dx: -32, dy: 12 }
  return { dx: 8, dy: -10 }
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
    focusInitialAsia()
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (mapTransitionTimer) clearTimeout(mapTransitionTimer)
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
              @click="selectCityFromList(c.id)"
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
              :class="{ 'lk-cnfp__zoom-inner--focused': mapZoom > 1.4 }"
              :style="{
                transform: `translate(${mapPanX}px, ${mapPanY}px) scale(${mapZoom})`,
                transition: mapTransition
                  ? 'transform 0.36s cubic-bezier(0.22, 0.61, 0.36, 1)'
                  : 'none',
              }"
            >
              <!-- 单个超宽 SVG：viewBox 横向 3× (= 3 份地图在 SVG 内部坐标系连续排列)，
                   slice 裁切只发生在 SVG 最外侧两端虚空，相邻地图无接缝 -->
              <svg
                class="lk-cnfp__svg"
                :viewBox="`0 0 ${WORLD_VIEWBOX.w * 3} ${WORLD_VIEWBOX.h}`"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
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

                <!-- 海洋背景：占满整个超宽 viewBox -->
                <rect
                  class="lk-cnfp__ocean"
                  x="0"
                  y="0"
                  :width="WORLD_VIEWBOX.w * 3"
                  :height="WORLD_VIEWBOX.h"
                />

                <!-- 3 份大陆 + 中国省份，左/中/右一字横排在同一 SVG 坐标系内 -->
                <g
                  v-for="i in 3"
                  :key="`tile-${i}`"
                  :transform="`translate(${(i - 1) * WORLD_VIEWBOX.w} 0)`"
                >
                  <path :d="WORLD_SVG_PATH_D" class="lk-cnfp__world-fill" />
                  <path :d="CHINA_PROVINCES_PATH_D" class="lk-cnfp__provinces" />
                </g>

                <!-- 辐射线 + 城市标记：只画在中间地图（viewBox x ∈ [W, 2W]） -->
                <g :transform="`translate(${WORLD_VIEWBOX.w} 0)`">
                  <g class="lk-cnfp__routes" fill="none" stroke-linecap="round">
                    <path
                      v-for="seg in connectionPaths"
                      :key="seg.id"
                      :d="seg.d"
                      class="lk-cnfp__route"
                      stroke-dasharray="3 5"
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
                      <circle r="1.4" class="lk-cnfp__ripple lk-cnfp__ripple--3" />
                      <circle r="1.4" class="lk-cnfp__ripple lk-cnfp__ripple--2" />
                      <circle r="1.4" class="lk-cnfp__ripple lk-cnfp__ripple--1" />
                      <circle :r="c.id === activeId ? 1.4 : 1.0" class="lk-cnfp__dot" />
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
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="lk-cnfp__legend" aria-label="说明">
      <span class="lk-cnfp__legend-item">虚线自浙江台州向外辐射；青色标点为到访城市，选中后变橙色</span>
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
  /* 关键：左右两栏拉伸到同一行高，由右侧 map-wrap 的 flex 链条决定 */
  align-items: stretch;
}

.lk-cnfp__side {
  position: relative;
  min-height: 120px;
  /* 抬高 max-height 上限以容纳右侧地图自然高度；
     列表内部 flex:1 + overflow-y:auto 仍负责长列表滚动 */
  max-height: clamp(440px, 64vh, 620px);
  padding: 0.15rem 0.25rem 0 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
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
  /* 改为 flex 列：让 zoom-shell 通过 flex:1 撑满 map-wrap 行高，
     从而和左侧 sidebar 底部对齐 */
  display: flex;
  flex-direction: column;
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
  position: relative;
  overflow: hidden;
  border-radius: 13px;
  /* 由原固定 height 改为 flex 拉伸 + 最小高度，让地图与左侧城市列底部对齐 */
  flex: 1 1 auto;
  height: auto;
  min-height: clamp(340px, 50vh, 420px);
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

// inner 横向 3× shell 宽：内含 1 个超宽 SVG，3 份地图通过 viewBox 内 transform 排列
// panX wrap 实现经度循环（"3D" 横向滚动），相邻地图视觉无缝
.lk-cnfp__zoom-inner {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 300%;
  transform-origin: 0 0;
  will-change: transform;
}

.lk-cnfp__svg {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.lk-cnfp__ocean {
  fill: rgba(224, 231, 255, 0.45);
}

[data-theme='dark'] .lk-cnfp__ocean {
  fill: rgba(15, 23, 42, 0.55);
}

.lk-cnfp__world-fill {
  fill: url(#lk-cnfp-land);
  stroke: rgba(99, 102, 241, 0.32);
  stroke-width: 0.45;
  fill-rule: evenodd;
}

[data-theme='dark'] .lk-cnfp__world-fill {
  fill: rgba(49, 46, 129, 0.62);
  stroke: rgba(167, 139, 250, 0.4);
}

.lk-cnfp__provinces {
  fill: none;
  stroke: rgba(124, 58, 237, 0.42);
  stroke-width: 0.32;
  stroke-linejoin: round;
  pointer-events: none;
}

[data-theme='dark'] .lk-cnfp__provinces {
  stroke: rgba(196, 181, 253, 0.5);
}

.lk-cnfp__route {
  stroke: rgba(124, 58, 237, 0.55);
  stroke-width: 0.55;
}

[data-theme='dark'] .lk-cnfp__route {
  stroke: rgba(196, 181, 253, 0.6);
}

.lk-cnfp__marker-g {
  cursor: pointer;
}

.lk-cnfp__ripple {
  fill: none;
  stroke: rgba(14, 165, 233, 0.55);
  stroke-width: 0.25;
  transform-box: fill-box;
  transform-origin: center;
  animation: lk-cnfp-ripple 2.85s ease-out infinite;
}

.lk-cnfp__ripple--2 {
  animation-delay: 0.55s;
  stroke: rgba(56, 189, 248, 0.45);
}

.lk-cnfp__ripple--3 {
  animation-delay: 1.1s;
  stroke: rgba(125, 211, 252, 0.38);
}

.lk-cnfp__marker-g--active .lk-cnfp__ripple {
  stroke: rgba(249, 115, 22, 0.92);
  stroke-width: 0.32;
}

.lk-cnfp__marker-g--active .lk-cnfp__ripple--2 {
  stroke: rgba(251, 146, 60, 0.8);
}

.lk-cnfp__marker-g--active .lk-cnfp__ripple--3 {
  stroke: rgba(254, 215, 170, 0.7);
}

.lk-cnfp__dot {
  fill: #0284c7;
  stroke: #f0f9ff;
  stroke-width: 0.32;
  filter: url(#lk-cnfp-glow);
  transition: fill 0.25s ease, stroke 0.25s ease;
}

.lk-cnfp__marker-g--active .lk-cnfp__dot {
  fill: #ea580c;
  stroke: #fff7ed;
  stroke-width: 0.4;
}

.lk-cnfp__label {
  font-size: 5px;
  font-weight: 600;
  fill: rgba(30, 27, 75, 0.82);
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 0.9px;
  stroke-linejoin: round;
  pointer-events: none;
  transition: fill 0.25s ease, opacity 0.25s ease;
}

[data-theme='dark'] .lk-cnfp__label {
  fill: rgba(226, 232, 240, 0.92);
  stroke: rgba(15, 23, 42, 0.85);
}

.lk-cnfp__label--active {
  fill: #c2410c;
  font-weight: 800;
  font-size: 6px;
  stroke: rgba(255, 255, 255, 0.95);
  stroke-width: 1.1px;
}

[data-theme='dark'] .lk-cnfp__label--active {
  fill: #fdba74;
  stroke: rgba(15, 23, 42, 0.92);
}

/* 聚焦放大状态下，隐藏非选中标签彻底避免重叠；非选中点位保留半透明以便定位 */
.lk-cnfp__zoom-inner--focused .lk-cnfp__label {
  opacity: 0;
}

.lk-cnfp__zoom-inner--focused .lk-cnfp__label--active {
  opacity: 1;
}

.lk-cnfp__zoom-inner--focused .lk-cnfp__marker-g:not(.lk-cnfp__marker-g--active) .lk-cnfp__dot {
  opacity: 0.55;
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
