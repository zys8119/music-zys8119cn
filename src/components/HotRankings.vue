<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import { Flame } from '@vicons/ionicons5'

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

// 当前选中项：优先站点标记的 current，其次与路由 query.url 匹配
function isActive(item: HotRanking): boolean {
  return item.current || (!!activeUrl.value && item.url === activeUrl.value)
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
    </div>

    <div class="hot-rankings__body">
      <div class="hot-rankings__list">
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

.hot-rankings__body {
  position: relative;
}

/* 榜单标签整体折行展示，不再横向滚动 */
.hot-rankings__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rank-chip {
  max-width: 100%;
  padding: 7px 14px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  text-align: left;
  word-break: break-word;
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

@media (prefers-reduced-motion: reduce) {
  .rank-chip {
    transition: none;
  }

  .rank-chip:hover {
    transform: none;
  }
}
</style>
