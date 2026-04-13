/**
 * 文章页右侧「分类」列表（名称与数量可按你的内容在构建前自行维护）。
 * `to` 暂统一指向文章列表，后续可改为按分类筛选的独立路由。
 */
export const ARTICLE_CATEGORIES = [
  { label: 'C++', count: 19, to: '/article/' },
  { label: 'Python', count: 27, to: '/article/' },
  { label: 'C / 嵌入式 C', count: 14, to: '/article/' },
  { label: '嵌入式 / MCU', count: 22, to: '/article/' },
  { label: '网络 / TCP·UDP', count: 16, to: '/article/' },
  { label: '网关 / API Gateway', count: 9, to: '/article/' },
  { label: 'NLP', count: 6, to: '/article/' },
  { label: '多模态 / Vision', count: 4, to: '/article/' },
  { label: 'RTOS', count: 11, to: '/article/' },
  { label: 'Linux 驱动', count: 8, to: '/article/' },
  { label: 'MQTT / IoT', count: 13, to: '/article/' },
  { label: 'Edge AI / ONNX', count: 7, to: '/article/' },
  { label: 'CMake / 构建', count: 5, to: '/article/' },
  { label: '总线 / SPI·I2C', count: 18, to: '/article/' },
]
