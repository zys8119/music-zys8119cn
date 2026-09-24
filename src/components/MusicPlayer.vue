<script setup lang="ts">
import { Howl } from 'howler'
import type { Ref } from 'vue'
import { NIcon } from 'naive-ui'
import {
  PlayCircle,
  PauseCircle,
  PlaySkipForward,
  PlaySkipBack,
  VolumeHigh,
  VolumeMute,
  Repeat,
  Shuffle,
  PlayForward,
  RefreshCircle,
  Download,
  ChevronUp,
  ChevronDown,
  Heart,
  HeartOutline
} from '@vicons/ionicons5'
import { musicApi } from '../services/api'

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  category: number;
  cover: string;
  url: string;
  songKey?: string;
}

const props = defineProps<{
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
}>()

const emit = defineEmits<{
  'toggle-play': [];
  'play-next': [];
  'play-prev': [];
  'update:volume': [volume: number];
  'toggle-play-mode': [];
  'download-song': [];
}>()

const message = useMessage()
const sound = ref<Howl | null>(null)
const localCurrentTime = ref(0)
const localDuration = ref(0)
const isMuted = ref(false)
const previousVolume = ref(props.volume)

// 注入全局状态
const globalCurrentTime = inject('currentTime', ref(0))
const globalDuration = inject('duration', ref(0))
const globalSeekTo = inject('seekTo', () => { })
const playMode = inject('playMode', ref('sequence'))
// 播放条可见状态（与分页联动）
const playerVisible = inject<Ref<boolean>>('playerVisible', ref(true))
// 全屏播放页开关
const fullscreenOpen = inject<Ref<boolean>>('fullscreenOpen', ref(false))

// 切换全屏播放页（快捷键 F / 封面按钮复用）
function toggleFullscreen() {
  if (!props.currentSong) return
  fullscreenOpen.value = !fullscreenOpen.value
}

// F 键：切换全屏播放页
function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }
  if (event.code === 'KeyF' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    toggleFullscreen()
  }
}

// ===== 收藏 =====
// 当前歌曲的稳定收藏键（优先 songKey，回退 url）
const favoriteKey = computed(() => props.currentSong?.songKey || props.currentSong?.url || '')
// 当前是否已收藏
const isFavorited = ref(false)

// 根据当前歌曲刷新收藏状态
async function refreshFavoriteState() {
  const key = favoriteKey.value
  if (!key) {
    isFavorited.value = false
    return
  }
  try {
    const res = await musicApi.checkFavorite(key)
    if (res.code === 200) isFavorited.value = !!res.data?.favorite
  } catch (e) {
    console.error('查询收藏状态失败', e)
  }
}

// 切换收藏 / 取消收藏
async function toggleFavorite() {
  const song = props.currentSong
  const key = favoriteKey.value
  if (!song || !key) return
  try {
    if (isFavorited.value) {
      await musicApi.removeFavoriteByUrl(key)
      isFavorited.value = false
      message.success('已取消收藏')
    } else {
      await musicApi.addFavorite({
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        url: key,
      })
      isFavorited.value = true
      message.success('已添加到收藏')
    }
  } catch (e) {
    console.error('收藏操作失败', e)
    message.error('操作失败')
  }
}

// 切歌时刷新收藏状态
watch(favoriteKey, () => {
  refreshFavoriteState()
}, { immediate: true })

// 播放模式图标映射
const playModeIcon = computed(() => {
  switch (playMode.value) {
    case 'sequence':
      return PlayForward
    case 'loop':
      return Repeat
    case 'single':
      return RefreshCircle
    case 'random':
      return Shuffle
    default:
      return PlayForward
  }
})

// 播放模式提示文本
const playModeText = computed(() => {
  switch (playMode.value) {
    case 'sequence':
      return '顺序播放'
    case 'loop':
      return '列表循环'
    case 'single':
      return '单曲循环'
    case 'random':
      return '随机播放'
    default:
      return '顺序播放'
  }
})

// 切换播放模式（由父组件切换状态）
function handleTogglePlayMode() {
  emit('toggle-play-mode')
}

// 播放模式变化时提示当前模式
watch(playMode, () => {
  message.info(playModeText.value)
})

// ===== 自动隐藏逻辑 =====
// 立即显示播放条
function showPlayer() {
  playerVisible.value = true
}

// 鼠标进入播放区域：保持显示
function onPointerEnter() {
  playerVisible.value = true
}

// 鼠标离开播放区域：立即隐藏
function onPointerLeave() {
  playerVisible.value = false
}

// 手动切换显隐（按钮）
function togglePlayerVisible() {
  playerVisible.value = !playerVisible.value
}

// 鼠标接近窗口底部时自动显示
function onWindowMouseMove(e: MouseEvent) {
  if (!props.currentSong) return
  const threshold = 80
  if (window.innerHeight - e.clientY <= threshold) {
    showPlayer()
  }
}

// 有歌曲时显示，无歌曲时隐藏
watch(() => props.currentSong, (song) => {
  playerVisible.value = !!song
})

onMounted(() => {
  window.addEventListener('mousemove', onWindowMouseMove)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onWindowMouseMove)
  document.removeEventListener('keydown', handleKeydown)
})

// 使用全局状态或本地状态
const currentTime = computed(() => globalCurrentTime.value || localCurrentTime.value)
const duration = computed(() => globalDuration.value || localDuration.value)

const progress = computed(() => {
  if (duration.value === 0) return 0
  return Math.round((currentTime.value / duration.value) * 100)
})

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function updateTime() {
  if (sound.value && props.isPlaying) {
    const seekTime = sound.value.seek() as number
    localCurrentTime.value = seekTime
    globalCurrentTime.value = seekTime
    requestAnimationFrame(updateTime)
  }
}

function handleSeek(value: number) {
  if (sound.value) {
    const seekTime = (value / 100) * duration.value
    sound.value.seek(seekTime)
    localCurrentTime.value = seekTime
    globalCurrentTime.value = seekTime
  }
}

function toggleMute() {
  if (sound.value) {
    if (isMuted.value) {
      sound.value.volume(previousVolume.value)
      emit('update:volume', previousVolume.value)
    } else {
      previousVolume.value = props.volume
      sound.value.volume(0)
      emit('update:volume', 0)
    }
    isMuted.value = !isMuted.value
  }
}

watch(() => props.currentSong, (newSong) => {
  if (sound.value) {
    sound.value.stop()
    sound.value.unload()
  }

  if (newSong) {
    sound.value = new Howl({
      src: [newSong.url],
      html5: true,
      volume: props.volume,
      onplay: () => {
        const audioDuration = sound.value?.duration() || 0
        localDuration.value = audioDuration
        globalDuration.value = audioDuration
        requestAnimationFrame(updateTime)
      },
      onend: () => {
        emit('play-next')
      },
      onloaderror: () => {
        message.error('加载音频失败')
      },
      onplayerror: () => {
        message.error('播放音频失败')
        emit('play-next')
      }
    })

    if (props.isPlaying) {
      sound.value.play()
    }
  }
}, { immediate: true })

watch(() => props.isPlaying, (isPlaying) => {
  if (sound.value) {
    if (isPlaying) {
      sound.value.play()
      requestAnimationFrame(updateTime)
    } else {
      sound.value.pause()
    }
  }
})

watch(() => props.volume, (newVolume) => {
  if (sound.value) {
    sound.value.volume(newVolume)
    if (newVolume > 0 && isMuted.value) {
      isMuted.value = false
    } else if (newVolume === 0 && !isMuted.value) {
      isMuted.value = true
    }
  }
})

// 监听全局时间变化（来自键盘快捷键）
watch(() => globalCurrentTime.value, (newTime) => {
  if (sound.value && Math.abs(newTime - localCurrentTime.value) > 1) {
    // 只有当时间差异较大时才进行跳转，避免正常播放时的干扰
    sound.value.seek(newTime)
    localCurrentTime.value = newTime
  }
})

onBeforeUnmount(() => {
  if (sound.value) {
    sound.value.stop()
    sound.value.unload()
  }
})
</script>

<template>
  <div class="music-player-bar fixed bottom-0 left-0 right-0 h-18 flex items-center px-6 z-100"
    :class="{ 'music-player-bar--hidden': !playerVisible }" v-if="currentSong" @mouseenter="onPointerEnter"
    @mouseleave="onPointerLeave">
    <!-- 手动显隐按钮：隐藏时朝上（点击显示），显示时朝下（点击隐藏） -->
    <button class="player-toggle" type="button" :aria-label="playerVisible ? '隐藏播放条' : '显示播放条'"
      @click="togglePlayerVisible">
      <n-icon size="16">
        <component :is="playerVisible ? ChevronDown : ChevronUp" />
      </n-icon>
    </button>
    <!-- 隐藏态保留的迷你进度头：显示歌名与播放进度 -->
    <div v-show="!playerVisible" class="player-mini">
      <span class="player-mini__title">{{ currentSong.title }}</span>
      <div class="player-mini__progress">
        <div class="player-mini__bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
    <div class="player-left flex items-center w-30%">
      <button class="player-cover-btn" type="button" :aria-label="fullscreenOpen ? '关闭全屏播放页' : '打开全屏播放页'"
        @click="toggleFullscreen">
        <div class="w-12 h-12 rounded-lg overflow-hidden mr-3 player-cover">
          <img :src="currentSong.cover" alt="Cover" class="w-full h-full object-cover" />
        </div>
        <span class="player-cover-mask">
          <n-icon size="18">
            <ChevronUp />
          </n-icon>
        </span>
      </button>
      <div class="flex flex-col">
        <div class="text-sm font-medium mb-1 player-song-title">{{ currentSong.title }}</div>
        <div class="text-xs player-song-artist">{{ currentSong.artist }}</div>
      </div>
    </div>

    <div class="player-center flex-1 flex flex-col items-center">
      <div class="player-controls flex items-center mb-2">
        <!-- 收藏按钮 -->
        <n-button quaternary circle :title="isFavorited ? '取消收藏' : '收藏'" :aria-label="isFavorited ? '取消收藏' : '收藏'"
          @click="toggleFavorite">
          <template #icon>
            <n-icon size="20" :color="isFavorited ? '#eb2f96' : undefined">
              <component :is="isFavorited ? Heart : HeartOutline" />
            </n-icon>
          </template>
        </n-button>

        <n-button quaternary circle @click="handleTogglePlayMode" :title="playModeText">
          <template #icon>
            <n-icon size="20" :class="{ 'text-blue-500': playMode !== 'sequence' }">
              <component :is="playModeIcon" />
            </n-icon>
          </template>
        </n-button>

        <n-button quaternary circle @click="emit('play-prev')">
          <template #icon>
            <n-icon size="24">
              <PlaySkipBack />
            </n-icon>
          </template>
        </n-button>

        <n-button quaternary circle @click="emit('toggle-play')">
          <template #icon>
            <n-icon size="32">
              <component :is="isPlaying ? PauseCircle : PlayCircle" />
            </n-icon>
          </template>
        </n-button>

        <n-button quaternary circle @click="emit('play-next')">
          <template #icon>
            <n-icon size="24">
              <PlaySkipForward />
            </n-icon>
          </template>
        </n-button>
      </div>

      <div class="player-progress flex items-center w-full px-4">
        <span class="text-xs w-10 text-center player-time">{{ formattedCurrentTime }}</span>
        <n-slider :value="progress" :step="0.1" @update:value="handleSeek" />
        <span class="text-xs w-10 text-center player-time">{{ formattedDuration }}</span>
      </div>
    </div>

    <div class="player-right flex items-center justify-end w-20%">
      <n-button quaternary circle @click="emit('download-song')" :disabled="!currentSong" title="下载歌曲">
        <template #icon>
          <n-icon size="20">
            <Download />
          </n-icon>
        </template>
      </n-button>

      <n-button quaternary circle @click="toggleMute">
        <template #icon>
          <n-icon size="20">
            <component :is="isMuted || volume === 0 ? VolumeMute : VolumeHigh" />
          </n-icon>
        </template>
      </n-button>

      <n-slider :value="volume" :step="0.01" :min="0" :max="1" class="w-20"
        @update:value="(val) => emit('update:volume', val)" />
    </div>
  </div>
</template>

<style scoped>
.music-player-bar {
  background: var(--app-surface);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  border-top: 1px solid var(--app-border);
  box-shadow: 0 -6px 24px rgba(31, 45, 61, 0.08);
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease,
    background-color 0.3s ease, border-color 0.3s ease;
}

/* 歌曲信息文字 */
.player-song-title {
  color: var(--app-text);
}

.player-song-artist {
  color: var(--app-muted);
}

.player-time {
  color: var(--app-muted);
}

/* 隐藏态：向下移出视口（仅位移，保留把手按钮可见可点） */
.music-player-bar--hidden {
  transform: translateY(100%);
}

/* 隐藏态下：仅播放条本体不响应鼠标，把手按钮仍可点击 */
.music-player-bar--hidden> :not(.player-toggle) {
  pointer-events: none;
}

/* 手动显隐按钮：位于播放条顶部最左侧的把手 */
.player-toggle {
  position: absolute;
  top: -26px;
  left: 12px;
  width: 46px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  background: var(--app-surface);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  color: var(--app-muted);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.player-toggle:hover {
  color: #1890ff;
  background: var(--app-active-bg);
}

.player-toggle:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

/* 隐藏态的迷你进度头：负 top 使其在播放条下移后仍停留在视口底部 */
.player-mini {
  position: absolute;
  top: -30px;
  left: 64px;
  right: 12px;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid var(--app-border);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  background: var(--app-surface);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  box-shadow: 0 -4px 16px rgba(31, 45, 61, 0.08);
  overflow: hidden;
}

.player-mini__title {
  flex-shrink: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-mini__progress {
  flex: 1;
  min-width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--app-border);
  overflow: hidden;
}

.player-mini__bar {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  transition: width 0.2s linear;
}

.player-cover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

/* 封面按钮：悬停显示黑色蒙版与向上箭头 */
.player-cover-btn {
  position: relative;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.player-cover-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.player-cover-btn:hover .player-cover-mask,
.player-cover-btn:focus-visible .player-cover-mask {
  opacity: 1;
}

.player-cover-btn:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .music-player-bar {
    transition: none;
  }
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {

  /* 紧凑高度，并预留底部安全区 */
  .music-player-bar {
    height: 72px !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* 左侧歌曲信息自适应剩余宽度 */
  .player-left {
    width: auto !important;
    flex: 1;
    min-width: 0;
  }

  /* 移动端隐藏右侧下载/音量控件，避免拥挤 */
  .player-right {
    display: none !important;
  }

  /* 中央控制区仅保留上一首/播放/下一首，去掉进度条 */
  .player-center {
    flex: 0 0 auto !important;
    width: auto !important;
  }

  .player-center .player-progress {
    display: none !important;
  }

  /* 缩小控制按钮间距与尺寸 */
  .player-controls {
    gap: 2px;
    margin-bottom: 0 !important;
  }

  .player-controls :deep(.n-button) {
    min-width: 40px;
    min-height: 40px;
  }

  /* 封面缩小 */
  .player-cover {
    width: 40px !important;
    height: 40px !important;
    margin-right: 10px !important;
  }

  .player-cover-mask {
    width: 40px;
    height: 40px;
  }

  .player-song-title {
    font-size: 13px;
  }

  /* 隐藏态迷你条适配安全区 */
  .player-mini {
    left: 60px;
  }
}
</style>