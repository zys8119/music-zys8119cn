<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { NCard, NEmpty, NButton, NInput, NSelect, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { AddOutline, TrashOutline, PlayCircleOutline, FolderOutline, MusicalNotesOutline } from '@vicons/ionicons5'
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
const addSongsToPlaylist = inject<(songs: Song[]) => void>('addSongsToPlaylist', () => {})

const favorites = ref<Favorite[]>([])
const groups = ref<Group[]>([])
const activeGroupId = ref<number | null>(null)
const newGroupName = ref('')
const isLoading = ref(false)

const displayed = computed(() => favorites.value)

const groupOptions = computed(() => [
  { label: '全部收藏', value: null as number | null },
  ...groups.value.map((g) => ({ label: `${g.name} (${g.count})`, value: g.id as number | null })),
])

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
    const res = await musicApi.getFavorites(activeGroupId.value ?? undefined)
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
      if (activeGroupId.value === group.id) activeGroupId.value = null
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

function onGroupChange(value: number | null) {
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
    <div class="view-header">
      <h1 class="view-title">我的收藏</h1>
      <span class="view-subtitle">共 {{ favorites.length }} 首</span>
      <n-button v-if="favorites.length" type="primary" size="small" class="play-all" @click="playAll">
        <template #icon>
          <n-icon><PlayCircleOutline /></n-icon>
        </template>
        播放全部
      </n-button>
    </div>

    <div class="group-bar">
      <n-select class="group-select" :value="activeGroupId" :options="groupOptions" @update:value="onGroupChange" />
      <n-input v-model:value="newGroupName" class="group-input" placeholder="新建分组名称" @keyup.enter="addGroup" />
      <n-button class="group-add" type="primary" @click="addGroup">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        新建分组
      </n-button>
    </div>

    <div v-if="groups.length" class="group-tags">
      <div v-for="g in groups" :key="g.id" class="group-tag" :class="{ 'group-tag--active': activeGroupId === g.id }"
        @click="onGroupChange(g.id)">
        <n-icon size="14"><FolderOutline /></n-icon>
        <span>{{ g.name }}</span>
        <span class="group-tag__count">{{ g.count }}</span>
        <n-popconfirm @positive-click="removeGroup(g)">
          <template #trigger>
            <button class="group-tag__del" type="button" aria-label="删除分组" @click.stop>
              <n-icon size="12"><TrashOutline /></n-icon>
            </button>
          </template>
          确定删除该分组？分组内收藏将变为未分组。
        </n-popconfirm>
      </div>
    </div>

    <n-card v-if="!isLoading && displayed.length === 0" class="empty-container">
      <n-empty description="暂无收藏歌曲">
        <template #extra>
          <span>您可以在浏览歌曲时添加喜欢的歌曲到收藏列表</span>
        </template>
      </n-empty>
    </n-card>

    <div v-else class="fav-list">
      <div v-for="fav in displayed" :key="fav.id" class="fav-item">
        <div class="fav-cover" @click="playFavorite(fav)">
          <img v-if="fav.cover" :src="fav.cover" :alt="fav.title" />
          <div v-else class="fav-cover__ph">
            <n-icon size="20"><MusicalNotesOutline /></n-icon>
          </div>
          <span class="fav-cover__mask"><n-icon size="18"><PlayCircleOutline /></n-icon></span>
        </div>
        <div class="fav-meta" @click="playFavorite(fav)">
          <div class="fav-title">{{ fav.title }}</div>
          <div class="fav-artist">{{ fav.artist }}</div>
        </div>
        <n-select v-if="groups.length" class="fav-group" size="small" :value="fav.group_id" :options="groupOptions.filter(o => o.value !== null)"
          placeholder="未分组" clearable @update:value="(v: number | null) => moveFavorite(fav, v)" />
        <n-popconfirm @positive-click="removeFavorite(fav)">
          <template #trigger>
            <n-button quaternary circle type="error" class="fav-del" aria-label="取消收藏">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
            </n-button>
          </template>
          确定取消收藏？
        </n-popconfirm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-view {
  padding: 8px 4px 20px;
}

.view-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
}

.view-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--app-text);
  position: relative;
  padding-left: 16px;
}

.view-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 22px;
  border-radius: 3px;
  background: linear-gradient(180deg, #1890ff, #722ed1);
}

.view-subtitle {
  font-size: 13px;
  color: var(--app-muted);
}

.play-all {
  margin-left: auto;
}

.group-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.group-select {
  width: 220px;
}

.group-input {
  width: 200px;
}

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
  padding: 6px 10px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-muted);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.group-tag:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.group-tag--active {
  color: #fff;
  background: linear-gradient(135deg, #1890ff, #722ed1);
  border-color: transparent;
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
}

.group-tag__del:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
}

.empty-container {
  min-height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
}

.fav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.fav-item:hover {
  box-shadow: var(--app-shadow);
  transform: translateX(2px);
}

.fav-cover {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
}

.fav-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.fav-group {
  width: 150px;
  flex-shrink: 0;
}

.fav-del {
  flex-shrink: 0;
}
</style>
