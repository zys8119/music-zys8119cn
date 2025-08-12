<script setup lang="ts">
import { ref } from 'vue'
import { NEmpty, NCard } from 'naive-ui'
</script>

<template>
  <div class="favorites-view">
    <h1>我的收藏</h1>
    <n-card class="content-card">
      <n-empty description="暂无收藏歌曲">
        <template #extra>
          <span>您可以在浏览歌曲时添加喜欢的歌曲到收藏列表</span>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<style scoped>
.favorites-view {
  padding: 20px;
}

.content-card {
  margin-top: 20px;
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>