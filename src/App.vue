<script setup lang="ts">
import MusicHeader from './components/MusicHeader.vue'
import MusicSidebar from './components/MusicSidebar.vue'
import MusicPlayer from './components/MusicPlayer.vue'

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

// 消息将在模板中通过Provider提供
const currentSong = ref<Song | null>(null)
const isPlaying = ref<boolean>(false)
const playlist = ref<Song[]>([])

// 音乐分类列表
const categories = ref<Category[]>([
  { id: 1, name: '流行音乐' },
  { id: 2, name: '民谣' },
  { id: 3, name: '古典音乐' },
  { id: 4, name: '说书' },
  { id: 5, name: '电子音乐' }
])

// 当前选中的分类
const currentCategory = ref<number | null>(null)

// 加载歌曲列表
onMounted(() => {
  // 从22a5.com网站获取的音乐资源
  playlist.value = [
    {
      id: 6,
      title: '就是南方凯《列车开往春天》[Mp3_Lrc]',
      artist: '白水寒',
      album: '白水寒',
      category: 2, // 民谣
      cover: 'https://img1.kuwo.cn/star/albumcover/300/s3s18/12/2706195026.jpg',
      url: 'https://er-sycdn.kuwo.cn/846ab17104569ffd3a5f68c5e4f84127/689ad2e3/resource/30106/trackmedia/C200003raqZW2WHzzR.m4a?from=vip'
    },
    {
      id: 7,
      title: '白水寒《天真的橡皮》[Mp3_Lrc]',
      artist: '白水寒',
      album: '白水寒',
      category: 2, // 民谣
      cover: 'http://img4.kuwo.cn/pic_music/300/s4s76/19/3055741675.jpg',
      url: 'https://lx-sycdn.kuwo.cn/93d3d288e00e7f430bf79a72b8cb7811/689ad24a/resource/a1/67/42/3606865785.aac?from=vip'
    },
    {
      id: 8,
      title: '第2026集 心亡，则忘',
      artist: '小酷说书',
      album: '小酷说书系列',
      category: 4, // 说书
      cover: 'https://p2.music.126.net/0-Ybpa8FrDfRgKYCTJD8Xg==/109951167206009876.jpg',
      url: 'https://www.22a5.com/mp3/esklggxsa.html'
    },
    {
      id: 9,
      title: 'ÉVEIL',
      artist: 'krash.',
      album: 'ÉVEIL',
      category: 5, // 电子音乐
      cover: 'https://p2.music.126.net/9kZl6NRj3HxmQQ8DqTjZ4Q==/109951165625582721.jpg',
      url: 'https://www.22a5.com/mp3/gsgkgamda.html'
    },
    {
      id: 10,
      title: '"Cerchero lontana terra" (Ernesto)',
      artist: 'Gaetano Donizetti & Orchestra del Teatro alla Scala di Milano',
      album: 'Classical Collection',
      category: 3, // 古典音乐
      cover: 'https://p1.music.126.net/WY-PtEHJOhLVQR4YGtYQKg==/109951167351825826.jpg',
      url: 'https://www.22a5.com/mp3/sldeglcl.html'
    },
    {
      id: 11,
      title: '夜曲',
      artist: '周杰伦',
      album: '十一月的萧邦',
      category: 1, // 流行音乐
      cover: 'https://p1.music.126.net/9ajqx2JRcI0CvAVSy0AYtQ==/109951166562828988.jpg',
      url: 'https://www.22a5.com/mp3/sample.html'
    }
    ]
  })

// 播放歌曲
const playSong = (song: Song): void => {
  currentSong.value = song
  isPlaying.value = true
  // 消息提示将在组件内部处理
}

// 切换播放状态
const togglePlay = (): void => {
  if (currentSong.value) {
    isPlaying.value = !isPlaying.value
  } else if (playlist.value.length > 0) {
    playSong(playlist.value[0])
  }
}

// 播放下一首
const playNext = (): void => {
  if (!currentSong.value || playlist.value.length === 0) return

  const currentIndex = playlist.value.findIndex(song => song.id === currentSong.value!.id)
  const nextIndex = (currentIndex + 1) % playlist.value.length
  playSong(playlist.value[nextIndex])
}

// 播放上一首
const playPrev = (): void => {
  if (!currentSong.value || playlist.value.length === 0) return
  
  const currentIndex = playlist.value.findIndex(song => song.id === currentSong.value!.id)
  const prevIndex = (currentIndex - 1 + playlist.value.length) % playlist.value.length
  playSong(playlist.value[prevIndex])
}

// 处理分类变更
const handleCategoryChange = (categoryId: number): void => {
  currentCategory.value = categoryId
  if (categoryId) {
    router.push({ name: 'category', params: { id: categoryId.toString() } })
  }
}

// 提供全局数据给路由页面组件
provide('playlist', playlist)
provide('currentSong', currentSong)
provide('categories', categories)
provide('currentCategory', currentCategory)
provide('playSong', playSong)
</script>

<template>
  <n-config-provider>
    <n-message-provider>
      <div class="music-player-container">
        <MusicHeader 
          :categories="categories"
          :currentCategory="currentCategory"
          @change-category="handleCategoryChange"
        />
        <div class="music-content">
          <MusicSidebar 
            :playlist="playlist" 
            :currentSong="currentSong" 
            :categories="categories"
            :currentCategory="currentCategory"
            @play-song="playSong" 
            @change-category="handleCategoryChange"
          />
          <div class="main-content">
            <router-view 
              :playlist="playlist" 
              :currentSong="currentSong" 
              :isPlaying="isPlaying"
              :categories="categories"
              @play-song="playSong"
            />
          </div>
        </div>
        <MusicPlayer 
          :currentSong="currentSong"
          :isPlaying="isPlaying"
          @toggle-play="togglePlay"
          @play-next="playNext"
          @play-prev="playPrev"
        />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped>
.music-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: #f9f9f9;
}
</style>
