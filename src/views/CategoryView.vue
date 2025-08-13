<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import { NList, NListItem, NThing, NTag, NEmpty, NCard, NGrid, NGridItem, NCheckbox, NButton, NSpace } from 'naive-ui'

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
}

interface HotListCategory {
  url: string;
  name: string;
}

interface HotListSong {
  url: string;
  name: string;
}

const route = useRoute()
const categoryId = computed(() => Number(route.params.id))

const props = defineProps({
  playlist: {
    type: Array as () => Song[],
    default: () => []
  },
  categories: {
    type: Array as () => Category[],
    default: () => []
  },
  currentSong: {
    type: Object as () => Song | null,
    default: null
  }
})

const emit = defineEmits<{
  (e: 'play-song', song: Song): void;
  (e: 'play-songs', songs: Song[]): void;
}>()

// 注入全局播放函数
const addSongsToPlaylist = inject('addSongsToPlaylist') as (songs: Song[]) => void

// 复选框状态管理
const selectedSongs = ref<Set<number>>(new Set())
const isAllSelected = computed(() => {
  return filteredPlaylist.value.length > 0 && selectedSongs.value.size === filteredPlaylist.value.length
})
const isIndeterminate = computed(() => {
  return selectedSongs.value.size > 0 && selectedSongs.value.size < filteredPlaylist.value.length
})

// 热门榜单分类数据
const hotListCategories = ref<HotListCategory[]>([])
const isLoadingCategories = ref(false)
const selectedCategory = ref<string | null>(null)

// 热门榜单歌曲数据
const hotListSongs = ref<HotListSong[]>([])
const isLoadingSongs = ref(false)

// 热门榜单歌曲复选框状态管理
const selectedHotListSongs = ref<Set<number>>(new Set())
const isAllHotListSelected = computed(() => {
  return hotListSongs.value.length > 0 && selectedHotListSongs.value.size === hotListSongs.value.length
})
const isHotListIndeterminate = computed(() => {
  return selectedHotListSongs.value.size > 0 && selectedHotListSongs.value.size < hotListSongs.value.length
})

// 获取热门榜单分类
const fetchHotListCategories = async () => {
  if (categoryId.value !== 1) {
    hotListCategories.value = []
    selectedCategory.value = null
    return
  }

  isLoadingCategories.value = true
  try {
    const response = await fetch('http://localhost:81/music/hotList')
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.data) && data.data.length > 0) {
        hotListCategories.value = data.data
        // 设置默认选中第一个分类并自动请求歌曲数据
        if (hotListCategories.value.length > 0 && !selectedCategory.value) {
          const firstCategory = hotListCategories.value[0]
          selectedCategory.value = firstCategory.name
          // 自动请求第一个分类的歌曲数据
          if (firstCategory.url) {
            fetchHotListSongs(firstCategory.url)
          }
        }
      } else {
        hotListCategories.value = []
        selectedCategory.value = null
      }
    } else {
      console.error('获取热门榜单分类失败:', response.statusText)
      hotListCategories.value = []
      selectedCategory.value = null
    }
  } catch (error) {
    console.error('获取热门榜单分类出错:', error)
    hotListCategories.value = []
    selectedCategory.value = null
  } finally {
    isLoadingCategories.value = false
  }
}
// 获取热门榜单歌曲
const fetchHotListSongs = async (url: string) => {
  isLoadingSongs.value = true
  try {
    const response = await fetch(`http://localhost:81/music/getHotPlayList?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.data) && data.data.length > 0) {
        hotListSongs.value = data.data
      } else {
        hotListSongs.value = []
      }
    } else {
      console.error('获取热门榜单歌曲失败:', response.statusText)
      hotListSongs.value = []
    }
  } catch (error) {
    console.error('获取热门榜单歌曲出错:', error)
    hotListSongs.value = []
  } finally {
    isLoadingSongs.value = false
  }
}

// 处理分类点击
const handleCategoryClick = (category: HotListCategory) => {
  console.log('点击分类:', category.name, category.url)
  selectedCategory.value = category.name
  // 清空热门榜单歌曲选中状态
  selectedHotListSongs.value.clear()
  // 请求歌曲数据
  if (category.url) {
    fetchHotListSongs(category.url)
  }
}

// 处理热门榜单歌曲点击
const handleHotListSongClick = (song: HotListSong, index: number) => {
  console.log('点击歌曲:', song.name, song.url)
  // 创建一个临时的Song对象用于播放
  const tempSong: Song = {
    id: index + 1000, // 使用索引+1000作为临时ID，避免与普通歌曲冲突
    title: song.name,
    artist: '热门榜单',
    url: song.url,
    category: categoryId.value
  }
  // 使用全局播放列表函数
  addSongsToPlaylist([tempSong])
}

// 处理热门榜单歌曲复选框变化
const handleHotListSongCheck = (index: number, checked: boolean) => {
  if (checked) {
    selectedHotListSongs.value.add(index)
  } else {
    selectedHotListSongs.value.delete(index)
  }
}

// 处理热门榜单全选/取消全选
const handleHotListSelectAll = (checked: boolean) => {
  if (checked) {
    hotListSongs.value.forEach((_, index) => {
      selectedHotListSongs.value.add(index)
    })
  } else {
    selectedHotListSongs.value.clear()
  }
}

// 播放选中的热门榜单歌曲
const playSelectedHotListSongs = () => {
  const songsToPlay: Song[] = []
  selectedHotListSongs.value.forEach(index => {
    const song = hotListSongs.value[index]
    if (song) {
      songsToPlay.push({
        id: index + 1000,
        title: song.name,
        artist: '热门榜单',
        url: song.url,
        category: categoryId.value
      })
    }
  })
  if (songsToPlay.length > 0) {
    // 使用全局播放列表函数
    addSongsToPlaylist(songsToPlay)
    selectedHotListSongs.value.clear()
  }
}

// 处理热门榜单歌曲项点击（避免复选框冲突）
const handleHotListSongItemClick = (song: HotListSong, index: number, event: Event) => {
  // 如果点击的是复选框区域，不触发播放
  const target = event.target as HTMLElement
  if (target.closest('.n-checkbox') || target.closest('.song-checkbox')) {
    return
  }
  handleHotListSongClick(song, index)
}

// 根据当前分类过滤歌曲列表
const filteredPlaylist = computed((): Song[] => {
  return props.playlist.filter(song => song.category === categoryId.value)
})

// 获取当前分类名称
const categoryName = computed((): string => {
  const category = props.categories.find(cat => cat.id === categoryId.value)
  return category ? category.name : '未知分类'
})

const isActive = (song: Song): boolean => {
  return Boolean(props.currentSong && props.currentSong.id === song.id)
}

const handlePlaySong = (song: Song): void => {
  // 使用全局播放列表函数
  addSongsToPlaylist([song])
}

// 处理单个歌曲复选框变化
const handleSongCheck = (song: Song, checked: boolean) => {
  if (checked) {
    selectedSongs.value.add(song.id)
  } else {
    selectedSongs.value.delete(song.id)
  }
}

// 处理全选/取消全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    filteredPlaylist.value.forEach(song => {
      selectedSongs.value.add(song.id)
    })
  } else {
    selectedSongs.value.clear()
  }
}

// 播放选中的歌曲
const playSelectedSongs = () => {
  const songsToPlay = filteredPlaylist.value.filter(song => selectedSongs.value.has(song.id))
  if (songsToPlay.length > 0) {
    // 使用全局播放列表函数
    addSongsToPlaylist(songsToPlay)
    selectedSongs.value.clear()
  }
}

// 处理歌曲项点击（避免复选框冲突）
const handleSongItemClick = (song: Song, event: Event) => {
  // 如果点击的是复选框区域，不触发播放
  const target = event.target as HTMLElement
  if (target.closest('.n-checkbox') || target.closest('.song-checkbox')) {
    return
  }
  handlePlaySong(song)
}

// 监听路由变化
watch(categoryId, () => {
  fetchHotListCategories()
}, { immediate: true })

// 组件挂载时获取数据
onMounted(() => {
  fetchHotListCategories()
})
</script>

<template>
  <div class="category-view">
    <h1>{{ categoryName }}</h1>
    <!-- 热门榜单二级分类 -->
    <div v-if="categoryId === 1 && hotListCategories.length > 0" class="hot-list-categories">
      <h3 class="categories-title">热门榜单</h3>
      <n-grid :cols="6" :x-gap="12" :y-gap="12" class="categories-grid">
        <n-grid-item v-for="category in hotListCategories" :key="category.name">
          <div 
            class="category-tag" 
            :class="{ 'category-tag--selected': selectedCategory === category.name }"
            @click="handleCategoryClick(category)"
          >
            {{ category.name }}
          </div>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 热门榜单歌曲列表 -->
    <div v-if="categoryId === 1 && selectedCategory && hotListSongs.length > 0" class="hot-list-songs">
      <h3 class="songs-title">{{ selectedCategory }} - 歌曲列表</h3>
      <div v-if="isLoadingSongs" class="loading-container">
        <span>加载中...</span>
      </div>
      <div v-else>
        <!-- 热门榜单全选和批量操作区域 -->
        <div class="batch-controls">
          <n-space align="center">
            <n-checkbox 
              :checked="isAllHotListSelected" 
              :indeterminate="isHotListIndeterminate"
              @update:checked="handleHotListSelectAll"
            >
              全选 ({{ selectedHotListSongs.size }}/{{ hotListSongs.length }})
            </n-checkbox>
            <n-button 
              type="primary" 
              size="small" 
              :disabled="selectedHotListSongs.size === 0"
              @click="playSelectedHotListSongs"
            >
              播放选中 ({{ selectedHotListSongs.size }})
            </n-button>
          </n-space>
        </div>
        
        <n-list hoverable clickable>
          <n-list-item 
            v-for="(song, index) in hotListSongs" 
            :key="index" 
            @click="handleHotListSongItemClick(song, index, $event)"
          >
            <n-thing>
              <template #avatar>
                <div class="song-avatar-container">
                  <n-checkbox 
                    class="song-checkbox"
                    :checked="selectedHotListSongs.has(index)"
                    @update:checked="(checked) => handleHotListSongCheck(index, checked)"
                    @click.stop
                  />
                  <div class="hot-song-avatar">
                    🎵
                  </div>
                </div>
              </template>
              <template #header>
                <div class="song-header">
                  <span class="song-title">{{ song.name }}</span>
                </div>
              </template>
              <template #description>
                <span class="song-url">{{ song.url }}</span>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </div>
    </div>

    <div v-if="filteredPlaylist.length > 0" class="song-list">
      <!-- 全选和批量操作区域 -->
      <div class="batch-controls">
        <n-space align="center">
          <n-checkbox 
            :checked="isAllSelected" 
            :indeterminate="isIndeterminate"
            @update:checked="handleSelectAll"
          >
            全选 ({{ selectedSongs.size }}/{{ filteredPlaylist.length }})
          </n-checkbox>
          <n-button 
            type="primary" 
            size="small" 
            :disabled="selectedSongs.size === 0"
            @click="playSelectedSongs"
          >
            播放选中 ({{ selectedSongs.size }})
          </n-button>
        </n-space>
      </div>
      
      <n-list hoverable clickable>
        <n-list-item 
          v-for="song in filteredPlaylist" 
          :key="song.id" 
          :class="{ 'active-song': isActive(song) }"
          @click="handleSongItemClick(song, $event)"
        >
          <n-thing>
            <template #avatar>
              <div class="song-avatar-container">
                <n-checkbox 
                  class="song-checkbox"
                  :checked="selectedSongs.has(song.id)"
                  @update:checked="(checked) => handleSongCheck(song, checked)"
                  @click.stop
                />
                <img :src="song.cover || 'https://via.placeholder.com/50'" class="song-avatar" alt="Cover">
              </div>
            </template>
            <template #header>
              <div class="song-header">
                <span class="song-title">{{ song.title }}</span>
              </div>
            </template>
            <template #description>
              <span class="song-artist">{{ song.artist }}</span>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
    </div>

    <n-card v-else class="empty-container">
      <n-empty description="暂无歌曲">
        <template #extra>
          <span>该分类下暂时没有歌曲</span>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<style scoped>
.category-view {
  padding: 20px;
}

.song-list {
  margin-top: 20px;
}

.song-header {
  display: flex;
  align-items: center;
}

.song-title {
  font-weight: 500;
}

.song-artist {
  font-size: 12px;
  color: #888;
}

.active-song {
  background-color: #e6f7ff !important;
}

.empty-container {
  margin-top: 20px;
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 热门榜单分类样式 */
.hot-list-categories {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.categories-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.categories-grid {
  margin-top: 16px;
}

.category-tag {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.category-tag:active {
  transform: translateY(0);
}

.category-tag--selected {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.category-tag--selected:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 热门榜单歌曲列表样式 */
.hot-list-songs {
  margin: 20px 0;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.songs-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-left: 4px solid #52c41a;
  padding-left: 12px;
}

.loading-container {
  text-align: center;
  padding: 40px;
  color: #666;
}

.song-url {
  font-size: 12px;
  color: #999;
  word-break: break-all;
}

/* 批量操作区域样式 */
.batch-controls {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

/* 歌曲头像容器样式 */
.song-avatar-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.song-checkbox {
  flex-shrink: 0;
}

.song-avatar {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.hot-song-avatar {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}
</style>