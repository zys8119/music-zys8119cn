<script setup lang="ts">
import { MusicalNote, Heart, Time, Albums, List } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

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
    class="h-100vh bg-white border-r border-gray-200 flex flex-col"
  >
    <div class="flex flex-col h-full pt-16">
      <div class="flex-shrink-0">
        <n-menu
          :value="activeKey"
          :options="menuOptions"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          @update:value="handleMenuClick"
        />
      </div>
      
      <div class="flex-1 flex flex-col overflow-hidden px-4 mt-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="m-0 text-base text-gray-800">播放列表</h3>
          <n-select
            v-if="categories.length > 0"
            :value="currentCategory"
            :options="categories.map(cat => ({ label: cat.name, value: cat.id }))"
            placeholder="选择分类"
            clearable
            size="small"
            class="w-30"
            @update:value="(val) => val && emit('change-category', val)"
          />
        </div>
        
        <n-list class="flex-1 overflow-y-auto">
          <n-list-item v-for="song in filteredPlaylist" :key="song.id" class="cursor-pointer rounded transition-colors-300 hover:bg-gray-50" :class="{ 'bg-blue-50': isSongActive(song) }" @click="handleSongClick(song)">
            <n-thing>
              <template #avatar>
                <div class="w-10 h-10 rounded overflow-hidden">
                  <img :src="song.cover" alt="Cover" class="w-full h-full object-cover" />
                </div>
              </template>
              <template #header>
                <div class="text-sm font-medium text-gray-800 truncate">{{ song.title }}</div>
              </template>
              <template #description>
                <div class="text-xs text-gray-400 truncate">{{ song.artist }}</div>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </div>
    </div>
  </n-layout-sider>
</template>

<style scoped>
/* UnoCSS classes are used in template, minimal custom styles if needed */
</style>