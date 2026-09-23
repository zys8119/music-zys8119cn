<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { NIcon } from 'naive-ui'
import { SunnyOutline, MoonOutline } from '@vicons/ionicons5'

type ThemeMode = 'light' | 'dark' | 'system'

const themeMode = inject<Ref<ThemeMode>>('themeMode', ref('system'))
const isDark = inject<Ref<boolean>>('isDark', ref(false))
const setThemeMode = inject<(m: ThemeMode) => void>('setThemeMode', () => { })

// 点击循环切换：亮 → 暗 → 跟随系统
function cycle() {
  const next: ThemeMode =
    themeMode.value === 'light'
      ? 'dark'
      : themeMode.value === 'dark'
        ? 'system'
        : 'light'
  setThemeMode(next)
}

const label = computed(() =>
  themeMode.value === 'light'
    ? '白天模式'
    : themeMode.value === 'dark'
      ? '黑夜模式'
      : '跟随系统',
)
</script>

<template>
  <button class="theme-toggle" type="button" :aria-label="`切换主题（当前：${label}）`" :title="`主题：${label}`" @click="cycle">
    <n-icon size="18">
      <component :is="isDark ? MoonOutline : SunnyOutline" />
    </n-icon>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.theme-toggle:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.theme-toggle:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}
</style>
