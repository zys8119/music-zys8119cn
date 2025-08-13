<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
import { PlayCircleOutline, HeartOutline, SearchOutline } from '@vicons/ionicons5'

const router = useRouter()

// 定义歌手类型
interface Artist {
  url: string
  img: string
  name: string
}

// 定义音乐类型
interface Song {
  url: string
  img: string
  music: string
  time: string
  singer: string
  playTime: string
}

// 定义歌单类型
interface Playlist {
  url: string
  img: string
  name: string
}

// 定义飙升榜歌曲类型
interface RisingSong {
  url: string
  name: string
  rank: number
}

const recommendedArtists = ref<Artist[]>([])
const popularSongs = ref<Song[]>([])
const hotPlaylists = ref<Playlist[]>([])
const risingSongs = ref<RisingSong[]>([])

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

// 获取网友都在听数据
const fetchPopularSongs = async () => {
  try {
    const response = await fetch('http://localhost:81/music/netizensAreAllListening')
    if (response.ok) {
      const result = await response.json()
      if (result.code === 200 && result.data) {
        popularSongs.value = result.data
        return
      } else {
        console.error('API returned error:', result)
      }
    } else {
      console.error('Failed to fetch popular songs:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching popular songs:', error)
  }

  // 如果API调用失败，使用模拟数据
  popularSongs.value = [
    {
      url: 'https://www.22a5.com/mp3/dseesdl.html',
      img: 'https://img1.kuwo.cn/star/albumcover/300/s4s84/92/1284532959.png',
      music: '认真的雪',
      time: '(刚刚)',
      singer: '薛之谦',
      playTime: '245'
    },
    {
      url: 'https://www.22a5.com/mp3/example1.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      music: 'Bad Idea',
      time: '(1分钟前)',
      singer: 'Sharon Mills',
      playTime: '193'
    },
    {
      url: 'https://www.22a5.com/mp3/example2.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      music: '遇合上的缘',
      time: '(2分钟前)',
      singer: '何雨刘政',
      playTime: '210'
    },
    {
      url: 'https://www.22a5.com/mp3/example3.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      music: '面心',
      time: '(3分钟前)',
      singer: '易烊千玺-Lin',
      playTime: '180'
    },
    {
      url: 'https://www.22a5.com/mp3/example4.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      music: 'J.S. Bach: Sinfonia',
      time: '(5分钟前)',
      singer: 'Janine Jansen&Maxim',
      playTime: '320'
    },
    {
      url: 'https://www.22a5.com/mp3/example5.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      music: 'Forest Fire',
      time: '(6分钟前)',
      singer: '0142',
      playTime: '223'
    },
    {
      url: 'https://www.22a5.com/mp3/example6.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      music: 'In The End (DJ版本)',
      time: '(8分钟前)',
      singer: '手机加油站',
      playTime: '129'
    },
    {
      url: 'https://www.22a5.com/mp3/example7.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      music: 'Gentleman',
      time: '(10分钟前)',
      singer: 'Psy',
      playTime: '291'
    }
  ]
}

// 获取热门歌单数据
const fetchHotPlaylists = async () => {
  try {
    const response = await fetch('http://localhost:81/music/hotPlayList')
    if (response.ok) {
      const result = await response.json()
      if (result.code === 200 && result.data) {
        hotPlaylists.value = result.data
        return
      } else {
        console.error('API returned error:', result)
      }
    } else {
      console.error('Failed to fetch hot playlists:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching hot playlists:', error)
  }

  // 如果API调用失败，使用模拟数据
  hotPlaylists.value = [
    {
      url: 'https://www.22a5.com/playlist/gkkgsxaaec.html',
      img: 'https://s.5bb3.com/img1.kuwo.cn/star/userpl2015/45/65/1714560958285_445571345_500.jpg?param=170y130',
      name: '【小众女声】轻似雀羽，煦如日光'
    },
    {
      url: 'https://www.22a5.com/playlist/example1.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '流行音乐合集'
    },
    {
      url: 'https://www.22a5.com/playlist/example2.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '分手快乐'
    },
    {
      url: 'https://www.22a5.com/playlist/example3.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '日语精选'
    },
    {
      url: 'https://www.22a5.com/playlist/example4.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '南方小镇豆腐脑'
    },
    {
      url: 'https://www.22a5.com/playlist/example5.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '通勤必备'
    },
    {
      url: 'https://www.22a5.com/playlist/example6.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '日系复古'
    },
    {
      url: 'https://www.22a5.com/playlist/example7.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '浪漫情歌'
    },
    {
      url: 'https://www.22a5.com/playlist/example8.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '港台经典'
    },
    {
      url: 'https://www.22a5.com/playlist/example9.html',
      img: 'https://p1.music.126.net/BgbHf9gKc6kWQI6atvqJyQ==/109951165142435842.jpg',
      name: '光阴诗集'
    }
  ]
}

// 获取歌曲飙升榜数据
const fetchRisingSongs = async () => {
  try {
    const response = await fetch('http://localhost:81/music/songRising')
    if (response.ok) {
      const result = await response.json()
      if (result.code === 200 && result.data) {
        // 为数据添加排名
        risingSongs.value = result.data.map((song: any, index: number) => ({
          ...song,
          rank: index + 1
        }))
        return
      } else {
        console.error('API returned error:', result)
      }
    } else {
      console.error('Failed to fetch rising songs:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching rising songs:', error)
  }

  // 如果API调用失败，使用模拟数据
  risingSongs.value = [
    {
      url: 'https://www.22a5.com/mp3/dsksmamxd.html',
      name: '刘阳阳《敬往事杯中沉浮》',
      rank: 1
    },
    {
      url: 'https://www.22a5.com/mp3/rising2.html',
      name: '周杰伦《稻香》',
      rank: 2
    },
    {
      url: 'https://www.22a5.com/mp3/rising3.html',
      name: '周杰伦《青花瓷》',
      rank: 3
    },
    {
      url: 'https://www.22a5.com/mp3/rising4.html',
      name: '周杰伦《夜曲》',
      rank: 4
    },
    {
      url: 'https://www.22a5.com/mp3/rising5.html',
      name: '周杰伦《告白气球》',
      rank: 5
    },
    {
      url: 'https://www.22a5.com/mp3/rising6.html',
      name: '周杰伦《简单爱》',
      rank: 6
    },
    {
      url: 'https://www.22a5.com/mp3/rising7.html',
      name: '周杰伦《彩虹》',
      rank: 7
    },
    {
      url: 'https://www.22a5.com/mp3/rising8.html',
      name: '周杰伦《东风破》',
      rank: 8
    },
    {
      url: 'https://www.22a5.com/mp3/rising9.html',
      name: '周杰伦《晴天》',
      rank: 9
    },
    {
      url: 'https://www.22a5.com/mp3/rising10.html',
      name: '周杰伦《菊花台》',
      rank: 10
    }
  ]
}

// 组件挂载时获取数据
onMounted(() => {
  fetchRecommendedArtists()
  fetchPopularSongs()
  fetchHotPlaylists()
  fetchRisingSongs()
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

// 处理歌曲点击
const handleSongClick = (song: Song) => {
  console.log('播放歌曲:', song.music)
  console.log('歌手:', song.singer)
  console.log('播放时间:', song.time)
  console.log('歌曲时长(秒):', song.playTime)
  // 这里可以添加播放歌曲的逻辑
  if (song.url) {
    console.log('歌曲链接:', song.url)
    // 可以跳转到歌曲详情页或开始播放
  }
}

// 处理歌单点击
const handlePlaylistClick = (playlist: Playlist) => {
  console.log('打开歌单:', playlist.name)
  // 这里可以添加跳转到歌单详情页的逻辑
  if (playlist.url) {
    console.log('歌单链接:', playlist.url)
    // 可以跳转到歌单详情页
  }
}

// 处理飙升榜歌曲点击
const handleRisingSongClick = (song: RisingSong) => {
  console.log('播放飙升榜歌曲:', song.name)
  console.log('排名:', song.rank)
  // 这里可以添加播放歌曲的逻辑
  if (song.url) {
    console.log('歌曲链接:', song.url)
    // 可以跳转到歌曲详情页或开始播放
  }
}

// 处理功能卡片点击
const handleFeatureClick = (feature: string) => {
  switch (feature) {
    case 'discover':
      router.push('/discover')
      break
    case 'recommend':
      router.push('/discover')
      break
    case 'favorites':
      router.push('/favorites')
      break
    default:
      console.log('未知功能:', feature)
  }
}
</script>

<template>
  <div class="p-10 pb-6 max-w-7xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center mb-15 py-15 bg-gradient-to-br from-blue-500 to-purple-600 rounded-4 text-white">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
        欢迎来到音乐播放器</h1>
      <p class="text-xl opacity-90 m-0">发现你喜欢的音乐，享受美妙的音乐时光</p>
    </div>
    <!-- Features Section -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 mb-10">
      <div
        class="text-center p-10 bg-white rounded-3 shadow-lg transition-all hover:transform hover:translate-y--1 hover:shadow-xl cursor-pointer"
        @click="handleFeatureClick('discover')">
        <n-icon size="48" color="#1890ff" class="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </n-icon>
        <h3 class="text-xl font-semibold my-4 text-gray-800">海量音乐</h3>
        <p class="text-gray-600 leading-relaxed m-0">数百万首高品质音乐等你发现</p>
      </div>

      <div
        class="text-center p-10 bg-white rounded-3 shadow-lg transition-all hover:transform hover:translate-y--1 hover:shadow-xl cursor-pointer"
        @click="handleFeatureClick('recommend')">
        <n-icon size="48" color="#52c41a" class="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </n-icon>
        <h3 class="text-xl font-semibold my-4 text-gray-800">个性推荐</h3>
        <p class="text-gray-600 leading-relaxed m-0">基于你的喜好推荐最适合的音乐</p>
      </div>

      <div
        class="text-center p-10 bg-white rounded-3 shadow-lg transition-all hover:transform hover:translate-y--1 hover:shadow-xl cursor-pointer"
        @click="handleFeatureClick('favorites')">
        <n-icon size="48" color="#fa541c" class="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </n-icon>
        <h3 class="text-xl font-semibold my-4 text-gray-800">收藏管理</h3>
        <p class="text-gray-600 leading-relaxed m-0">轻松管理你的音乐收藏和播放列表</p>
      </div>
    </div>

    <!-- 推荐歌手 -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">推荐歌手</h2>
      <div class="grid grid-cols-12 gap-4">
        <div v-for="(artist, index) in recommendedArtists" :key="index"
          class="flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
          @click="handleArtistClick(artist)">
          <div class="w-16 h-16 rounded-full overflow-hidden mb-2 shadow-md">
            <img :src="artist.img" :alt="artist.name" class="w-full h-full object-cover" />
          </div>
          <span class="text-xs text-gray-700 text-center truncate w-full px-1">{{ artist.name }}</span>
        </div>
      </div>
    </div>
    <!-- 歌曲飙升榜 -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">歌曲飙升榜</h2>
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="space-y-3">
          <div v-for="(song, index) in risingSongs.slice(0, 10)" :key="index"
            class="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
            @click="handleRisingSongClick(song)">
            <!-- 排名 -->
            <div class="flex-shrink-0 w-8 text-center">
              <span class="text-lg font-bold" :class="{
                'text-red-500': song.rank <= 3,
                'text-orange-500': song.rank > 3 && song.rank <= 6,
                'text-gray-600': song.rank > 6
              }">
                {{ song.rank }}
              </span>
            </div>

            <!-- 歌曲信息 -->
            <div class="flex-1 ml-4 min-w-0">
              <h3 class="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {{ song.name }}
              </h3>
            </div>

            <!-- 播放按钮 -->
            <div class="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <n-icon size="20" color="#1890ff" class="cursor-pointer hover:scale-110 transition-transform">
                <PlayCircleOutline />
              </n-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 网友都在听 -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">网友都在听</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="(song, index) in popularSongs" :key="index"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3"
          @click="handleSongClick(song)">
          <div class="relative mb-3">
            <img :src="song.img" :alt="song.music" class="w-full aspect-square object-cover rounded-lg" />
            <div class="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {{ song.time }}
            </div>
          </div>
          <h3 class="font-medium text-gray-900 text-sm mb-1 truncate" :title="song.music">
            {{ song.music }}
          </h3>
          <p class="text-gray-600 text-xs truncate" :title="song.singer">
            {{ song.singer }}
          </p>
        </div>
      </div>
    </div>
    <!-- 热门歌单 -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">热门歌单</h2>
      <div
        class="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        <div class="flex gap-4 pb-4" style="width: max-content; min-width: 100%;">
          <div v-for="(playlist, index) in hotPlaylists.slice(0, 8)" :key="index"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer p-3 flex-shrink-0 hover:scale-105"
            style="width: 160px;" @click="handlePlaylistClick(playlist)">
            <div class="relative mb-3">
              <img :src="playlist.img" :alt="playlist.name" class="w-full aspect-square object-cover rounded-lg" />
            </div>
            <h3 class="font-medium text-gray-900 text-sm mb-1 truncate" :title="playlist.name">
              {{ playlist.name }}
            </h3>
          </div>
        </div>
      </div>
    </div>




  </div>
</template>

<style scoped>
/* UnoCSS classes are used in template, no custom styles needed */
</style>