<script setup lang="ts">
import {
  Search,
  MusicalNotes,
  Home,
  TrendingUp,
  Flash,
  Library,
  Cafe,
  Leaf
} from '@vicons/ionicons5'

interface Category {
  id: number;
  name: string;
  url?: string;
  type?: string;
}

const router = useRouter()
const message = useMessage()

const props = defineProps<{
  categories: Category[];
  currentCategory: number | null;
}>()

const emit = defineEmits<{
  'change-category': [categoryId: number];
}>()

const handleCategoryChange = (categoryId: number): void => {
  // 仅通知父组件统一处理跳转（父组件会携带目标站点 URL/类型）
  emit('change-category', categoryId)
}

// 搜索关键词
const searchKeyword = ref('')

// 执行搜索：跳转到搜索结果页
const handleSearch = (): void => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    message.warning('请输入您要搜索的内容！')
    return
  }
  router.push({ name: 'search', query: { wd: keyword } })
}

const goToHome = (): void => {
  router.push({ name: 'home' })
}

// 依据真实导航类型匹配图标
const getCategoryIcon = (category: Category) => {
  const iconMap: Record<string, any> = {
    home: Home,        // 首页
    rank: TrendingUp,  // 榜单
    singer: Library,   // 歌手
    playlist: Cafe,    // 歌单
    radio: Flash,      // 电台
    mv: Leaf           // 高清MV
  }
  return iconMap[category.type || ''] || Home
}
</script>

<template>
  <n-layout-header class="header">
    <div class="header-content">
      <div class="logo">
        <n-icon size="24" color="#1890ff">
          <musical-notes />
        </n-icon>
        <span class="logo-text" @click="goToHome">音乐播放器</span>
      </div>
      <div class="search-container">
        <n-input v-model:value="searchKeyword" placeholder="搜索歌曲、歌手或专辑" round clearable class="search-input"
          @keyup.enter="handleSearch">
          <template #prefix>
            <n-icon>
              <search />
            </n-icon>
          </template>
          <template #suffix>
            <n-button quaternary circle size="small" class="search-btn" aria-label="搜索" @click="handleSearch">
              <template #icon>
                <n-icon>
                  <search />
                </n-icon>
              </template>
            </n-button>
          </template>
        </n-input>
      </div>
      <div class="nav-menu">
        <div v-if="categories.length > 0" class="nav-icons">
          <div v-for="category in categories" :key="category.id" class="nav-item"
            :class="{ 'nav-item--active': currentCategory === category.id }" @click="handleCategoryChange(category.id)"
            :title="category.name">
            <n-icon size="20">
              <component :is="getCategoryIcon(category)" />
            </n-icon>
            <span class="nav-label">{{ category.name }}</span>
          </div>
        </div>
      </div>
      <div class="user-actions">
        <n-space align="center">
          <ThemeToggle />
          <n-button quaternary circle>
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
                  <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 16.5c-3.31 0-6-2.69-6-6s2.69-6 6-6s6 2.69 6 6s-2.69 6-6 6z">
                    </path>
                    <circle cx="12" cy="12.5" r="2"></circle>
                  </g>
                </svg>
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle>
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
                  <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3v-7a9 9 0 0 0-9-9z"></path>
                    <path d="M10 21v-5a2 2 0 1 1 4 0v5"></path>
                  </g>
                </svg>
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle>
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
                  <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </g>
                </svg>
              </n-icon>
            </template>
          </n-button>
        </n-space>
      </div>
    </div>
  </n-layout-header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  background: var(--app-surface);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--app-border);
  box-shadow: 0 2px 12px rgba(31, 45, 61, 0.06);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 24px;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 32px;
  flex-shrink: 0;
}

.logo-text {
  margin-left: 10px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2px;
  background: linear-gradient(120deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.logo-text:hover {
  opacity: 0.75;
}

.search-container {
  width: 280px;
  margin-right: auto;
  flex-shrink: 1;
}

.search-container :deep(.search-btn) {
  color: var(--app-muted);
  transition: color 0.2s ease, background-color 0.2s ease;
}

.search-container :deep(.search-btn:hover) {
  color: #1890ff;
  background-color: var(--app-active-bg);
}

.nav-menu {
  margin-right: 8px;
}

.nav-icons {
  display: flex;
  gap: 4px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--app-muted);
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.nav-item:hover {
  background-color: var(--app-active-bg);
  color: #1890ff;
  transform: translateY(-2px);
}

.nav-item--active {
  background: var(--app-active-bg);
  color: #1890ff;
}

.nav-item--active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #1890ff, #722ed1);
}

.nav-label {
  font-size: 12px;
  margin-top: 4px;
  white-space: nowrap;
}

.nav-item--active .nav-label {
  font-weight: 600;
}

.user-actions {
  margin-left: 8px;
  flex-shrink: 0;
}

.user-actions :deep(.n-button) {
  color: var(--app-muted);
  transition: color 0.2s ease, background-color 0.2s ease;
}

.user-actions :deep(.n-button:hover) {
  color: #1890ff;
  background-color: var(--app-active-bg);
}
</style>