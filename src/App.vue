<script setup lang="ts">
import MusicHeader from './components/MusicHeader.vue'
import MusicSidebar from './components/MusicSidebar.vue'
import MusicPlayer from './components/MusicPlayer.vue'

// 导入类型
import type { Song, Category } from './types/index'

// 创建路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const currentSong = ref<Song | null>(null)
const isPlaying = ref(false)
const volume = ref(0.8)
const categories = ref<Category[]>([
  { id: 1, name: '流行' },
  { id: 2, name: '摇滚' },
  { id: 3, name: '电子' },
  { id: 4, name: '古典' },
  { id: 5, name: '爵士' },
  { id: 6, name: '民谣' }
])
const currentCategory = ref<number | null>(null)

// 歌曲列表
const playlist = ref<Song[]>([
  {
    id: 1,
    title: '天真的橡皮',
    artist: '测试歌手',
    album: '测试专辑',
    category: 1,
    cover: 'https://p2.music.126.net/9Y-LlcH5-OEPClZp3sacCw==/109951166361218466.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=test.mp3'
  }
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

// 处理分类变更
function handleCategoryChange(categoryId: number) {
  currentCategory.value = categoryId
}

// 提供全局数据
provide('playlist', playlist)
provide('currentSong', currentSong)
provide('isPlaying', isPlaying)
provide('volume', volume)
provide('categories', categories)
provide('currentCategory', currentCategory)
provide('playSong', playSong)
provide('togglePlay', togglePlay)
provide('playNext', playNext)
provide('playPrev', playPrev)
provide('handleCategoryChange', handleCategoryChange)
</script>

<template>
  <n-config-provider>
    <n-message-provider>
      <div class="app-container">
        <MusicHeader 
          :categories="categories"
          :current-category="currentCategory"
          @change-category="handleCategoryChange"
        />
        <div class="main-content">
          <MusicSidebar
            :playlist="playlist"
            :current-song="currentSong"
            :categories="categories"
            :current-category="currentCategory"
            @play-song="playSong"
            @change-category="handleCategoryChange"
          />
          <div class="content">
            <router-view />
          </div>
        </div>
        <MusicPlayer
          :current-song="currentSong"
          :is-playing="isPlaying"
          :volume="volume"
          @toggle-play="togglePlay"
          @play-next="playNext"
          @play-prev="playPrev"
          @update:volume="(val: number) => volume = val"
        />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-top: 88px; /* 为顶部导航栏留出空间 */
  padding-bottom: 96px; /* 为底部播放器留出空间 */
}
</style>
