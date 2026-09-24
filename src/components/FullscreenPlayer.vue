<script setup lang="ts">
import { computed, inject, nextTick, ref, watch, type Ref } from 'vue'
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
  VolumeHigh,
  VolumeMute,
  Heart,
  HeartOutline,
  ListOutline,
} from '@vicons/ionicons5'
import { musicApi } from '../services/api'
import { useResponsive } from '../composables/useResponsive'

interface Song {
  id: number
  title: string
  artist: string
  album?: string
  category: number
  cover: string
  url: string
  songKey?: string
}

// 注入全局状态
const fullscreenOpen = inject<Ref<boolean>>('fullscreenOpen', ref(false))
const currentSong = inject<Ref<Song | null>>('currentSong', ref(null))
const isPlaying = inject<Ref<boolean>>('isPlaying', ref(false))
const currentTime = inject<Ref<number>>('currentTime', ref(0))
const duration = inject<Ref<number>>('duration', ref(0))
const playlist = inject<Ref<Song[]>>('playlist', ref([]))
const playMode = inject<Ref<string>>('playMode', ref('sequence'))
const volume = inject<Ref<number>>('volume', ref(0.8))

const playSong = inject<(song: Song) => void>('playSong', () => { })
const togglePlay = inject<() => void>('togglePlay', () => { })
const playNext = inject<() => void>('playNext', () => { })
const playPrev = inject<() => void>('playPrev', () => { })
const seekTo = inject<(t: number) => void>('seekTo', () => { })
const togglePlayMode = inject<() => void>('togglePlayMode', () => { })
const downloadSong = inject<() => void>('downloadSong', () => { })

const listEl = ref<HTMLElement | null>(null)

// 响应式：移动端将播放列表收为可展开的底部抽屉
const { isMobile } = useResponsive()
const playlistOpen = ref(false)

// 移动端点击歌曲后收起抽屉
function handleSelectSong(song: Song) {
  selectSong(song)
  if (isMobile.value) playlistOpen.value = false
}

// 关闭全屏页时复位抽屉状态
watch(fullscreenOpen, (open) => {
  if (!open) playlistOpen.value = false
})

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

// 音量控制
const lastVolume = ref(volume.value || 0.8)
const isMuted = computed(() => volume.value === 0)

function handleVolume(value: number) {
  volume.value = value
  if (value > 0) lastVolume.value = value
}

function toggleMute() {
  if (isMuted.value) {
    volume.value = lastVolume.value || 0.8
  } else {
    lastVolume.value = volume.value
    volume.value = 0
  }
}

// ===== 收藏 =====
const message = useMessage()
// 当前歌曲的稳定收藏键（优先 songKey，回退 url）
const favoriteKey = computed(() => currentSong.value?.songKey || currentSong.value?.url || '')
const isFavorited = ref(false)

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

async function toggleFavorite() {
  const song = currentSong.value
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

watch(favoriteKey, () => {
  refreshFavoriteState()
}, { immediate: true })

function close() {
  fullscreenOpen.value = false
}

function selectSong(song: Song) {
  playSong(song)
}

// 歌曲的稳定唯一键（优先 songKey，其次 url，最后回退 id）
// 各列表页的 id 是按索引+偏移生成的，跨批次会重复，不能作为唯一标识
function songKeyOf(song: Song): string {
  return song.songKey || song.url || String(song.id)
}

function isCurrent(song: Song): boolean {
  const cur = currentSong.value
  if (!cur) return false
  return songKeyOf(cur) === songKeyOf(song)
}

// 将当前激活的歌曲居中显示在播放列表可视区域
function scrollToActiveSong(behavior: ScrollBehavior = 'smooth') {
  const container = listEl.value
  if (!container) return
  const idx = playlist.value.findIndex(song => isCurrent(song))
  if (idx < 0) return
  const el = container.children[idx] as HTMLElement | undefined
  if (!el) return
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  // 目标项中心相对容器内容顶部的距离
  const elCenter = elRect.top - containerRect.top + container.scrollTop + elRect.height / 2
  container.scrollTo({
    top: elCenter - container.clientHeight / 2,
    behavior,
  })
}

// 播放列表、当前歌曲变化或抽屉展开时，自动将激活项居中
watch(
  [
    () => playlist.value.length,
    () => (currentSong.value ? songKeyOf(currentSong.value) : ''),
    fullscreenOpen,
    playlistOpen,
  ],
  async () => {
    if (!fullscreenOpen.value) return
    // 移动端抽屉未展开时不滚动（隐藏元素无尺寸）
    if (isMobile.value && !playlistOpen.value) return
    await nextTick()
    scrollToActiveSong()
  }
)

// ===== 歌词 =====
const currentLyric = inject<Ref<string>>('currentLyric', ref(''))

interface LyricLine {
  time: number
  text: string
}

const lyricsEl = ref<HTMLElement | null>(null)
// 用户手动滚动时暂停自动滚动，避免与其冲突
const userScrollLock = ref(false)
let scrollIdleTimer: number | null = null

// 鼠标拖拽滚动状态
const isDragging = ref(false)
let dragStartY = 0
let dragStartScrollTop = 0
// 本次按住是否发生了位移（用于区分拖拽与点击）
let dragMoved = false

// 解析 LRC 文本为按时间升序的行列表
const lyricLines = computed<LyricLine[]>(() => {
  const raw = currentLyric.value || ''
  if (!raw) return []
  const result: LyricLine[] = []
  for (const row of raw.split('\n')) {
    const text = row.replace(/\[[^\]]*\]/g, '').trim()
    if (!text) continue
    const re = /\[(\d+):(\d+(?:\.\d+)?)\]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(row)) !== null) {
      result.push({ time: parseInt(m[1], 10) * 60 + parseFloat(m[2]), text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
})

// 当前高亮行索引
const activeLyricIndex = computed(() => {
  const t = currentTime.value
  let idx = -1
  for (let i = 0; i < lyricLines.value.length; i++) {
    if (lyricLines.value[i].time <= t + 0.3) idx = i
    else break
  }
  return idx
})

// 用户手动滚动：暂停自动滚动，并设定“停止滚动后重新居中”的时机
function pauseAutoScroll() {
  userScrollLock.value = true
  if (scrollIdleTimer !== null) clearTimeout(scrollIdleTimer)
  // 停止滚动 1.2 秒后，解除锁定并重新居中当前激活行
  scrollIdleTimer = window.setTimeout(() => {
    userScrollLock.value = false
    if (fullscreenOpen.value && activeLyricIndex.value >= 0) {
      scrollToLyric(activeLyricIndex.value)
    }
  }, 1200)
}

// 鼠标离开歌词区域：立即将当前激活行重新居中
function onLyricsLeave() {
  if (isDragging.value) return
  if (scrollIdleTimer !== null) {
    clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
  }
  userScrollLock.value = false
  if (fullscreenOpen.value && activeLyricIndex.value >= 0) {
    scrollToLyric(activeLyricIndex.value)
  }
}

// ===== 鼠标拖拽滚动歌词 =====
function onDragStart(e: MouseEvent) {
  const container = lyricsEl.value
  if (!container || e.button !== 0) return
  isDragging.value = true
  dragMoved = false
  dragStartY = e.clientY
  dragStartScrollTop = container.scrollTop
  // 拖拽期间锁定自动滚动
  userScrollLock.value = true
  if (scrollIdleTimer !== null) {
    clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
  }
  // 关闭平滑滚动，保证拖拽跟手
  container.style.scrollBehavior = 'auto'
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  const container = lyricsEl.value
  if (!container || !isDragging.value) return
  const delta = e.clientY - dragStartY
  if (Math.abs(delta) > 3) dragMoved = true
  container.scrollTop = dragStartScrollTop - delta
  e.preventDefault()
}

function onDragEnd() {
  const container = lyricsEl.value
  isDragging.value = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  if (container) container.style.scrollBehavior = ''
  // 拖拽结束后延时回中（仅当确实拖动过）
  if (dragMoved) pauseAutoScroll()
  // 下一帧再重置，避免拖拽后的 click 误触发跳转
  setTimeout(() => {
    dragMoved = false
  }, 0)
}

// 将指定行滚动到容器中间
function scrollToLyric(idx: number) {
  const container = lyricsEl.value
  const el = container?.children[idx] as HTMLElement | undefined
  if (!container || !el) return
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  // 目标行中心相对容器内容顶部的距离
  const elCenter = elRect.top - containerRect.top + container.scrollTop + elRect.height / 2
  container.scrollTo({
    top: elCenter - container.clientHeight / 2,
    behavior: 'smooth',
  })
}

// 高亮行变化时自动滚动（用户手动滚动期间不打扰）
watch(activeLyricIndex, async (idx) => {
  if (userScrollLock.value || idx < 0 || !fullscreenOpen.value) return
  await nextTick()
  scrollToLyric(idx)
})

// 打开全屏页时定位到当前行
watch(fullscreenOpen, async (open) => {
  if (!open) return
  await nextTick()
  if (activeLyricIndex.value >= 0) scrollToLyric(activeLyricIndex.value)
})

// 点击歌词跳转到对应进度（拖拽结束后的 click 不触发）
function seekToLyric(line: LyricLine) {
  if (dragMoved) return
  seekTo(line.time)
  userScrollLock.value = false
  if (scrollIdleTimer !== null) {
    clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
  }
}

// Esc 关闭全屏播放页
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && fullscreenOpen.value) {
    fullscreenOpen.value = false
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  if (scrollIdleTimer !== null) clearTimeout(scrollIdleTimer)
})
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
        <div class="fp-header__actions">
          <!-- 移动端：展开/收起播放列表 -->
          <button v-if="isMobile" class="fp-close" type="button" :aria-label="playlistOpen ? '收起播放列表' : '展开播放列表'"
            :aria-expanded="playlistOpen" @click="playlistOpen = !playlistOpen">
            <n-icon size="22">
              <ListOutline />
            </n-icon>
          </button>
          <button class="fp-close" type="button" aria-label="收起全屏播放器" @click="close">
            <n-icon size="22">
              <ChevronDownOutline />
            </n-icon>
          </button>
        </div>
      </header>

      <!-- 移动端：播放列表抽屉遮罩 -->
      <div v-if="isMobile && playlistOpen" class="fp-playlist-mask" @click="playlistOpen = false"></div>

      <!-- 主体 -->
      <div class="fp-body">
        <!-- 左侧：歌曲列表（移动端收为底部抽屉） -->
        <aside class="fp-playlist" :class="{ 'fp-playlist--open': isMobile && playlistOpen }">
          <div class="fp-playlist__head">
            <h3>播放列表</h3>
            <span class="fp-playlist__count">{{ playlist.length }} 首</span>
          </div>
          <div ref="listEl" class="fp-playlist__list">
            <button v-for="song in playlist" :key="songKeyOf(song)" type="button" class="fp-song"
              :class="{ 'fp-song--active': isCurrent(song) }" @click="handleSelectSong(song)">
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

          <!-- 歌词：可滚动、可拖拽，点击跳转进度 -->
          <div v-if="lyricLines.length" ref="lyricsEl" class="fp-lyrics" :class="{ 'fp-lyrics--dragging': isDragging }"
            @wheel="pauseAutoScroll" @touchmove="pauseAutoScroll" @mouseleave="onLyricsLeave" @mousedown="onDragStart">
            <p v-for="(line, idx) in lyricLines" :key="idx" class="fp-lyrics__line"
              :class="{ 'fp-lyrics__line--active': idx === activeLyricIndex }" @click="seekToLyric(line)">
              {{ line.text }}
            </p>
          </div>
          <div v-else class="fp-lyrics fp-lyrics--empty">暂无歌词</div>
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

        <div class="fp-controls-row">
          <div class="fp-controls">
            <!-- 收藏按钮 -->
            <button class="fp-btn" type="button" :aria-label="isFavorited ? '取消收藏' : '收藏'"
              :title="isFavorited ? '取消收藏' : '收藏'" @click="toggleFavorite()">
              <n-icon size="20" :color="isFavorited ? '#eb2f96' : undefined">
                <component :is="isFavorited ? Heart : HeartOutline" />
              </n-icon>
            </button>

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

          <!-- 音量控制 -->
          <div class="fp-volume">
            <button class="fp-btn" type="button" :aria-label="isMuted ? '取消静音' : '静音'" @click="toggleMute">
              <n-icon size="20">
                <component :is="isMuted ? VolumeMute : VolumeHigh" />
              </n-icon>
            </button>
            <div class="fp-volume__track">
              <div class="fp-volume__fill" :style="{ width: (volume * 100) + '%' }"></div>
              <input class="fp-volume__range" type="range" min="0" max="1" step="0.01" :value="volume" aria-label="音量"
                @input="handleVolume(Number(($event.target as HTMLInputElement).value))" />
            </div>
          </div>
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
  gap: 20px;
  min-height: 0;
  padding: 8px 0;
}

.fp-vinyl {
  position: relative;
  width: min(260px, 30vh);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  flex-shrink: 0;
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

/* 歌词区：固定在舞台下方，可滚动 */
.fp-lyrics {
  position: relative;
  flex: 1;
  min-height: 96px;
  width: min(560px, 100%);
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 8px 12px;
  text-align: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  mask-image: linear-gradient(180deg, transparent 0, #000 18%, #000 82%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 18%, #000 82%, transparent 100%);
}

.fp-lyrics--dragging {
  cursor: grabbing;
}

.fp-lyrics__line {
  margin: 0;
  padding: 7px 6px;
  font-size: 15px;
  line-height: 1.5;
  color: rgba(248, 250, 252, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, font-weight 0.2s ease,
    transform 0.2s ease;
}

.fp-lyrics__line:hover {
  color: rgba(248, 250, 252, 0.85);
  background: rgba(255, 255, 255, 0.06);
}

.fp-lyrics__line:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
}

.fp-lyrics__line--active {
  color: #22c55e;
  font-weight: 600;
  transform: scale(1.04);
}

.fp-lyrics--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  font-size: 14px;
  color: rgba(248, 250, 252, 0.4);
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

.fp-controls-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fp-controls {
  display: flex;
  align-items: center;
  gap: 22px;
}

/* 音量控制：置于控制区右侧 */
.fp-volume {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 160px;
}

.fp-volume__track {
  position: relative;
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.fp-volume__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 3px;
  background: linear-gradient(90deg, #22c55e, #38bdf8);
}

.fp-volume__range {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
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

/* 顶栏右侧操作区 */
.fp-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 移动端抽屉遮罩 */
.fp-playlist-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* 响应式 */
@media (max-width: 1024px) {
  .fp-body {
    grid-template-columns: 260px 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {

  /* 播放列表已改为固定定位的抽屉，主区改用弹性单列，确保舞台水平居中 */
  .fp-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    padding: 0 16px;
  }

  /* 播放列表改为底部滑入抽屉，默认收起 */
  .fp-playlist {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1300;
    max-height: 62vh;
    border-radius: 20px 20px 0 0;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.5);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .fp-playlist--open {
    transform: translateY(0);
  }

  /* 抽屉展开时保证列表可滚动 */
  .fp-playlist__list {
    -webkit-overflow-scrolling: touch;
  }

  .fp-stage {
    order: 1;
    gap: 16px;
    /* 占满可用宽度与高度，内部内容水平居中 */
    width: 100%;
    flex: 1;
  }

  .fp-vinyl {
    width: min(240px, 34vh);
  }

  .fp-info__title {
    font-size: 20px;
  }

  /* 移动端：音量控件回到控制区下方单独一行 */
  .fp-controls-row {
    flex-direction: column;
    gap: 12px;
    /* 音量绝对定位已取消，此处允许换行避免溢出 */
    flex-wrap: wrap;
  }

  /* 控制区占满宽度并均匀分布，避免按钮超出屏幕 */
  .fp-controls {
    width: 100%;
    justify-content: space-between;
    gap: 4px;
    /* 极窄屏时允许换行，保证下载等按钮不被裁切 */
    flex-wrap: wrap;
  }

  /* 缩小按钮尺寸，保证小屏也能完整展示 */
  .fp-btn {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  .fp-btn--primary {
    width: 56px;
    height: 56px;
  }

  /* 底部内边距收紧，为播放条让出空间 */
  .fp-footer {
    padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px));
    gap: 10px;
  }

  .fp-volume {
    position: static;
    width: 100%;
    max-width: 320px;
  }
}

/* 超小屏（如 iPhone SE 竖屏）进一步压缩，避免横向溢出 */
@media (max-width: 380px) {
  .fp-controls {
    gap: 2px;
  }

  .fp-btn {
    width: 40px;
    height: 40px;
  }

  .fp-btn--primary {
    width: 52px;
    height: 52px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fp-vinyl__disc {
    animation: none;
  }

  .fp-playlist {
    transition: none;
  }

  .fullscreen-fade-enter-active,
  .fullscreen-fade-leave-active {
    transition: none;
  }
}
</style>
