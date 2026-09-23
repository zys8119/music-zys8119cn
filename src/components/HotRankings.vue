<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import { Flame, ChevronBack, ChevronForward } from '@vicons/ionicons5'

interface HotRanking {
  url: string
  name: string
  current: boolean
}

interface HotRankingsData {
  title: string
  list: HotRanking[]
}

// 全局注入的热门榜单数据与点击处理
const hotRankings = inject<Ref<HotRankingsData>>('hotRankings', ref({ title: '热门榜单', list: [] }))
const handleHotRankingClick = inject<(item: { url: string; name: string }) => void>(
  'handleHotRankingClick',
  () => { }
)
const route = useRoute()

const list = computed(() => hotRankings.value?.list || [])
const title = computed(() => hotRankings.value?.title || '热门榜单')
const activeUrl = computed(() => (route.query.url as string) || '')

// 横向翻页：最多两行，超出部分左右切换
const scroller = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// 根据滚动位置更新左右按钮可用状态
function updateScrollState() {
  const el = scroller.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

// 左右切换一屏
function scrollByPage(direction: 1 | -1) {
  const el = scroller.value
  if (!el) return
  el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
}

// 当前选中项：优先站点标记的 current，其次与路由 query.url 匹配
function isActive(item: HotRanking): boolean {
  return item.current || (!!activeUrl.value && item.url === activeUrl.value)
}

function onClick(item: HotRanking) {
  if (isActive(item)) return
  handleHotRankingClick({ url: item.url, name: item.name })
}

// 列表数据变化后重新计算可滚动状态
watch(list, async () => {
  await nextTick()
  updateScrollState()
})

onMounted(() => {
  nextTick(updateScrollState)
  window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollState)
})
</script>

<template>
  <section v-if="list.length" class="hot-rankings" aria-label="热门榜单导航">
    <div class="hot-rankings__header">
      <div class="hot-rankings__title">
        <n-icon size="18" color="#f97316">
          <Flame />
        </n-icon>
        <span>{{ title }}</span>
      </div>
      <div class="hot-rankings__nav">
        <button class="scroll-btn" type="button" aria-label="向左切换" :disabled="!canScrollLeft" @click="scrollByPage(-1)">
          <n-icon size="16">
            <ChevronBack />
          </n-icon>
        </button>
        <button class="scroll-btn" type="button" aria-label="向右切换" :disabled="!canScrollRight" @click="scrollByPage(1)">
          <n-icon size="16">
            <ChevronForward />
          </n-icon>
        </button>
      </div>
    </div>

    <div class="hot-rankings__body">
      <div ref="scroller" class="hot-rankings__list" @scroll="updateScrollState">
        <button v-for="item in list" :key="item.url" type="button" class="rank-chip"
          :class="{ 'rank-chip--active': isActive(item) }" :aria-current="isActive(item) ? 'true' : undefined"
          @click="onClick(item)">
          {{ item.name }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hot-rankings {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--app-surface);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border: 1px solid var(--app-border);
  box-shadow: 0 6px 20px rgba(31, 45, 61, 0.06);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.hot-rankings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.hot-rankings__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text);
}

.hot-rankings__nav {
  display: flex;
  gap: 6px;
}

.scroll-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  color: var(--app-muted);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.scroll-btn:hover:not(:disabled) {
  color: #1890ff;
  border-color: #1890ff;
  background: var(--app-active-bg);
}

.scroll-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.scroll-btn:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

.hot-rankings__body {
  position: relative;
}

/* 列流布局：每列纵向排 2 个，超出两行部分横向滚动切换 */
.hot-rankings__list {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, minmax(0, auto));
  grid-auto-columns: max-content;
  gap: 8px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 2px;
}

.rank-chip {
  max-width: 220px;
  padding: 7px 14px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  text-align: left;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease,
    box-shadow 0.2s ease, transform 0.2s ease;
}

.rank-chip:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: var(--app-active-bg);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.16);
}

.rank-chip:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

.rank-chip--active {
  background: linear-gradient(135deg, #1890ff, #722ed1);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.3);
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {

  .rank-chip,
  .scroll-btn {
    transition: none;
  }

  .hot-rankings__list {
    scroll-behavior: auto;
  }

  .rank-chip:hover {
    transform: none;
  }
}

@media (max-width: 768px) {
  .hot-rankings__nav {
    display: none;
  }
}
</style>
