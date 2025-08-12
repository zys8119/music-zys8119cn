<script setup lang="ts">
import { MusicalNote, Heart, Time, Albums, List } from '@vicons/ionicons5'

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  category: number;
  cover: string;
  url: string;
}

interface Category {
  id: number;
  name: string;
}

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  playlist: Song[];
  currentSong: Song | null;
  categories: Category[];
  currentCategory: number | null;
}>()

const emit = defineEmits<{
  'play-song': [song: Song];
  'change-category': [categoryId: number];
}>()

const menuOptions = [
  {
    label: '发现音乐',
    key: 'discover',
    icon: () => h(NIcon, null, { default: () => h(MusicalNote) })
  },
  {
    label: '我的收藏',
    key: 'favorites',
    icon: () => h(NIcon, null, { default: () => h(Heart) })
  },
  {
    label: '最近播放',
    key: 'recent',
    icon: () => h(NIcon, null, { default: () => h(Time) })
  },
  {
    label: '专辑',
    key: 'albums',
    icon: () => h(NIcon, null, { default: () => h(Albums) })
  },
  {
    label: '分类',
    key: 'categories',
    icon: () => h(NIcon, null, { default: () => h(List) }),
    children: props.categories.map(category => ({
      label: category.name,
      key: `category-${category.id}`,
    }))
  }
]

const activeKey = computed(() => {
  const path = route.path
  if (path.includes('/category/')) {
    const categoryId = Number(route.params.id)
    return `category-${categoryId}`
  }
  return route.name as string
})

const handleMenuClick = (key: string): void => {
  if (key.startsWith('category-')) {
    const categoryId = Number(key.split('-')[1])
    emit('change-category', categoryId)
    router.push({ name: 'category', params: { id: categoryId.toString() } })
  } else {
    router.push({ name: key })
  }
}

const filteredPlaylist = computed(() => {
  if (!props.currentCategory) return props.playlist
  return props.playlist.filter(song => song.category === props.currentCategory)
})

const handleSongClick = (song: Song): void => {
  emit('play-song', song)
}

const isSongActive = (song: Song): boolean => {
  return props.currentSong?.id === song.id
}
</script>

<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    :native-scrollbar="false"
    class="sidebar"
  >
    <div class="sidebar-content">
      <div class="menu-section">
        <n-menu
          :value="activeKey"
          :options="menuOptions"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          @update:value="handleMenuClick"
        />
      </div>
      
      <div class="playlist-section">
        <div class="playlist-header">
          <h3>播放列表</h3>
          <n-select
            v-if="categories.length > 0"
            :value="currentCategory"
            :options="categories.map(cat => ({ label: cat.name, value: cat.id }))"
            placeholder="选择分类"
            clearable
            size="small"
            style="width: 120px"
            @update:value="(val) => val && emit('change-category', val)"
          />
        </div>
        
        <n-list class="song-list">
          <n-list-item v-for="song in filteredPlaylist" :key="song.id" class="song-item" :class="{ 'active': isSongActive(song) }" @click="handleSongClick(song)">
            <n-thing>
              <template #avatar>
                <div class="song-cover">
                  <img :src="song.cover" alt="Cover" />
                </div>
              </template>
              <template #header>
                <div class="song-title">{{ song.title }}</div>
              </template>
              <template #description>
                <div class="song-artist">{{ song.artist }}</div>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </div>
    </div>
  </n-layout-sider>
</template>

<style scoped>
.sidebar {
  height: 100vh;
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 64px; /* 为顶部导航栏留出空间 */
}

.menu-section {
  flex-shrink: 0;
}

.playlist-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 16px;
  margin-top: 16px;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.playlist-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.song-list {
  flex: 1;
  overflow-y: auto;
}

.song-item {
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.song-item:hover {
  background-color: #f5f5f5;
}

.song-item.active {
  background-color: #e6f7ff;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>