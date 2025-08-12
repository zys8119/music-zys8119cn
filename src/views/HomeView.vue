<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NIcon } from 'naive-ui'
import { PlayCircleOutline, HeartOutline, SearchOutline } from '@vicons/ionicons5'

// 定义歌手类型
interface Artist {
  url: string
  img: string
  name: string
}

const recommendedArtists = ref<Artist[]>([])

// 获取推荐歌手数据
const fetchRecommendedArtists = async () => {
  try {
    const response = await fetch('http://localhost:81/music/recommended-singer')
    if (response.ok) {
      const result = await response.json()
      if (result.code === 200 && result.data) {
        recommendedArtists.value = result.data
      } else {
        console.error('API returned error:', result)
      }
    } else {
      console.error('Failed to fetch recommended artists:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching recommended artists:', error)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchRecommendedArtists()
})

// 处理歌手点击
const handleArtistClick = (artist: Artist) => {
  console.log('点击歌手:', artist.name)
  // 这里可以添加跳转到歌手详情页的逻辑
  if (artist.url) {
    // 可以根据url进行页面跳转或其他操作
    console.log('歌手链接:', artist.url)
  }
}
</script>

<template>
  <div class="p-10 pb-6 max-w-7xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center mb-15 py-15 bg-gradient-to-br from-blue-500 to-purple-600 rounded-4 text-white">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">欢迎来到音乐播放器</h1>
      <p class="text-xl opacity-90 m-0">发现你喜欢的音乐，享受美妙的音乐时光</p>
    </div>
    
    <!-- 推荐歌手 -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">推荐歌手</h2>
      <div class="grid grid-cols-12 gap-4">
        <div 
          v-for="(artist, index) in recommendedArtists" 
          :key="index"
          class="flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
          @click="handleArtistClick(artist)"
        >
          <div class="w-16 h-16 rounded-full overflow-hidden mb-2 shadow-md">
            <img 
              :src="artist.img" 
              :alt="artist.name" 
              class="w-full h-full object-cover"
            />
          </div>
          <span class="text-xs text-gray-700 text-center truncate w-full px-1">{{ artist.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- Features Section -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
      <div class="text-center p-10 bg-white rounded-3 shadow-lg transition-all hover:transform hover:translate-y--1 hover:shadow-xl">
        <n-icon size="48" color="#1890ff" class="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3h-6z"/></svg>
        </n-icon>
        <h3 class="text-xl font-semibold my-4 text-gray-800">海量音乐</h3>
        <p class="text-gray-600 leading-relaxed m-0">数百万首高品质音乐等你发现</p>
      </div>
      
      <div class="text-center p-10 bg-white rounded-3 shadow-lg transition-all hover:transform hover:translate-y--1 hover:shadow-xl">
        <n-icon size="48" color="#52c41a" class="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </n-icon>
        <h3 class="text-xl font-semibold my-4 text-gray-800">个性推荐</h3>
        <p class="text-gray-600 leading-relaxed m-0">基于你的喜好推荐最适合的音乐</p>
      </div>
      
      <div class="text-center p-10 bg-white rounded-3 shadow-lg transition-all hover:transform hover:translate-y--1 hover:shadow-xl">
        <n-icon size="48" color="#fa541c" class="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </n-icon>
        <h3 class="text-xl font-semibold my-4 text-gray-800">收藏管理</h3>
        <p class="text-gray-600 leading-relaxed m-0">轻松管理你的音乐收藏和播放列表</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* UnoCSS classes are used in template, no custom styles needed */
</style>