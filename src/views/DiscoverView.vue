<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NSpace, NGrid, NGi, NImage, NText, NButton } from 'naive-ui'

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
  playlist: Song[];
}>()

const emit = defineEmits<{
  'play-song': [song: Song];
}>()

const handlePlaySong = (song: Song): void => {
  emit('play-song', song)
}
</script>

<template>
  <div class="discover-view">
    <h1>发现音乐</h1>
    <div class="content-section">
      <n-card title="推荐歌曲" class="section-card">
        <n-grid :cols="4" :x-gap="16" :y-gap="16">
          <n-gi v-for="song in playlist" :key="song.id">
            <n-card hoverable class="song-card">
              <template #cover>
                <n-image
                  :src="song.cover || 'https://via.placeholder.com/300'"
                  fallback-src="https://via.placeholder.com/300"
                  object-fit="cover"
                  class="song-cover"
                />
              </template>
              <div class="song-info">
                <n-text class="song-title">{{ song.title }}</n-text>
                <n-text depth="3" class="song-artist">{{ song.artist }}</n-text>
                <n-button
                  tertiary
                  type="primary"
                  size="small"
                  class="play-button"
                  @click="handlePlaySong(song)"
                >
                  播放
                </n-button>
              </div>
            </n-card>
          </n-gi>
        </n-grid>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.discover-view {
  padding: 20px;
}

.content-section {
  margin-top: 20px;
}

.section-card {
  margin-bottom: 30px;
}

.song-card {
  transition: transform 0.3s;
}

.song-card:hover {
  transform: translateY(-5px);
}

.song-cover {
  height: 180px;
  width: 100%;
  object-fit: cover;
}

.song-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.song-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
}

.play-button {
  margin-top: 8px;
  align-self: flex-end;
}
</style>