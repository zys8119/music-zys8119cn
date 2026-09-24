import { ref, computed } from 'vue'

// 响应式断点（与设计系统保持一致）
// mobile: < 768px, tablet: 768px ~ 1023px, desktop: >= 1024px
export const MOBILE_BREAKPOINT = 768

// 全局单例状态
const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
const height = ref(typeof window !== 'undefined' ? window.innerHeight : 900)

function updateSize() {
  if (typeof window === 'undefined') return
  width.value = window.innerWidth
  height.value = window.innerHeight
}

// 监听视口尺寸变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateSize, { passive: true })
  window.addEventListener('orientationchange', updateSize, { passive: true })
}

// 是否为移动端（窄屏）
export const isMobile = computed(() => width.value < MOBILE_BREAKPOINT)
// 是否为平板
export const isTablet = computed(
  () => width.value >= MOBILE_BREAKPOINT && width.value < 1024
)
// 是否为桌面端
export const isDesktop = computed(() => width.value >= 1024)

// 移动端优先使用紧凑间距
export const isCompact = computed(() => width.value < 1024)

export function useResponsive() {
  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isCompact,
  }
}
