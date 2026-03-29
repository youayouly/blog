<script setup>
/**
 * Keeps <meta name="theme-color"> in sync with the active palette (PWA / mobile chrome).
 */
import { onMounted, watch } from 'vue'
import { useDarkMode } from 'vuepress-theme-hope/client'

const { isDarkMode } = useDarkMode()

function syncThemeColor() {
  const el = document.querySelector('meta[name="theme-color"]')
  if (!el) return
  el.setAttribute(
    'content',
    isDarkMode.value ? '#161B22' : '#4A7AB8',
  )
}

onMounted(syncThemeColor)
watch(isDarkMode, syncThemeColor, { flush: 'post' })
</script>

<template />
