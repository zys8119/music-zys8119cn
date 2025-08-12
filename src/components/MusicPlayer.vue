<script setup lang="ts">
import { Howl } from 'howler'
import { NIcon } from 'naive-ui'
import {
  PlayCircle,
  PauseCircle,
  PlaySkipForward,
  PlaySkipBack,
  VolumeHigh,
  VolumeMute
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
}>()

const message = useMessage()
const sound = ref<Howl | null>(null)
const currentTime = ref(0)
const duration = ref(0)
const isMuted = ref(false)
const previousVolume = ref(props.volume)

const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
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
    currentTime.value = sound.value.seek() as number
    requestAnimationFrame(updateTime)
  }
}

function handleSeek(value: number) {
  if (sound.value) {
    const seekTime = (value / 100) * duration.value
    sound.value.seek(seekTime)
    currentTime.value = seekTime
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
        duration.value = sound.value?.duration() || 0
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

onBeforeUnmount(() => {
  if (sound.value) {
    sound.value.stop()
    sound.value.unload()
  }
})
</script>

<template>
  <div class="music-player" v-if="currentSong">
    <div class="player-left">
      <div class="song-cover">
        <img :src="currentSong.cover" alt="Cover" />
      </div>
      <div class="song-info">
        <div class="song-title">{{ currentSong.title }}</div>
        <div class="song-artist">{{ currentSong.artist }}</div>
      </div>
    </div>
    
    <div class="player-center">
      <div class="player-controls">
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
      
      <div class="player-progress">
        <span class="time">{{ formattedCurrentTime }}</span>
        <n-slider
          :value="progress"
          :step="0.1"
          @update:value="handleSeek"
        />
        <span class="time">{{ formattedDuration }}</span>
      </div>
    </div>
    
    <div class="player-right">
      <n-button quaternary circle @click="toggleMute">
        <template #icon>
          <n-icon size="20">
            <component :is="isMuted || volume === 0 ? VolumeMute : VolumeHigh" />
          </n-icon>
        </template>
      </n-button>
      
      <n-slider
        :value="volume"
        :step="0.01"
        :min="0"
        :max="1"
        style="width: 80px"
        @update:value="(val) => emit('update:volume', val)"
      />
    </div>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 100;
}

.player-left {
  display: flex;
  align-items: center;
  width: 30%;
}

.song-cover {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-info {
  display: flex;
  flex-direction: column;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 12px;
  color: #999;
}

.player-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-controls {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.player-progress {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 16px;
}

.time {
  font-size: 12px;
  color: #999;
  width: 40px;
  text-align: center;
}

.player-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 20%;
}
</style>