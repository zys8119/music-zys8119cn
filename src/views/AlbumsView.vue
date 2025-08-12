<script setup lang="ts">
import { ref, computed } from 'vue'
import { NEmpty, NCard, NGrid, NGi, NImage, NText } from 'naive-ui'

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  category: number;
  cover: string;
  url: string;
}

interface Album {
  name: string;
  artist: string;
  cover: string;
}

const props = defineProps<{
  playlist: Song[];
}>()

// 从播放列表中提取唯一的专辑
const albums = computed((): Album[] => {
  const albumMap = new Map<string, Album>()
  props.playlist.forEach(song => {
    if (!albumMap.has(song.album)) {
      albumMap.set(song.album, {
        name: song.album,
        artist: song.artist,
        cover: song.cover
      })
    }
  })
  return Array.from(albumMap.values())
})
</script>

<template>
  <div class="albums-view">
    <h1>专辑</h1>
    <div v-if="albums.length > 0" class="albums-grid">
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-gi v-for="(album, index) in albums" :key="index">
          <n-card hoverable class="album-card">
            <template #cover>
              <n-image
                :src="album.cover || 'https://via.placeholder.com/300'"
                fallback-src="https://via.placeholder.com/300"
                object-fit="cover"
                class="album-cover"
              />
            </template>
            <div class="album-info">
              <n-text class="album-title">{{ album.name }}</n-text>
              <n-text depth="3" class="album-artist">{{ album.artist }}</n-text>
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </div>
    <div v-else class="empty-state">
      <n-card class="content-card">
        <n-empty description="暂无专辑">
          <template #extra>
            <span>当您添加更多歌曲时，专辑将会显示在这里</span>
          </template>
        </n-empty>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.albums-view {
  padding: 20px;
}

.albums-grid {
  margin-top: 20px;
}

.album-card {
  transition: transform 0.3s;
}

.album-card:hover {
  transform: translateY(-5px);
}

.album-cover {
  height: 180px;
  width: 100%;
  object-fit: cover;
}

.album-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.album-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.album-artist {
  font-size: 12px;
}

.empty-state {
  margin-top: 20px;
}

.content-card {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>