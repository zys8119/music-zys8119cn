<script setup lang="ts">
import MusicHeader from './components/MusicHeader.vue'
import MusicSidebar from './components/MusicSidebar.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import KeyboardShortcuts from './components/KeyboardShortcuts.vue'

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
const currentTime = ref(0)
const duration = ref(0)
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

// 获取真实歌曲信息
async function fetchRealSongInfo(url: string) {
  try {
    const response = await fetch(`http://localhost:81/music/get?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const result = await response.json()
      if (result.code === 200 && result.data) {
        return result.data
      }
    }
    console.error('获取歌曲信息失败:', response.statusText)
    return null
  } catch (error) {
    console.error('请求歌曲信息出错:', error)
    return null
  }
}

// 播放歌曲
async function playSong(song: Song) {
  // 如果歌曲有URL，先获取真实的歌曲信息
  if (song.url) {
    const realSongInfo = await fetchRealSongInfo(song.url)
    if (realSongInfo) {
      // 使用真实的歌曲信息更新当前歌曲
      const updatedSong: Song = {
        ...song,
        title: realSongInfo.title || song.title,
        cover: realSongInfo.pic || song.cover,
        url: realSongInfo.url || song.url
      }
      currentSong.value = updatedSong
    } else {
      // 如果获取失败，使用原始歌曲信息
      currentSong.value = song
    }
  } else {
    currentSong.value = song
  }
  isPlaying.value = true
}

// 添加歌曲到播放列表并播放
async function addSongsToPlaylist(songs: Song[]) {
  if (songs.length === 0) return
  
  // 将新歌曲添加到播放列表中
  songs.forEach(song => {
    // 检查歌曲是否已存在于播放列表中
    const exists = playlist.value.some(existingSong => existingSong.id === song.id)
    if (!exists) {
      playlist.value.push(song)
    }
  })
  
  // 播放第一首歌曲
  await playSong(songs[0])
}

// 切换播放状态
function togglePlay() {
  isPlaying.value = !isPlaying.value
}

// 播放下一首
async function playNext() {
  if (!currentSong.value) return

  const currentIndex = playlist.value.findIndex((song: Song) => song.id === currentSong.value?.id)
  if (currentIndex === -1 || currentIndex === playlist.value.length - 1) {
    // 如果是最后一首，则播放第一首
    await playSong(playlist.value[0])
  } else {
    // 否则播放下一首
    await playSong(playlist.value[currentIndex + 1])
  }
}

// 播放上一首
async function playPrev() {
  if (!currentSong.value) return

  const currentIndex = playlist.value.findIndex((song: Song) => song.id === currentSong.value?.id)
  if (currentIndex === -1 || currentIndex === 0) {
    // 如果是第一首，则播放最后一首
    await playSong(playlist.value[playlist.value.length - 1])
  } else {
    // 否则播放上一首
    await playSong(playlist.value[currentIndex - 1])
  }
}

// 音量控制
function adjustVolume(delta: number) {
  const newVolume = Math.max(0, Math.min(1, volume.value + delta))
  volume.value = newVolume
}

// 播放进度控制
function seekTo(time: number) {
  currentTime.value = Math.max(0, Math.min(duration.value, time))
}

// 快进/快退
function seek(delta: number) {
  const newTime = currentTime.value + delta
  seekTo(newTime)
}

// 键盘快捷键处理
function handleKeydown(event: KeyboardEvent) {
  // 如果用户正在输入框中输入，则不处理快捷键
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  switch (event.code) {
    case 'Space': // 空格键：播放/暂停
      event.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft': // 左箭头：上一首或快退
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + 左箭头：快退10秒
        seek(-10)
      } else {
        // 左箭头：上一首
        playPrev()
      }
      break
    case 'ArrowRight': // 右箭头：下一首或快进
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + 右箭头：快进10秒
        seek(10)
      } else {
        // 右箭头：下一首
        playNext()
      }
      break
    case 'ArrowUp': // 上箭头：音量增加
      event.preventDefault()
      adjustVolume(0.1)
      break
    case 'ArrowDown': // 下箭头：音量减少
      event.preventDefault()
      adjustVolume(-0.1)
      break
    case 'KeyM': // M键：静音/取消静音
      event.preventDefault()
      if (volume.value > 0) {
        // 保存当前音量并静音
        const savedVolume = volume.value
        volume.value = 0
        // 将保存的音量存储到一个临时变量中
        ;(window as any).savedVolume = savedVolume
      } else {
        // 恢复之前的音量
        volume.value = (window as any).savedVolume || 0.8
      }
      break
    case 'Digit0':
    case 'Digit1':
    case 'Digit2':
    case 'Digit3':
    case 'Digit4':
    case 'Digit5':
    case 'Digit6':
    case 'Digit7':
    case 'Digit8':
    case 'Digit9':
      // 数字键0-9：跳转到对应的播放进度百分比
      event.preventDefault()
      const digit = parseInt(event.code.replace('Digit', ''))
      const targetTime = (duration.value * digit) / 10
      seekTo(targetTime)
      break
  }
}

// 组件挂载时添加键盘事件监听器
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载时移除键盘事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

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
provide('currentTime', currentTime)
provide('duration', duration)
provide('categories', categories)
provide('currentCategory', currentCategory)
provide('hotListCategories', hotListCategories)
provide('showHotListDropdown', showHotListDropdown)
provide('playSong', playSong)
provide('globalPlaySong', playSong)
provide('addSongsToPlaylist', addSongsToPlaylist)
provide('togglePlay', togglePlay)
provide('playNext', playNext)
provide('playPrev', playPrev)
provide('adjustVolume', adjustVolume)
provide('seekTo', seekTo)
provide('seek', seek)
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
        <KeyboardShortcuts />
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
