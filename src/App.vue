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
    title: '晴天',
    artist: '周杰伦',
    album: '叶惠美',
    category: 1,
    cover: 'https://p2.music.126.net/9Y-LlcH5-OEPClZp3sacCw==/109951166361218466.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=186016.mp3'
  },
  {
    id: 2,
    title: '七里香',
    artist: '周杰伦',
    album: '七里香',
    category: 1,
    cover: 'https://p1.music.126.net/mmGgGtdktKY0nSgwa7tN_A==/109951166199683549.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=186001.mp3'
  },
  {
    id: 3,
    title: '爱在西元前',
    artist: '周杰伦',
    album: 'Jay',
    category: 1,
    cover: 'https://p2.music.126.net/sSxbRt9RpC6s_MaewyDJfA==/109951165566399390.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=185868.mp3'
  },
  {
    id: 4,
    title: 'Yellow',
    artist: 'Coldplay',
    album: 'Parachutes',
    category: 2,
    cover: 'https://p2.music.126.net/2bA9SRy3vj7MKGPbRaE57g==/109951163533012556.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=17177324.mp3'
  },
  {
    id: 5,
    title: 'The Scientist',
    artist: 'Coldplay',
    album: 'A Rush of Blood to the Head',
    category: 2,
    cover: 'https://p1.music.126.net/N_8SmJQ-tJhAdJE9PNmyDw==/109951163533011733.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=17177296.mp3'
  },
  {
    id: 6,
    title: 'Something Just Like This',
    artist: 'The Chainsmokers / Coldplay',
    album: 'Something Just Like This',
    category: 3,
    cover: 'https://p1.music.126.net/ggnyubDdMxrhpqYvpZbhEQ==/3302932937412681.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=461347998.mp3'
  },
  {
    id: 7,
    title: '夜曲',
    artist: '周杰伦',
    album: '十一月的萧邦',
    category: 1,
    cover: 'https://p1.music.126.net/8y8KJC1eCSO_vUKf2MyZwA==/109951165796899183.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=185815.mp3'
  },
  {
    id: 8,
    title: 'Fix You',
    artist: 'Coldplay',
    album: 'X&Y',
    category: 2,
    cover: 'https://p2.music.126.net/Q4Dg5QXwDL7rM_cRBPc2gw==/109951163533010585.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=3586155.mp3'
  },
  {
    id: 9,
    title: 'Viva La Vida',
    artist: 'Coldplay',
    album: 'Viva La Vida or Death and All His Friends',
    category: 2,
    cover: 'https://p2.music.126.net/2bA9SRy3vj7MKGPbRaE57g==/109951163533012556.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=3586155.mp3'
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
