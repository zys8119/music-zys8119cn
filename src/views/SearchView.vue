<script setup lang="ts">
import { ref, computed, watch, inject, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NList, NListItem, NThing, NEmpty, NCard } from 'naive-ui'
import { SearchOutline, PlayCircleOutline, CloseOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { musicApi } from '../services/api'

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

const route = useRoute()
const router = useRouter()
const addSongsToPlaylist = inject('addSongsToPlaylist') as (songs: Song[]) => void
// 当前播放歌曲：用于让固定分页避开底部播放条
const currentSong = inject<Ref<Song | null>>('currentSong', ref(null))
// 播放条是否可见：分页随之上下移动
const playerVisible = inject<Ref<boolean>>('playerVisible', ref(true))

// 分页底部偏移：播放条可见时为 88px，隐藏时为 39px
const pageBottom = computed(() => (currentSong.value && playerVisible.value ? '88px' : '39px'))

const keyword = computed(() => String(route.query.wd || '').trim())
const page = computed(() => Number(route.query.page) || 1)

const listItems = ref<ListItem[]>([])
const heading = ref('')
const total = ref(0)
const pagination = ref<Pagination>({ current: 1, total: 1, items: [] })
const isLoading = ref(false)
const loadError = ref('')

// 搜索历史
interface HistoryItem {
  id: number
  keyword: string
  created_at: number
}
const history = ref<HistoryItem[]>([])

async function loadHistory() {
  try {
    const res = await musicApi.getSearchHistory()
    if (res.code === 200) history.value = res.data || []
  } catch (e) {
    console.error('加载搜索历史失败', e)
  }
}

async function removeHistory(item: HistoryItem, event: Event) {
  event.stopPropagation()
  try {
    await musicApi.removeSearchHistory(item.id)
    await loadHistory()
  } catch (e) {
    console.error('删除搜索历史失败', e)
  }
}

async function clearHistory() {
  try {
    await musicApi.clearSearchHistory()
    history.value = []
  } catch (e) {
    console.error('清空搜索历史失败', e)
  }
}

function goSearch(kw: string) {
  router.push({ name: 'search', query: { wd: kw } })
}

async function loadSearch() {
  if (!keyword.value) {
    listItems.value = []
    heading.value = ''
    total.value = 0
    pagination.value = { current: 1, total: 1, items: [] }
    loadHistory()
    return
  }
  isLoading.value = true
  loadError.value = ''
  // 记录搜索历史（仅第一页时记录，避免翻页重复写入）
  if (page.value === 1) {
    musicApi.addSearchHistory(keyword.value).catch((e) => console.error('记录搜索历史失败', e))
  }
  try {
    const res = await musicApi.search(keyword.value, page.value)
    if (res.code === 200 && res.data) {
      listItems.value = Array.isArray(res.data.list) ? res.data.list : []
      heading.value = res.data.heading || `${keyword.value} 结果列表`
      total.value = res.data.total || 0
      pagination.value = res.data.pagination || { current: page.value, total: 1, items: [] }
    } else {
      listItems.value = []
      pagination.value = { current: 1, total: 1, items: [] }
    }
  } catch (error) {
    console.error('搜索出错:', error)
    loadError.value = (error as Error).message || '搜索失败'
    listItems.value = []
    pagination.value = { current: 1, total: 1, items: [] }
  } finally {
    isLoading.value = false
  }
}

// 播放搜索结果中的歌曲
function handleItemClick(item: ListItem, index: number) {
  const song: Song = {
    id: index + 5000,
    title: item.name,
    artist: keyword.value,
    cover: '',
    url: item.url,
    category: -2,
  }
  addSongsToPlaylist([song])
}

// 分页跳转：使用路由 query，保持可分享/可前进后退
function handlePageClick(link: PageLink, event: Event) {
  event.preventDefault()
  if (!link.url || link.current) return
  const m = link.url.match(/\/so\/[^/]+\/(\d+)\.html/)
  const targetPage = m ? Number(m[1]) : 1
  router.push({ name: 'search', query: { wd: keyword.value, page: String(targetPage) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch([keyword, page], () => {
  loadSearch()
}, { immediate: true })
</script>

<template>
  <div class="search-view">
    <div v-if="!keyword" class="search-hint">
      <n-icon size="52" color="#c0c4cc">
        <SearchOutline />
      </n-icon>
      <p>输入关键词，搜索你喜欢的歌曲</p>

      <!-- 搜索历史 -->
      <div v-if="history.length" class="history">
        <div class="history__head">
          <span>搜索历史</span>
          <button class="history__clear" type="button" @click="clearHistory">清空</button>
        </div>
        <div class="history__list">
          <span v-for="h in history" :key="h.id" class="history-chip" @click="goSearch(h.keyword)">
            {{ h.keyword }}
            <button class="history-chip__del" type="button" aria-label="删除该记录" @click="removeHistory(h, $event)">
              <n-icon size="12">
                <CloseOutline />
              </n-icon>
            </button>
          </span>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="view-header">
        <h1 class="view-title">搜索：{{ keyword }}</h1>
        <span v-if="total > 0" class="view-subtitle">共 {{ total }} 首结果</span>
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

      <n-card v-else-if="listItems.length === 0" class="empty-container">
        <n-empty :description="loadError ? `搜索失败：${loadError}` : '没有找到相关歌曲'">
          <template #extra>
            <span>换个关键词试试吧</span>
          </template>
        </n-empty>
      </n-card>

      <n-list v-else hoverable clickable class="song-list">
        <n-list-item v-for="(item, index) in listItems" :key="item.url" @click="handleItemClick(item, index)">
          <n-thing>
            <template #avatar>
              <div class="hot-song-avatar">
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

      <!-- 分页：固定定位在底部（完全参考站点 .page 结构） -->
      <nav v-if="!isLoading && listItems.length > 0 && pagination.items.length > 0" class="page"
        :style="{ bottom: pageBottom }" aria-label="分页导航">
        <template v-for="(link, idx) in pagination.items" :key="`${link.label}-${idx}`">
          <span v-if="link.current" class="page-link current" aria-current="page">{{ link.label }}</span>
          <a v-else-if="link.url" class="page-link" :href="link.url" @click="handlePageClick(link, $event)">{{
            link.label }}</a>
          <span v-else class="page-link disabled">{{ link.label }}</span>
        </template>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.search-view {
  padding: 8px 4px 20px;
  /* 为底部固定分页预留空间，避免遮挡内容 */
  padding-bottom: 96px;
}

.search-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 100px 20px;
  color: var(--app-muted);
  font-size: 15px;
}

/* 搜索历史 */
.history {
  width: min(560px, 100%);
  margin-top: 12px;
}

.history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--app-muted);
}

.history__clear {
  border: none;
  background: transparent;
  color: var(--app-muted);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.history__clear:hover {
  color: #ff4d4f;
}

.history__list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.history-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px 6px 12px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.history-chip:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.history-chip__del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--app-muted);
  cursor: pointer;
}

.history-chip__del:hover {
  color: #ff4d4f;
  background: var(--app-hover);
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
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.1);
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

.hot-song-avatar {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

/* 骨架屏加载态 */
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

/* 分页样式：固定定位在右下角（完全参考站点 .page 结构，现代化美化） */
.page {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 30;
  max-width: min(920px, calc(100vw - 32px));
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--app-surface);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border: 1px solid var(--app-border);
  box-shadow: 0 8px 28px rgba(31, 45, 61, 0.12);
  transition: bottom 0.24s ease, background-color 0.3s ease, border-color 0.3s ease;
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
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.18);
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
  color: var(--app-muted);
  background: var(--app-surface-2);
  border-color: var(--app-border);
  cursor: not-allowed;
}
</style>
