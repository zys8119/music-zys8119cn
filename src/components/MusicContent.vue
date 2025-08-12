<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NCard, NSpace, NTag, NButton, NIcon, NSpin } from 'naive-ui'
import { PlayCircle, PauseCircle, Heart, HeartOutline, Share, MusicalNotes } from '@vicons/ionicons5'

interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  url: string;
  category: number;
}

const props = defineProps({
  currentSong: {
    type: Object as () => Song | null,
    default: null
  },
  isPlaying: {
    type: Boolean,
    default: false
  }
})

const isFavorite = ref<boolean>(false)

const toggleFavorite = (): void => {
  isFavorite.value = !isFavorite.value
}

const hasSong = computed((): boolean => {
  return props.currentSong !== null
})
</script>

<template>
  <div class="main-content">
    <div v-if="hasSong" class="song-details">
      <div class="song-cover-container">
        <img :src="currentSong?.cover" class="song-cover" alt="Album Cover" />
        <div class="cover-overlay" :class="{ 'playing': isPlaying }">
          <n-icon size="64" color="#fff">
            <component :is="isPlaying ? PauseCircle : PlayCircle" />
          </n-icon>
        </div>
      </div>
      
      <div class="song-info">
        <h1 class="song-title">{{ currentSong?.title }}</h1>
        <h2 class="song-artist">{{ currentSong?.artist }}</h2>
        <p class="song-album">专辑：{{ currentSong?.album }}</p>
        
        <div class="song-actions">
          <n-button type="primary" size="large" class="action-button">
            <template #icon>
              <n-icon>
                <component :is="isPlaying ? PauseCircle : PlayCircle" />
              </n-icon>
            </template>
            {{ isPlaying ? '暂停' : '播放' }}
          </n-button>
          
          <n-button secondary size="large" class="action-button" @click="toggleFavorite">
            <template #icon>
              <n-icon>
                <component :is="isFavorite ? Heart : HeartOutline" />
              </n-icon>
            </template>
            {{ isFavorite ? '已收藏' : '收藏' }}
          </n-button>
          
          <n-button secondary size="large" class="action-button">
            <template #icon>
              <n-icon>
                <share />
              </n-icon>
            </template>
            分享
          </n-button>
        </div>
      </div>
    </div>
    
    <div v-else class="no-song-selected">
      <n-card title="欢迎使用音乐播放器" class="welcome-card">
        <template #header-extra>
          <n-icon size="24" color="#1890ff">
            <musical-notes />
          </n-icon>
        </template>
        <div class="welcome-content">
          <p>从左侧播放列表选择一首歌曲开始播放</p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.song-details {
  display: flex;
  padding: 30px;
  gap: 40px;
}

.song-cover-container {
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.song-cover-container:hover .cover-overlay {
  opacity: 1;
}

.cover-overlay.playing {
  background-color: rgba(0, 0, 0, 0.5);
}

.song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.song-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #333;
}

.song-artist {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #666;
}

.song-album {
  font-size: 16px;
  color: #888;
  margin-bottom: 30px;
}

.song-actions {
  display: flex;
  gap: 15px;
  margin-top: auto;
}

.action-button {
  min-width: 100px;
}

.no-song-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}

.welcome-card {
  max-width: 500px;
  width: 100%;
}

.welcome-content {
  text-align: center;
  padding: 40px 0;
  color: #666;
}
</style>