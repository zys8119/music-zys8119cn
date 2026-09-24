<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { NList, NListItem, NThing, NEmpty, NCard, NIcon } from 'naive-ui'
import { PlayCircleOutline } from '@vicons/ionicons5'
import { musicApi } from '../services/api'
import { useResponsive } from '../composables/useResponsive'
import { useInfiniteScroll, getNextPageLink } from '../composables/useInfiniteScroll'

interface Song {
  id: number
  title: string
  artist: string
  cover?: string
  url: string
  category: number
}

interface ListItem {
  url: string
  name: string
  img: string
  type: string
}

interface PageLink {
  label: string
  url: string
  current: boolean
}

interface Pagination {
  current: number
  total: number
  items: PageLink[]
}

const addSongsToPlaylist = inject<(songs: Song[]) => void>('addSongsToPlaylist', () => { })

// 新歌榜地址（目标站点）
const NEW_SONG_URL = 'https://www.22a5.com/list/new.html'

const listItems = ref<ListItem[]>([])
const pagination = ref<Pagination>({ current: 1, total: 1, items: [] })
const isLoading = ref(false)
// 上拉加载更多时的加载态（与首屏骨架屏区分）
const isLoadingMore = ref(false)
const loadError = ref('')
const activeUrl = ref(NEW_SONG_URL)

// 移动端使用滚动分页（上拉加载更多）
const { isMobile } = useResponsive()

// 仅保留歌曲条目
const songs = computed(() => listItems.value.filter((i) => i.type === 'song' || i.type === 'mv'))

// 下一页链接（移动端上拉加载使用）
const nextPageLink = computed(() => getNextPageLink(pagination.value))
const hasMore = computed(() => !!nextPageLink.value)

/**
 * 加载列表。append 为 true 时追加到现有列表（上拉加载更多），否则替换。
 */
async function loadList(url: string, append = false) {
  if (append) isLoadingMore.value = true
  else isLoading.value = true
  loadError.value = ''
  try {
    const res = await musicApi.getList(url)
    if (res.code === 200 && res.data) {
      const data = res.data
      const list = Array.isArray(data.list) ? data.list : []
      listItems.value = append ? [...listItems.value, ...list] : list
      pagination.value = data.pagination || { current: 1, total: 1, items: [] }
      activeUrl.value = url
    } else if (!append) {
      listItems.value = []
      pagination.value = { current: 1, total: 1, items: [] }
    }
  } catch (error) {
    console.error('获取新歌榜出错:', error)
    loadError.value = (error as Error).message || '加载失败'
    if (!append) {
      listItems.value = []
      pagination.value = { current: 1, total: 1, items: [] }
    }
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 上拉加载下一页
function loadMore() {
  if (!nextPageLink.value || isLoadingMore.value) return
  loadList(nextPageLink.value.url, true)
}

const { sentinelEl } = useInfiniteScroll({
  hasMore: () => isMobile.value && hasMore.value,
  isLoading: () => isLoading.value || isLoadingMore.value,
  onLoadMore: loadMore,
})

function toSong(item: ListItem, index: number): Song {
  return {
    id: index + 3000,
    title: item.name,
    artist: '新歌榜',
    cover: item.img,
    url: item.url,
    category: -5,
  }
}

function handlePlay(item: ListItem, index: number) {
  addSongsToPlaylist([toSong(item, index)])
}

function playAll() {
  if (!songs.value.length) return
  addSongsToPlaylist(songs.value.map((item, index) => toSong(item, index)))
}

function handlePageClick(link: PageLink, event: Event) {
  event.preventDefault()
  if (!link.url || link.current || link.url === activeUrl.value) return
  loadList(link.url)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => loadList(NEW_SONG_URL))
</script>

<template>
  <div class="discover-view">
    <div class="view-header">
      <h1 class="view-title">发现音乐</h1>
      <span class="view-subtitle">新歌榜 · 共 {{ pagination.total }} 页</span>
      <n-button v-if="songs.length" type="primary" size="small" class="play-all" @click="playAll">
        <template #icon>
          <n-icon>
            <PlayCircleOutline />
          </n-icon>
        </template>
        播放全部
      </n-button>
    </div>

    <!-- 加载态：骨架屏 -->
    <div v-if="isLoading" class="skeleton-list">
      <div v-for="n in 8" :key="n" class="skeleton-row">
        <div class="skeleton-block skeleton-avatar"></div>
        <div class="skeleton-lines">
          <div class="skeleton-block skeleton-line"></div>
          <div class="skeleton-block skeleton-line skeleton-line--short"></div>
        </div>
      </div>
    </div>

    <n-card v-else-if="songs.length === 0" class="empty-container">
      <n-empty :description="loadError ? `加载失败：${loadError}` : '暂无新歌'">
        <template #extra>
          <span>换个时间再来看看吧</span>
        </template>
      </n-empty>
    </n-card>

    <n-list v-else hoverable clickable class="song-list">
      <n-list-item v-for="(item, index) in songs" :key="item.url" @click="handlePlay(item, index)">
        <n-thing>
          <template #avatar>
            <img v-if="item.img" :src="item.img" class="song-avatar" alt="cover" />
            <div v-else class="hot-song-avatar">
              <n-icon size="22">
                <PlayCircleOutline />
              </n-icon>
            </div>
          </template>
          <template #header>
            <span class="song-title">{{ item.name }}</span>
          </template>
          <template #description>
            <span class="song-url">{{ item.url }}</span>
          </template>
        </n-thing>
      </n-list-item>
    </n-list>

    <!-- 分页：桌面端显示页码；移动端改用上拉加载更多 -->
    <nav v-if="!isMobile && !isLoading && songs.length > 0 && pagination.items.length > 0" class="page"
      aria-label="分页导航">
      <template v-for="(link, idx) in pagination.items" :key="link.label + '-' + idx">
        <span v-if="link.current" class="page-link current" aria-current="page">{{ link.label }}</span>
        <a v-else-if="link.url" class="page-link" :href="link.url" @click="handlePageClick(link, $event)">{{ link.label
          }}</a>
        <span v-else class="page-link disabled">{{ link.label }}</span>
      </template>
    </nav>

    <!-- 移动端：上拉加载更多的哨兵与状态提示 -->
    <div v-if="isMobile && songs.length > 0" class="mobile-only-infinite">
      <div ref="sentinelEl" class="infinite-sentinel"></div>
      <div v-if="isLoadingMore" class="infinite-status">
        <span class="infinite-status__spinner"></span>
        <span>正在加载…</span>
      </div>
      <div v-else-if="!hasMore" class="infinite-status">已加载全部</div>
    </div>
  </div>
</template>

<style scoped>
.discover-view {
  padding: 8px 4px 20px;
}

.view-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
}

.view-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--app-text);
  position: relative;
  padding-left: 16px;
}

.view-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 22px;
  border-radius: 3px;
  background: linear-gradient(180deg, #1890ff, #722ed1);
}

.view-subtitle {
  font-size: 13px;
  color: var(--app-muted);
}

.play-all {
  margin-left: auto;
}

.empty-container {
  margin-top: 20px;
  min-height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
}

.song-list :deep(.n-list-item) {
  border-radius: 12px;
  padding: 12px 16px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.song-list :deep(.n-list-item:hover) {
  background: var(--app-active-bg);
  box-shadow: var(--app-shadow);
  transform: translateX(2px);
}

.song-title {
  font-weight: 500;
  color: var(--app-text);
}

.song-url {
  font-size: 12px;
  color: var(--app-muted);
  word-break: break-all;
}

.song-avatar {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.hot-song-avatar {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

/* 骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-block {
  background: linear-gradient(90deg, #f1f3f6 25%, #e6e9ee 37%, #f1f3f6 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
  border-radius: 8px;
}

html.dark .skeleton-block {
  background: linear-gradient(90deg, #24243e 25%, #2e2e4d 37%, #24243e 63%);
  background-size: 400% 100%;
}

.skeleton-avatar {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  flex-shrink: 0;
}

.skeleton-line {
  height: 14px;
  width: 60%;
}

.skeleton-line--short {
  width: 35%;
  height: 11px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
  }
}

/* 分页 */
.page {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 32px 0 12px;
}

.page-link {
  min-width: 38px;
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
  color: var(--app-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease,
    box-shadow 0.2s ease, transform 0.2s ease;
}

a.page-link {
  cursor: pointer;
}

a.page-link:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: var(--app-active-bg);
  transform: translateY(-1px);
}

a.page-link:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

.page-link.current {
  background: linear-gradient(135deg, #1890ff, #722ed1);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.32);
  cursor: default;
}

.page-link.disabled {
  color: #c0c4cc;
  background: var(--app-surface-2);
  border-color: var(--app-border);
  cursor: not-allowed;
}
</style>
