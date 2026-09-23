<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { NCard, NEmpty, NButton, NInput, NSelect, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { AddOutline, TrashOutline, PlayCircleOutline, FolderOutline, MusicalNotesOutline, Heart } from '@vicons/ionicons5'
import { musicApi } from '../services/api'

interface Song {
  id: number
  title: string
  artist: string
  cover?: string
  url: string
  category: number
}

interface Favorite {
  id: number
  title: string
  artist: string
  cover: string
  url: string
  group_id: number | null
  group_name?: string | null
  created_at: number
}

interface Group {
  id: number
  name: string
  count: number
  created_at: number
}

const message = useMessage()
const addSongsToPlaylist = inject<(songs: Song[]) => void>('addSongsToPlaylist', () => { })

const favorites = ref<Favorite[]>([])
const groups = ref<Group[]>([])
// 0 表示“全部收藏”（分组 id 由 SQLite 自增，从 1 开始）
const activeGroupId = ref<number>(0)
const newGroupName = ref('')
const isLoading = ref(false)

const displayed = computed(() => favorites.value)

const groupOptions = computed(() => [
  { label: '全部收藏', value: 0 },
  ...groups.value.map((g) => ({ label: `${g.name} (${g.count})`, value: g.id })),
])

// 仅分组选项（用于条目上的移动分组下拉）
const groupOnlyOptions = computed(() =>
  groups.value.map((g) => ({ label: g.name, value: g.id })),
)

async function loadGroups() {
  try {
    const res = await musicApi.getFavoriteGroups()
    if (res.code === 200) groups.value = res.data || []
  } catch (e) {
    console.error('加载分组失败', e)
  }
}

async function loadFavorites() {
  isLoading.value = true
  try {
    const res = await musicApi.getFavorites(activeGroupId.value || undefined)
    if (res.code === 200) favorites.value = res.data || []
  } catch (e) {
    console.error('加载收藏失败', e)
    message.error('加载收藏失败')
  } finally {
    isLoading.value = false
  }
}

async function addGroup() {
  const name = newGroupName.value.trim()
  if (!name) {
    message.warning('请输入分组名称')
    return
  }
  try {
    const res = await musicApi.addFavoriteGroup(name)
    if (res.code === 200) {
      newGroupName.value = ''
      message.success('分组已创建')
      await loadGroups()
    }
  } catch (e) {
    console.error('创建分组失败', e)
    message.error('创建分组失败')
  }
}

async function removeGroup(group: Group) {
  try {
    const res = await musicApi.removeFavoriteGroup(group.id)
    if (res.code === 200) {
      message.success('分组已删除')
      if (activeGroupId.value === group.id) activeGroupId.value = 0
      await Promise.all([loadGroups(), loadFavorites()])
    }
  } catch (e) {
    console.error('删除分组失败', e)
    message.error('删除分组失败')
  }
}

async function removeFavorite(fav: Favorite) {
  try {
    const res = await musicApi.removeFavorite(fav.id)
    if (res.code === 200) {
      message.success('已取消收藏')
      await Promise.all([loadGroups(), loadFavorites()])
    }
  } catch (e) {
    console.error('删除收藏失败', e)
    message.error('删除收藏失败')
  }
}

async function moveFavorite(fav: Favorite, groupId: number | null) {
  try {
    const res = await musicApi.moveFavorite(fav.id, groupId)
    if (res.code === 200) {
      message.success('已移动分组')
      await Promise.all([loadGroups(), loadFavorites()])
    }
  } catch (e) {
    console.error('移动分组失败', e)
    message.error('移动分组失败')
  }
}

function playFavorite(fav: Favorite) {
  addSongsToPlaylist([
    {
      id: fav.id + 100000,
      title: fav.title,
      artist: fav.artist,
      cover: fav.cover,
      url: fav.url,
      category: -3,
    },
  ])
}

function playAll() {
  if (!displayed.value.length) return
  addSongsToPlaylist(
    displayed.value.map((f) => ({
      id: f.id + 100000,
      title: f.title,
      artist: f.artist,
      cover: f.cover,
      url: f.url,
      category: -3,
    })),
  )
}

function onGroupChange(value: number) {
  activeGroupId.value = value
  loadFavorites()
}

onMounted(() => {
  loadGroups()
  loadFavorites()
})
</script>

<template>
  <div class="favorites-view">
    <!-- 页头横幅 -->
    <div class="hero">
      <div class="hero__icon">
        <n-icon size="30">
          <Heart />
        </n-icon>
      </div>
      <div class="hero__text">
        <h1 class="hero__title">我的收藏</h1>
        <p class="hero__sub">共 {{ favorites.length }} 首歌曲 · {{ groups.length }} 个分组</p>
      </div>
      <n-button v-if="favorites.length" class="hero__play" type="primary" round @click="playAll">
        <template #icon>
          <n-icon>
            <PlayCircleOutline />
          </n-icon>
        </template>
        播放全部
      </n-button>
    </div>

    <!-- 分组管理栏 -->
    <div class="group-bar">
      <n-select class="group-select" :value="activeGroupId" :options="groupOptions" @update:value="onGroupChange" />
      <n-input v-model:value="newGroupName" class="group-input" placeholder="新建分组名称" @keyup.enter="addGroup" />
      <n-button class="group-add" type="primary" @click="addGroup">
        <template #icon>
          <n-icon>
            <AddOutline />
          </n-icon>
        </template>
        新建分组
      </n-button>
    </div>

    <!-- 分组标签 -->
    <div v-if="groups.length" class="group-tags">
      <button class="group-tag" :class="{ 'group-tag--active': activeGroupId === 0 }" @click="onGroupChange(0)">
        <span>全部</span>
        <span class="group-tag__count">{{ favorites.length }}</span>
      </button>
      <div v-for="g in groups" :key="g.id" class="group-tag" :class="{ 'group-tag--active': activeGroupId === g.id }"
        @click="onGroupChange(g.id)">
        <n-icon size="14">
          <FolderOutline />
        </n-icon>
        <span>{{ g.name }}</span>
        <span class="group-tag__count">{{ g.count }}</span>
        <n-popconfirm @positive-click="removeGroup(g)">
          <template #trigger>
            <button class="group-tag__del" type="button" aria-label="删除分组" @click.stop>
              <n-icon size="12">
                <TrashOutline />
              </n-icon>
            </button>
          </template>
          确定删除该分组？分组内收藏将变为未分组。
        </n-popconfirm>
      </div>
    </div>

    <!-- 加载骨架屏 -->
    <div v-if="isLoading" class="skeleton-list">
      <div v-for="n in 6" :key="n" class="skeleton-row">
        <div class="skeleton-block skeleton-avatar"></div>
        <div class="skeleton-lines">
          <div class="skeleton-block skeleton-line"></div>
          <div class="skeleton-block skeleton-line skeleton-line--short"></div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <n-card v-else-if="displayed.length === 0" class="empty-container">
      <n-empty description="暂无收藏歌曲">
        <template #extra>
          <span>您可以在浏览歌曲时点击爱心图标添加收藏</span>
        </template>
      </n-empty>
    </n-card>

    <!-- 收藏列表 -->
    <transition-group v-else name="fav-fade" tag="div" class="fav-list">
      <div v-for="(fav, index) in displayed" :key="fav.id" class="fav-item">
        <span class="fav-index">{{ index + 1 }}</span>
        <div class="fav-cover" @click="playFavorite(fav)">
          <img v-if="fav.cover" :src="fav.cover" :alt="fav.title" />
          <div v-else class="fav-cover__ph">
            <n-icon size="20">
              <MusicalNotesOutline />
            </n-icon>
          </div>
          <span class="fav-cover__mask"><n-icon size="18">
              <PlayCircleOutline />
            </n-icon></span>
        </div>
        <div class="fav-meta" @click="playFavorite(fav)">
          <div class="fav-title">{{ fav.title }}</div>
          <div class="fav-artist">{{ fav.artist }}</div>
        </div>
        <span v-if="fav.group_name" class="fav-badge">{{ fav.group_name }}</span>
        <n-select v-if="groups.length" class="fav-group" size="small" :value="fav.group_id" :options="groupOnlyOptions"
          placeholder="未分组" clearable @update:value="(v: number | null) => moveFavorite(fav, v)" />
        <n-popconfirm @positive-click="removeFavorite(fav)">
          <template #trigger>
            <n-button quaternary circle type="error" class="fav-del" aria-label="取消收藏">
              <template #icon>
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </template>
            </n-button>
          </template>
          确定取消收藏？
        </n-popconfirm>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.favorites-view {
  padding: 8px 4px 20px;
}

/* ===== 页头横幅 ===== */
.hero {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
  padding: 22px 26px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%);
  box-shadow: 0 18px 44px -20px rgba(67, 56, 202, 0.6);
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  width: 240px;
  height: 240px;
  right: -80px;
  top: -100px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.28);
  filter: blur(50px);
  pointer-events: none;
}

.hero__icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  backdrop-filter: blur(6px);
}

.hero__text {
  flex: 1;
  min-width: 0;
}

.hero__title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #f8fafc;
}

.hero__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(248, 250, 252, 0.78);
}

.hero__play {
  flex-shrink: 0;
}

/* ===== 分组管理栏 ===== */
.group-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  flex-wrap: wrap;
  align-items: center;
  border-radius: 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.group-select {
  width: 220px;
}

.group-input {
  width: 200px;
}

/* 统一表单圆角与高度（Naive UI 通过 CSS 变量控制视觉边框） */
.group-bar :deep(.n-base-selection),
.group-bar :deep(.n-input) {
  --n-border-radius: 10px;
  --n-height: 38px;
}

.group-bar :deep(.n-base-selection) {
  transition: box-shadow 0.2s ease;
}

.group-bar :deep(.n-base-selection:hover),
.group-bar :deep(.n-input:hover) {
  box-shadow: 0 2px 10px rgba(24, 144, 255, 0.1);
}

.group-bar :deep(.n-base-selection--focus),
.group-bar :deep(.n-input--focus) {
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.16);
}

.group-add {
  border-radius: 10px;
  height: 38px;
}

/* ===== 分组标签 ===== */
.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.group-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.group-tag:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.group-tag--active {
  color: #fff;
  background: linear-gradient(135deg, #1890ff, #722ed1);
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.3);
}

.group-tag__count {
  font-size: 12px;
  opacity: 0.8;
}

.group-tag__del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.group-tag__del:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
}

/* ===== 骨架屏 ===== */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-block {
  background: linear-gradient(90deg, #f1f3f6 25%, #e6e9ee 37%, #f1f3f6 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
  border-radius: 8px;
}

html.dark .skeleton-block {
  background: linear-gradient(90deg, #24243e 25%, #2e2e4d 37%, #24243e 63%);
  background-size: 400% 100%;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
}

.skeleton-line {
  height: 14px;
  width: 60%;
}

.skeleton-line--short {
  width: 35%;
  height: 11px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
  }
}

/* ===== 空状态 ===== */
.empty-container {
  min-height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
}

/* ===== 收藏列表 ===== */
.fav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-radius: 14px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  transition: box-shadow 0.24s ease, transform 0.24s ease, border-color 0.2s ease;
}

.fav-item:hover {
  box-shadow: var(--app-shadow);
  border-color: rgba(24, 144, 255, 0.3);
  transform: translateX(3px);
}

.fav-index {
  flex-shrink: 0;
  width: 22px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-muted);
}

.fav-cover {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
}

.fav-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.fav-cover:hover img {
  transform: scale(1.08);
}

.fav-cover__ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.fav-cover__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.fav-cover:hover .fav-cover__mask {
  opacity: 1;
}

.fav-meta {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.fav-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-artist {
  margin-top: 2px;
  font-size: 12px;
  color: var(--app-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #1890ff;
  background: var(--app-active-bg);
  border: 1px solid rgba(24, 144, 255, 0.24);
  white-space: nowrap;
}

.fav-group {
  width: 150px;
  flex-shrink: 0;
}

/* 条目标签上的分组下拉：圆角、淡边框、悬停反馈 */
.fav-group :deep(.n-base-selection) {
  --n-border-radius: 8px;
  --n-height: 30px;
  transition: box-shadow 0.2s ease;
}

.fav-group :deep(.n-base-selection:hover) {
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.14);
}

.fav-group :deep(.n-base-selection--focus) {
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.16);
}

.fav-del {
  flex-shrink: 0;
}

/* ===== 列表过渡动画 ===== */
.fav-fade-enter-active,
.fav-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.fav-fade-enter-from,
.fav-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .hero {
    flex-wrap: wrap;
    padding: 18px 20px;
  }

  .hero__title {
    font-size: 20px;
  }

  .hero__play {
    width: 100%;
  }

  .group-select,
  .group-input {
    width: 100%;
  }

  .fav-group {
    width: 110px;
  }

  .fav-badge {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {

  .fav-item,
  .fav-cover img,
  .fav-fade-enter-active,
  .fav-fade-leave-active {
    transition: none;
  }

  .fav-item:hover,
  .fav-cover:hover img {
    transform: none;
  }
}
</style>