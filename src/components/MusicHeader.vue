<script setup lang="ts">
import { h } from 'vue'
import { Search, MusicalNotes } from '@vicons/ionicons5'

interface Category {
  id: number;
  name: string;
}

const router = useRouter()

const props = defineProps<{
  categories: Category[];
  currentCategory: number | null;
}>()

const emit = defineEmits<{
  'change-category': [categoryId: number];
}>()

const handleCategoryChange = (key: string): void => {
  const categoryId = Number(key)
  emit('change-category', categoryId)
  router.push({ name: 'category', params: { id: categoryId.toString() } })
}
</script>

<template>
  <n-layout-header class="header">
    <div class="header-content">
      <div class="logo">
        <n-icon size="24" color="#1890ff">
          <musical-notes />
        </n-icon>
        <span class="logo-text">音乐播放器</span>
      </div>
      <div class="search-container">
        <n-input
          placeholder="搜索歌曲、歌手或专辑"
          round
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon>
              <search />
            </n-icon>
          </template>
        </n-input>
      </div>
      <div class="nav-menu">
        <n-menu
          v-if="categories.length > 0"
          mode="horizontal"
          :options="categories.map(cat => ({
            label: cat.name,
            key: cat.id.toString(),
          }))"
          :value="currentCategory ? currentCategory.toString() : undefined"
          @update:value="handleCategoryChange"
        />
      </div>
      <div class="user-actions">
        <n-space>
          <n-button quaternary circle>
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 16.5c-3.31 0-6-2.69-6-6s2.69-6 6-6s6 2.69 6 6s-2.69 6-6 6z"></path><circle cx="12" cy="12.5" r="2"></circle></g></svg>
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle>
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3v-7a9 9 0 0 0-9-9z"></path><path d="M10 21v-5a2 2 0 1 1 4 0v5"></path></g></svg>
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle>
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></g></svg>
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
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 64px;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 48px;
}

.logo-text {
  margin-left: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.search-container {
  width: 300px;
  margin-right: auto;
}

.nav-menu {
  margin-right: 24px;
}

.user-actions {
  margin-left: 16px;
}
</style>