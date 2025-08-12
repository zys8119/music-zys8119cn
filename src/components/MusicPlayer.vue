<script setup lang="ts">
import { PlayCircle, PauseCircle, PlaySkipBack, PlaySkipForward, VolumeHigh, VolumeMute } from '@vicons/ionicons5'
import { Howl } from 'howler'

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
}>()

const emit = defineEmits<{
  'toggle-play': [];
  'play-next': [];
  'play-prev': [];
}>()

const message = useMessage()
const sound = ref<Howl | null>(null)
const duration = ref<number>(0)
const currentTime = ref<number>(0)
const volume = ref<number>(80)
const isMuted = ref<boolean>(false)
const seekValue = ref<number>(0)
const progressInterval = ref<number | null>(null)

const formattedCurrentTime = computed((): string => {
  return formatTime(currentTime.value)
})

const formattedDuration = computed((): string => {
  return formatTime(duration.value)
})

const hasSong = computed((): boolean => {
  return props.currentSong !== null
})

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function updateProgress(): void {
  if (sound.value && sound.value.playing()) {
    currentTime.value = sound.value.seek()
    seekValue.value = (currentTime.value / duration.value) * 100 || 0
  }
}

function setupProgressInterval(): void {
  clearProgressInterval()
  progressInterval.value = window.setInterval(() => {
    updateProgress()
  }, 1000)
}

function clearProgressInterval(): void {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
}

function handleSeek(value: number): void {
  if (!sound.value || !duration.value) return
  
  const seekTime = (value / 100) * duration.value
  sound.value.seek(seekTime)
  currentTime.value = seekTime
}

function handleVolumeChange(value: number): void {
  volume.value = value
  if (sound.value) {
    sound.value.volume(value / 100)
  }
  if (value === 0) {
    isMuted.value = true
  } else {
    isMuted.value = false
  }
}

function toggleMute(): void {
  if (isMuted.value) {
    // 恢复到之前的音量
    isMuted.value = false
    if (volume.value === 0) {
      volume.value = 50
    }
  } else {
    // 静音
    isMuted.value = true
    volume.value = 0
  }
  
  if (sound.value) {
    sound.value.volume(volume.value / 100)
  }
}

function togglePlay(): void {
  emit('toggle-play')
}

function playNext(): void {
  emit('play-next')
}

function playPrev(): void {
  emit('play-prev')
}

watch(() => props.currentSong, (newSong) => {
  if (newSong) {
    // 停止当前播放的音频
    if (sound.value) {
      sound.value.stop()
      sound.value.unload()
    }
    
    // 创建新的Howl实例
    sound.value = new Howl({
      src: [newSong.url],
      html5: true,
      volume: volume.value / 100,
      onplay: () => {
        setupProgressInterval()
        message.success(`正在播放: ${newSong.title}`)
      },
      onload: () => {
        duration.value = sound.value?.duration() || 0
      },
      onend: () => {
        playNext()
      },
      onloaderror: () => {
        message.error('加载音频失败，请检查网络连接')
      },
      onplayerror: () => {
        message.error('播放音频失败，请尝试其他歌曲')
      }
    })
    
    // 如果isPlaying为true，则开始播放
    if (props.isPlaying) {
      sound.value.play()
    }
  }
}, { immediate: true })

watch(() => props.isPlaying, (isPlaying) => {
  if (sound.value) {
    if (isPlaying) {
      sound.value.play()
    } else {
      sound.value.pause()
      clearProgressInterval()
    }
  }
})

onMounted(() => {
  if (props.currentSong && props.isPlaying && !sound.value) {
    sound.value = new Howl({
      src: [props.currentSong.url],
      html5: true,
      volume: volume.value / 100,
      onplay: () => {
        setupProgressInterval()
      },
      onload: () => {
        duration.value = sound.value?.duration() || 0
      },
      onend: () => {
        playNext()
      }
    })
    sound.value.play()
  }
})

onBeforeUnmount(() => {
  clearProgressInterval()
  if (sound.value) {
    sound.value.stop()
    sound.value.unload()
  }
})
</script>

<template>
  <div class="music-player" :class="{ 'has-song': hasSong }">
    <div class="player-content">
      <div class="song-info" v-if="currentSong">
        <div class="song-cover">
          <img :src="currentSong.cover" alt="Cover" />
        </div>
        <div class="song-details">
          <div class="song-title">{{ currentSong.title }}</div>
          <div class="song-artist">{{ currentSong.artist }}</div>
        </div>
      </div>
      
      <div class="player-controls">
        <div class="control-buttons">
          <n-button quaternary circle @click="playPrev">
            <template #icon>
              <n-icon size="24">
                <play-skip-back />
              </n-icon>
            </template>
          </n-button>
          
          <n-button quaternary circle class="play-button" @click="togglePlay">
            <template #icon>
              <n-icon size="32">
                <component :is="isPlaying ? PauseCircle : PlayCircle" />
              </n-icon>
            </template>
          </n-button>
          
          <n-button quaternary circle @click="playNext">
            <template #icon>
              <n-icon size="24">
                <play-skip-forward />
              </n-icon>
            </template>
          </n-button>
        </div>
        
        <div class="progress-container">
          <span class="time">{{ formattedCurrentTime }}</span>
          <n-slider
            :value="seekValue"
            :step="0.1"
            :disabled="!hasSong"
            @update:value="handleSeek"
          />
          <span class="time">{{ formattedDuration }}</span>
        </div>
      </div>
      
      <div class="volume-controls">
        <n-button quaternary circle @click="toggleMute">
          <template #icon>
            <n-icon>
              <component :is="isMuted ? VolumeMute : VolumeHigh" />
            </n-icon>
          </template>
        </n-button>
        <n-slider
          :value="volume"
          :step="1"
          style="width: 80px"
          @update:value="handleVolumeChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.player-content {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.song-info {
  display: flex;
  align-items: center;
  width: 300px;
}

.song-cover {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.song-artist {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.player-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.control-buttons {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.play-button {
  margin: 0 16px;
}

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
}

.time {
  font-size: 12px;
  color: #999;
  width: 40px;
  text-align: center;
}

.volume-controls {
  display: flex;
  align-items: center;
  width: 120px;
  justify-content: flex-end;
}
</style>