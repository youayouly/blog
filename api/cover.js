/**
 * Vercel Serverless Function: 调用 Dify 生成文章封面图
 * 支持多种图片生成后端：Dify、硅基流动、Hugging Face
 *
 * 本地开发模式（vercel dev）：图片会下载到 docs/.vuepress/public/gallery/
 */

const fs = require('fs')
const path = require('path')

// 确保在Node.js环境中正确处理fetch
let fetch
try {
  // 优先使用 undici 的 fetch（已在package.json中依赖）
  fetch = require('undici').fetch
  console.log('[Cover] Using undici fetch')
} catch {
  // 回退到原生fetch（Node 18+）
  fetch = global.fetch
  console.log('[Cover] Using native fetch')
}

// 本地开发模式检测（尝试写入文件来判断）
function canWriteLocal() {
  try {
    // 检查 gallery 目录是否存在或可以创建
    if (!fs.existsSync(GALLERY_DIR)) {
      fs.mkdirSync(GALLERY_DIR, { recursive: true })
    }
    // 尝试创建临时文件测试写入权限
    const testFile = path.join(GALLERY_DIR, '.write-test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    return true
  } catch {
    return false
  }
}

// 本地 gallery 目录路径
const GALLERY_DIR = path.join(process.cwd(), 'docs', '.vuepress', 'public', 'gallery')

// 根据标题生成文件名 slug
function generateSlug(title) {
  const timestamp = Date.now()
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)
  return `${slug}-${timestamp}`
}

// 检测图片格式
function detectImageFormat(buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg'
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'gif'
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'webp'
  return 'png'
}

// 下载图片并保存到本地（仅本地开发环境）
async function downloadAndSaveLocal(imageUrl, title) {
  if (!canWriteLocal()) {
    return { saved: false, reason: 'not-local-dev' }
  }

  try {
    const res = await fetch(imageUrl)
    if (!res.ok) {
      throw new Error(`下载失败: ${res.status}`)
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const format = detectImageFormat(buffer)
    const slug = generateSlug(title)
    const filename = `article-cover-${slug}.${format}`
    const filepath = path.join(GALLERY_DIR, filename)

    // 确保 gallery 目录存在
    if (!fs.existsSync(GALLERY_DIR)) {
      fs.mkdirSync(GALLERY_DIR, { recursive: true })
    }

    fs.writeFileSync(filepath, buffer)
    console.log(`[Cover] 已保存到本地: ${filepath}`)

    // 自动添加到git（防止部署时找不到图片）
    try {
      const { execSync } = require('child_process')
      execSync(`git add "${filepath}"`, { encoding: 'utf-8', stdio: 'pipe' })
      console.log(`[Cover] 已添加到git: ${filename}`)
    } catch (gitErr) {
      // git操作失败不影响图片保存，只记录警告
      console.warn(`[Cover] 无法添加到git: ${gitErr.message}`)
    }

    return {
      saved: true,
      localPath: filepath,
      url: `/gallery/${filename}`,
      filename,
      size: buffer.length,
    }
  } catch (e) {
    console.error('[Cover] 本地保存失败:', e.message)
    return { saved: false, reason: e.message }
  }
}

// 图片生成后端配置
const IMAGE_BACKENDS = {
  // Dify 工作流
  dify: {
    name: 'Dify',
    generate: async (title, keywords, summary, config) => {
      const { apiUrl, apiKey } = config

      // 调用 Dify 工作流 API
      const apiUrlWithWorkflow = `${apiUrl}/workflows/run`
      console.log(`[Dify] Calling API: ${apiUrlWithWorkflow}`)
      console.log(`[Dify] Request body:`, JSON.stringify({
        inputs: {
          title,
          keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
          summary: summary || title,
        },
        response_mode: 'blocking',
        user: 'article-publisher',
      }, null, 2))

      const res = await fetch(apiUrlWithWorkflow, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            title,
            keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
            summary: summary || title,
          },
          response_mode: 'blocking',
          user: 'article-publisher',
        }),
      })

      console.log(`[Dify] Response status: ${res.status} ${res.statusText}`)

      if (!res.ok) {
        const err = await res.text()
        console.error(`[Dify] Error response: ${err}`)
        throw new Error(`Dify API error: ${err}`)
      }

      const data = await res.json()
      console.log(`[Dify] Response data:`, JSON.stringify(data, null, 2))
      console.log(`[Dify] Full response structure:`, JSON.stringify(Object.keys(data), null, 2))

      // 检查工作流执行状态
      if (data.data?.status === 'failed') {
        const errorInfo = data.data?.error || 'Unknown error'
        console.error(`[Dify] Workflow failed: ${errorInfo}`)

        // 提供更友好的错误信息
        if (errorInfo.includes('APIAuthenticationError') || errorInfo.includes('401')) {
          throw new Error('Dify工作流认证失败：API密钥无效或已过期。请检查Dify配置或尝试使用其他后端（如siliconflow）。')
        } else {
          throw new Error(`Dify工作流执行失败：${errorInfo}`)
        }
      }

      // Dify 工作流返回格式解析
      const outputs = data.data?.outputs || {}
      console.log(`[Dify] Extracted outputs:`, JSON.stringify(outputs, null, 2))

      // 尝试多种可能的返回格式
      let imageUrl = null

      // 格式1: { result: [{ url: "..." }] }
      if (outputs.result?.[0]?.url) {
        imageUrl = outputs.result[0].url
        console.log(`[Dify] Found image URL (format 1): ${imageUrl}`)
      }
      // 格式2: { image_url: "..." }
      else if (outputs.image_url) {
        imageUrl = outputs.image_url
        console.log(`[Dify] Found image URL (format 2): ${imageUrl}`)
      }
      // 格式3: { cover_url: "..." }
      else if (outputs.cover_url) {
        imageUrl = outputs.cover_url
        console.log(`[Dify] Found image URL (format 3): ${imageUrl}`)
      }
      // 格式4: { url: "..." }
      else if (outputs.url) {
        imageUrl = outputs.url
        console.log(`[Dify] Found image URL (format 4): ${imageUrl}`)
      }
      // 格式5: 直接在 result 中
      else if (outputs.result && typeof outputs.result === 'string') {
        imageUrl = outputs.result
        console.log(`[Dify] Found image URL (format 5): ${imageUrl}`)
      }
      // 格式6: outputs 本身就是 URL 字符串
      else if (typeof outputs === 'string' && outputs.startsWith('http')) {
        imageUrl = outputs
        console.log(`[Dify] Found image URL (format 6): ${imageUrl}`)
      }

      if (imageUrl) {
        return imageUrl
      }

      console.error(`[Dify] No image URL found in response, full data:`, JSON.stringify(data, null, 2))
      throw new Error('Dify工作流未返回图片URL，请检查工作流配置')
    },
  },

  // 硅基流动 API（推荐：国内访问快，价格低）
  siliconflow: {
    name: '硅基流动',
    generate: async (title, keywords, config) => {
      const { apiKey } = config

      // 先用简单的 prompt，后续可以接入 LLM 优化
      const prompt = generatePrompt(title, keywords)

      const res = await fetch('https://api.siliconflow.cn/v1/image/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'flux-schnell', // 快速模型，效果也不错
          prompt,
          image_size: '1200x800',
          num_images: 1,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`SiliconFlow API error: ${err}`)
      }

      const data = await res.json()
      return data.images?.[0]?.url
    },
  },

  // Hugging Face 免费推理 API
  huggingface: {
    name: 'Hugging Face',
    generate: async (title, keywords, config) => {
      const { apiKey } = config

      const prompt = generatePrompt(title, keywords)

      // 使用 Stable Diffusion XL
      const res = await fetch(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              width: 1200,
              height: 800,
            },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`HuggingFace API error: ${err}`)
      }

      // 返回 base64 图片
      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return `data:image/png;base64,${base64}`
    },
  },

  // Stability AI 官方 API
  stability: {
    name: 'Stability AI',
    generate: async (title, keywords, config) => {
      const { apiKey } = config

      const prompt = generatePrompt(title, keywords)

      const res = await fetch(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,
            height: 800,
            width: 1200,
            steps: 30,
            samples: 1,
          }),
        }
      )

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Stability API error: ${err}`)
      }

      const data = await res.json()
      const base64 = data.artifacts?.[0]?.base64
      return base64 ? `data:image/png;base64,${base64}` : null
    },
  },
}

// 生成英文图片提示词
function generatePrompt(title, keywords) {
  const keywordStr = Array.isArray(keywords) && keywords.length > 0 ? keywords.join(', ') : (typeof keywords === 'string' ? keywords : 'technology')

  return `Professional tech blog cover image, ${keywordStr} theme, modern minimalist design,
abstract geometric shapes, gradient colors, clean composition, no text, no logo,
suitable for article thumbnail, high quality, 4k, professional photography style`
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const { title, keywords, summary, backend = 'siliconflow', authUser, authPass } = body

    // 验证必填字段
    if (!title) {
      return res.status(400).json({ ok: false, error: 'Missing title' })
    }

    // 验证用户鉴权（可选）
    const LK_SITE_USER = process.env.LK_SITE_USER
    const LK_SITE_PASS = process.env.LK_SITE_PASS
    if (LK_SITE_USER && LK_SITE_PASS) {
      if (authUser !== LK_SITE_USER || authPass !== LK_SITE_PASS) {
        return res.status(401).json({ ok: false, error: 'Authentication failed' })
      }
    }

    // 获取对应后端的 API 配置
    const backendConfig = IMAGE_BACKENDS[backend]
    if (!backendConfig) {
      return res.status(400).json({ ok: false, error: `Unknown backend: ${backend}` })
    }

    // 读取环境变量配置
    let config = {}
    switch (backend) {
      case 'dify':
        config = {
          apiUrl: process.env.DIFY_API_URL,
          apiKey: process.env.DIFY_API_KEY,
        }
        if (!config.apiUrl || !config.apiKey) {
          return res.status(500).json({ ok: false, error: 'Dify API not configured' })
        }
        break
      case 'siliconflow':
        config = { apiKey: process.env.SILICONFLOW_API_KEY }
        if (!config.apiKey) {
          return res.status(500).json({ ok: false, error: 'SiliconFlow API not configured' })
        }
        break
      case 'huggingface':
        config = { apiKey: process.env.HUGGINGFACE_API_KEY }
        if (!config.apiKey) {
          return res.status(500).json({ ok: false, error: 'HuggingFace API not configured' })
        }
        break
      case 'stability':
        config = { apiKey: process.env.STABILITY_API_KEY }
        if (!config.apiKey) {
          return res.status(500).json({ ok: false, error: 'Stability API not configured' })
        }
        break
    }

    console.log(`[Cover] Generating cover for: ${title}`)
    console.log(`  - Backend: ${backendConfig.name}`)
    console.log(`  - Keywords: ${Array.isArray(keywords) ? keywords.join(', ') : (keywords || 'none')}`)
    console.log(`  - Summary: ${summary?.substring(0, 50) || '(none)'}...`)

    // 调用对应后端生成图片
    const imageUrl = await backendConfig.generate(title, keywords || [], summary, config)

    if (!imageUrl) {
      return res.status(500).json({ ok: false, error: 'Failed to generate image' })
    }

    console.log(`  - Generated: ${imageUrl.substring(0, 100)}...`)

    // 本地开发模式：下载图片到 gallery 目录
    let finalUrl = imageUrl
    let localSave = null

    if (canWriteLocal() && !imageUrl.startsWith('data:')) {
      localSave = await downloadAndSaveLocal(imageUrl, title)
      if (localSave.saved) {
        finalUrl = localSave.url
        console.log(`  - Local saved: ${localSave.localPath}`)
      }
    }

    return res.status(200).json({
      ok: true,
      imageUrl: finalUrl,
      originalUrl: finalUrl !== imageUrl ? imageUrl : undefined,
      backend: backendConfig.name,
      localSaved: localSave?.saved || false,
      localPath: localSave?.localPath,
    })
  } catch (err) {
    console.error('[Cover] Error:', err.message)
    console.error('[Cover] Error stack:', err.stack)
    return res.status(500).json({ ok: false, error: err.message || 'Internal server error' })
  }
}
