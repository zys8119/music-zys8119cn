<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { NCard, NEmpty, NButton, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { TrashOutline, PlayCircleOutline, MusicalNotesOutline, TimeOutline } from '@vicons/ionicons5'
import { musicApi } from '../services/api'

interface Song {
  id: number
  title: string
  artist: string
  cover?: string
  url: string
  category: number
}

interface Recent {
  id: number
  title: string
  artist: string
  cover: string
  url: string
  played_at: number
}

const message = useMessage()
const addSongsToPlaylist = inject<(songs: Song[]) => void>('addSongsToPlaylist', () => {})

const recent = ref<Recent[]>([])
const isLoading = ref(false)

async function load() {
  isLoading.value = true
  try {
    const res = await musicApi.getRecent()
    if (res.code === 200) recent.value = res.data || []
  } catch (e) {
    console.error('加载最近播放失败', e)
    message.error('加载最近播放失败')
  } finally {
    isLoading.value = false
  }
}

async function clearAll() {
  try {
    const res = await musicApi.clearRecent()
    if (res.code === 200) {
      message.success('已清空最近播放')
      recent.value = []
    }
  } catch (e) {
    console.error('清空失败', e)
    message.error('清空失败')
  }
}

function play(item: Recent) {
  addSongsToPlaylist([
    {
      id: item.id + 200000,
      title: item.title,
      artist: item.artist,
      cover: item.cover,
      url: item.url,
      category: -4,
    },
  ])
}

function playAll() {
  if (!recent.value.length) return
  addSongsToPlaylist(
    recent.value.map((r) => ({
      id: r.id + 200000,
      title: r.title,
      artist: r.artist,
      cover: r.cover,
      url: r.url,
      category: -4,
    })),
  )
}

// 相对时间展示
function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day} 天前`
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(load)
</script>

<template>
  <div class="recent-view">
    <div class="view-header">
      <h1 class="view-title">最近播放</h1>
      <span class="view-subtitle">最近 {{ recent.length }} 首</span>
      <div class="header-actions">
        <n-button v-if="recent.length" type="primary" size="small" @click="playAll">
          <template #icon>
            <n-icon><PlayCircleOutline /></n-icon>
          </template>
          播放全部
        </n-button>
        <n-popconfirm v-if="recent.length" @positive-click="clearAll">
          <template #trigger>
            <n-button size="small" type="error" secondary>
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
              清空
            </n-button>
          </template>
          确定清空最近播放记录？
        </n-popconfirm>
      </div>
    </div>

    <n-card v-if="!isLoading && recent.length === 0" class="empty-container">
      <n-empty description="暂无最近播放记录">
        <template #extra>
          <span>播放歌曲后，将会在这里显示您最近播放的歌曲</span>
        </template>
      </n-empty>
    </n-card>

    <div v-else class="recent-list">
      <div v-for="item in recent" :key="item.id" class="recent-item">
        <div class="recent-cover" @click="play(item)">
          <img v-if="item.cover" :src="item.cover" :alt="item.title" />
          <div v-else class="recent-cover__ph">
            <n-icon size="20"><MusicalNotesOutline /></n-icon>
          </div>
          <span class="recent-cover__mask"><n-icon size="18"><PlayCircleOutline /></n-icon></span>
        </div>
        <div class="recent-meta" @click="play(item)">
          <div class="recent-title">{{ item.title }}</div>
          <div class="recent-artist">{{ item.artist }}</div>
        </div>
        <div class="recent-time">
          <n-icon size="14"><TimeOutline /></n-icon>
          <span>{{ formatTime(item.played_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recent-view {
  padding: 8px 4px 20px;
}

.view-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
}

.view-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--app-text);
  position: relative;
  padding-left: 16px;
}

.view-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 22px;
  border-radius: 3px;
  background: linear-gradient(180deg, #1890ff, #722ed1);
}

.view-subtitle {
  font-size: 13px;
  color: var(--app-muted);
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.empty-container {
  min-height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.recent-item:hover {
  box-shadow: var(--app-shadow);
  transform: translateX(2px);
}

.recent-cover {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
}

.recent-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recent-cover__ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.recent-cover__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.recent-cover:hover .recent-cover__mask {
  opacity: 1;
}

.recent-meta {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.recent-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-artist {
  margin-top: 2px;
  font-size: 12px;
  color: var(--app-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--app-muted);
}
</style>
