<script setup lang="ts">
import MusicHeader from './components/MusicHeader.vue'
import MusicSidebar from './components/MusicSidebar.vue'
import MusicPlayer from './components/MusicPlayer.vue'

// 导入类型
import type { Song, Category } from './types/index'

// 定义热门榜单分类类型
interface HotListCategory {
  url: string;
  name: string;
}

// 创建路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const currentSong = ref<Song | null>(null)
const isPlaying = ref(false)
const volume = ref(0.8)
const categories = ref<Category[]>([
  { id: 1, name: '热门榜单' },
  { id: 2, name: '新歌榜' },
  { id: 3, name: '排行榜' },
  { id: 4, name: '摇滚' },
  { id: 5, name: '电子' },
  { id: 6, name: '古典' },
  { id: 7, name: '爵士' },
  { id: 8, name: '民谣' }
])
const currentCategory = ref<number | null>(null)
const hotListCategories = ref<HotListCategory[]>([])
const showHotListDropdown = ref(false)

// 歌曲列表
const playlist = ref<Song[]>([
])

// 播放歌曲
function playSong(song: Song) {
  currentSong.value = song
  isPlaying.value = true
}

// 切换播放状态
function togglePlay() {
  isPlaying.value = !isPlaying.value
}

// 播放下一首
function playNext() {
  if (!currentSong.value) return

  const currentIndex = playlist.value.findIndex((song: Song) => song.id === currentSong.value?.id)
  if (currentIndex === -1 || currentIndex === playlist.value.length - 1) {
    // 如果是最后一首，则播放第一首
    currentSong.value = playlist.value[0]
  } else {
    // 否则播放下一首
    currentSong.value = playlist.value[currentIndex + 1]
  }

  isPlaying.value = true
}

// 播放上一首
function playPrev() {
  if (!currentSong.value) return

  const currentIndex = playlist.value.findIndex((song: Song) => song.id === currentSong.value?.id)
  if (currentIndex === -1 || currentIndex === 0) {
    // 如果是第一首，则播放最后一首
    currentSong.value = playlist.value[playlist.value.length - 1]
  } else {
    // 否则播放上一首
    currentSong.value = playlist.value[currentIndex - 1]
  }

  isPlaying.value = true
}

// 获取热门榜单分类
async function fetchHotListCategories() {
  try {
    const response = await fetch('http://localhost:81/music/hotList')
    if (response.ok) {
      const data = await response.json()
      hotListCategories.value = Array.isArray(data) ? data : []
    } else {
      console.error('获取热门榜单分类失败:', response.statusText)
      // 提供模拟数据作为容错
      hotListCategories.value = [
        { url: 'https://www.22a5.com/list/djwuqu.html', name: 'DJ舞曲大全' },
        { url: 'https://example.com/pop', name: '流行榜单' },
        { url: 'https://example.com/rock', name: '摇滚榜单' }
      ]
    }
  } catch (error) {
    console.error('获取热门榜单分类出错:', error)
    // 提供模拟数据作为容错
    hotListCategories.value = [
      { url: 'https://www.22a5.com/list/djwuqu.html', name: 'DJ舞曲大全' },
      { url: 'https://example.com/pop', name: '流行榜单' },
      { url: 'https://example.com/rock', name: '摇滚榜单' }
    ]
  }
}

// 处理分类变更
function handleCategoryChange(categoryId: number) {
  currentCategory.value = categoryId
  // 如果点击的是热门榜单，获取二级分类
  if (categoryId === 1) {
    fetchHotListCategories()
    showHotListDropdown.value = !showHotListDropdown.value
  } else {
    showHotListDropdown.value = false
  }
}

// 处理热门榜单分类点击
function handleHotListCategoryClick(category: HotListCategory) {
  console.log('点击热门榜单分类:', category.name, category.url)
  // 这里可以添加跳转到对应榜单页面的逻辑
  if (category.url) {
    window.open(category.url, '_blank')
  }
  showHotListDropdown.value = false
}

// 提供全局数据
provide('playlist', playlist)
provide('currentSong', currentSong)
provide('isPlaying', isPlaying)
provide('volume', volume)
provide('categories', categories)
provide('currentCategory', currentCategory)
provide('hotListCategories', hotListCategories)
provide('showHotListDropdown', showHotListDropdown)
provide('playSong', playSong)
provide('togglePlay', togglePlay)
provide('playNext', playNext)
provide('playPrev', playPrev)
provide('handleCategoryChange', handleCategoryChange)
provide('handleHotListCategoryClick', handleHotListCategoryClick)
</script>

<template>
  <n-config-provider>
    <n-message-provider>
      <div class="h-100vh flex flex-col overflow-hidden">
        <MusicHeader 
          :categories="categories" 
          :current-category="currentCategory"
          :hot-list-categories="hotListCategories"
          :show-hot-list-dropdown="showHotListDropdown"
          @change-category="handleCategoryChange"
          @hot-list-category-click="handleHotListCategoryClick" />
        <n-layout class="flex-1 overflow-hidden" has-sider>
          <MusicSidebar :playlist="playlist" :current-song="currentSong" :categories="categories"
            :current-category="currentCategory" @play-song="playSong" @change-category="handleCategoryChange" />
          <n-layout-content class="overflow-y-auto p-6 pt-22 pb-24 scrollbar-hide">
            <router-view />
          </n-layout-content>
        </n-layout>
        <MusicPlayer :current-song="currentSong" :is-playing="isPlaying" :volume="volume" @toggle-play="togglePlay"
          @play-next="playNext" @play-prev="playPrev" @update:volume="(val: number) => volume = val" />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
/* 隐藏滚动条但保持滚动功能 */
.scrollbar-hide {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
}
</style>
