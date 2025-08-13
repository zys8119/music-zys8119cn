<script setup lang="ts">
const showShortcuts = ref(false)

function toggleShortcuts() {
  showShortcuts.value = !showShortcuts.value
}

// 监听 ? 键显示快捷键帮助
function handleKeydown(event: KeyboardEvent) {
  if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const target = event.target as HTMLElement
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
      event.preventDefault()
      toggleShortcuts()
    }
  }
  if (event.key === 'Escape') {
    showShortcuts.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- 快捷键帮助按钮 -->
  <n-button 
    quaternary 
    circle 
    size="small" 
    @click="toggleShortcuts"
    class="fixed top-4 right-4 z-1000"
    title="键盘快捷键帮助 (按 ? 键)"
  >
    <template #icon>
      <n-icon size="16">
        <svg viewBox="0 0 24 24">
          <path fill="currentColor" d="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44c.91-1.29.4-3.7-2.18-3.7c-1.69 0-2.52 1.28-2.87 2.34L6.54 6.96C7.25 4.83 9.18 3 11.99 3c2.35 0 3.96 1.07 4.78 2.41c.7 1.15.6 3.05-.85 4.49c-1.06 1.06-2.87 2.17-3.05 3.95zm-.52 3.93c0-.59.47-1.06 1.06-1.06c.59 0 1.06.47 1.06 1.06c0 .59-.47 1.06-1.06 1.06c-.59 0-1.06-.47-1.06-1.06z"/>
        </svg>
      </n-icon>
    </template>
  </n-button>

  <!-- 快捷键帮助弹窗 -->
  <n-modal v-model:show="showShortcuts" preset="card" title="键盘快捷键" class="w-120">
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h3 class="text-lg font-semibold mb-3 text-gray-800">播放控制</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">播放/暂停</span>
              <n-tag size="small" type="info">空格键</n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">上一首</span>
              <n-tag size="small" type="info">←</n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">下一首</span>
              <n-tag size="small" type="info">→</n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">切换播放模式</span>
              <n-tag size="small" type="info">L</n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">下载歌曲</span>
              <n-tag size="small" type="info">D</n-tag>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-3 text-gray-800">音量控制</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">音量增加</span>
              <n-tag size="small" type="info">↑</n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">音量减少</span>
              <n-tag size="small" type="info">↓</n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">静音/取消静音</span>
              <n-tag size="small" type="info">M</n-tag>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold mb-3 text-gray-800">播放进度控制</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">快退 10 秒</span>
              <n-tag size="small" type="info">Ctrl/Cmd + ←</n-tag>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">快进 10 秒</span>
              <n-tag size="small" type="info">Ctrl/Cmd + →</n-tag>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">跳转到进度</span>
              <n-tag size="small" type="info">0-9</n-tag>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              按数字键 0-9 跳转到对应的播放进度百分比
            </div>
          </div>
        </div>
      </div>

      <div class="border-t pt-4">
        <h3 class="text-lg font-semibold mb-3 text-gray-800">其他</h3>
        <div class="flex justify-between items-center">
          <span class="text-gray-600">显示/隐藏快捷键帮助</span>
          <n-tag size="small" type="info">?</n-tag>
        </div>
      </div>

      <div class="bg-blue-50 p-3 rounded-lg">
        <p class="text-sm text-blue-700">
          <strong>提示：</strong>当您在输入框中输入时，快捷键将被禁用，以避免干扰正常的文本输入。
        </p>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
/* UnoCSS classes are used in template, no custom styles needed */
</style>