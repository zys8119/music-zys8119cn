<script setup lang="ts">
import { ref, computed, onMounted, watch, inject, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NList, NListItem, NThing, NEmpty, NCard, NGrid, NGridItem, NCheckbox, NButton, NIcon } from 'naive-ui'
import { PlayCircleOutline } from '@vicons/ionicons5'
import { musicApi } from '../services/api'

interface Song {
  id: number;
  title: string;
  artist: string;
  cover?: string;
  url: string;
  category: number;
}

interface Category {
  id: number;
  name: string;
  url?: string;
  type?: string;
}

// 通用列表项（榜单/歌手/歌单/电台/MV）
interface ListItem {
  url: string;
  name: string;
  img: string;
  type: string;
}

// 分页信息（完全参考站点 .page 结构）
interface PageLink {
  label: string;
  url: string;
  current: boolean;
}
interface Pagination {
  current: number;
  total: number;
  items: PageLink[];
}

const route = useRoute()
const router = useRouter()
const categoryId = computed(() => Number(route.params.id))

// 从全局注入的分类与播放函数
const categories = inject('categories', ref<Category[]>([]))
const addSongsToPlaylist = inject('addSongsToPlaylist') as (songs: Song[]) => void
// 当前播放歌曲：用于让固定分页避开底部播放条
const currentSong = inject<Ref<Song | null>>('currentSong', ref(null))
// 播放条是否可见：分页随之上下移动
const playerVisible = inject<Ref<boolean>>('playerVisible', ref(true))

// 分页底部偏移：播放条可见时为 88px，隐藏时贴近底部
const pageBottom = computed(() => (currentSong.value && playerVisible.value ? '88px' : '16px'))

// 当前分类（来自导航）
const currentCategory = computed((): Category | undefined =>
  categories.value.find(c => c.id === categoryId.value)
)

// 分类标题：优先使用路由 query 携带的名称
const categoryName = computed((): string => {
  const qName = route.query.name as string | undefined
  if (qName) return qName
  return currentCategory.value?.name || '未知分类'
})

// 列表数据
const listItems = ref<ListItem[]>([])
const isLoading = ref(false)
const loadError = ref('')
const pagination = ref<Pagination>({ current: 1, total: 1, items: [] })
const activeUrl = ref('')

// 根据路由 query 获取目标页面 URL
const targetUrl = computed((): string => (route.query.url as string) || currentCategory.value?.url || '')
const pageType = computed((): string => (route.query.type as string) || currentCategory.value?.type || 'list')

// 统一处理列表响应（新结构 { list, pagination }，兼容旧的数组结构）
async function loadList(url: string) {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await musicApi.getList(url)
    if (res.code === 200 && res.data) {
      const data = res.data
      if (Array.isArray(data)) {
        listItems.value = data
        pagination.value = { current: 1, total: 1, items: [] }
      } else {
        listItems.value = Array.isArray(data.list) ? data.list : []
        pagination.value = data.pagination || { current: 1, total: 1, items: [] }
      }
      activeUrl.value = url
    } else {
      listItems.value = []
      pagination.value = { current: 1, total: 1, items: [] }
    }
  } catch (error) {
    console.error('获取列表出错:', error)
    loadError.value = (error as Error).message || '加载失败'
    listItems.value = []
    pagination.value = { current: 1, total: 1, items: [] }
  } finally {
    isLoading.value = false
  }
}

function fetchList() {
  if (!targetUrl.value) {
    listItems.value = []
    return
  }
  loadList(targetUrl.value)
}

// 点击列表项：歌曲/MV 直接播放，歌手/歌单/电台 下钻到对应列表
function handleItemClick(item: ListItem, index: number) {
  if (item.type === 'song' || item.type === 'mv') {
    addSongsToPlaylist([toSong(item, index)])
    return
  }

  // 歌手/歌单/电台：加载其详情页列表
  loadList(item.url)
}

// 分页跳转（复用站点分页链接）
function handlePageClick(link: PageLink, event: Event) {
  event.preventDefault()
  if (!link.url || link.current || link.url === activeUrl.value) return
  loadList(link.url)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ===== 多选 / 全选 =====
// 是否仅歌曲/MV 可选中（歌手/歌单/电台为下钻类目，不支持批量播放）
const isPlayable = computed(() => pageType.value !== 'singer' && pageType.value !== 'playlist' && pageType.value !== 'radio')

// 已选中的行索引
const selectedIndexes = ref<Set<number>>(new Set())

const isAllSelected = computed(() =>
  listItems.value.length > 0 && selectedIndexes.value.size === listItems.value.length
)

const isIndeterminate = computed(() =>
  selectedIndexes.value.size > 0 && selectedIndexes.value.size < listItems.value.length
)

// 行是否被选中
function isSelected(index: number): boolean {
  return selectedIndexes.value.has(index)
}

// 切换单行选中状态
function toggleSelect(index: number, event: Event) {
  event.stopPropagation()
  const next = new Set(selectedIndexes.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  selectedIndexes.value = next
}

// 全选 / 取消全选
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIndexes.value = new Set()
  } else {
    selectedIndexes.value = new Set(listItems.value.map((_, i) => i))
  }
}

// 将列表项转换为可播放歌曲
function toSong(item: ListItem, index: number): Song {
  return {
    id: index + 1000,
    title: item.name,
    artist: categoryName.value,
    cover: item.img,
    url: item.url,
    category: categoryId.value,
  }
}

// 播放选中的歌曲（按列表顺序）
function playSelected() {
  if (selectedIndexes.value.size === 0) return
  const songs = listItems.value
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => selectedIndexes.value.has(index))
    .map(({ item, index }) => toSong(item, index))
  addSongsToPlaylist(songs)
  selectedIndexes.value = new Set()
}

// 列表数据变化时清空选中（切换分类/分页/下钻）
watch(listItems, () => {
  selectedIndexes.value = new Set()
})

watch(targetUrl, () => {
  fetchList()
}, { immediate: true })

onMounted(() => {
  if (!targetUrl.value) fetchList()
})
</script>

<template>
  <div class="category-view">
    <!-- 面包屑：显示当前位置 -->
    <nav class="breadcrumb" aria-label="面包屑导航">
      <a class="breadcrumb-link" @click="router.push({ name: 'home' })">首页</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">{{ categoryName }}</span>
    </nav>

    <div class="view-header">
      <h1 class="view-title">{{ categoryName }}</h1>
      <span v-if="pagination.total > 1" class="view-subtitle">共 {{ pagination.total }} 页</span>
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
      <n-empty :description="loadError ? `加载失败：${loadError}` : '暂无内容'">
        <template #extra>
          <span>该分类下暂时没有可展示的内容</span>
        </template>
      </n-empty>
    </n-card>

    <!-- 歌手类：头像网格 -->
    <div v-else-if="pageType === 'singer'" class="singer-grid">
      <n-grid :cols="6" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="(item, index) in listItems" :key="index">
          <div class="singer-card" @click="handleItemClick(item, index)">
            <div class="singer-avatar">
              <img :src="item.img" :alt="item.name" />
            </div>
            <span class="singer-name">{{ item.name }}</span>
          </div>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 歌单/电台：封面卡片网格 -->
    <div v-else-if="pageType === 'playlist' || pageType === 'radio'" class="cover-grid">
      <n-grid :cols="5" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="(item, index) in listItems" :key="index">
          <div class="cover-card" @click="handleItemClick(item, index)">
            <img :src="item.img" :alt="item.name" class="cover-img" />
            <span class="cover-name" :title="item.name">{{ item.name }}</span>
          </div>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 歌曲/榜单/MV：列表（支持全选/多选播放） -->
    <template v-else>
      <div v-if="isPlayable" class="list-toolbar">
        <n-checkbox :checked="isAllSelected" :indeterminate="isIndeterminate" @update:checked="toggleSelectAll">
          全选<span v-if="selectedIndexes.size > 0" class="toolbar-count">已选 {{ selectedIndexes.size }} 首</span>
        </n-checkbox>
        <n-button type="primary" size="small" :disabled="selectedIndexes.size === 0" @click="playSelected">
          <template #icon>
            <n-icon>
              <PlayCircleOutline />
            </n-icon>
          </template>
          播放选中
        </n-button>
      </div>

      <n-list hoverable clickable class="song-list">
        <n-list-item v-for="(item, index) in listItems" :key="index"
          :class="{ 'list-item--selected': isSelected(index) }" @click="handleItemClick(item, index)">
          <template v-if="isPlayable" #prefix>
            <n-checkbox :checked="isSelected(index)" @click.stop="toggleSelect(index, $event)" />
          </template>
          <n-thing>
            <template #avatar>
              <img v-if="item.img" :src="item.img" class="song-avatar" alt="cover" />
              <div v-else class="hot-song-avatar">🎵</div>
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
    </template>

    <!-- 分页：固定定位在底部（完全参考站点 .page 结构） -->
    <nav v-if="!isLoading && listItems.length > 0 && pagination.items.length > 0" class="page"
      :style="{ bottom: pageBottom }" aria-label="分页导航">
      <template v-for="(link, idx) in pagination.items" :key="`${link.label}-${idx}`">
        <span v-if="link.current" class="page-link current" aria-current="page">{{ link.label }}</span>
        <a v-else-if="link.url" class="page-link" :href="link.url" @click="handlePageClick(link, $event)">{{ link.label
          }}</a>
        <span v-else class="page-link disabled">{{ link.label }}</span>
      </template>
    </nav>
  </div>
</template>

<style scoped>
.category-view {
  padding: 8px 4px 20px;
  /* 为底部固定分页预留空间，避免遮挡内容 */
  padding-bottom: 96px;
}

/* 面包屑 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 14px;
}

.breadcrumb-link {
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #1890ff;
}

.breadcrumb-sep {
  color: #d1d5db;
}

.breadcrumb-current {
  color: #374151;
  font-weight: 500;
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
  color: #1f2937;
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
  color: #9ca3af;
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

.empty-container {
  margin-top: 20px;
  min-height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
}

.song-list {
  margin-top: 4px;
}

/* 列表工具栏（全选 + 播放选中） */
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.04);
}

.toolbar-count {
  margin-left: 8px;
  font-size: 12px;
  color: #1890ff;
}

/* 选中行高亮 */
.song-list :deep(.n-list-item.list-item--selected) {
  background: linear-gradient(90deg, #eef6ff, #f6efff);
  box-shadow: inset 0 0 0 1px rgba(24, 144, 255, 0.25);
}

.song-list :deep(.n-list-item) {
  border-radius: 12px;
  padding: 12px 16px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.song-list :deep(.n-list-item:hover) {
  background: linear-gradient(90deg, #f5f9ff, #faf7ff);
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.1);
  transform: translateX(2px);
}

.song-title {
  font-weight: 500;
  color: #1f2937;
}

.song-url {
  font-size: 12px;
  color: #b0b7c3;
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
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.singer-grid,
.cover-grid {
  margin-top: 4px;
}

.singer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 14px;
  transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease;
}

.singer-card:hover {
  transform: translateY(-4px);
  background-color: #f8fafc;
}

.singer-avatar {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  border: 2px solid #fff;
  transition: box-shadow 0.24s ease;
}

.singer-card:hover .singer-avatar {
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.28);
}

.singer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.singer-name {
  font-size: 13px;
  color: #374151;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-card {
  cursor: pointer;
  transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cover-card:hover {
  transform: translateY(-5px);
}

.cover-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.24s ease;
}

.cover-card:hover .cover-img {
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.25);
}

.cover-name {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 28px rgba(31, 45, 61, 0.12);
  transition: bottom 0.24s ease;
}

.page-link {
  min-width: 38px;
  height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #4b5563;
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
  background: #f2f8ff;
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
  color: #c0c4cc;
  background: #fafafa;
  border-color: #f0f0f0;
  cursor: not-allowed;
}
</style>
