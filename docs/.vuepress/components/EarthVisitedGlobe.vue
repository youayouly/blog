<script setup>
/**
 * 3D 地球（three.js）+ 左侧城市卡（时间 + wttr.in 天气）
 * - 标点：到访城市经纬度
 * - 交互：拖拽旋转、滚轮缩放、点标点或左侧卡片互相同步
 *
 * 使用静态 import（勿用 import('three')）：Vite 预构建缓存 URL 在 dev 下易出现 504 Outdated Optimize Dep。
 */
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

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

const cities = ref(
  cityList.map((c) => ({
    ...c,
    time: '',
    weather: '加载中…',
    weatherEmoji: '⛅',
  })),
)
const activeId = ref(cityList[0].id)

const containerRef = ref(null)
/** 首帧 WebGL 完成前显示占位，避免误以为「空白」 */
const globeReady = ref(false)
const globeError = ref(false)

let timer = null
let disposeGlobe = () => {}

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

/** wttr.in：优先 JSON（避免返回整页 HTML 污染 UI） */
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

function activate(cityId) {
  activeId.value = cityId
}

onMounted(() => {
  tickTimes()
  timer = setInterval(tickTimes, 1000)
  cityList.reduce(
    (p, city) => p.then(() => fetchWeather(city)).catch(() => {}),
    Promise.resolve(),
  )

  void nextTick().then(() => {
    requestAnimationFrame(() => {
      disposeGlobe = mountGlobe()
    })
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  disposeGlobe()
})

/** Y 轴朝上：北极为 +Y，东经为正 */
function latLonToVec3(lat, lng, r) {
  const latR = (lat * Math.PI) / 180
  const lonR = (lng * Math.PI) / 180
  const x = r * Math.cos(latR) * Math.cos(lonR)
  const y = r * Math.sin(latR)
  const z = r * Math.cos(latR) * Math.sin(lonR)
  return new T.Vector3(x, y, z)
}

function mountGlobe() {
  if (typeof window === 'undefined') return () => {}

  let alive = true
  let raf = 0
  const markerById = new Map()
  let scene
  let camera
  let renderer
  let controls
  let globeGroup
  let focusFrom
  let focusTo
  let focusT = 1
  const CAM_DIST = 2.55

  const onPointerDown = () => {
    if (controls) controls.autoRotate = false
  }

  const onClick = (ev) => {
    if (!containerRef.value || !camera) return
    const rect = renderer.domElement.getBoundingClientRect()
    const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
    const raycaster = new T.Raycaster()
    raycaster.setFromCamera(new T.Vector2(x, y), camera)
    const hits = raycaster.intersectObjects([...markerById.values()], false)
    if (hits.length && hits[0].object?.userData?.cityId) {
      activeId.value = hits[0].object.userData.cityId
    }
  }

  const resize = () => {
    if (!containerRef.value || !renderer || !camera) return
    const rect = containerRef.value.getBoundingClientRect()
    let w = Math.round(rect.width) || containerRef.value.clientWidth
    let h = Math.round(rect.height) || containerRef.value.clientHeight
    if (w < 2) w = 320
    if (h < 2) h = Math.max(260, Math.round(w * 0.8))
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  }

  let ro
  const startFocusForActive = () => {
    if (!camera) return
    const mesh = markerById.get(activeId.value)
    if (!mesh) return
    const wp = mesh.getWorldPosition(new T.Vector3())
    const dir = wp.clone().normalize()
    focusFrom = camera.position.clone()
    focusTo = dir.multiplyScalar(CAM_DIST)
    focusT = 0
  }

  const stopWatch = watch(activeId, () => {
    startFocusForActive()
    for (const [id, m] of markerById) {
      const mat = m.material
      mat.color.setHex(id === activeId.value ? 0xfbbf24 : 0x6366f1)
      mat.emissive?.setHex?.(id === activeId.value ? 0x78350f : 0x312e81)
    }
  })

  try {
    if (!containerRef.value) throw new Error('地球容器未就绪')

    scene = new T.Scene()
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    scene.background = null

    camera = new T.PerspectiveCamera(50, 1, 0.1, 50)
    camera.position.set(0, 0, CAM_DIST)

    renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    try {
      if (T.SRGBColorSpace != null) {
        renderer.outputColorSpace = T.SRGBColorSpace
      }
    } catch {
      /* 部分浏览器不支持 gl.drawingBufferColorSpace，忽略 */
    }
    renderer.setClearColor(0x000000, 0)
    if (!renderer.getContext()) throw new Error('WebGL 上下文为 null')
    containerRef.value.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.position = 'relative'
    renderer.domElement.style.zIndex = '1'
    resize()

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 1.85
    controls.maxDistance = 4.2
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.35
    controls.target.set(0, 0, 0)

    globeGroup = new T.Group()
    scene.add(globeGroup)

    const amb = new T.AmbientLight(0xffffff, 0.55)
    scene.add(amb)
    const sun = new T.DirectionalLight(0xffffff, 1.1)
    sun.position.set(4, 2.5, 5)
    scene.add(sun)

    const sphereGeo = new T.SphereGeometry(1, 64, 48)
    const sphereMat = new T.MeshPhongMaterial({
      color: dark ? 0x1e3a5f : 0x38bdf8,
      emissive: dark ? 0x0f172a : 0xbae6fd,
      emissiveIntensity: dark ? 0.42 : 0.38,
      shininess: dark ? 24 : 42,
      specular: dark ? 0x93c5fd : 0xffffff,
    })
    const earth = new T.Mesh(sphereGeo, sphereMat)
    globeGroup.add(earth)

    const wire = new T.Mesh(
      new T.SphereGeometry(1.012, 36, 24),
      new T.MeshBasicMaterial({
        color: dark ? 0x7dd3fc : 0x0ea5e9,
        wireframe: true,
        transparent: true,
        opacity: dark ? 0.14 : 0.07,
      }),
    )
    globeGroup.add(wire)

    const starGeo = new T.BufferGeometry()
    const starCount = 900
    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const r = 8 + Math.random() * 4
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    starGeo.setAttribute('position', new T.BufferAttribute(positions, 3))
    const stars = new T.Points(
      starGeo,
      new T.PointsMaterial({
        color: dark ? 0xffffff : 0x38bdf8,
        size: 0.032,
        transparent: true,
        opacity: dark ? 0.45 : 0.12,
        sizeAttenuation: true,
      }),
    )
    scene.add(stars)

    const markGeo = new T.SphereGeometry(0.038, 16, 12)
    for (const c of cityList) {
      const mat = new T.MeshStandardMaterial({
        color: c.id === activeId.value ? 0xfbbf24 : 0x6366f1,
        emissive: c.id === activeId.value ? 0x78350f : 0x312e81,
        emissiveIntensity: 0.65,
        metalness: 0.2,
        roughness: 0.45,
      })
      const mesh = new T.Mesh(markGeo, mat)
      const p = latLonToVec3(c.lat, c.lng, 1.045)
      mesh.position.copy(p)
      mesh.userData.cityId = c.id
      globeGroup.add(mesh)
      markerById.set(c.id, mesh)
    }

    ro = new ResizeObserver(resize)
    ro.observe(containerRef.value)
    window.addEventListener('resize', resize)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('click', onClick)

    startFocusForActive()

    const clock = new T.Clock()
    const ease = (t) => 1 - (1 - t) ** 3

    globeReady.value = true
    globeError.value = false

    const loop = () => {
      if (!alive) return
      raf = requestAnimationFrame(loop)
      const dt = clock.getDelta()
      if (focusT < 1 && focusFrom && focusTo) {
        focusT = Math.min(1, focusT + dt * 2.2)
        const k = ease(focusT)
        camera.position.lerpVectors(focusFrom, focusTo, k)
        if (focusT >= 1) controls.autoRotate = true
      }
      controls.update()
      renderer.render(scene, camera)
    }
    loop()
  } catch (err) {
    console.error('[EarthVisitedGlobe] WebGL / three init failed:', err?.message || err)
    globeError.value = true
    globeReady.value = false
  }

  return () => {
    alive = false
    stopWatch()
    cancelAnimationFrame(raf)
    ro?.disconnect?.()
    window.removeEventListener('resize', resize)
    if (renderer?.domElement) {
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('click', onClick)
    }
    controls?.dispose?.()
    renderer?.dispose?.()
    if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    scene?.traverse?.((obj) => {
      if (obj.geometry) obj.geometry.dispose?.()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) m.dispose?.()
      }
    })
  }
}
</script>

<template>
  <div class="lk-globe">
    <div class="lk-globe__layout">
      <aside class="lk-globe__cards" aria-label="去过的城市">
        <button
          v-for="c in cities"
          :key="c.id"
          type="button"
          :class="['lk-globe__city', { 'lk-globe__city--active': c.id === activeId }]"
          @click="activate(c.id)"
        >
          <span class="lk-globe__city-head">
            <span class="lk-globe__city-name">{{ c.name }}</span>
            <span class="lk-globe__city-emoji" aria-hidden="true">{{ c.weatherEmoji }}</span>
          </span>
          <span class="lk-globe__city-time">{{ c.time || '--:--:--' }}</span>
          <span class="lk-globe__city-weather" :title="c.weather">{{ c.weather }}</span>
        </button>
      </aside>

      <div class="lk-globe__viewport" role="img" aria-label="3D 地球：到访城市标点">
        <!-- 毛玻璃只放在画布背后的层，避免作为 WebGL 祖先触发 Chromium 合成失败 -->
        <div class="lk-globe__glass" aria-hidden="true" />
        <div ref="containerRef" class="lk-globe__canvas-host">
          <div
            v-if="!globeReady && !globeError"
            class="lk-globe__state lk-globe__state--loading"
          >
            地球加载中…
          </div>
          <div v-if="globeError" class="lk-globe__state lk-globe__state--error">
            <span class="lk-globe__err-title">3D 未能启动</span>
            <span class="lk-globe__err-hint">常见原因：浏览器关闭硬件加速、显卡驱动过旧，或页面叠加了毛玻璃滤镜导致 WebGL 无法合成。可尝试换 Chrome / Edge、在设置里开启「使用硬件加速」，并刷新本页。</span>
          </div>
        </div>
      </div>
    </div>

    <div class="lk-globe__legend" aria-label="说明">
      <span class="lk-globe__legend-item">紫 / 金点：到访城市（金色为当前选中）</span>
      <span class="lk-globe__legend-item lk-globe__legend-item--hint">拖拽旋转 · 滚轮缩放 · 点击标点或左侧卡片</span>
    </div>
  </div>
</template>

<style scoped>
.lk-globe {
  width: 100%;
}

.lk-globe__layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 0.85rem;
  align-items: stretch;
}

@media (max-width: 720px) {
  .lk-globe__layout {
    grid-template-columns: 1fr;
  }

  .lk-globe__viewport {
    min-height: 320px;
    aspect-ratio: 1;
  }
}

.lk-globe__cards {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.lk-globe__city {
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

.lk-globe__city:hover {
  transform: translateY(-1px);
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.lk-globe__city--active {
  border-color: rgba(99, 102, 241, 0.7);
  background: linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.18);
}

[data-theme='dark'] .lk-globe__city {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
}

[data-theme='dark'] .lk-globe__city--active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.28) 0%, rgba(167, 139, 250, 0.22) 100%);
  border-color: rgba(125, 211, 252, 0.55);
}

.lk-globe__city-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.lk-globe__city-emoji {
  font-size: 1rem;
}

.lk-globe__city-time {
  font-family: var(--lk-font-mono, ui-monospace, monospace);
  font-size: 0.86rem;
  color: rgba(15, 23, 42, 0.78);
  letter-spacing: 0.02em;
}

[data-theme='dark'] .lk-globe__city-time {
  color: rgba(226, 232, 240, 0.86);
}

.lk-globe__city-weather {
  font-size: 0.74rem;
  color: rgba(15, 23, 42, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme='dark'] .lk-globe__city-weather {
  color: rgba(226, 232, 240, 0.6);
}

.lk-globe__viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 4;
  min-height: min(360px, 52vh);
  min-width: 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(125, 211, 252, 0.45);
  /* 外层不用 backdrop-filter；毛玻璃只在 .lk-globe__glass，且与 canvas 为兄弟关系 */
  background: rgba(248, 250, 252, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    0 10px 36px -18px rgba(15, 23, 42, 0.18);
}

[data-theme='dark'] .lk-globe__viewport {
  border-color: rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 12px 40px -16px rgba(0, 0, 0, 0.45);
}

.lk-globe__glass {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(165deg, rgba(255, 255, 255, 0.72) 0%, rgba(219, 234, 254, 0.55) 45%, rgba(224, 242, 254, 0.5) 100%);
  backdrop-filter: blur(14px) saturate(1.15);
  -webkit-backdrop-filter: blur(14px) saturate(1.15);
}

[data-theme='dark'] .lk-globe__glass {
  background:
    linear-gradient(165deg, rgba(15, 23, 42, 0.72) 0%, rgba(30, 41, 59, 0.62) 50%, rgba(15, 23, 42, 0.55) 100%);
}

.lk-globe__canvas-host {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 240px;
}

.lk-globe__state {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  pointer-events: none;
}

.lk-globe__state--loading {
  color: rgba(15, 23, 42, 0.55);
  background: rgba(255, 255, 255, 0.35);
}

[data-theme='dark'] .lk-globe__state--loading {
  color: rgba(226, 232, 240, 0.55);
  background: rgba(15, 23, 42, 0.35);
}

.lk-globe__state--error {
  flex-direction: column;
  gap: 0.45rem;
  align-items: center;
  justify-content: center;
  color: #b45309;
  background: rgba(254, 243, 199, 0.85);
  pointer-events: auto;
}

[data-theme='dark'] .lk-globe__state--error {
  color: #fcd34d;
  background: rgba(120, 53, 15, 0.55);
}

.lk-globe__err-title {
  font-weight: 800;
  font-size: 0.92rem;
}

.lk-globe__err-hint {
  font-size: 0.76rem;
  font-weight: 500;
  line-height: 1.5;
  max-width: 22rem;
  opacity: 0.95;
}

.lk-globe__legend {
  margin-top: 0.6rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.85rem;
  font-size: 0.82rem;
  color: rgba(15, 23, 42, 0.78);
}

[data-theme='dark'] .lk-globe__legend {
  color: rgba(226, 232, 240, 0.85);
}

.lk-globe__legend-item--hint {
  margin-left: auto;
  font-weight: 600;
  opacity: 0.9;
}

@media (max-width: 720px) {
  .lk-globe__legend-item--hint {
    margin-left: 0;
  }
}
</style>
