<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { MusicalNote, Heart, Time, Albums, List, TrashOutline, CheckboxOutline } from '@vicons/ionicons5'
import { NIcon, NButton, NCheckbox } from 'naive-ui'

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
  'remove-songs': [songIds: number[]];
  'clear-playlist': [];
}>()

// 菜单项：分类子项需随异步加载的分类动态更新
const menuOptions = computed(() => [
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
])

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
    // 交由父组件统一处理分类跳转
    emit('change-category', categoryId)
  } else {
    router.push({ name: key })
  }
}

const filteredPlaylist = computed(() => {
  if (!props.currentCategory) return props.playlist
  return props.playlist.filter(song => song.category === props.currentCategory)
})

const globalPlaySong = inject('globalPlaySong') as ((song: Song) => void) | undefined

const handleSongClick = (song: Song): void => {
  if (globalPlaySong) {
    globalPlaySong(song)
  } else {
    emit('play-song', song)
  }
}

const isSongActive = (song: Song): boolean => {
  return props.currentSong?.id === song.id
}

// 选择状态管理
const selectedSongs = ref<Set<number>>(new Set())

// 全选状态
const isAllSelected = computed(() => {
  return filteredPlaylist.value.length > 0 &&
    filteredPlaylist.value.every(song => selectedSongs.value.has(song.id))
})

const isIndeterminate = computed(() => {
  const selectedCount = filteredPlaylist.value.filter(song => selectedSongs.value.has(song.id)).length
  return selectedCount > 0 && selectedCount < filteredPlaylist.value.length
})



// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedSongs.value.clear()
  } else {
    filteredPlaylist.value.forEach(song => {
      selectedSongs.value.add(song.id)
    })
  }
}

// 切换单个歌曲选择状态
const toggleSongSelection = (songId: number, event: Event) => {
  event.stopPropagation()
  if (selectedSongs.value.has(songId)) {
    selectedSongs.value.delete(songId)
  } else {
    selectedSongs.value.add(songId)
  }
}

// 删除选中的歌曲
const removeSelectedSongs = () => {
  if (selectedSongs.value.size > 0) {
    emit('remove-songs', Array.from(selectedSongs.value))
    selectedSongs.value.clear()
  }
}

// 删除单个歌曲
const removeSingleSong = (songId: number, event: Event) => {
  event.stopPropagation()
  emit('remove-songs', [songId])
}

// 清空播放列表
const clearPlaylist = () => {
  emit('clear-playlist')
  selectedSongs.value.clear()
}

// 处理歌曲点击
const handleSongItemClick = (song: Song, event: Event) => {
  // 如果点击的是复选框区域，不播放歌曲
  const target = event.target as HTMLElement
  if (target.closest('.n-checkbox') || target.closest('[data-checkbox]')) {
    return
  }
  handleSongClick(song)
}
</script>

<template>
  <n-layout-sider bordered collapse-mode="width" :collapsed-width="64" :width="240" :native-scrollbar="false"
    class="sidebar h-100vh flex flex-col">
    <div class="flex flex-col h-full pt-16">
      <div class="flex-shrink-0">
        <n-menu :value="activeKey" :options="menuOptions" :collapsed-width="64" :collapsed-icon-size="22"
          @update:value="handleMenuClick" />
      </div>

      <div class="flex-1 flex flex-col overflow-hidden px-4 mt-4">
        <div class="list-header">
          <h3 class="list-title">播放列表</h3>
          <n-button size="small" type="error" @click="clearPlaylist" :disabled="filteredPlaylist.length === 0">
            <template #icon>
              <n-icon>
                <TrashOutline />
              </n-icon>
            </template>
            清空
          </n-button>
        </div>

        <!-- 批量操作栏 -->
        <div v-if="selectedSongs.size > 0" class="flex justify-between items-center mb-3 p-2 bg-gray-50 rounded">
          <div class="flex items-center gap-2">
            <n-checkbox :checked="isAllSelected" :indeterminate="isIndeterminate" @update:checked="toggleSelectAll">
              全选 ({{ selectedSongs.size }}/{{ filteredPlaylist.length }})
            </n-checkbox>
          </div>
          <n-button size="small" type="error" @click="removeSelectedSongs">
            <template #icon>
              <n-icon>
                <TrashOutline />
              </n-icon>
            </template>
            删除选中
          </n-button>
        </div>

        <!-- 全选操作 -->
        <div v-else-if="filteredPlaylist.length > 0" class="flex items-center mb-3">
          <n-checkbox :checked="isAllSelected" :indeterminate="isIndeterminate" @update:checked="toggleSelectAll">
            全选
          </n-checkbox>
        </div>

        <n-list class="flex-1 overflow-y-auto">
          <n-list-item v-for="song in filteredPlaylist" :key="song.id"
            class="cursor-pointer rounded transition-colors-300 hover:bg-gray-50 group" :class="{
              'bg-blue-50': isSongActive(song),
              'bg-red-50': selectedSongs.has(song.id)
            }" @click="handleSongItemClick(song, $event)">
            <template #prefix>
              <n-checkbox :checked="selectedSongs.has(song.id)" @click.stop="toggleSongSelection(song.id, $event)"
                data-checkbox />
            </template>
            <n-thing class="flex-1">
              <template #header>
                <div class="text-sm font-medium text-gray-800 truncate">{{ song.title }}</div>
              </template>
              <template #description>
                <div class="text-xs text-gray-400 truncate">{{ song.artist }}</div>
              </template>
            </n-thing>
            <template #suffix>
              <n-button size="small" type="error" quaternary
                class="opacity-0 group-hover:opacity-100 transition-opacity" @click="removeSingleSong(song.id, $event)">
                <template #icon>
                  <n-icon>
                    <TrashOutline />
                  </n-icon>
                </template>
              </n-button>
            </template>
          </n-list-item>
        </n-list>
      </div>
    </div>
  </n-layout-sider>
</template>

<style scoped>
.sidebar {
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  position: relative;
  padding-left: 10px;
}

.list-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #1890ff, #722ed1);
}

/* 播放列表项美化 */
:deep(.n-list-item) {
  border-radius: 10px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.n-list-item:hover) {
  background-color: #f7f9fc;
  box-shadow: inset 0 0 0 1px rgba(24, 144, 255, 0.12);
}
</style>