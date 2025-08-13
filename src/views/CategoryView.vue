<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NList, NListItem, NThing, NTag, NEmpty, NCard, NGrid, NGridItem } from 'naive-ui'

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

interface HotListCategory {
  url: string;
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

// 热门榜单分类数据
const hotListCategories = ref<HotListCategory[]>([])
const isLoadingCategories = ref(false)

// 获取热门榜单分类
const fetchHotListCategories = async () => {
  if (categoryId.value !== 1) return // 只有热门榜单才获取分类

  isLoadingCategories.value = true
  try {
    const response = await fetch('http://localhost:81/music/hotList')
    if (response.ok) {
      const data = await response.json()
      hotListCategories.value = Array.isArray(data.data) ? data.data : []
    } else {
      console.error('获取热门榜单分类失败:', response.statusText)
      hotListCategories.value = []
    }
  } catch (error) {
    console.error('获取热门榜单分类出错:', error)
    hotListCategories.value = []
  } finally {
    isLoadingCategories.value = false
  }
}
// 处理分类点击
const handleCategoryClick = (category: HotListCategory) => {
  console.log('点击分类:', category.name, category.url)
}

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

// 监听路由变化
watch(categoryId, () => {
  fetchHotListCategories()
}, { immediate: true })

// 组件挂载时获取数据
onMounted(() => {
  fetchHotListCategories()
})
</script>

<template>
  <div class="category-view">
    <h1>{{ categoryName }}</h1>
    <!-- 热门榜单二级分类 -->
    <div v-if="categoryId === 1 && hotListCategories.length > 0" class="hot-list-categories">
      <h3 class="categories-title">热门榜单</h3>
      <n-grid :cols="6" :x-gap="12" :y-gap="12" class="categories-grid">
        <n-grid-item v-for="category in hotListCategories" :key="category.name">
          <div class="category-tag" @click="handleCategoryClick(category)">
            {{ category.name }}
          </div>
        </n-grid-item>
      </n-grid>
    </div>

    <div v-if="filteredPlaylist.length > 0" class="song-list">
      <n-list hoverable clickable>
        <n-list-item v-for="song in filteredPlaylist" :key="song.id" :class="{ 'active-song': isActive(song) }"
          @click="handlePlaySong(song)">
          <n-thing>
            <template #avatar>
              <img :src="song.cover || 'https://via.placeholder.com/50'" class="song-avatar" alt="Cover">
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

/* 热门榜单分类样式 */
.hot-list-categories {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.categories-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-left: 4px solid #1890ff;
  padding-left: 12px;
}

.categories-grid {
  margin-top: 16px;
}

.category-tag {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.category-tag:active {
  transform: translateY(0);
}
</style>