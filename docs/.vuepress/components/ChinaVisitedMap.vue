<script setup>
/**
 * 中国行政区图（简化拼贴）+ 已访问城市卡：
 * - 右侧：34 块省份按近似地理位置布局，已访问省份高亮浅蓝紫
 * - 左侧：每张城市卡显示当地时间（Intl）和天气（wttr.in）
 * - 互动：点城市卡 → 高亮对应省份；点省份 → 切到对应城市卡
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'

const visitedProvinces = new Set([
  'beijing',
  'zhejiang',
  'guangdong',
  'shaanxi',
  'hunan',
  'hongkong',
  'shanghai', // 新增
  'fujian',   // 新增
])

const provinces = [
  { id: 'heilongjiang', name: '黑龙江', x: 78, y: 4, w: 18, h: 9 },
  { id: 'jilin', name: '吉林', x: 75, y: 13, w: 17, h: 6.5 },
  { id: 'liaoning', name: '辽宁', x: 73, y: 19, w: 15, h: 7 },
  { id: 'innermongolia', name: '内蒙古', x: 28, y: 8, w: 47, h: 11 },
  { id: 'xinjiang', name: '新疆', x: 2, y: 12, w: 26, h: 16 },
  { id: 'gansu', name: '甘肃', x: 30, y: 22, w: 15, h: 9 },
  { id: 'qinghai', name: '青海', x: 16, y: 28, w: 19, h: 11 },
  { id: 'ningxia', name: '宁夏', x: 45, y: 24, w: 7, h: 8 },
  { id: 'shaanxi', name: '陕西', x: 49, y: 30, w: 9, h: 13 },
  { id: 'shanxi', name: '山西', x: 58, y: 26, w: 8, h: 13 },
  { id: 'beijing', name: '北京', x: 67, y: 22, w: 7.5, h: 6 },
  { id: 'tianjin', name: '天津', x: 75, y: 24, w: 7, h: 5.5 },
  { id: 'hebei', name: '河北', x: 67, y: 28, w: 11, h: 9 },
  { id: 'shandong', name: '山东', x: 67, y: 37, w: 13, h: 8 },
  { id: 'henan', name: '河南', x: 58, y: 39, w: 11, h: 9 },
  { id: 'jiangsu', name: '江苏', x: 70, y: 45, w: 11, h: 7 },
  { id: 'shanghai', name: '上海', x: 81, y: 47, w: 6, h: 5 },
  { id: 'anhui', name: '安徽', x: 64, y: 49, w: 10, h: 9 },
  { id: 'zhejiang', name: '浙江', x: 75, y: 52, w: 10, h: 8 },
  { id: 'jiangxi', name: '江西', x: 65, y: 58, w: 10, h: 9 },
  { id: 'fujian', name: '福建', x: 75, y: 60, w: 10, h: 9 },
  { id: 'taiwan', name: '台湾', x: 86, y: 64, w: 8, h: 9 },
  { id: 'hubei', name: '湖北', x: 53, y: 49, w: 12, h: 9 },
  { id: 'hunan', name: '湖南', x: 53, y: 58, w: 12, h: 9 },
  { id: 'sichuan', name: '四川', x: 32, y: 39, w: 16, h: 11 },
  { id: 'chongqing', name: '重庆', x: 48, y: 45, w: 8, h: 6 },
  { id: 'guizhou', name: '贵州', x: 41, y: 56, w: 11, h: 8 },
  { id: 'yunnan', name: '云南', x: 28, y: 56, w: 13, h: 13 },
  { id: 'tibet', name: '西藏', x: 4, y: 32, w: 26, h: 14 },
  { id: 'guangxi', name: '广西', x: 41, y: 65, w: 12, h: 9 },
  { id: 'guangdong', name: '广东', x: 53, y: 67, w: 14, h: 9 },
  { id: 'hainan', name: '海南', x: 49, y: 80, w: 9, h: 7 },
  { id: 'hongkong', name: '香港', x: 60, y: 78, w: 7.5, h: 4.8 },
  { id: 'macau', name: '澳门', x: 53, y: 78, w: 6.5, h: 4.8 },
]

/** 城市卡数据：每条对应一个已访问城市，含时区与 wttr.in 城市名 */
const cityList = [
  { id: 'beijing',   name: '北京',          province: 'beijing',   tz: 'Asia/Shanghai',  wttr: 'Beijing' },
  { id: 'shanghai',  name: '上海',          province: 'shanghai',  tz: 'Asia/Shanghai',  wttr: 'Shanghai' },
  { id: 'hangzhou',  name: '浙江 · 杭州',    province: 'zhejiang',  tz: 'Asia/Shanghai',  wttr: 'Hangzhou' },
  { id: 'wenzhou',   name: '浙江 · 温州',    province: 'zhejiang',  tz: 'Asia/Shanghai',  wttr: 'Wenzhou' },
  { id: 'taizhou',   name: '浙江 · 台州',    province: 'zhejiang',  tz: 'Asia/Shanghai',  wttr: 'Taizhou' },
  { id: 'fuzhou',    name: '福建 · 福州',    province: 'fujian',    tz: 'Asia/Shanghai',  wttr: 'Fuzhou' },
  { id: 'xian',      name: '陕西 · 西安',    province: 'shaanxi',   tz: 'Asia/Shanghai',  wttr: 'Xian' },
  { id: 'changsha',  name: '湖南 · 长沙',    province: 'hunan',     tz: 'Asia/Shanghai',  wttr: 'Changsha' },
  { id: 'guangzhou', name: '广东 · 广州',    province: 'guangdong', tz: 'Asia/Shanghai',  wttr: 'Guangzhou' },
  { id: 'shenzhen',  name: '广东 · 深圳',    province: 'guangdong', tz: 'Asia/Shanghai',  wttr: 'Shenzhen' },
  { id: 'hongkong',  name: '香港',          province: 'hongkong',  tz: 'Asia/Hong_Kong', wttr: 'HongKong' },
  { id: 'bangkok',   name: '🇹🇭 泰国 · 曼谷', province: null,        tz: 'Asia/Bangkok',   wttr: 'Bangkok' },
]

const cities = ref(
  cityList.map((c) => ({
    ...c,
    time: '',
    weather: '加载中…',
    weatherEmoji: '⛅',
  })),
)
const activeId = ref(cityList[0].id)
const activeCity = computed(() => cities.value.find((c) => c.id === activeId.value))
const activeProvince = computed(() => activeCity.value?.province ?? null)

let timer = null

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
  '☀️': '☀️', '🌞': '☀️', 'Sunny': '☀️',
  '⛅': '⛅', 'Partly': '⛅',
  '☁️': '☁️', 'Cloudy': '☁️', 'Overcast': '☁️',
  '🌧': '🌧', 'Rain': '🌧',
  '❄️': '❄️', 'Snow': '❄️',
  '🌫': '🌫', 'Fog': '🌫', 'Mist': '🌫',
}

function pickEmoji(text) {
  if (!text) return '⛅'
  for (const k of Object.keys(WEATHER_EMOJI)) {
    if (text.includes(k)) return WEATHER_EMOJI[k]
  }
  return '⛅'
}

async function fetchWeather(city) {
  try {
    const url = `https://wttr.in/${encodeURIComponent(city.wttr)}?format=%c+%C+%t&lang=zh`
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error('weather http ' + res.status)
    const text = (await res.text()).trim()
    const idx = cities.value.findIndex((c) => c.id === city.id)
    if (idx >= 0) {
      cities.value[idx].weather = text || '—'
      cities.value[idx].weatherEmoji = pickEmoji(text)
    }
  } catch {
    const idx = cities.value.findIndex((c) => c.id === city.id)
    if (idx >= 0) cities.value[idx].weather = '获取失败'
  }
}

function activate(cityId) {
  activeId.value = cityId
}

function activateProvince(provinceId) {
  if (!visitedProvinces.has(provinceId)) return
  const hit = cities.value.find((c) => c.province === provinceId)
  if (hit) activeId.value = hit.id
}

onMounted(() => {
  tickTimes()
  timer = setInterval(tickTimes, 1000)
  /* 初始一次性串行抓 weather，避免一波 12 个并发 */
  cityList.reduce(
    (p, city) => p.then(() => fetchWeather(city)).catch(() => {}),
    Promise.resolve(),
  )
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function isVisited(id) {
  return visitedProvinces.has(id)
}
</script>

<template>
  <div class="lk-cnmap">
    <div class="lk-cnmap__layout">
      <!-- 左：可点击的城市卡列表（时间 + 天气） -->
      <aside class="lk-cnmap__cards" aria-label="去过的城市">
        <button
          v-for="c in cities"
          :key="c.id"
          type="button"
          :class="['lk-cnmap__city', { 'lk-cnmap__city--active': c.id === activeId }]"
          @click="activate(c.id)"
        >
          <span class="lk-cnmap__city-head">
            <span class="lk-cnmap__city-name">{{ c.name }}</span>
            <span class="lk-cnmap__city-emoji" aria-hidden="true">{{ c.weatherEmoji }}</span>
          </span>
          <span class="lk-cnmap__city-time">{{ c.time || '--:--:--' }}</span>
          <span class="lk-cnmap__city-weather" :title="c.weather">{{ c.weather }}</span>
        </button>
      </aside>

      <!-- 右：中国省份示意图 -->
      <div class="lk-cnmap__viewport" role="img" aria-roledescription="map">
        <button
          v-for="p in provinces"
          :key="p.id"
          type="button"
          :class="[
            'lk-cnmap__prov',
            isVisited(p.id) ? 'lk-cnmap__prov--visited' : 'lk-cnmap__prov--idle',
            activeProvince === p.id ? 'lk-cnmap__prov--active' : '',
          ]"
          :style="{ left: p.x + '%', top: p.y + '%', width: p.w + '%', height: p.h + '%' }"
          :title="p.name"
          @click="activateProvince(p.id)"
        >
          <span class="lk-cnmap__prov-label">{{ p.name }}</span>
        </button>
      </div>
    </div>

    <div class="lk-cnmap__legend" aria-label="图例">
      <span class="lk-cnmap__legend-item">
        <span class="lk-cnmap__legend-swatch lk-cnmap__legend-swatch--visited" aria-hidden="true" />
        已去过
      </span>
      <span class="lk-cnmap__legend-item">
        <span class="lk-cnmap__legend-swatch lk-cnmap__legend-swatch--idle" aria-hidden="true" />
        未去过
      </span>
      <span class="lk-cnmap__legend-item lk-cnmap__legend-item--note">
        🇹🇭 海外：泰国 · 曼谷
      </span>
    </div>
  </div>
</template>

<style scoped>
.lk-cnmap {
  width: 100%;
}

.lk-cnmap__layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 0.85rem;
  align-items: stretch;
}

@media (max-width: 720px) {
  .lk-cnmap__layout {
    grid-template-columns: 1fr;
  }
}

/* ── 左：城市卡列表 ─────────────────────────────────── */
.lk-cnmap__cards {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.lk-cnmap__city {
  appearance: none;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  border-radius: 10px;
  padding: 0.45rem 0.6rem 0.55rem;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 0.15rem;
  font-size: 0.82rem;
  line-height: 1.3;
}

.lk-cnmap__city:hover {
  transform: translateY(-1px);
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.lk-cnmap__city--active {
  border-color: rgba(99, 102, 241, 0.7);
  background: linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.18);
}

[data-theme='dark'] .lk-cnmap__city {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
}

[data-theme='dark'] .lk-cnmap__city--active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.28) 0%, rgba(167, 139, 250, 0.22) 100%);
  border-color: rgba(125, 211, 252, 0.55);
}

.lk-cnmap__city-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.lk-cnmap__city-emoji {
  font-size: 1rem;
}

.lk-cnmap__city-time {
  font-family: var(--lk-font-mono, ui-monospace, monospace);
  font-size: 0.86rem;
  color: rgba(15, 23, 42, 0.78);
  letter-spacing: 0.02em;
}

[data-theme='dark'] .lk-cnmap__city-time {
  color: rgba(226, 232, 240, 0.86);
}

.lk-cnmap__city-weather {
  font-size: 0.74rem;
  color: rgba(15, 23, 42, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme='dark'] .lk-cnmap__city-weather {
  color: rgba(226, 232, 240, 0.6);
}

/* ── 右：省份示意图（参考图 1：浅蓝紫 + 描边） ─────────── */
.lk-cnmap__viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 4;
  background:
    radial-gradient(circle at 70% 60%, rgba(196, 181, 253, 0.18), transparent 60%),
    rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 14px;
  overflow: hidden;
  min-width: 0;
}

[data-theme='dark'] .lk-cnmap__viewport {
  background:
    radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.2), transparent 60%),
    rgba(15, 23, 42, 0.45);
  border-color: rgba(148, 163, 184, 0.18);
}

.lk-cnmap__prov {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #475569;
  text-align: center;
  line-height: 1.05;
  padding: 1px 3px;
  box-sizing: border-box;
  cursor: default;
  appearance: none;
  background: rgba(255, 255, 255, 0.92);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
  white-space: nowrap;
}

/* 已访问省份：图 1 同款浅蓝紫 */
.lk-cnmap__prov--visited {
  background: linear-gradient(135deg, #dbeafe 0%, #ddd6fe 100%);
  border-color: #a5b4fc;
  color: #312e81;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.28);
}

.lk-cnmap__prov--visited:hover {
  transform: translateY(-1px);
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.28);
}

.lk-cnmap__prov--active {
  background: linear-gradient(135deg, #c7d2fe 0%, #c4b5fd 100%) !important;
  border-color: #6366f1 !important;
  color: #1e1b4b !important;
  box-shadow:
    0 0 0 2px rgba(99, 102, 241, 0.32),
    0 6px 18px rgba(99, 102, 241, 0.32) !important;
  transform: translateY(-1px);
}

[data-theme='dark'] .lk-cnmap__prov {
  background: rgba(30, 41, 59, 0.7);
  border-color: rgba(148, 163, 184, 0.32);
  color: rgba(226, 232, 240, 0.78);
}

[data-theme='dark'] .lk-cnmap__prov--visited {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.32) 0%, rgba(167, 139, 250, 0.32) 100%);
  border-color: rgba(167, 139, 250, 0.6);
  color: #e0e7ff;
}

[data-theme='dark'] .lk-cnmap__prov--active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.55) 0%, rgba(167, 139, 250, 0.55) 100%) !important;
  border-color: rgba(196, 181, 253, 0.85) !important;
  color: #f5f3ff !important;
}

/* ── 图例 ───────────────────────────────────────────────── */
.lk-cnmap__legend {
  margin-top: 0.6rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.85rem;
  font-size: 0.82rem;
  color: rgba(15, 23, 42, 0.78);
}

[data-theme='dark'] .lk-cnmap__legend {
  color: rgba(226, 232, 240, 0.85);
}

.lk-cnmap__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.lk-cnmap__legend-item--note {
  margin-left: auto;
  font-weight: 600;
}

.lk-cnmap__legend-swatch {
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.55);
}

.lk-cnmap__legend-swatch--visited {
  background: linear-gradient(135deg, #dbeafe 0%, #ddd6fe 100%);
  border-color: #a5b4fc;
}

.lk-cnmap__legend-swatch--idle {
  background: rgba(255, 255, 255, 0.92);
}

[data-theme='dark'] .lk-cnmap__legend-swatch--idle {
  background: rgba(30, 41, 59, 0.7);
}

@media (max-width: 900px) {
  .lk-cnmap__prov {
    font-size: 0.55rem;
    padding: 0 1px;
  }
}

@media (max-width: 600px) {
  .lk-cnmap__prov {
    font-size: 0.5rem;
  }
}
</style>
