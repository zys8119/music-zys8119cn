<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NList, NListItem, NThing, NTag, NEmpty, NCard } from 'naive-ui'

interface Song {
  id: number;
  title: string;
  artist: string;
  cover?: string;
  url: string;
  category: number;
}

interface Category {
  id: number;
  name: string;
}

const route = useRoute()
const categoryId = computed(() => Number(route.params.id))

const props = defineProps({
  playlist: {
    type: Array as () => Song[],
    default: () => []
  },
  categories: {
    type: Array as () => Category[],
    default: () => []
  },
  currentSong: {
    type: Object as () => Song | null,
    default: null
  }
})

const emit = defineEmits<{
  (e: 'play-song', song: Song): void;
}>()

// 根据当前分类过滤歌曲列表
const filteredPlaylist = computed((): Song[] => {
  return props.playlist.filter(song => song.category === categoryId.value)
})

// 获取当前分类名称
const categoryName = computed((): string => {
  const category = props.categories.find(cat => cat.id === categoryId.value)
  return category ? category.name : '未知分类'
})

const isActive = (song: Song): boolean => {
  return Boolean(props.currentSong && props.currentSong.id === song.id)
}

const handlePlaySong = (song: Song): void => {
  emit('play-song', song)
}
</script>

<template>
  <div class="category-view">
    <h1>{{ categoryName }}</h1>
    
    <div v-if="filteredPlaylist.length > 0" class="song-list">
      <n-list hoverable clickable>
        <n-list-item 
          v-for="song in filteredPlaylist" 
          :key="song.id"
          :class="{ 'active-song': isActive(song) }"
          @click="handlePlaySong(song)"
        >
          <n-thing>
            <template #avatar>
              <img 
                :src="song.cover || 'https://via.placeholder.com/50'" 
                class="song-avatar"
                alt="Cover"
              >
            </template>
            <template #header>
              <div class="song-header">
                <span class="song-title">{{ song.title }}</span>
              </div>
            </template>
            <template #description>
              <span class="song-artist">{{ song.artist }}</span>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
    </div>
    
    <n-card v-else class="empty-container">
      <n-empty description="暂无歌曲">
        <template #extra>
          <span>该分类下暂时没有歌曲</span>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<style scoped>
.category-view {
  padding: 20px;
}

.song-list {
  margin-top: 20px;
}

.song-avatar {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
}

.song-header {
  display: flex;
  align-items: center;
}

.song-title {
  font-weight: 500;
}

.song-artist {
  font-size: 12px;
  color: #888;
}

.active-song {
  background-color: #e6f7ff !important;
}

.empty-container {
  margin-top: 20px;
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>