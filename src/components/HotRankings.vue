<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
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
  () => {}
)
const route = useRoute()

const scroller = ref<HTMLElement | null>(null)

const list = computed(() => hotRankings.value?.list || [])
const title = computed(() => hotRankings.value?.title || '热门榜单')
const activeUrl = computed(() => (route.query.url as string) || '')

// 当前选中项：优先站点标记的 current，其次与路由 query.url 匹配
function isActive(item: HotRanking): boolean {
  return item.current || (!!activeUrl.value && item.url === activeUrl.value)
}

function scrollBy(delta: number) {
  scroller.value?.scrollBy({ left: delta, behavior: 'smooth' })
}

function onClick(item: HotRanking) {
  if (isActive(item)) return
  handleHotRankingClick({ url: item.url, name: item.name })
}
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
        <button class="scroll-btn" type="button" aria-label="向左滚动" @click="scrollBy(-240)">
          <n-icon size="16">
            <ChevronBack />
          </n-icon>
        </button>
        <button class="scroll-btn" type="button" aria-label="向右滚动" @click="scrollBy(240)">
          <n-icon size="16">
            <ChevronForward />
          </n-icon>
        </button>
      </div>
    </div>

    <div class="hot-rankings__body">
      <div class="edge edge--left" aria-hidden="true"></div>
      <div ref="scroller" class="hot-rankings__scroller">
        <button
          v-for="item in list"
          :key="item.url"
          type="button"
          class="rank-chip"
          :class="{ 'rank-chip--active': isActive(item) }"
          :aria-current="isActive(item) ? 'true' : undefined"
          @click="onClick(item)"
        >
          {{ item.name }}
        </button>
      </div>
      <div class="edge edge--right" aria-hidden="true"></div>
    </div>
  </section>
</template>

<style scoped>
.hot-rankings {
  position: sticky;
  top: 64px;
  z-index: 20;
  margin-bottom: 20px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 6px 20px rgba(31, 45, 61, 0.06);
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
  color: #1f2937;
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.scroll-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: #f2f8ff;
}

.scroll-btn:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

.hot-rankings__body {
  position: relative;
}

.hot-rankings__scroller {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 2px;
}

.rank-chip {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease,
    box-shadow 0.2s ease, transform 0.2s ease;
}

.rank-chip:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: #f2f8ff;
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

.edge {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 28px;
  pointer-events: none;
}

.edge--left {
  left: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), transparent);
}

.edge--right {
  right: 0;
  background: linear-gradient(270deg, rgba(255, 255, 255, 0.95), transparent);
}

@media (prefers-reduced-motion: reduce) {
  .rank-chip,
  .scroll-btn {
    transition: none;
  }

  .hot-rankings__scroller {
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
