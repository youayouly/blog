import { reactive } from 'vue'

export const busuanziState = reactive({
  uv: '',
  pv: '',
  ready: false,
})

let pollTimer = null
let pollTries = 0

function startPolling() {
  if (pollTimer) return
  pollTries = 0
  pollTimer = setInterval(() => {
    pollTries += 1
    const uvEl = document.getElementById('busuanzi_value_site_uv')
    const pvEl = document.getElementById('busuanzi_value_site_pv')
    const uv = uvEl?.textContent?.trim() ?? ''
    const pv = pvEl?.textContent?.trim() ?? ''
    if (uv) {
      busuanziState.uv = Number(uv).toLocaleString('zh-CN')
      busuanziState.ready = true
    }
    if (pv) busuanziState.pv = Number(pv).toLocaleString('zh-CN')
    if ((busuanziState.uv && busuanziState.pv) || pollTries > 60) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }, 400)
}

export function ensureBusuanzi() {
  if (typeof document === 'undefined') return

  if (!document.getElementById('busuanzi_value_site_uv')) {
    const uv = document.createElement('span')
    uv.id = 'busuanzi_value_site_uv'
    uv.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;clip:rect(0,0,0,0)'
    document.body.appendChild(uv)
  }
  if (!document.getElementById('busuanzi_value_site_pv')) {
    const pv = document.createElement('span')
    pv.id = 'busuanzi_value_site_pv'
    pv.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;clip:rect(0,0,0,0)'
    document.body.appendChild(pv)
  }

  if (!document.getElementById('busuanzi-js')) {
    const s = document.createElement('script')
    s.id = 'busuanzi-js'
    s.async = true
    s.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
    s.onload = () => startPolling()
    document.head.appendChild(s)
  } else {
    startPolling()
  }
}
