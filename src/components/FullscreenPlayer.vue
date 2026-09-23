<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import { NIcon } from 'naive-ui'
import {
  ChevronDownOutline,
  PlayCircle,
  PauseCircle,
  PlaySkipForward,
  PlaySkipBack,
  Repeat,
  Shuffle,
  PlayForward,
  RefreshCircle,
  Download,
  MusicalNotes,
} from '@vicons/ionicons5'

interface Song {
  id: number
  title: string
  artist: string
  album?: string
  category: number
  cover: string
  url: string
}

// 注入全局状态
const fullscreenOpen = inject<Ref<boolean>>('fullscreenOpen', ref(false))
const currentSong = inject<Ref<Song | null>>('currentSong', ref(null))
const isPlaying = inject<Ref<boolean>>('isPlaying', ref(false))
const currentTime = inject<Ref<number>>('currentTime', ref(0))
const duration = inject<Ref<number>>('duration', ref(0))
const playlist = inject<Ref<Song[]>>('playlist', ref([]))
const playMode = inject<Ref<string>>('playMode', ref('sequence'))

const playSong = inject<(song: Song) => void>('playSong', () => { })
const togglePlay = inject<() => void>('togglePlay', () => { })
const playNext = inject<() => void>('playNext', () => { })
const playPrev = inject<() => void>('playPrev', () => { })
const seekTo = inject<(t: number) => void>('seekTo', () => { })
const togglePlayMode = inject<() => void>('togglePlayMode', () => { })
const downloadSong = inject<() => void>('downloadSong', () => { })

const listEl = ref<HTMLElement | null>(null)

// 默认古典唱片图（无封面时使用）
const DEFAULT_VINYL =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=classic%20vinyl%20record%20black%20disc%20texture%20top%20view%20realistic%20photography&image_size=square'

const vinylCover = computed(() => currentSong.value?.cover || DEFAULT_VINYL)

const progress = computed(() => {
  if (!duration.value) return 0
  return Math.round((currentTime.value / duration.value) * 100)
})

const playModeIcon = computed(() => {
  switch (playMode.value) {
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

const playModeText = computed(() => {
  switch (playMode.value) {
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

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function handleSeek(value: number) {
  seekTo((value / 100) * duration.value)
}

function close() {
  fullscreenOpen.value = false
}

function selectSong(song: Song) {
  playSong(song)
}

function isCurrent(song: Song): boolean {
  return currentSong.value?.id === song.id
}

// Esc 关闭全屏播放页
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && fullscreenOpen.value) {
    fullscreenOpen.value = false
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="fullscreen-fade">
    <div v-if="fullscreenOpen" class="fullscreen-player" role="dialog" aria-label="全屏播放器">
      <!-- 顶栏 -->
      <header class="fp-header">
        <div class="fp-header__title">
          <n-icon size="20" color="#22c55e">
            <MusicalNotes />
          </n-icon>
          <span>正在播放</span>
        </div>
        <button class="fp-close" type="button" aria-label="收起全屏播放器" @click="close">
          <n-icon size="22">
            <ChevronDownOutline />
          </n-icon>
        </button>
      </header>

      <!-- 主体 -->
      <div class="fp-body">
        <!-- 左侧：歌曲列表 -->
        <aside class="fp-playlist">
          <div class="fp-playlist__head">
            <h3>播放列表</h3>
            <span class="fp-playlist__count">{{ playlist.length }} 首</span>
          </div>
          <div ref="listEl" class="fp-playlist__list">
            <button v-for="song in playlist" :key="song.id" type="button" class="fp-song"
              :class="{ 'fp-song--active': isCurrent(song) }" @click="selectSong(song)">
              <span class="fp-song__index">
                <n-icon v-if="isCurrent(song)" size="14">
                  <component :is="isPlaying ? PauseCircle : PlayCircle" />
                </n-icon>
                <template v-else>{{ song.id }}</template>
              </span>
              <span class="fp-song__meta">
                <span class="fp-song__title">{{ song.title }}</span>
                <span class="fp-song__artist">{{ song.artist }}</span>
              </span>
            </button>
            <p v-if="!playlist.length" class="fp-playlist__empty">播放列表为空</p>
          </div>
        </aside>

        <!-- 右侧：唱片 + 歌曲信息 -->
        <section class="fp-stage">
          <div class="fp-vinyl" :class="{ 'fp-vinyl--playing': isPlaying }">
            <div class="fp-vinyl__disc">
              <img :src="vinylCover" :alt="currentSong?.title || '默认唱片'" class="fp-vinyl__cover" />
              <span class="fp-vinyl__hole"></span>
            </div>
            <div class="fp-vinyl__glow"></div>
          </div>

          <div class="fp-info">
            <h1 class="fp-info__title">{{ currentSong?.title || '暂无歌曲' }}</h1>
            <p class="fp-info__artist">{{ currentSong?.artist }}</p>
          </div>
        </section>
      </div>

      <!-- 底部：进度 + 控制 -->
      <footer class="fp-footer">
        <div class="fp-progress">
          <span class="fp-progress__time">{{ formatTime(currentTime) }}</span>
          <div class="fp-progress__track">
            <div class="fp-progress__fill" :style="{ width: progress + '%' }"></div>
            <input class="fp-progress__range" type="range" min="0" max="100" step="0.1" :value="progress"
              aria-label="播放进度" @input="handleSeek(Number(($event.target as HTMLInputElement).value))" />
          </div>
          <span class="fp-progress__time">{{ formatTime(duration) }}</span>
        </div>

        <div class="fp-controls">
          <button class="fp-btn" type="button" :title="playModeText" @click="togglePlayMode()">
            <n-icon size="20">
              <component :is="playModeIcon" />
            </n-icon>
          </button>
          <button class="fp-btn" type="button" aria-label="上一首" @click="playPrev()">
            <n-icon size="26">
              <PlaySkipBack />
            </n-icon>
          </button>
          <button class="fp-btn fp-btn--primary" type="button" :aria-label="isPlaying ? '暂停' : '播放'"
            @click="togglePlay()">
            <n-icon size="36">
              <component :is="isPlaying ? PauseCircle : PlayCircle" />
            </n-icon>
          </button>
          <button class="fp-btn" type="button" aria-label="下一首" @click="playNext()">
            <n-icon size="26">
              <PlaySkipForward />
            </n-icon>
          </button>
          <button class="fp-btn" type="button" aria-label="下载歌曲" @click="downloadSong()">
            <n-icon size="20">
              <Download />
            </n-icon>
          </button>
        </div>
      </footer>
    </div>
  </Transition>
</template>

<style scoped>
.fullscreen-player {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 20% 20%, rgba(67, 56, 202, 0.35), transparent 55%),
    radial-gradient(circle at 80% 30%, rgba(34, 197, 94, 0.18), transparent 50%),
    linear-gradient(160deg, #0f0f23 0%, #1e1b4b 100%);
  color: #f8fafc;
  overflow: hidden;
}

/* 过渡 */
.fullscreen-fade-enter-active,
.fullscreen-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.fullscreen-fade-enter-from,
.fullscreen-fade-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

/* 顶栏 */
.fp-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
}

.fp-header__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: rgba(248, 250, 252, 0.86);
}

.fp-close {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(248, 250, 252, 0.85);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.fp-close:hover {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.12);
}

.fp-close:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
}

/* 主体 */
.fp-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  padding: 0 28px;
}

/* 左侧播放列表 */
.fp-playlist {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.fp-playlist__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.fp-playlist__head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.fp-playlist__count {
  font-size: 12px;
  color: rgba(248, 250, 252, 0.5);
}

.fp-playlist__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.fp-song {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.fp-song:hover {
  background: rgba(255, 255, 255, 0.07);
}

.fp-song--active {
  background: rgba(34, 197, 94, 0.14);
  color: #22c55e;
}

.fp-song__index {
  flex-shrink: 0;
  width: 22px;
  text-align: center;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.4);
}

.fp-song--active .fp-song__index {
  color: #22c55e;
}

.fp-song__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fp-song__title {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fp-song__artist {
  font-size: 11px;
  color: rgba(248, 250, 252, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fp-playlist__empty {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: rgba(248, 250, 252, 0.4);
}

/* 右侧舞台 */
.fp-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 36px;
  min-height: 0;
}

.fp-vinyl {
  position: relative;
  width: min(320px, 42vh);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

.fp-vinyl__disc {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  padding: 14%;
  background:
    repeating-radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0 2px, transparent 2px 5px),
    radial-gradient(circle at center, #2a2a3a 0%, #101018 70%);
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(0, 0, 0, 0.6);
  animation: vinyl-spin 22s linear infinite;
  animation-play-state: paused;
}

.fp-vinyl--playing .fp-vinyl__disc {
  animation-play-state: running;
}

.fp-vinyl__cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.fp-vinyl__hole {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8%;
  height: 8%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #0f0f23;
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.12);
}

.fp-vinyl__glow {
  position: absolute;
  inset: -12%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.22), transparent 62%);
  filter: blur(24px);
  z-index: -1;
}

@keyframes vinyl-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.fp-info {
  text-align: center;
  max-width: 90%;
}

.fp-info__title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fp-info__artist {
  margin: 0;
  font-size: 14px;
  color: rgba(248, 250, 252, 0.6);
}

/* 底部 */
.fp-footer {
  flex-shrink: 0;
  padding: 16px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.fp-progress {
  width: min(720px, 100%);
  display: flex;
  align-items: center;
  gap: 12px;
}

.fp-progress__time {
  flex-shrink: 0;
  width: 44px;
  font-size: 12px;
  text-align: center;
  color: rgba(248, 250, 252, 0.55);
}

.fp-progress__track {
  position: relative;
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.fp-progress__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 3px;
  background: linear-gradient(90deg, #22c55e, #38bdf8);
}

.fp-progress__range {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.fp-controls {
  display: flex;
  align-items: center;
  gap: 22px;
}

.fp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(248, 250, 252, 0.75);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.fp-btn:hover {
  color: #22c55e;
  background: rgba(255, 255, 255, 0.07);
}

.fp-btn:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
}

.fp-btn--primary {
  width: 64px;
  height: 64px;
  color: #0f0f23;
  background: linear-gradient(135deg, #22c55e, #38bdf8);
  box-shadow: 0 10px 30px -8px rgba(34, 197, 94, 0.6);
}

.fp-btn--primary:hover {
  color: #0f0f23;
  background: linear-gradient(135deg, #22c55e, #38bdf8);
  transform: scale(1.05);
}

/* 响应式 */
@media (max-width: 1024px) {
  .fp-body {
    grid-template-columns: 260px 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .fp-body {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .fp-playlist {
    order: 2;
    max-height: 34vh;
  }

  .fp-stage {
    order: 1;
    gap: 20px;
  }

  .fp-vinyl {
    width: min(240px, 34vh);
  }

  .fp-info__title {
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fp-vinyl__disc {
    animation: none;
  }

  .fullscreen-fade-enter-active,
  .fullscreen-fade-leave-active {
    transition: none;
  }
}
</style>
