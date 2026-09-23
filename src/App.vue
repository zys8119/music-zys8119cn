<script setup lang="ts">
import MusicHeader from './components/MusicHeader.vue'
import MusicSidebar from './components/MusicSidebar.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import KeyboardShortcuts from './components/KeyboardShortcuts.vue'
import HotRankings from './components/HotRankings.vue'
import LyricsPanel from './components/LyricsPanel.vue'
import FullscreenPlayer from './components/FullscreenPlayer.vue'
import { musicApi } from './services/api'

// 导入类型
import type { Song, Category } from './types/index'
import { PlayMode } from './types/index'
import { useTheme } from './composables/useTheme'
import { darkTheme } from 'naive-ui'

// 主题
const { mode: themeMode, isDark, setMode: setThemeMode } = useTheme()
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

// 创建路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const currentSong = ref<Song | null>(null)
const isPlaying = ref(false)
const volume = ref(0.8)
const currentTime = ref(0)
const duration = ref(0)
const playMode = ref<PlayMode>(PlayMode.SEQUENCE)
const categories = ref<Category[]>([])
const categoriesLoading = ref(false)

// 播放条是否可见（供播放器与分页联动）
const playerVisible = ref(true)

// 是否展开全屏播放页
const fullscreenOpen = ref(false)

// 当前歌词（原始 LRC 文本）
const currentLyric = ref('')

// 热门榜单分类（全站通用）
interface HotRanking {
  url: string;
  name: string;
  current: boolean;
}
const hotRankings = ref<{ title: string; list: HotRanking[] }>({ title: '热门榜单', list: [] })

async function fetchHotRankings() {
  try {
    const res = await musicApi.getHotRankings()
    if (res.code === 200 && res.data) {
      hotRankings.value = {
        title: res.data.title || '热门榜单',
        list: Array.isArray(res.data.list) ? res.data.list : [],
      }
    }
  } catch (error) {
    console.error('获取热门榜单出错:', error)
  }
}

// 动态加载真实站点导航分类
async function fetchCategories() {
  categoriesLoading.value = true
  try {
    const res = await musicApi.getCategories()
    if (res.code === 200 && Array.isArray(res.data)) {
      categories.value = res.data
    }
  } catch (error) {
    console.error('获取导航分类出错:', error)
  } finally {
    categoriesLoading.value = false
  }
}

// 组件挂载时加载分类
onMounted(() => {
  fetchCategories()
  fetchHotRankings()
})
const currentCategory = ref<number | null>(null)

// 歌曲列表
const playlist = ref<Song[]>([
])

// 获取真实歌曲信息
async function fetchRealSongInfo(url: string) {
  try {
    const result = await musicApi.getSongInfo(url)
    if (result.code === 200 && result.data) {
      return result.data
    }
    console.error('获取歌曲信息失败:', result)
    return null
  } catch (error) {
    console.error('请求歌曲信息出错:', error)
    return null
  }
}

// 判断是否为歌曲详情页链接（需请求真实播放地址；直链则无需再解析）
function isSongPageUrl(url: string): boolean {
  return /\/mp[34]\/[^/]+\.html?$/i.test(url)
}

// 获取歌词（依赖原始歌曲详情页 URL）
async function fetchLyric(url: string) {
  if (!isSongPageUrl(url)) {
    currentLyric.value = ''
    return
  }
  try {
    const res = await musicApi.getLyric(url)
    if (res.code === 200 && res.data) {
      currentLyric.value = res.data.lrc || ''
    } else {
      currentLyric.value = ''
    }
  } catch (error) {
    console.error('获取歌词出错:', error)
    currentLyric.value = ''
  }
}

// 播放歌曲
async function playSong(song: Song) {
  // 记录最近播放（用原始详情页 URL 作为唯一键）
  musicApi
    .addRecent({ title: song.title, artist: song.artist, cover: song.cover, url: song.url })
    .catch((e) => console.error('记录最近播放失败', e))

  // 仅当仍是歌曲详情页链接时才请求真实播放地址，避免重复解析
  if (song.url && isSongPageUrl(song.url)) {
    // 记录稳定的收藏键（详情页 URL）
    const stableKey = song.songKey || song.url
    // 先用原始详情页 URL 获取歌词
    fetchLyric(song.url)
    const realSongInfo = await fetchRealSongInfo(song.url)
    if (realSongInfo) {
      // 使用真实的歌曲信息更新当前歌曲
      currentSong.value = {
        ...song,
        songKey: stableKey,
        title: realSongInfo.title || song.title,
        cover: realSongInfo.pic || song.cover,
        url: realSongInfo.url || song.url
      }
    } else {
      // 获取失败时仍使用原始信息，并重建对象引用以确保播放器感知切换
      currentSong.value = { ...song, songKey: stableKey }
    }
  } else {
    // 已是可播放直链：清空歌词并重建对象引用
    currentLyric.value = ''
    currentSong.value = { ...song, songKey: song.songKey || song.url }
  }
  isPlaying.value = true
}

// 添加歌曲到播放列表并播放
async function addSongsToPlaylist(songs: Song[]) {
  if (songs.length === 0) return

  // 将新歌曲添加到播放列表中（以 songKey/url 作为唯一键，避免各列表页索引 id 跨批次重复导致误判为已存在）
  songs.forEach(song => {
    const key = song.songKey || song.url
    const exists = playlist.value.some(existingSong => (existingSong.songKey || existingSong.url) === key)
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
  if (!currentSong.value || playlist.value.length === 0) return

  const currentIndex = playlist.value.findIndex((song: Song) => song.id === currentSong.value?.id)

  switch (playMode.value) {
    case PlayMode.SINGLE:
      // 单曲循环：重复播放当前歌曲
      await playSong(currentSong.value)
      break

    case PlayMode.RANDOM:
      // 随机播放：尽量避开当前歌曲，避免连续重复
      if (playlist.value.length === 1) {
        await playSong(playlist.value[0])
      } else {
        let randomIndex = currentIndex
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * playlist.value.length)
        }
        await playSong(playlist.value[randomIndex])
      }
      break

    case PlayMode.LOOP:
      // 列表循环：播放完最后一首后回到第一首
      if (currentIndex === -1 || currentIndex === playlist.value.length - 1) {
        await playSong(playlist.value[0])
      } else {
        await playSong(playlist.value[currentIndex + 1])
      }
      break

    case PlayMode.SEQUENCE:
    default:
      // 顺序播放：播放完最后一首后停止
      if (currentIndex === -1 || currentIndex === playlist.value.length - 1) {
        isPlaying.value = false
      } else {
        await playSong(playlist.value[currentIndex + 1])
      }
      break
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

// 切换播放模式
function togglePlayMode() {
  const modes = [PlayMode.SEQUENCE, PlayMode.LOOP, PlayMode.SINGLE, PlayMode.RANDOM]
  const currentIndex = modes.indexOf(playMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  playMode.value = modes[nextIndex]
}

// 下载歌曲
function downloadSong() {
  if (!currentSong.value) {
    useMessage().warning('没有正在播放的歌曲')
    return
  }

  const song = currentSong.value
  const link = document.createElement('a')
  link.href = song.url
  link.download = `${song.artist} - ${song.title}.mp3`
  link.target = '_blank'

  // 添加到DOM并触发点击
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  useMessage().success(`开始下载：${song.title}`)
}

// 删除选中的歌曲
function removeSongs(songIds: number[]) {
  // 检查当前播放的歌曲是否在删除列表中
  const isCurrentSongDeleted = currentSong.value && songIds.includes(currentSong.value.id)

  // 从播放列表中移除选中的歌曲
  playlist.value = playlist.value.filter(song => !songIds.includes(song.id))

  // 如果当前播放的歌曲被删除，停止播放并清空当前歌曲
  if (isCurrentSongDeleted) {
    isPlaying.value = false
    currentSong.value = null
    currentTime.value = 0
    duration.value = 0
  }
}

// 清空播放列表
function clearPlaylist() {
  playlist.value = []
  isPlaying.value = false
  currentSong.value = null
  currentTime.value = 0
  duration.value = 0
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
          ; (window as any).savedVolume = savedVolume
      } else {
        // 恢复之前的音量
        volume.value = (window as any).savedVolume || 0.8
      }
      break
    case 'KeyL': // L键：切换播放模式
      event.preventDefault()
      togglePlayMode()
      break
    case 'KeyD': // D键：下载歌曲
      event.preventDefault()
      downloadSong()
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

// 处理分类变更：跳转到分类页并携带目标站点 URL/类型
function handleCategoryChange(categoryId: number) {
  currentCategory.value = categoryId
  const category = categories.value.find((c) => c.id === categoryId)
  if (!category) return

  // 首页直接回首页
  if (category.type === 'home') {
    router.push({ name: 'home' })
    return
  }

  router.push({
    name: 'category',
    params: { id: categoryId.toString() },
    query: { url: category.url, name: category.name, type: category.type },
  })
}

// 处理热门榜单点击：跳转到对应榜单分类页
function handleHotRankingClick(item: { url: string; name: string }) {
  // 找到匹配的导航分类 id 以便高亮，找不到则使用占位 id
  const matched = categories.value.find((c) => c.url === item.url)
  const id = matched ? matched.id : -1
  currentCategory.value = id
  router.push({
    name: 'category',
    params: { id: id.toString() },
    query: { url: item.url, name: item.name, type: matched?.type || 'rank' },
  })
}

// 提供全局数据
provide('playlist', playlist)
provide('currentSong', currentSong)
provide('isPlaying', isPlaying)
provide('volume', volume)
provide('playerVisible', playerVisible)
provide('themeMode', themeMode)
provide('isDark', isDark)
provide('setThemeMode', setThemeMode)
provide('fullscreenOpen', fullscreenOpen)
provide('currentLyric', currentLyric)
provide('currentTime', currentTime)
provide('duration', duration)
provide('playMode', playMode)
provide('togglePlayMode', togglePlayMode)
provide('categories', categories)
provide('hotRankings', hotRankings)
provide('handleHotRankingClick', handleHotRankingClick)
provide('currentCategory', currentCategory)
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
provide('removeSongs', removeSongs)
provide('clearPlaylist', clearPlaylist)
provide('downloadSong', downloadSong)
</script>

<template>
  <n-config-provider :theme="naiveTheme">
    <n-message-provider>
      <div class="h-100vh flex flex-col overflow-hidden">
        <MusicHeader :categories="categories" :current-category="currentCategory"
          @change-category="handleCategoryChange" />
        <n-layout class="flex-1 overflow-hidden app-layout" has-sider>
          <MusicSidebar :playlist="playlist" :current-song="currentSong" :categories="categories"
            :current-category="currentCategory" @play-song="playSong" @change-category="handleCategoryChange"
            @remove-songs="removeSongs" @clear-playlist="clearPlaylist" />
          <n-layout-content class="overflow-y-auto p-6 pt-22 pb-24 scrollbar-hide">
            <HotRankings />
            <router-view />
          </n-layout-content>
        </n-layout>
        <MusicPlayer :current-song="currentSong" :is-playing="isPlaying" :volume="volume" @toggle-play="togglePlay"
          @play-next="playNext" @play-prev="playPrev" @update:volume="(val: number) => volume = val"
          @toggle-play-mode="togglePlayMode" @download-song="downloadSong" />
        <LyricsPanel />
        <FullscreenPlayer />
        <KeyboardShortcuts />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
/* 内容区布局使用主题背景，覆盖 Naive UI 默认色 */
.app-layout {
  --n-color: transparent !important;
  background: transparent;
}

.app-layout :deep(.n-layout-scroll-container) {
  background: transparent;
}

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
