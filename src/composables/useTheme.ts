import { ref, computed, watchEffect } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'app-theme-mode'

// 从本地存储读取初始主题模式
function readStoredMode(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return 'system'
}

// 全局单例状态
const mode = ref<ThemeMode>(readStoredMode())
const systemPrefersDark = ref(false)

// 监听系统主题变化
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = mql.matches
  mql.addEventListener('change', (e) => {
    systemPrefersDark.value = e.matches
  })
}

// 实际是否为暗色
export const isDark = computed(() => {
  if (mode.value === 'system') return systemPrefersDark.value
  return mode.value === 'dark'
})

// 将主题同步到 <html> 的 class 与 data 属性，供 CSS 变量与 Naive UI 使用
watchEffect(() => {
  const root = document.documentElement
  root.classList.toggle('dark', isDark.value)
  root.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
})

// 持久化模式
watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, mode.value)
})

export function useTheme() {
  function setMode(next: ThemeMode) {
    mode.value = next
  }

  // 在 亮/暗 之间直接切换（系统模式时切换为相反的实际主题）
  function toggleTheme() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, setMode, toggleTheme }
}
