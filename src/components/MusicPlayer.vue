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
  ChevronDown
} from '@vicons/ionicons5'

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  category: number;
  cover: string;
  url: string;
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
// 空闲多久后自动隐藏
const HIDE_DELAY = 3000
let hideTimer: number | null = null

// 清除待执行的隐藏定时器
function clearHideTimer() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// 立即显示播放条
function showPlayer() {
  clearHideTimer()
  playerVisible.value = true
}

// 延迟隐藏：鼠标在区域内或正在交互时不隐藏
function scheduleHide() {
  clearHideTimer()
  hideTimer = window.setTimeout(() => {
    playerVisible.value = false
  }, HIDE_DELAY)
}

// 鼠标进入播放区域：取消隐藏
function onPointerEnter() {
  clearHideTimer()
}

// 鼠标离开播放区域：延时隐藏
function onPointerLeave() {
  scheduleHide()
}

// 手动切换显隐（按钮）
function togglePlayerVisible() {
  if (playerVisible.value) {
    playerVisible.value = false
    clearHideTimer()
  } else {
    showPlayer()
  }
}

// 鼠标接近窗口底部时自动显示
function onWindowMouseMove(e: MouseEvent) {
  if (!props.currentSong) return
  const threshold = 80
  if (window.innerHeight - e.clientY <= threshold) {
    showPlayer()
  }
}

// 有歌曲时启动自动隐藏；无歌曲时复位
watch(() => props.currentSong, (song) => {
  if (song) {
    playerVisible.value = true
    scheduleHide()
  } else {
    clearHideTimer()
    playerVisible.value = true
  }
})

onMounted(() => {
  window.addEventListener('mousemove', onWindowMouseMove)
})

onBeforeUnmount(() => {
  clearHideTimer()
  window.removeEventListener('mousemove', onWindowMouseMove)
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
    <div class="flex items-center w-30%">
      <div class="w-12 h-12 rounded-lg overflow-hidden mr-3 player-cover">
        <img :src="currentSong.cover" alt="Cover" class="w-full h-full object-cover" />
      </div>
      <div class="flex flex-col">
        <div class="text-sm font-medium text-gray-800 mb-1">{{ currentSong.title }}</div>
        <div class="text-xs text-gray-400">{{ currentSong.artist }}</div>
      </div>
    </div>

    <div class="flex-1 flex flex-col items-center">
      <div class="flex items-center mb-2">
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

      <div class="flex items-center w-full px-4">
        <span class="text-xs text-gray-400 w-10 text-center">{{ formattedCurrentTime }}</span>
        <n-slider :value="progress" :step="0.1" @update:value="handleSeek" />
        <span class="text-xs text-gray-400 w-10 text-center">{{ formattedDuration }}</span>
      </div>
    </div>

    <div class="flex items-center justify-end w-20%">
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 -6px 24px rgba(31, 45, 61, 0.08);
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease;
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
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.player-toggle:hover {
  color: #1890ff;
  background: #f2f8ff;
}

.player-toggle:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

.player-cover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .music-player-bar {
    transition: none;
  }
}
</style>